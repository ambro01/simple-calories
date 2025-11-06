# Unit Testing Tips - Lessons Learned

## Problem Analysis & Solutions

### 1. Vitest Globals Configuration

**Problem:**

- Test files were importing `describe`, `it`, `expect` from vitest
- Configuration had `globals: true` in vitest.config.ts
- This caused "No test suite found in file" error

**Solution:**

- When `globals: true` is set in vitest.config.ts, **DO NOT import** test functions
- Remove imports like: `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"`
- Keep only actual module imports

**Example:**

```typescript
// ❌ WRONG (with globals: true)
import { describe, it, expect } from "vitest";
import { myFunction } from "../my-module";

// ✅ CORRECT (with globals: true)
import { myFunction } from "../my-module";

describe("myFunction", () => {
  it("should work", () => {
    expect(myFunction()).toBe(true);
  });
});
```

### 2. Time Zone Issues in Date/Time Tests

**Problem:**

- Tests used UTC timestamps: `new Date("2025-01-27T08:30:00Z")`
- Functions returned local time using `getHours()` and `getMinutes()`
- Tests failed because local time ≠ UTC time (e.g., Poland is UTC+1)

**Solution:**

- Use local date constructor for time-based tests: `new Date(year, month, day, hour, minute)`
- This ensures tests work regardless of system timezone

**Example:**

```typescript
// ❌ WRONG - assumes UTC
it("returns correct time", () => {
  vi.setSystemTime(new Date("2025-01-27T08:30:00Z")); // UTC time
  expect(getCurrentTime()).toBe("08:30"); // Fails in non-UTC zones
});

// ✅ CORRECT - uses local time
it("returns correct time", () => {
  const localDate = new Date(2025, 0, 27, 8, 30, 0); // Local time
  vi.setSystemTime(localDate);
  expect(getCurrentTime()).toBe("08:30"); // Works everywhere
});
```

### 3. String Validation with Punctuation

**Problem:**

- Test checked: `expect(message).not.toContain(".")`
- This failed because the message ended with a period: "...Please verify your input."
- Intent was to verify numbers don't have decimal points

**Solution:**

- Be specific in what you're testing
- Use regex to check for decimal numbers: `not.toMatch(/\d+\.\d+ kcal/)`

**Example:**

```typescript
// ❌ WRONG - too broad
it("has no decimals in calories", () => {
  expect(result.message).not.toContain("."); // Fails if message has period
});

// ✅ CORRECT - specific check
it("has no decimals in calories", () => {
  expect(result.message).not.toMatch(/\d+\.\d+ kcal/); // Only checks numbers
});
```

### 4. Unicode/Emoji Character Counting

**Problem:**

- Test assumed emoji counts as 1 character: `"🍕".repeat(500)`
- Emoji use surrogate pairs in JavaScript, counting as 2 characters
- Test failed because 500 emoji = 1000 JS characters

**Solution:**

- Remember that emoji and some Unicode characters use 2+ characters in JavaScript
- Adjust test expectations accordingly

**Example:**

```typescript
// ❌ WRONG - assumes 1 char per emoji
it("handles emoji", () => {
  const text = "🍕".repeat(500); // Actually 1000 chars!
  expect(validateText(text, 500)).toBeNull();
});

// ✅ CORRECT - accounts for surrogate pairs
it("handles emoji", () => {
  const text = "🍕".repeat(250); // 500 chars (250 * 2)
  expect(validateText(text, 500)).toBeNull();
});
```

## General Best Practices

### When Writing Tests

1. **Check vitest.config.ts first**
   - If `globals: true` → don't import test functions
   - If `globals: false` → import test functions explicitly

2. **For date/time tests**
   - Always use local time constructors: `new Date(year, month, day, hour, minute)`
   - Never assume UTC unless the function explicitly uses UTC

3. **For string validation**
   - Be specific about what you're testing
   - Use regex for pattern matching, not `.includes()` or `.contains()`

4. **For Unicode/emoji**
   - Remember surrogate pairs count as 2 characters
   - Test with actual character limits, not emoji counts

### Debugging Test Failures

1. **"No test suite found"**
   - Check for conflicting globals imports
   - Verify file is in test pattern (`**/*.{test,spec}.{ts,tsx}`)

2. **Time-related failures**
   - Check if function uses local vs UTC time
   - Verify mock time is in correct timezone

3. **String matching failures**
   - Print actual output: `console.log(result.message)`
   - Use `.toMatch()` with regex instead of `.toContain()` for precision

## File Organization

```
src/
├── lib/
│   ├── helpers/
│   │   ├── __tests__/
│   │   │   ├── date-formatter.test.ts
│   │   │   ├── macronutrient-validator.test.ts
│   │   │   └── meal-form.utils.test.ts
│   │   ├── date-formatter.ts
│   │   ├── macronutrient-validator.ts
│   │   └── meal-form.utils.ts
│   └── validation/
│       ├── __tests__/
│       │   └── meal-form.validation.test.ts
│       └── meal-form.validation.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/lib/helpers/__tests__/date-formatter.test.ts

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```
