/**
 * AI Generation Service
 *
 * Business logic layer for AI-powered nutritional estimation.
 * Handles the complete lifecycle of an AI generation:
 * 1. Create pending record in database
 * 2. Call OpenRouter API to generate estimate
 * 3. Update record with results (completed or failed)
 *
 * @module AIGenerationService
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { AIGenerationResponseDTO } from "../../types";
import { openRouterService } from "./openrouter/adapter";
import type { NutritionalEstimate } from "./openrouter";

/**
 * Result of creating an AI generation
 */
export interface CreateAIGenerationResult {
  success: boolean;
  data?: AIGenerationResponseDTO;
  error?: string;
}

/**
 * AI Generation Service Class
 *
 * Orchestrates the AI generation process with proper error handling
 * and database transaction management.
 */
export class AIGenerationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new AI generation for nutritional estimation
   *
   * Process:
   * 1. Insert initial record with status='pending'
   * 2. Call OpenRouter API to generate estimate
   * 3. Update record with results:
   *    - status='completed' + nutritional values (if successful)
   *    - status='failed' + error_message (if AI couldn't estimate or API failed)
   *
   * @param userId - User ID from JWT token
   * @param prompt - User's meal description
   * @returns Created AI generation record with final status
   */
  async createAIGeneration(userId: string, prompt: string): Promise<CreateAIGenerationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Create initial pending record
      const { data: pendingRecord, error: insertError } = await this.supabase
        .from("ai_generations")
        .insert({
          user_id: userId,
          prompt: prompt,
          status: "pending",
          // All other fields are nullable and will be updated after AI processing
        })
        .select()
        .single();

      if (insertError || !pendingRecord) {
        console.error("Failed to create pending AI generation:", insertError);
        return {
          success: false,
          error: "Failed to initialize AI generation",
        };
      }

      // Step 2: Call OpenRouter API for nutritional estimate
      let estimate: NutritionalEstimate;
      try {
        estimate = await openRouterService.generateNutritionEstimate(prompt);
      } catch (apiError) {
        // API call failed - update record as failed
        const generationDuration = Date.now() - startTime;

        await this.supabase
          .from("ai_generations")
          .update({
            status: "failed",
            error_message: apiError instanceof Error ? apiError.message : "Unknown error during AI generation",
            generation_duration: generationDuration,
          })
          .eq("id", pendingRecord.id);

        return {
          success: false,
          error: "AI service temporarily unavailable. Please try again later.",
        };
      }

      // Step 3: Update record with results
      const generationDuration = Date.now() - startTime;

      // Check if AI returned an error (e.g., too vague description)
      if (estimate.error) {
        const { data: failedRecord, error: updateError } = await this.supabase
          .from("ai_generations")
          .update({
            status: "failed",
            error_message: estimate.error,
            generation_duration: generationDuration,
            model_used: import.meta.env.OPENROUTER_MODEL || "mock-gpt-4",
          })
          .eq("id", pendingRecord.id)
          .select()
          .single();

        if (updateError || !failedRecord) {
          console.error("Failed to update AI generation record:", updateError);
          return {
            success: false,
            error: "Failed to save AI generation results",
          };
        }

        // Return the failed record - client can show the error message
        return {
          success: true,
          data: failedRecord,
        };
      }

      // AI successfully generated estimates
      const { data: completedRecord, error: updateError } = await this.supabase
        .from("ai_generations")
        .update({
          status: "completed",
          generated_calories: estimate.calories,
          generated_protein: estimate.protein,
          generated_carbs: estimate.carbs,
          generated_fats: estimate.fats,
          assumptions: estimate.assumptions,
          generation_duration: generationDuration,
          model_used: import.meta.env.OPENROUTER_MODEL || "mock-gpt-4",
        })
        .eq("id", pendingRecord.id)
        .select()
        .single();

      if (updateError || !completedRecord) {
        console.error("Failed to update AI generation record:", updateError);
        return {
          success: false,
          error: "Failed to save AI generation results",
        };
      }

      return {
        success: true,
        data: completedRecord,
      };
    } catch (error) {
      console.error("Unexpected error in createAIGeneration:", error);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }

  /**
   * Retrieves an AI generation by ID
   *
   * Validates that the generation belongs to the requesting user.
   *
   * @param generationId - AI generation UUID
   * @param userId - User ID from JWT token
   * @returns AI generation record or null if not found/unauthorized
   */
  async getAIGeneration(generationId: string, userId: string): Promise<AIGenerationResponseDTO | null> {
    const { data, error } = await this.supabase
      .from("ai_generations")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Lists AI generations for a user with pagination
   *
   * @param userId - User ID from JWT token
   * @param limit - Number of records to return
   * @param offset - Number of records to skip
   * @returns Array of AI generations ordered by creation date (newest first)
   */
  async listAIGenerations(userId: string, limit = 20, offset = 0): Promise<AIGenerationResponseDTO[]> {
    const { data, error } = await this.supabase
      .from("ai_generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      console.error("Failed to list AI generations:", error);
      return [];
    }

    return data;
  }

  /**
   * Counts total AI generations for a user
   *
   * Used for pagination metadata.
   *
   * @param userId - User ID from JWT token
   * @returns Total count of AI generations
   */
  async countAIGenerations(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("ai_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to count AI generations:", error);
      return 0;
    }

    return count || 0;
  }
}
