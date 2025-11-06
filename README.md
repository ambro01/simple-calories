# Simple Calories

A fast and intuitive calorie tracking web application powered by AI

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**Simple Calories** (Szybkie Kalorie) is an MVP web application designed to simplify the process of tracking calories and macronutrients. The primary goal is to remove the barriers that prevent people from consistently monitoring their diet by eliminating the time-consuming and complex aspects of traditional calorie counting tools.

### Key Features

- **AI-Powered Estimation**: Describe your meal in natural language and get instant calorie and macronutrient estimates
- **Manual Entry**: Option to manually input nutritional values when needed
- **Daily Goal Tracking**: Set and monitor your daily caloric targets
- **Progress Dashboard**: Visual overview of your daily calorie consumption with color-coded indicators
- **Meal Management**: Edit and delete meal entries with ease
- **Responsive Design**: Fully responsive web application with mobile-first approach
- **User Authentication**: Secure account system with password reset functionality

### Target Audience

This application is designed for health-conscious individuals who value their time and prefer simplicity over complexity when tracking their nutrition.

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, modern web framework
- **[React 19](https://react.dev/)** - Interactive UI components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible component library

### Backend

- **[Supabase](https://supabase.com/)** - Complete backend solution
  - PostgreSQL database
  - Backend-as-a-Service (BaaS)
  - Built-in authentication
  - Open-source and self-hostable

### AI Integration

- **[Openrouter.ai](https://openrouter.ai/)** - Access to multiple AI models
  - Support for OpenAI, Anthropic, Google, and more
  - Cost optimization through model selection
  - API key budget limits

### Testing

- **[Vitest](https://vitest.dev/)** - Unit and integration testing
  - Fast test runner built for Vite
  - Compatible with Jest API
  - Code coverage reporting with c8
- **[React Testing Library](https://testing-library.com/react)** - Component testing
  - User-centric testing approach
  - Integration with Vitest
- **[Playwright](https://playwright.dev/)** - End-to-end testing
  - Cross-browser testing (Chromium, Firefox, WebKit)
  - Auto-wait and retry mechanisms
  - Built-in accessibility testing with axe-core

### CI/CD & Hosting

- **GitHub Actions** - Continuous integration and deployment
- **DigitalOcean** - Application hosting via Docker containers

## Getting Started Locally

### Prerequisites

- **Node.js**: Version 22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) with the included `.nvmrc` file)
- **npm**: Comes with Node.js
- **Supabase Account**: For database and authentication
- **Openrouter.ai API Key**: For AI-powered meal estimation

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/simple-calories.git
   cd simple-calories
   ```

2. **Install Node.js version**

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Openrouter.ai Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Set up Supabase**
   - Create a new project on [Supabase](https://supabase.com/)
   - Run database migrations (to be added)
   - Copy your project URL and anon key to `.env`

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to `http://localhost:4321` (or the port shown in your terminal)

## Available Scripts

| Script             | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the development server with hot reload |
| `npm run build`    | Build the application for production         |
| `npm run preview`  | Preview the production build locally         |
| `npm run astro`    | Run Astro CLI commands                       |
| `npm run lint`     | Check code for linting errors                |
| `npm run lint:fix` | Automatically fix linting errors             |
| `npm run format`   | Format code with Prettier                    |

### Code Quality & Testing

This project uses:

- **ESLint** for code linting with TypeScript, React, and Astro support
- **Prettier** for code formatting
- **Husky** for Git hooks
- **lint-staged** for running linters on staged files before commit
- **Vitest** for unit and integration tests with 80%+ code coverage target
- **React Testing Library** for testing React components
- **Playwright** for end-to-end testing across multiple browsers

## Project Scope

### Included in MVP

✅ User registration and authentication (email/password)
✅ Password reset functionality
✅ Daily calorie goal management
✅ AI-powered calorie and macro estimation from text descriptions
✅ Manual nutritional value entry
✅ Meal categorization (Breakfast, Lunch, Dinner, Snack, Other)
✅ Date and time assignment for meals
✅ Dashboard with daily calorie overview
✅ Color-coded progress indicators
✅ Meal viewing, editing, and deletion
✅ Fully responsive web design (RWD)
✅ 3-step onboarding tutorial

### Not Included in MVP

❌ Photo or audio-based meal input
❌ Diet planning and meal suggestions
❌ Social features (sharing with trainers, etc.)
❌ Integration with third-party health/fitness apps
❌ Native mobile applications (iOS/Android)
❌ Automatic TDEE (Total Daily Energy Expenditure) calculation
❌ Weight or body measurement tracking
❌ Favorite/custom meal saving
❌ Weekly/monthly summaries

## Project Status

🚧 **In Development** - Version 0.0.1

This project is currently in active development as an MVP (Minimum Viable Product). Core features are being implemented following the [Product Requirements Document](.ai/prd.md).

### Success Metrics

The MVP will be evaluated based on:

- **AI Trust Metric**: Target 75% - Percentage of AI estimations accepted without manual edits
- **AI Usefulness Metric**: Target 75% - Percentage of entries initiated through AI vs. manual entry

## License

This project currently does not have a specified license. Please contact the project maintainer for usage permissions.

---

**Note**: This is an early-stage project. Contributions, feedback, and suggestions are welcome!
