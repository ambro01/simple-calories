/**
 * Profile Service
 *
 * Business logic layer for user profile management.
 * Handles operations related to the user's profile record which serves
 * as a bridge between Supabase Auth and application logic.
 *
 * The profile is automatically created on user signup via the handle_new_user() trigger.
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
}
