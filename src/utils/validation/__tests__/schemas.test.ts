/**
 * Unit tests for Zod schemas
 *
 * Testing validation schemas used with React Hook Form:
 * - Email validation
 * - Password validation
 * - Auth forms (signup, login, forgot/reset password)
 * - Change password form
 * - Calorie goal form
 * - Manual meal form
 * - AI meal form
 */

import {
  emailSchema,
  passwordSchema,
  passwordRequiredSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  calorieGoalSchema,
  manualMealSchema,
  aiMealSchema,
} from "../schemas";

describe("emailSchema", () => {
  it("accepts valid email", () => {
    const result = emailSchema.safeParse("test@example.com");
    expect(result.success).toBe(true);
  });

  it("accepts email with subdomains", () => {
    const result = emailSchema.safeParse("user@mail.company.com");
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Email jest wymagany");
    }
  });

  it("rejects invalid email format", () => {
    const result = emailSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Nieprawidłowy format email");
    }
  });

  it("rejects email without @", () => {
    const result = emailSchema.safeParse("userexample.com");
    expect(result.success).toBe(false);
  });

  it("rejects email without domain", () => {
    const result = emailSchema.safeParse("user@");
    expect(result.success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts valid password (8-72 characters)", () => {
    const result = passwordSchema.safeParse("password123");
    expect(result.success).toBe(true);
  });

  it("accepts password with special characters", () => {
    const result = passwordSchema.safeParse("P@ssw0rd!");
    expect(result.success).toBe(true);
  });

  it("accepts password with exactly 8 characters", () => {
    const result = passwordSchema.safeParse("12345678");
    expect(result.success).toBe(true);
  });

  it("accepts password with exactly 72 characters", () => {
    const result = passwordSchema.safeParse("a".repeat(72));
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = passwordSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Hasło jest wymagane");
    }
  });

  it("rejects password shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("pass123");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Hasło musi mieć minimum 8 znaków");
    }
  });

  it("rejects password longer than 72 characters", () => {
    const result = passwordSchema.safeParse("a".repeat(73));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Hasło może mieć maksymalnie 72 znaki");
    }
  });
});

describe("passwordRequiredSchema", () => {
  it("accepts any non-empty password", () => {
    const result = passwordRequiredSchema.safeParse("short");
    expect(result.success).toBe(true);
  });

  it("accepts very long password (no length limit)", () => {
    const result = passwordRequiredSchema.safeParse("a".repeat(100));
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = passwordRequiredSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Hasło jest wymagane");
    }
  });
});

describe("signupSchema", () => {
  const validSignup = {
    email: "test@example.com",
    password: "password123",
    passwordConfirm: "password123",
  };

  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse(validSignup);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      passwordConfirm: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) => e.path[0] === "passwordConfirm");
      expect(error?.message).toBe("Hasła muszą być identyczne");
    }
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "short",
      passwordConfirm: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty passwordConfirm", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      passwordConfirm: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  const validLogin = {
    email: "test@example.com",
    password: "password",
  };

  it("accepts valid login data", () => {
    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("accepts short password (no length validation)", () => {
    const result = loginSchema.safeParse({
      ...validLogin,
      password: "short",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      ...validLogin,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      ...validLogin,
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validReset = {
    password: "newpassword123",
    passwordConfirm: "newpassword123",
  };

  it("accepts valid reset data", () => {
    const result = resetPasswordSchema.safeParse(validReset);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      ...validReset,
      passwordConfirm: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) => e.path[0] === "passwordConfirm");
      expect(error?.message).toBe("Hasła muszą być identyczne");
    }
  });

  it("rejects short password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      passwordConfirm: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const validChange = {
    currentPassword: "oldpassword",
    newPassword: "newpassword123",
  };

  it("accepts valid password change", () => {
    const result = changePasswordSchema.safeParse(validChange);
    expect(result.success).toBe(true);
  });

  it("rejects same password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "samepassword",
      newPassword: "samepassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) => e.path[0] === "newPassword");
      expect(error?.message).toBe("Nowe hasło musi być różne od obecnego");
    }
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newpassword123",
    });
    expect(result.success).toBe(false);
  });
});

describe("calorieGoalSchema", () => {
  it("accepts valid calorie goal", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: 2000 });
    expect(result.success).toBe(true);
  });

  it("accepts minimum value (1)", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: 1 });
    expect(result.success).toBe(true);
  });

  it("accepts maximum value (10000)", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: 10000 });
    expect(result.success).toBe(true);
  });

  it("coerces string to number", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: "2500" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dailyGoal).toBe(2500);
    }
  });

  it("rejects value less than 1", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Cel musi być większy lub równy 1");
    }
  });

  it("rejects value greater than 10000", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: 10001 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Cel musi być mniejszy lub równy 10000");
    }
  });

  it("rejects non-integer", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: 2000.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Cel musi być liczbą całkowitą");
    }
  });

  it("rejects non-numeric string", () => {
    const result = calorieGoalSchema.safeParse({ dailyGoal: "not-a-number" });
    expect(result.success).toBe(false);
  });
});

describe("manualMealSchema", () => {
  const validMeal = {
    description: "Jajecznica z trzech jajek",
    calories: 300,
    protein: 20,
    carbs: 5,
    fats: 15,
    fiber: 0,
    category: "breakfast" as const,
    date: "2025-01-27",
    time: "08:30",
  };

  it("accepts valid meal data", () => {
    const result = manualMealSchema.safeParse(validMeal);
    expect(result.success).toBe(true);
  });

  it("accepts meal with null macros", () => {
    const result = manualMealSchema.safeParse({
      ...validMeal,
      protein: null,
      carbs: null,
      fats: null,
      fiber: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts meal with null category", () => {
    const result = manualMealSchema.safeParse({
      ...validMeal,
      category: null,
    });
    expect(result.success).toBe(true);
  });

  it("coerces string numbers to integers", () => {
    const result = manualMealSchema.safeParse({
      ...validMeal,
      calories: "300",
      protein: "20",
      carbs: "5",
      fats: "15",
      fiber: "0",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calories).toBe(300);
      expect(result.data.protein).toBe(20);
    }
  });

  describe("description validation", () => {
    it("rejects empty description", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        description: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Opis jest wymagany");
      }
    });

    it("rejects description longer than 200 characters", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        description: "a".repeat(201),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Opis może mieć maksymalnie 200 znaków");
      }
    });

    it("accepts description with exactly 200 characters", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        description: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("calories validation", () => {
    it("rejects calories less than 1", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        calories: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Kalorie muszą być większe od 0");
      }
    });

    it("rejects calories greater than 10000", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        calories: 10001,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Kalorie nie mogą przekraczać 10000");
      }
    });

    it("rejects non-integer calories", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        calories: 300.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Kalorie muszą być liczbą całkowitą");
      }
    });

    it("accepts calories at boundaries (1 and 10000)", () => {
      expect(manualMealSchema.safeParse({ ...validMeal, calories: 1 }).success).toBe(true);
      expect(manualMealSchema.safeParse({ ...validMeal, calories: 10000 }).success).toBe(true);
    });
  });

  describe("macros validation", () => {
    it("rejects negative protein", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        protein: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects protein greater than 1000", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        protein: 1001,
      });
      expect(result.success).toBe(false);
    });

    it("accepts protein at boundaries (0 and 1000)", () => {
      expect(manualMealSchema.safeParse({ ...validMeal, protein: 0 }).success).toBe(true);
      expect(manualMealSchema.safeParse({ ...validMeal, protein: 1000 }).success).toBe(true);
    });

    it("rejects non-integer macros", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        protein: 20.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects fiber greater than 200", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        fiber: 201,
      });
      expect(result.success).toBe(false);
    });

    it("accepts fiber at boundaries (0 and 200)", () => {
      expect(manualMealSchema.safeParse({ ...validMeal, fiber: 0 }).success).toBe(true);
      expect(manualMealSchema.safeParse({ ...validMeal, fiber: 200 }).success).toBe(true);
    });
  });

  describe("category validation", () => {
    it("accepts all valid categories", () => {
      const categories = ["breakfast", "lunch", "dinner", "snack"] as const;
      categories.forEach((category) => {
        const result = manualMealSchema.safeParse({
          ...validMeal,
          category,
        });
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid category", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        category: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("date and time validation", () => {
    it("accepts valid date format (YYYY-MM-DD)", () => {
      const result = manualMealSchema.safeParse(validMeal);
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        date: "27-01-2025",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Nieprawidłowy format daty");
      }
    });

    it("rejects invalid date (not YYYY-MM-DD)", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        date: "2025/01/27",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid time format (HH:MM)", () => {
      const result = manualMealSchema.safeParse(validMeal);
      expect(result.success).toBe(true);
    });

    it("rejects invalid time format", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        time: "8:30",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Nieprawidłowy format czasu");
      }
    });

    it("rejects time with seconds", () => {
      const result = manualMealSchema.safeParse({
        ...validMeal,
        time: "08:30:00",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("aiMealSchema", () => {
  const validAIMeal = {
    aiPrompt: "Jajecznica z trzech jajek na maśle",
    category: "breakfast" as const,
    date: "2025-01-27",
    time: "08:30",
  };

  it("accepts valid AI meal data", () => {
    const result = aiMealSchema.safeParse(validAIMeal);
    expect(result.success).toBe(true);
  });

  it("accepts null category", () => {
    const result = aiMealSchema.safeParse({
      ...validAIMeal,
      category: null,
    });
    expect(result.success).toBe(true);
  });

  describe("prompt validation", () => {
    it("rejects prompt shorter than 3 characters", () => {
      const result = aiMealSchema.safeParse({
        ...validAIMeal,
        aiPrompt: "ab",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Prompt musi mieć minimum 3 znaki");
      }
    });

    it("accepts prompt with exactly 3 characters", () => {
      const result = aiMealSchema.safeParse({
        ...validAIMeal,
        aiPrompt: "abc",
      });
      expect(result.success).toBe(true);
    });

    it("accepts prompt with exactly 500 characters", () => {
      const result = aiMealSchema.safeParse({
        ...validAIMeal,
        aiPrompt: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it("rejects prompt longer than 500 characters", () => {
      const result = aiMealSchema.safeParse({
        ...validAIMeal,
        aiPrompt: "a".repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Prompt może mieć maksymalnie 500 znaków");
      }
    });
  });

  describe("date and time validation", () => {
    it("accepts valid date format", () => {
      const result = aiMealSchema.safeParse(validAIMeal);
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format", () => {
      const result = aiMealSchema.safeParse({
        ...validAIMeal,
        date: "27-01-2025",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid time format", () => {
      const result = aiMealSchema.safeParse(validAIMeal);
      expect(result.success).toBe(true);
    });

    it("rejects invalid time format", () => {
      const result = aiMealSchema.safeParse({
        ...validAIMeal,
        time: "8:30",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("category validation", () => {
    it("accepts all valid categories", () => {
      const categories = ["breakfast", "lunch", "dinner", "snack"] as const;
      categories.forEach((category) => {
        const result = aiMealSchema.safeParse({
          ...validAIMeal,
          category,
        });
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid category", () => {
      const result = aiMealSchema.safeParse({
        ...validAIMeal,
        category: "brunch",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("type inference", () => {
  it("infers correct types from schemas", () => {
    const signup = signupSchema.parse({
      email: "test@example.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    // TypeScript will validate these types at compile time
    expect(typeof signup.email).toBe("string");
    expect(typeof signup.password).toBe("string");
    expect(typeof signup.passwordConfirm).toBe("string");
  });

  it("infers correct nullable types", () => {
    const meal = manualMealSchema.parse({
      description: "Test",
      calories: 100,
      protein: null,
      carbs: null,
      fats: null,
      fiber: null,
      category: null,
      date: "2025-01-27",
      time: "12:00",
    });

    expect(meal.protein).toBeNull();
    expect(meal.category).toBeNull();
  });
});
