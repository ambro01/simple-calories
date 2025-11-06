# Testing Guide

This document describes the testing setup and practices for the Simple Calories application.

## Test Stack

- **Vitest** - Fast unit test runner with HMR support
- **React Testing Library** - User-centric component testing
- **Playwright** - End-to-end testing framework
- **Coverage**: Vitest with c8 coverage provider

## Project Structure

```
simple-calories/
├── src/
│   ├── components/
│   │   └── **/__tests__/          # Component unit tests
│   ├── lib/
│   │   ├── helpers/__tests__/     # Helper function tests
│   │   └── services/__tests__/    # Service tests
│   └── test/
│       ├── setup.ts               # Vitest global setup
│       └── test-utils.tsx         # Custom render utilities
├── e2e/
│   ├── fixtures.ts                # Playwright custom fixtures
│   └── *.spec.ts                  # E2E test files
├── vitest.config.ts               # Vitest configuration
└── playwright.config.ts           # Playwright configuration
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Generate test code using codegen
npm run test:e2e:codegen
```

## Writing Unit Tests

**Note:** This project uses Vitest's `globals: true` configuration, so `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` etc. are available globally without imports.

### Testing Components

```typescript
import { render, screen } from '@/test/test-utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Testing Helper Functions

```typescript
import { myHelper } from "../my-helper";

describe("myHelper", () => {
  it("performs correct calculation", () => {
    const result = myHelper(5, 10);
    expect(result).toBe(15);
  });
});
```

### Using Mocks

```typescript
// Mock a function (vi is available globally)
const mockFn = vi.fn();

// Mock a module
vi.mock("../module", () => ({
  someFunction: vi.fn(() => "mocked value"),
}));

// Spy on existing function
vi.spyOn(object, "method");
```

## Writing E2E Tests

### Basic Structure

```typescript
import { test, expect } from "./fixtures";

test.describe("Feature Name", () => {
  test("should perform action", async ({ page }) => {
    await page.goto("/");
    await page.click('button[aria-label="Submit"]');
    await expect(page).toHaveURL("/success");
  });
});
```

### Page Object Model

```typescript
// e2e/pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

// Usage in test
const loginPage = new LoginPage(page);
await loginPage.login("test@example.com", "password");
```

### Visual Regression Testing

```typescript
test("should match snapshot", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("page-name.png", {
    fullPage: true,
    animations: "disabled",
  });
});
```

## Coverage Goals

- **Target**: Minimum 80% coverage for:
  - Lines
  - Functions
  - Branches
  - Statements

### Priority Areas for Testing

1. **Business Logic** (High Priority)
   - Calorie calculations
   - Dietary goal tracking
   - Macronutrient validation

2. **Data Components** (High Priority)
   - Components that display user data
   - Forms with validation
   - API interaction components

3. **Utils/Helpers** (Medium Priority)
   - Date formatters
   - Validators
   - Data transformers

4. **UI Components** (Lower Priority for coverage)
   - Focus on critical user interactions
   - Test accessibility features

## Best Practices

### Unit Tests

- Use descriptive test names that explain what is being tested
- Follow Arrange-Act-Assert pattern
- Test one thing per test
- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` when monitoring existing functions
- Leverage inline snapshots for readable assertions

### E2E Tests

- Use Page Object Model for maintainable tests
- Prefer user-facing selectors (roles, labels) over implementation details
- Implement proper wait strategies (avoid arbitrary timeouts)
- Use `test.describe` to group related tests
- Clean up test data in hooks
- Run tests in parallel when possible

### General Guidelines

- Write tests alongside feature development
- Keep tests independent and isolated
- Mock external dependencies
- Use meaningful assertions
- Keep tests DRY but readable
- Document complex test setups

## CI/CD Integration

Tests will run automatically in the CI/CD pipeline:

- Unit tests run on every commit
- E2E tests run on pull requests
- Coverage reports are generated and enforced
- Failed tests block deployment

## Debugging Tests

### Vitest

```bash
# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- -t "pattern"

# Open UI for visual debugging
npm run test:ui
```

### Playwright

```bash
# Debug mode (opens inspector)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/example.spec.ts

# View test report
npx playwright show-report
```

## Common Issues

### Tests Timing Out

- Increase timeout in config
- Check for missing awaits
- Verify network requests complete

### Flaky Tests

- Add proper wait conditions
- Avoid arbitrary delays
- Mock time-dependent code
- Ensure test isolation

### Coverage Not Meeting Threshold

- Check excluded files in config
- Add tests for uncovered code paths
- Focus on business-critical areas first

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
