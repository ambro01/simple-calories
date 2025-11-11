/**
 * Authentication Service
 * Centralized API calls for auth operations
 */

export type SignupData = {
  email: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type ForgotPasswordData = {
  email: string;
};

export type ResetPasswordData = {
  password: string;
};

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export type AuthResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Authentication API client
 */
export const authService = {
  /**
   * Register new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    try {
      const response = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Nie udało się utworzyć konta",
        };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      };
    }
  },

  /**
   * Login existing user
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Nieprawidłowy email lub hasło",
        };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      };
    }
  },

  /**
   * Request password reset email
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  forgotPassword: async (_data: ForgotPasswordData): Promise<AuthResponse> => {
    try {
      // TODO: Implement when backend is ready
      // const response = await fetch("/api/v1/auth/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(_data),
      // });

      // For now, always return success (security: don't reveal if email exists)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      };
    }
  },

  /**
   * Reset password with token from email
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resetPassword: async (_data: ResetPasswordData): Promise<AuthResponse> => {
    try {
      // TODO: Implement when backend is ready
      // const response = await fetch("/api/v1/auth/reset-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(_data),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      };
    }
  },

  /**
   * Change password for logged-in user
   */
  changePassword: async (data: ChangePasswordData): Promise<AuthResponse> => {
    try {
      const response = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Nie udało się zmienić hasła",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      };
    }
  },
};
