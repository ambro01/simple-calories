/**
 * Login API Endpoint
 *
 * POST /api/v1/auth/login
 * Authenticates user with email and password via Supabase Auth
 *
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response:
 * - 200: { user: { id: string, email: string } }
 * - 400: { error: string }
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// SSR required for auth operations
export const prerender = false;

// Validation schema for login request
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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
        }
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return generic error message for security (prevent user enumeration)
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy email lub hasło",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return user data on success
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
