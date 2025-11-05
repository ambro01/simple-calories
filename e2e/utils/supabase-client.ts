import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Create Supabase client for E2E tests
 * Uses anon key with authentication for test user
 */
export function createSupabaseTestClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create authenticated Supabase client for test user
 * Required for cleanup operations that respect RLS policies
 */
export async function createAuthenticatedTestClient(): Promise<SupabaseClient<Database>> {
  const client = createSupabaseTestClient();
  const { email, password } = getTestUserCredentials();

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to authenticate test client: ${error.message}`);
  }

  return client;
}

/**
 * Get test user credentials from environment
 */
export function getTestUserCredentials() {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  const userId = process.env.E2E_USERNAME_ID;

  if (!email || !password || !userId) {
    throw new Error('Missing E2E test user credentials in environment variables');
  }

  return { email, password, userId };
}

/**
 * Cleanup test data for a specific user
 * Removes all meals (which automatically updates daily_progress view)
 * Note: Uses authenticated client to respect RLS policies
 */
export async function cleanupUserMeals(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from('meals').delete().eq('user_id', userId).select();

  if (error) {
    console.error('Failed to cleanup meals:', error);
    throw error;
  }

  if (data) {
    console.log(`✓ Cleaned up ${data.length} meal(s) for user ${userId}`);
  }
}

/**
 * Comprehensive cleanup for E2E tests
 * Removes all test data: meals, ai_generations
 * Note: daily_progress is a view and updates automatically when meals are deleted
 */
export async function cleanupAllTestData(supabase: SupabaseClient, userId: string) {
  try {
    // Verify session is active before cleanup
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('No active session for cleanup, attempting to re-authenticate...');
      const { email, password } = getTestUserCredentials();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(`Failed to re-authenticate for cleanup: ${signInError.message}`);
      }
    }

    // First, delete AI generations (to avoid foreign key issues)
    const { data: aiData, error: aiError } = await supabase
      .from('ai_generations')
      .delete()
      .eq('user_id', userId)
      .select();

    if (aiError) {
      console.error('Failed to cleanup AI generations:', aiError);
      // Don't throw - continue with meals cleanup
    } else if (aiData) {
      console.log(`✓ Cleaned up ${aiData.length} AI generation(s) for user ${userId}`);
    }

    // Then delete all meals (daily_progress view will update automatically)
    const { data: mealsData, error: mealsError } = await supabase
      .from('meals')
      .delete()
      .eq('user_id', userId)
      .select();

    if (mealsError) {
      console.error('Failed to cleanup meals:', mealsError);
      console.error('Error details:', {
        message: mealsError.message,
        details: mealsError.details,
        hint: mealsError.hint,
        code: mealsError.code,
      });
      throw mealsError;
    }

    if (mealsData) {
      console.log(`✓ Cleaned up ${mealsData.length} meal(s) for user ${userId}`);
    }

    console.log(`✓ Cleaned up all test data for user ${userId}`);
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}

/**
 * Get meal by description for verification
 * Returns the most recent meal with matching description
 * Retries up to 3 times with 1 second delay to handle async DB writes
 */
export async function getMealByDescription(
  supabase: SupabaseClient,
  userId: string,
  description: string,
  retries = 3
) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('description', description)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to get meal:', error);
      throw error;
    }

    // If found, return it
    if (data && data.length > 0) {
      return data[0];
    }

    // If not found and we have retries left, wait and try again
    if (attempt < retries - 1) {
      console.log(`Meal "${description}" not found, retrying in 1s... (attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // After all retries, return null
  return null;
}

/**
 * Get all meals for user on specific date
 */
export async function getMealsByDate(supabase: SupabaseClient, userId: string, date: string) {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('meal_timestamp', `${date}T00:00:00`)
    .lt('meal_timestamp', `${date}T23:59:59`)
    .order('meal_timestamp', { ascending: true });

  if (error) {
    console.error('Failed to get meals:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete meal by ID (hard delete for cleanup)
 */
export async function deleteMealById(supabase: SupabaseClient, mealId: string) {
  const { error } = await supabase.from('meals').delete().eq('id', mealId);

  if (error) {
    console.error('Failed to delete meal:', error);
    throw error;
  }
}

/**
 * Verify meal exists in database
 */
export async function verifyMealExists(
  supabase: SupabaseClient,
  userId: string,
  expectedData: {
    description: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  }
): Promise<boolean> {
  const meal = await getMealByDescription(supabase, userId, expectedData.description);

  if (!meal) {
    console.error(`Meal not found: "${expectedData.description}"`);
    return false;
  }

  console.log(`Verifying meal data:`, {
    expected: expectedData,
    actual: {
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
    }
  });

  // Verify calories
  if (meal.calories !== expectedData.calories) {
    console.error(`Calories mismatch: expected ${expectedData.calories} (${typeof expectedData.calories}), got ${meal.calories} (${typeof meal.calories})`);
    return false;
  }

  // Verify optional macros - convert to numbers for comparison to handle decimal types
  if (expectedData.protein !== undefined) {
    const actualProtein = meal.protein ? Number(meal.protein) : null;
    if (actualProtein !== expectedData.protein) {
      console.error(`Protein mismatch: expected ${expectedData.protein} (${typeof expectedData.protein}), got ${meal.protein} (${typeof meal.protein})`);
      return false;
    }
  }

  if (expectedData.carbs !== undefined) {
    const actualCarbs = meal.carbs ? Number(meal.carbs) : null;
    if (actualCarbs !== expectedData.carbs) {
      console.error(`Carbs mismatch: expected ${expectedData.carbs} (${typeof expectedData.carbs}), got ${meal.carbs} (${typeof meal.carbs})`);
      return false;
    }
  }

  if (expectedData.fats !== undefined) {
    const actualFats = meal.fats ? Number(meal.fats) : null;
    if (actualFats !== expectedData.fats) {
      console.error(`Fats mismatch: expected ${expectedData.fats} (${typeof expectedData.fats}), got ${meal.fats} (${typeof meal.fats})`);
      return false;
    }
  }

  return true;
}
