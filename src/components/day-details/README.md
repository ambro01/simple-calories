# DayDetails Feature

Day details view showing calorie summary and list of meals for a specific day.

## Features

- **Daily Summary Header**: Sticky header with calories, progress bar, and macros
- **Meal List**: Categorized meals with delete/edit actions
- **Delete Confirmation**: Auto-collapsing confirmation (5s timer)
- **Category Badges**: Visual meal categorization with emojis
- **AI Detection**: Shows badge for AI-generated meals
- **Empty States**: Helpful UI when no meals exist
- **Error Handling**: Graceful error messages with recovery options
- **Floating Action Button**: Quick access to add meals (mobile only)
- **Responsive**: Optimized for mobile and desktop

## Installation

All components are already installed. Just import and use:

```tsx
import { DayDetails } from "@/components/day-details/DayDetails";
```

## Usage

### Basic Example with React

```tsx
import { DayDetails } from "@/components/day-details/DayDetails";

function MyComponent() {
  return <DayDetails date="2025-01-27" onBack={() => (window.location.href = "/")} />;
}
```

### With Astro

```astro
---
// src/pages/day/[date].astro
import Layout from "@/layouts/Layout.astro";
import { DayDetails } from "@/components/day-details/DayDetails";

const { date } = Astro.params;

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!date || !dateRegex.test(date)) {
  return Astro.redirect("/");
}
---

<Layout title="Day Details - Szybkie Kalorie">
  <DayDetails
    date={date}
    onBack={() => {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }}
    client:load
  />
</Layout>
```

## API

### DayDetails Props

```typescript
interface DayDetailsProps {
  date: string; // YYYY-MM-DD format, required
  onBack?: () => void; // Callback for back button (mobile)
}
```

**Props:**

- `date`: Date in YYYY-MM-DD format (e.g., "2025-01-27")
- `onBack`: Optional callback for back button navigation (shown only on mobile)

## API Endpoints

The component interacts with these API endpoints:

### GET /api/v1/daily-progress/:date

Fetches daily progress for a specific date.

**Example:** `GET /api/v1/daily-progress/2025-01-27`

**Response:**

```json
{
  "date": "2025-01-27",
  "user_id": "uuid",
  "total_calories": 1850,
  "total_protein": 95.5,
  "total_carbs": 180.0,
  "total_fats": 65.0,
  "calorie_goal": 2000,
  "percentage": 92.5,
  "status": "on_track"
}
```

**Error Responses:**

- `404`: No data found for this date
- `401`: Unauthorized
- `500`: Server error

### GET /api/v1/meals

Fetches list of meals for a specific date.

**Query Parameters:**

- `date`: Date in YYYY-MM-DD format
- `limit`: Number of meals to fetch (default: 100)
- `offset`: Number of meals to skip (default: 0)

**Example:** `GET /api/v1/meals?date=2025-01-27&limit=100&offset=0`

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "description": "Jajecznica z trzech jajek",
      "calories": 420,
      "protein": 18.5,
      "carbs": 25.0,
      "fats": 28.0,
      "category": "breakfast",
      "input_method": "ai",
      "ai_generation_id": "uuid",
      "meal_timestamp": "2025-01-27T08:30:00Z",
      "created_at": "2025-01-27T08:30:00Z",
      "updated_at": "2025-01-27T08:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 100,
    "offset": 0
  }
}
```

### DELETE /api/v1/meals/:id

Deletes a meal by ID.

**Example:** `DELETE /api/v1/meals/uuid`

**Response:** `204 No Content`

**Error Responses:**

- `404`: Meal not found
- `401`: Unauthorized
- `500`: Server error

## Component Structure

```
day-details/
├── DayDetails.tsx         # Main container component
├── DayHeader.tsx          # Sticky header with summary
├── MealCard.tsx           # Individual meal card
├── SkeletonMealCard.tsx   # Loading skeleton
└── EmptyMealsList.tsx     # Empty state component
```

## State Management

The component uses the `useDayDetails` hook for state management:

```typescript
const {
  state, // Current state object
  loadDayData, // Load progress + meals
  deleteMeal, // Delete meal by ID
  refreshAfterMealChange, // Silent refetch after CRUD
  setEditingMeal, // Set meal for editing
} = useDayDetails({ date });

// State structure
interface DayDetailsState {
  date: string;
  progress: DailyProgressResponseDTO | null;
  meals: MealResponseDTO[];
  loading: boolean;
  error: string | null;
  deletingMealId: string | null; // ID of meal being deleted
  editingMeal: MealResponseDTO | null; // Meal being edited
}
```

## User Interactions

### Click Back Button (Mobile)

- Triggers `onBack()` callback
- Typically navigates to dashboard

### Click Edit Button

- Opens AddMealModal in edit mode
- Pre-fills form with meal data
- After success, refreshes day data

### Click Delete Button

- Shows delete confirmation box
- Auto-collapses after 5 seconds
- Cancels on "Anuluj" click
- Deletes on "Usuń" click

### Delete Confirmation Flow

1. User clicks "Usuń" on meal card
2. Confirmation box appears (red background)
3. Timer starts (5 seconds)
4. User can confirm or cancel
5. If no action, auto-collapses after 5s
6. On confirm: deletes meal and refreshes data

### Click FAB Button

- Opens AddMealModal to add a new meal
- After success, refreshes day data

### Scroll Behavior

- Header is sticky (stays at top)
- Smooth scrolling on iOS/Android

## Styling

Components use Tailwind CSS:

- **Sticky header**: `sticky top-0 z-10`
- **Cards**: `rounded-lg shadow-sm border`
- **Category badges**: Color-coded with emojis
- **Responsive**: Mobile-first design

### Category Colors

```typescript
CATEGORY_CONFIG = {
  breakfast: {
    label: "Śniadanie",
    icon: "🍳",
    color: "bg-yellow-100 text-yellow-800",
  },
  lunch: {
    label: "Obiad",
    icon: "🍽️",
    color: "bg-blue-100 text-blue-800",
  },
  dinner: {
    label: "Kolacja",
    icon: "🍲",
    color: "bg-purple-100 text-purple-800",
  },
  snack: {
    label: "Przekąska",
    icon: "🍪",
    color: "bg-pink-100 text-pink-800",
  },
  other: {
    label: "Inne",
    icon: "🍴",
    color: "bg-gray-100 text-gray-800",
  },
};
```

## Error Handling

The component handles various error scenarios:

### Network Errors

- Shows error message with refresh button
- Maintains existing data if available

### 404 Not Found

- Message: "Nie znaleziono danych dla tego dnia"
- Shows error state

### 401 Unauthorized

- Message: "Unauthorized - please log in"
- User should be redirected to login

### 500 Server Error

- Message: "Server error - please try again later"
- Shows refresh button

### No Meals

- Shows empty state with emoji and message
- Provides "Add meal" button

## Testing

### Manual Testing Checklist

#### Initial Load

- [ ] Page loads with day summary header
- [ ] Shows skeleton loaders while loading
- [ ] Progress bar has correct color based on status
- [ ] Macros are displayed in 3-column grid
- [ ] Meals are sorted by timestamp

#### Header

- [ ] Date is formatted correctly (full Polish format)
- [ ] Calories show "X / Y kcal" format
- [ ] Percentage is calculated correctly
- [ ] Progress bar fills to correct width
- [ ] Header is sticky when scrolling
- [ ] Back button visible on mobile, hidden on desktop

#### Meal Cards

- [ ] Category badge shows correct emoji and label
- [ ] Time is formatted correctly (HH:MM)
- [ ] Description is displayed
- [ ] Calories show in bold
- [ ] Macros show when available (B/W/T)
- [ ] AI badge shows for AI-generated meals
- [ ] Edit button is clickable
- [ ] Delete button is clickable

#### Delete Confirmation

- [ ] Clicking "Usuń" shows confirmation box
- [ ] Confirmation has red background
- [ ] Shows "Czy na pewno chcesz usunąć?" message
- [ ] "Usuń" and "Anuluj" buttons work
- [ ] Auto-collapses after 5 seconds
- [ ] Timer cancels when user interacts
- [ ] After deletion, data refreshes
- [ ] During deletion, card shows opacity-50

#### Empty State

- [ ] Shows empty state when no meals exist
- [ ] Displays emoji and helpful message
- [ ] "Dodaj posiłek" button is visible and clickable
- [ ] FAB button is also visible

#### Error States

- [ ] Network error shows error message
- [ ] 404 error shows appropriate message
- [ ] 401 error shows appropriate message
- [ ] 500 error shows appropriate message
- [ ] Refresh button reloads the page

#### FAB Functionality

- [ ] FAB is visible on mobile (hidden on desktop lg+)
- [ ] Positioned in bottom-right corner
- [ ] Opens AddMealModal on click
- [ ] After adding meal, day data refreshes automatically

#### Edit Functionality

- [ ] Clicking "Edytuj" opens modal
- [ ] Modal is pre-filled with meal data (when implemented)
- [ ] After editing, data refreshes
- [ ] editingMeal state is cleared after modal closes

#### Responsive Design

- [ ] Mobile: Full-width layout
- [ ] Desktop: Centered with max-width
- [ ] Back button hidden on desktop
- [ ] FAB hidden on desktop (lg: breakpoint)
- [ ] Touch-friendly click targets (min 44x44px)
- [ ] Sticky header works on all devices

### API Testing

Test with these scenarios:

```bash
# 1. Day with no meals
# Expected: Empty state with "Dodaj posiłek" button

# 2. Day with multiple meals
# Expected: All meals displayed, sorted by time

# 3. Day with only AI meals
# Expected: All show AI badge

# 4. Day with mixed AI and manual meals
# Expected: AI badge only on AI meals

# 5. Invalid date format
# Expected: Redirect to dashboard

# 6. Future date
# Expected: Empty state or error

# 7. Delete meal
# Expected: Meal removed, data refreshed

# 8. Simulate 404 error
# Expected: Error message displayed

# 9. Simulate 500 error
# Expected: Error message with refresh button
```

### Browser Testing

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Edge Cases

- [ ] Day with 0 calories
- [ ] Day with >10,000 calories
- [ ] Meal with null macros
- [ ] Meal with very long description
- [ ] Very old dates (years ago)
- [ ] Future dates

## Performance Considerations

### Optimization Techniques Used

- **Parallel Fetching**: Progress and meals fetched in parallel
- **Skeleton Loading**: Perceived performance improvement
- **Silent Refetch**: No loading spinner for background updates
- **Auto-cleanup**: Timers and listeners cleaned up properly

### Future Optimizations

- [ ] React.memo for MealCard
- [ ] Virtualization for very long lists
- [ ] Lazy loading of images (if added)
- [ ] Cache meal data

## Accessibility

- ✅ Semantic HTML (buttons, headings, sections)
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus indicators
- ✅ Role="progressbar" on progress bars
- ✅ Timed actions (auto-collapse) can be cancelled

## Known Limitations

1. **Edit Mode**: AddMealModal doesn't support edit mode yet (requires `initialMeal` prop)
2. **Meal Limit**: Only loads first 100 meals (no pagination for >100)
3. **No Sorting Options**: Meals always sorted by timestamp
4. **No Filtering**: Can't filter by category
5. **No Search**: Can't search meal descriptions

## Troubleshooting

### Day details don't load

- Check network tab for API errors
- Verify date format is YYYY-MM-DD
- Check authentication cookies
- Check console for JavaScript errors

### Delete doesn't work

- Verify user has permission to delete
- Check network tab for 404/401/500 errors
- Ensure meal ID is valid

### Auto-collapse not working

- Check if timer is being cleared prematurely
- Verify useEffect cleanup is working
- Check browser console for errors

### Meals show wrong data

- Verify API response format matches types
- Check date/time formatting
- Verify category mapping

### Edit button doesn't work

- Implement edit mode in AddMealModal first
- Check if editingMeal state is set correctly
- Verify modal opens with correct props

### Header not sticky

- Check if `sticky top-0` classes are applied
- Verify z-index (should be z-10)
- Check parent container overflow settings

## Related Components

- [Dashboard](../dashboard/README.md) - Main dashboard view
- [AddMealModal](../add-meal/README.md) - For adding/editing meals
- [CalorieProgressBar](../shared/CalorieProgressBar.tsx) - Progress bar component

## Contributing

When modifying these components:

1. Follow existing patterns
2. Add TypeScript types for all props
3. Update this README
4. Test on mobile and desktop
5. Verify accessibility
6. Test delete confirmation timer
7. Ensure cleanup in useEffect hooks
