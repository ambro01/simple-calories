/**
 * Profile Service
 *
 * Business logic layer for user profile management.
 * Handles operations related to the user's profile record which serves
 * as a bridge between Supabase Auth and application logic.
 *
 * The profile is created in the application layer during signup (POST /api/v1/auth/signup).
 * A database trigger (on_profile_created) automatically creates a default calorie goal (2000 kcal).
 *
 * @module ProfileService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { ProfileResponseDTO, UpdateProfileRequestDTO } from "../../types";

/**
 * Profile Service Class
 *
 * Manages profile CRUD operations with proper error handling
 * and RLS policy enforcement.
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves the authenticated user's profile
   *
   * Uses RLS policy to ensure users can only access their own profile.
   * The userId must match auth.uid() at the database level.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @returns User profile or null if not found
   */
  async getProfile(userId: string): Promise<ProfileResponseDTO | null> {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      // PGRST116 = Row not found (404 equivalent in PostgREST)
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Updates the authenticated user's profile
   *
   * Currently no fields are editable (reserved for future extensions).
   * Uses RLS policy to ensure users can only update their own profile.
   * The updated_at field is automatically set by the update_profiles_updated_at trigger.
   *
   * @param userId - User ID from JWT token (auth.uid())
   * @param updates - Fields to update (currently empty object)
   * @returns Updated profile record
   */
  async updateProfile(userId: string, updates: UpdateProfileRequestDTO): Promise<ProfileResponseDTO> {
    const { data, error } = await this.supabase.from("profiles").update(updates).eq("id", userId).select().single();

    if (error) throw error;

    return data;
  }

  /**
   * Changes the password for the authenticated user
   *
   * Uses Supabase Auth API to update the user's password.
   * Requires the current password for verification.
   *
   * @param currentPassword - User's current password
   * @param newPassword - New password to set
   * @throws Error if current password is incorrect or update fails
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // First, verify current password by attempting to sign in
    const { data: userData, error: authError } = await this.supabase.auth.getUser();

    if (authError || !userData?.user?.email) {
      throw new Error("Nie można pobrać danych użytkownika");
    }

    // Verify current password
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Aktualne hasło jest nieprawidłowe");
    }

    // Update password
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(`Nie udało się zmienić hasła: ${updateError.message}`);
    }
  }
}
