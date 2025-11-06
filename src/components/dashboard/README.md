# Dashboard Feature

Main dashboard view displaying a list of days with calorie tracking summary.

## Features

- **Infinite Scroll**: Automatically loads more days as you scroll
- **Daily Summary Cards**: Shows calories, progress bar, and macros for each day
- **Status Colors**: Visual feedback (gray/green/orange) based on calorie goal
- **Empty States**: Helpful UI when no data is available
- **Error Handling**: Graceful error messages with recovery options
- **Floating Action Button**: Quick access to add meals (mobile only)
- **Responsive**: Optimized for mobile and desktop

## Installation

All components are already installed. Just import and use:

```tsx
import { Dashboard } from "@/components/dashboard/Dashboard";
```

## Usage

### Basic Example with React

```tsx
import { Dashboard } from "@/components/dashboard/Dashboard";

function MyComponent() {
  return <Dashboard />;
}
```

### With Astro

```astro
---
// src/pages/index.astro
import Layout from "@/layouts/Layout.astro";
import { Dashboard } from "@/components/dashboard/Dashboard";
---

<Layout title="Dashboard - Szybkie Kalorie">
  <Dashboard client:load />
</Layout>
```

## API

### Dashboard Props

The Dashboard component doesn't require any props. All state is managed internally via the `useDashboard` hook.

```typescript
// No props required
<Dashboard />
```

## API Endpoints

The component interacts with these API endpoints:

### GET /api/v1/daily-progress

Fetches paginated list of daily progress records.

**Query Parameters:**

- `limit`: Number of days to fetch (default: 30)
- `offset`: Number of days to skip (for pagination)

**Response:**

```json
{
  "data": [
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
  ],
  "pagination": {
    "total": 100,
    "limit": 30,
    "offset": 0
  }
}
```

**Status Values:**

- `under`: < 90% of goal (gray)
- `on_track`: 90-110% of goal (green)
- `over`: > 110% of goal (orange)

## Component Structure

```
dashboard/
├── Dashboard.tsx           # Main container component
├── DayCard.tsx            # Individual day summary card
├── SkeletonDayCard.tsx    # Loading skeleton
├── EmptyDashboard.tsx     # Empty state component
└── FAB.tsx                # Floating Action Button
```

## State Management

The component uses the `useDashboard` hook for state management:

```typescript
const {
  state, // Current state object
  loadInitialDays, // Load first page
  loadMoreDays, // Load next page (infinite scroll)
  refreshDays, // Refresh from start
  selectDay, // Select day (for desktop two-pane)
  refetchAfterMealChange, // Silent refetch after meal CRUD
} = useDashboard();

// State structure
interface DashboardState {
  days: DailyProgressResponseDTO[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  limit: number;
  selectedDate: string | null; // For desktop two-pane
  refreshing: boolean; // Pull-to-refresh state
}
```

## User Interactions

### Click on Day Card

- **Mobile**: Navigates to `/day/:date` page
- **Desktop** (future): Opens day details in two-pane layout

### Scroll to Bottom

- Automatically triggers `loadMoreDays()` when reaching the end
- Uses Intersection Observer for performance

### Click FAB Button

- Opens AddMealModal to add a new meal
- After success, refreshes dashboard data

## Styling

Components use Tailwind CSS:

- **Grid layout**: `space-y-4` for vertical spacing
- **Cards**: `rounded-lg shadow-sm border`
- **Progress bars**: Color-coded by status
- **Responsive**: Mobile-first design

### Status Colors

```typescript
STATUS_COLOR_MAP = {
  under: {
    bg: "bg-sky-400",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  on_track: {
    bg: "bg-green-500",
    text: "text-green-700",
    border: "border-green-400",
  },
  over: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    border: "border-orange-400",
  },
};
```

## Error Handling

The component handles various error scenarios:

### Network Errors

- Shows error message with refresh button
- Maintains existing data if available

### 401 Unauthorized

- Message: "Unauthorized - please log in"
- User should be redirected to login

### 500 Server Error

- Message: "Server error - please try again later"
- Shows refresh button

### No Data

- Shows empty state with emoji and message
- Provides "Add meal" button

## Testing

### Manual Testing Checklist

#### Initial Load

- [ ] Dashboard loads with 30 days
- [ ] Shows skeleton loaders while loading
- [ ] Days are sorted by date (newest first)
- [ ] Each card shows correct date, calories, percentage, macros
- [ ] Progress bars have correct colors based on status

#### Infinite Scroll

- [ ] Scroll to bottom triggers loading more days
- [ ] Shows 3 skeleton cards at bottom while loading
- [ ] New days are appended to the list
- [ ] Stops loading when no more days available
- [ ] Shows "Koniec listy" message when done

#### Empty State

- [ ] Shows empty state when no days exist
- [ ] Displays emoji and helpful message
- [ ] FAB button is visible and clickable

#### Error States

- [ ] Network error shows error message
- [ ] 401 error shows appropriate message
- [ ] 500 error shows appropriate message
- [ ] Refresh button reloads the page

#### FAB Functionality

- [ ] FAB is visible on mobile (hidden on desktop lg+)
- [ ] Positioned in bottom-right corner
- [ ] Opens AddMealModal on click
- [ ] After adding meal, dashboard refreshes automatically

#### Day Card Click

- [ ] Clicking card navigates to `/day/:date`
- [ ] URL parameter matches clicked date (YYYY-MM-DD)
- [ ] Navigation works for all cards

#### Responsive Design

- [ ] Mobile: Single column layout
- [ ] Desktop: Centered with max-width
- [ ] FAB hidden on desktop (lg: breakpoint)
- [ ] Touch-friendly click targets (min 44x44px)

### API Testing

Test with these scenarios:

```bash
# 1. Fresh user (no data)
# Expected: Empty state

# 2. User with < 30 days
# Expected: All days shown, no infinite scroll

# 3. User with > 30 days
# Expected: Initial 30, then load more on scroll

# 4. Simulate 401 error
# Expected: Error message displayed

# 5. Simulate 500 error
# Expected: Error message with refresh button

# 6. Add meal and verify refresh
# Expected: Dashboard automatically updates
```

### Browser Testing

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

## Performance Considerations

### Optimization Techniques Used

- **Intersection Observer**: Efficient scroll detection
- **Skeleton Loading**: Perceived performance improvement
- **Batch Loading**: 30 days at a time
- **Silent Refetch**: No loading spinner for background updates

### Future Optimizations

- [ ] React.memo for DayCard
- [ ] Virtual scrolling for very long lists
- [ ] Implement pull-to-refresh
- [ ] Cache API responses

## Accessibility

- ✅ Semantic HTML (buttons, headings)
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus indicators
- ✅ Role="progressbar" on progress bars

## Known Limitations

1. **Edit Mode**: AddMealModal doesn't support edit mode yet
2. **Two-Pane**: Desktop two-pane layout not implemented
3. **Pull-to-Refresh**: Not implemented yet
4. **Offline Support**: No offline functionality
5. **Optimistic Updates**: No optimistic UI updates

## Troubleshooting

### Dashboard doesn't load

- Check network tab for API errors
- Verify authentication cookies
- Check console for JavaScript errors

### Infinite scroll doesn't trigger

- Ensure there are >30 days of data
- Check if `hasMore` is true in state
- Verify Intersection Observer is supported

### FAB not visible

- Check screen size (should be hidden on desktop)
- Verify z-index conflicts
- Check if element is being overlapped

### Cards show wrong data

- Verify API response format matches types
- Check date formatting
- Verify status calculation logic

## Related Components

- [AddMealModal](../add-meal/README.md) - For adding meals
- [DayDetails](../day-details/README.md) - Day details view
- [CalorieProgressBar](../shared/CalorieProgressBar.tsx) - Progress bar component

## Contributing

When modifying these components:

1. Follow existing patterns
2. Add TypeScript types for all props
3. Update this README
4. Test on mobile and desktop
5. Verify accessibility
