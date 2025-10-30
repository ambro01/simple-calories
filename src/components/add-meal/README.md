# AddMeal Feature

Modal form component for adding meals with AI-powered or manual calorie tracking.

## Features

- **AI Mode**: Describe meal in natural language, get automatic calorie estimation
- **Manual Mode**: Enter calories and macronutrients manually
- **Smart Validation**: Real-time validation with helpful warnings
- **Auto-detection**: Category detection based on time
- **Macro Warning**: Alerts when macros don't match calories
- **Responsive**: Fullscreen on mobile, dialog on desktop

## Installation

All components are already installed. Just import and use:

```tsx
import { AddMealModal } from '@/components/add-meal';
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { AddMealModal } from '@/components/add-meal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Dodaj posiłek
      </button>

      <AddMealModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(meal) => {
          console.log('Meal added:', meal);
          setIsOpen(false);
        }}
      />
    </>
  );
}
```

### With Astro

```astro
---
// In your .astro file
---

<button id="open-add-meal">Dodaj posiłek</button>

<div id="add-meal-modal"></div>

<script>
  import { AddMealModal } from '@/components/add-meal';
  import { createRoot } from 'react-dom/client';
  import { createElement } from 'react';

  const button = document.getElementById('open-add-meal');
  const container = document.getElementById('add-meal-modal');

  let isOpen = false;

  function render() {
    const root = createRoot(container);
    root.render(
      createElement(AddMealModal, {
        isOpen,
        onClose: () => {
          isOpen = false;
          render();
        },
        onSuccess: (meal) => {
          console.log('Meal added:', meal);
          isOpen = false;
          render();
          // Refresh your meals list here
        },
      })
    );
  }

  button?.addEventListener('click', () => {
    isOpen = true;
    render();
  });

  render();
</script>
```

## API

### AddMealModal Props

```typescript
interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meal: CreateMealResponseDTO) => void;
}
```

- `isOpen`: Controls modal visibility
- `onClose`: Called when user cancels or clicks outside
- `onSuccess`: Called when meal is successfully created. Receives the created meal data.

## API Endpoints

The component interacts with these API endpoints:

### POST /api/v1/ai-generations
Generates AI calorie estimation from meal description.

**Request:**
```json
{
  "prompt": "Jajecznica z trzech jajek i kromka chleba"
}
```

**Response:**
```json
{
  "id": "uuid",
  "generated_calories": 420,
  "generated_protein": 18.5,
  "generated_carbs": 25.0,
  "generated_fats": 28.0,
  "assumptions": "Based on medium eggs and whole grain bread",
  "status": "completed"
}
```

### POST /api/v1/meals
Creates a new meal entry.

**Request (AI mode):**
```json
{
  "description": "Jajecznica z chlebem",
  "calories": 420,
  "protein": 18.5,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai",
  "ai_generation_id": "uuid",
  "meal_timestamp": "2025-01-27T08:30:00Z"
}
```

**Request (Manual mode):**
```json
{
  "description": "Kurczak z ryżem",
  "calories": 550,
  "protein": 45.0,
  "carbs": 60.0,
  "fats": 12.0,
  "category": "lunch",
  "input_method": "manual",
  "meal_timestamp": "2025-01-27T13:00:00Z"
}
```

## Component Structure

```
add-meal/
├── AddMealModal.tsx          # Main modal container
├── MealForm.tsx              # Form orchestrator
├── SegmentedControl.tsx      # AI/Manual toggle
├── CharacterCounter.tsx      # Character count display
├── ExampleChips.tsx          # Example prompts
├── LoadingState.tsx          # Multi-stage loading
├── FormActions.tsx           # Cancel/Submit buttons
├── ai-mode/
│   ├── AIMode.tsx            # AI mode interface
│   └── AIResult.tsx          # AI result display
├── manual-mode/
│   ├── ManualMode.tsx        # Manual mode interface
│   ├── MacroInputs.tsx       # Macro input fields
│   └── MacroWarning.tsx      # Macro mismatch warning
└── common-fields/
    ├── CommonFields.tsx      # Shared fields
    └── CategorySelector.tsx  # Category buttons
```

## Validation Rules

### AI Mode
- Prompt: required, max 500 characters
- Date: cannot be in future (blocks submit)
- Date: >7 days old shows warning (doesn't block)

### Manual Mode
- Description: required, max 500 characters
- Calories: required, 1-10000 kcal, integer
- Macros: optional, 0-1000g each, decimal(6,2)
- Macro warning: shows if difference >5% (doesn't block)
- Date: same as AI mode

## State Management

The component uses the `useAddMealForm` hook for centralized state management:

```typescript
const form = useAddMealForm();

// Access state
form.state.mode              // 'ai' | 'manual'
form.state.calories          // number | null
form.state.aiLoading         // boolean

// Actions
form.generateAI()            // Trigger AI generation
form.submitMeal()            // Submit form
form.switchToManual(true)    // Switch modes
form.updateField('calories', 500)  // Update field
```

## Styling

Components use Tailwind CSS with shadcn/ui components:
- Fully responsive (mobile-first)
- Dark mode support
- Accessible (ARIA, keyboard navigation)
- Smooth animations and transitions

## Error Handling

The component handles various error scenarios:
- Network errors
- API rate limiting (429)
- Unclear AI descriptions
- Validation errors
- Missing AI generation
- Server errors (500)

All errors are displayed with appropriate UI feedback and recovery options.
