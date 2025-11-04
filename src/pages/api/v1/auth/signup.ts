/**
 * Signup API Endpoint
 *
 * POST /api/v1/auth/signup
 * Creates a new user account with email and password via Supabase Auth
 * User is automatically logged in after successful registration (no email confirmation required in MVP)
 *
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response:
 * - 201: { user: { id: string, email: string } }
 * - 400: { error: string } - Validation error
 * - 409: { error: string } - User already exists
 * - 500: { error: string } - Server error
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// SSR required for auth operations
export const prerender = false;

// Validation schema for signup request
const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email")
    .max(255),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .max(72, "Hasło może mieć maksymalnie 72 znaki"), // bcrypt limit
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Check if user already exists
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "Użytkownik z tym adresem email już istnieje",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Return generic error for other auth errors
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta. Spróbuj ponownie później.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Ensure user was created
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta. Spróbuj ponownie później.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Create profile for new user in application layer
    // (avoiding cross-schema permission issues with triggers)
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Log error but don't fail the signup - profile can be created later
      // User is already created in auth.users at this point
    }

    // Handle email confirmation based on environment
    // Local dev (SKIP_EMAIL_CONFIRMATION=true): signUp creates session, so sign out
    // Production (enable_confirmations=true in Supabase): signUp doesn't create session
    if (import.meta.env.SKIP_EMAIL_CONFIRMATION === "true") {
      await supabase.auth.signOut();
    }

    // Return user data on success (201 Created)
    // Database trigger will automatically create default calorie_goal (2000 kcal)
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
