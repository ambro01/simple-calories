# REST API Plan - Szybkie Kalorie

## 1. Resources

### Core Resources

- **profiles** - User profiles bridging Supabase Auth with application logic
- **calorie-goals** - User's calorie goal history with effective dates
- **meals** - User's meal entries with nutritional information
- **ai-generations** - AI generation history for meal analysis
- **daily-progress** - Aggregated daily progress (read-only view)

### Administrative Resources

- **error-logs** - Application error logs (admin access only)

## 2. Endpoints

### 2.1. Authentication

Authentication is handled directly by Supabase Auth SDK on the client side. The API expects a valid JWT token in the Authorization header for all authenticated endpoints.

**Authorization Header Format:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Client-side operations:**

- `supabase.auth.signUp({ email, password })` - User registration
- `supabase.auth.signInWithPassword({ email, password })` - User login
- `supabase.auth.resetPasswordForEmail(email)` - Password reset
- `supabase.auth.signOut()` - Logout

### 2.2. Profiles

#### GET /api/v1/profile

Get the authenticated user's profile.

**Authentication:** Required

**Response 200:**

```json
{
  "id": "uuid",
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

**Error 401:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### PATCH /api/v1/profile

Update the authenticated user's profile.

**Authentication:** Required

**Request Body:**

```json
{
  // Currently no updatable fields, reserved for future extensions
}
```

**Response 200:**

```json
{
  "id": "uuid",
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T12:30:00Z"
}
```

### 2.3. Calorie Goals

#### GET /api/v1/calorie-goals

Get all calorie goals for the authenticated user (history).

**Authentication:** Required

**Query Parameters:**

- `limit` (optional, default: 50) - Number of records to return
- `offset` (optional, default: 0) - Number of records to skip

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "daily_goal": 2500,
      "effective_from": "2025-01-28",
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /api/v1/calorie-goals/current

Get the current calorie goal for the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `date` (optional, default: today) - Date in YYYY-MM-DD format

**Response 200:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "daily_goal": 2500,
  "effective_from": "2025-01-20",
  "created_at": "2025-01-19T10:00:00Z",
  "updated_at": "2025-01-19T10:00:00Z"
}
```

**Response 404:**

```json
{
  "error": "Not Found",
  "message": "No calorie goal found. Using default: 2000 kcal"
}
```

#### POST /api/v1/calorie-goals

Create a new calorie goal. The goal will be effective from tomorrow (CURRENT_DATE + 1).

**Authentication:** Required

**Request Body:**

```json
{
  "daily_goal": 2500
}
```

**Validation:**

- `daily_goal`: required, integer, 1-10000

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "daily_goal": 2500,
  "effective_from": "2025-01-28",
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

**Error 400:**

```json
{
  "error": "Validation Error",
  "message": "Invalid daily_goal value",
  "details": {
    "daily_goal": "Must be between 1 and 10000"
  }
}
```

**Error 409:**

```json
{
  "error": "Conflict",
  "message": "A calorie goal for this date already exists. Use PATCH to update."
}
```

#### PATCH /api/v1/calorie-goals/:id

Update an existing calorie goal.

**Authentication:** Required

**URL Parameters:**

- `id` - Calorie goal UUID

**Request Body:**

```json
{
  "daily_goal": 2600
}
```

**Response 200:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "daily_goal": 2600,
  "effective_from": "2025-01-28",
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T12:00:00Z"
}
```

**Error 404:**

```json
{
  "error": "Not Found",
  "message": "Calorie goal not found"
}
```

#### DELETE /api/v1/calorie-goals/:id

Delete a calorie goal.

**Authentication:** Required

**URL Parameters:**

- `id` - Calorie goal UUID

**Response 204:** No Content

**Error 404:**

```json
{
  "error": "Not Found",
  "message": "Calorie goal not found"
}
```

### 2.4. AI Generations

#### POST /api/v1/ai-generations

Generate nutritional estimates from a text description using AI.

**Authentication:** Required

**Rate Limit:** 10 requests per minute per user

**Request Body:**

```json
{
  "prompt": "dwa jajka sadzone na maśle i kromka chleba"
}
```

**Validation:**

- `prompt`: required, string, max 1000 characters

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "meal_id": null,
  "prompt": "dwa jajka sadzone na maśle i kromka chleba",
  "generated_calories": 420,
  "generated_protein": 18.5,
  "generated_carbs": 25.0,
  "generated_fats": 28.0,
  "assumptions": "Założono: 2 jajka średniej wielkości (120g), 10g masła, 1 kromka chleba pszennego (40g)",
  "model_used": "gpt-4",
  "generation_duration": 1234,
  "status": "completed",
  "error_message": null,
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Response 201 (unclear description):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "meal_id": null,
  "prompt": "coś zjadłem",
  "generated_calories": null,
  "generated_protein": null,
  "generated_carbs": null,
  "generated_fats": null,
  "assumptions": null,
  "model_used": "gpt-4",
  "generation_duration": 890,
  "status": "failed",
  "error_message": "Opis jest zbyt ogólny. Proszę podać więcej szczegółów: jakie składniki, ile porcji, sposób przygotowania.",
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Error 400:**

```json
{
  "error": "Validation Error",
  "message": "Invalid request",
  "details": {
    "prompt": "Prompt is required and cannot be empty"
  }
}
```

**Error 429:**

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many AI generation requests. Please wait before trying again.",
  "retry_after": 45
}
```

**Error 500:**

```json
{
  "error": "AI Service Error",
  "message": "Failed to generate nutritional estimates. Please try again."
}
```

#### GET /api/v1/ai-generations/:id

Get a specific AI generation by ID.

**Authentication:** Required

**URL Parameters:**

- `id` - AI generation UUID

**Response 200:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "meal_id": "uuid",
  "prompt": "dwa jajka sadzone na maśle i kromka chleba",
  "generated_calories": 420,
  "generated_protein": 18.5,
  "generated_carbs": 25.0,
  "generated_fats": 28.0,
  "assumptions": "Założono: 2 jajka średniej wielkości (120g), 10g masła, 1 kromka chleba pszennego (40g)",
  "model_used": "gpt-4",
  "generation_duration": 1234,
  "status": "completed",
  "error_message": null,
  "created_at": "2025-01-27T10:00:00Z"
}
```

**Error 404:**

```json
{
  "error": "Not Found",
  "message": "AI generation not found"
}
```

#### GET /api/v1/ai-generations

Get AI generations for the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `meal_id` (optional) - Filter by meal UUID (returns generation history for that meal)
- `limit` (optional, default: 20) - Number of records to return
- `offset` (optional, default: 0) - Number of records to skip

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "meal_id": "uuid",
      "prompt": "dwa jajka sadzone na maśle i kromka chleba",
      "generated_calories": 420,
      "generated_protein": 18.5,
      "generated_carbs": 25.0,
      "generated_fats": 28.0,
      "assumptions": "Założono: 2 jajka średniej wielkości (120g), 10g masła, 1 kromka chleba pszennego (40g)",
      "model_used": "gpt-4",
      "generation_duration": 1234,
      "status": "completed",
      "error_message": null,
      "created_at": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

### 2.5. Meals

#### GET /api/v1/meals

Get meals for the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `date` (optional) - Filter by specific date (YYYY-MM-DD)
- `date_from` (optional) - Start date for range filter (YYYY-MM-DD)
- `date_to` (optional) - End date for range filter (YYYY-MM-DD)
- `category` (optional) - Filter by category: breakfast, lunch, dinner, snack, other
- `limit` (optional, default: 50) - Number of records to return
- `offset` (optional, default: 0) - Number of records to skip
- `sort` (optional, default: desc) - Sort order: asc, desc

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "description": "Jajka sadzone z chlebem",
      "calories": 420,
      "protein": 18.5,
      "carbs": 25.0,
      "fats": 28.0,
      "category": "breakfast",
      "input_method": "ai",
      "meal_timestamp": "2025-01-27T08:30:00Z",
      "created_at": "2025-01-27T08:35:00Z",
      "updated_at": "2025-01-27T08:35:00Z",
      "ai_generation": {
        "id": "uuid",
        "prompt": "dwa jajka sadzone na maśle i kromka chleba",
        "assumptions": "Założono: 2 jajka średniej wielkości (120g), 10g masła, 1 kromka chleba pszennego (40g)",
        "model_used": "gpt-4",
        "generation_duration": 1234
      }
    }
  ],
  "pagination": {
    "total": 120,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /api/v1/meals/:id

Get a specific meal by ID.

**Authentication:** Required

**URL Parameters:**

- `id` - Meal UUID

**Response 200:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Jajka sadzone z chlebem",
  "calories": 420,
  "protein": 18.5,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai",
  "meal_timestamp": "2025-01-27T08:30:00Z",
  "created_at": "2025-01-27T08:35:00Z",
  "updated_at": "2025-01-27T08:35:00Z",
  "ai_generation": {
    "id": "uuid",
    "prompt": "dwa jajka sadzone na maśle i kromka chleba",
    "assumptions": "Założono: 2 jajka średniej wielkości (120g), 10g masła, 1 kromka chleba pszennego (40g)",
    "model_used": "gpt-4",
    "generation_duration": 1234
  }
}
```

**Error 404:**

```json
{
  "error": "Not Found",
  "message": "Meal not found"
}
```

#### POST /api/v1/meals

Create a new meal entry.

**Authentication:** Required

**Request Body (AI-generated):**

```json
{
  "description": "Jajka sadzone z chlebem",
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

**Request Body (Manual):**

```json
{
  "description": "Kurczak z ryżem",
  "calories": 650,
  "protein": 45.0,
  "carbs": 70.0,
  "fats": 15.0,
  "category": "lunch",
  "input_method": "manual",
  "meal_timestamp": "2025-01-27T13:00:00Z"
}
```

**Validation:**

- `description`: required, string, max 500 characters
- `calories`: required, integer, 1-10000
- `protein`: optional, decimal(6,2), 0-1000
- `carbs`: optional, decimal(6,2), 0-1000
- `fats`: optional, decimal(6,2), 0-1000
- `category`: optional, enum [breakfast, lunch, dinner, snack, other]
- `input_method`: required, enum [ai, manual, ai-edited]
- `ai_generation_id`: required if input_method is 'ai', UUID
- `meal_timestamp`: required, ISO 8601 timestamp, cannot be in the future

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Jajka sadzone z chlebem",
  "calories": 420,
  "protein": 18.5,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai",
  "meal_timestamp": "2025-01-27T08:30:00Z",
  "created_at": "2025-01-27T08:35:00Z",
  "updated_at": "2025-01-27T08:35:00Z",
  "warnings": []
}
```

**Response 201 (with warning):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Kurczak z ryżem",
  "calories": 650,
  "protein": 45.0,
  "carbs": 70.0,
  "fats": 15.0,
  "category": "lunch",
  "input_method": "manual",
  "meal_timestamp": "2025-01-27T13:00:00Z",
  "created_at": "2025-01-27T13:05:00Z",
  "updated_at": "2025-01-27T13:05:00Z",
  "warnings": [
    {
      "field": "macronutrients",
      "message": "The calculated calories from macronutrients (540 kcal) differs by more than 5% from the provided calories (650 kcal). Please verify your input."
    }
  ]
}
```

**Error 400:**

```json
{
  "error": "Validation Error",
  "message": "Invalid meal data",
  "details": {
    "calories": "Must be between 1 and 10000",
    "meal_timestamp": "Cannot be in the future"
  }
}
```

#### PATCH /api/v1/meals/:id

Update an existing meal entry.

**Authentication:** Required

**URL Parameters:**

- `id` - Meal UUID

**Request Body:**

```json
{
  "description": "Jajka sadzone z chlebem (updated)",
  "calories": 450,
  "protein": 20.0,
  "category": "breakfast"
}
```

**Note:** When a user edits values from an AI-generated meal, the `input_method` should be changed to 'ai-edited'.

**Response 200:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Jajka sadzone z chlebem (updated)",
  "calories": 450,
  "protein": 20.0,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai-edited",
  "meal_timestamp": "2025-01-27T08:30:00Z",
  "created_at": "2025-01-27T08:35:00Z",
  "updated_at": "2025-01-27T10:15:00Z",
  "warnings": []
}
```

**Error 404:**

```json
{
  "error": "Not Found",
  "message": "Meal not found"
}
```

#### DELETE /api/v1/meals/:id

Delete a meal entry.

**Authentication:** Required

**URL Parameters:**

- `id` - Meal UUID

**Response 204:** No Content

**Error 404:**

```json
{
  "error": "Not Found",
  "message": "Meal not found"
}
```

### 2.6. Daily Progress

#### GET /api/v1/daily-progress

Get daily progress summary for the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `date_from` (optional) - Start date (YYYY-MM-DD)
- `date_to` (optional) - End date (YYYY-MM-DD)
- `limit` (optional, default: 30) - Number of records to return
- `offset` (optional, default: 0) - Number of records to skip

**Response 200:**

```json
{
  "data": [
    {
      "date": "2025-01-27",
      "user_id": "uuid",
      "total_calories": 2150,
      "total_protein": 95.5,
      "total_carbs": 220.0,
      "total_fats": 75.0,
      "calorie_goal": 2500,
      "percentage": 86.0,
      "status": "under"
    },
    {
      "date": "2025-01-26",
      "user_id": "uuid",
      "total_calories": 2480,
      "total_protein": 105.0,
      "total_carbs": 250.0,
      "total_fats": 82.0,
      "calorie_goal": 2500,
      "percentage": 99.2,
      "status": "on_track"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 30,
    "offset": 0
  }
}
```

**Status Calculation:**

- `under`: total_calories < calorie_goal - 100
- `on_track`: calorie_goal - 100 <= total_calories <= calorie_goal + 100
- `over`: total_calories > calorie_goal + 100

#### GET /api/v1/daily-progress/:date

Get daily progress for a specific date.

**Authentication:** Required

**URL Parameters:**

- `date` - Date in YYYY-MM-DD format

**Response 200:**

```json
{
  "date": "2025-01-27",
  "user_id": "uuid",
  "total_calories": 2150,
  "total_protein": 95.5,
  "total_carbs": 220.0,
  "total_fats": 75.0,
  "calorie_goal": 2500,
  "percentage": 86.0,
  "status": "under"
}
```

**Response 200 (no meals for date):**

```json
{
  "date": "2025-01-27",
  "user_id": "uuid",
  "total_calories": 0,
  "total_protein": 0,
  "total_carbs": 0,
  "total_fats": 0,
  "calorie_goal": 2500,
  "percentage": 0.0,
  "status": "under"
}
```

## 3. Authentication and Authorization

### Authentication Mechanism

The application uses **Supabase Auth** with JWT (JSON Web Tokens) for authentication:

- **Registration/Login**: Handled by Supabase Auth SDK on the client side
- **Token Storage**: JWT tokens are stored securely by Supabase SDK (localStorage/sessionStorage)
- **Token Lifetime**: 30 days (configurable in Supabase settings)
- **Password Security**: Passwords are hashed using bcrypt by Supabase Auth

### Authorization Strategy

Authorization is enforced at two levels:

#### 1. API Level

- All endpoints (except health checks) require a valid JWT token
- Token is passed in the `Authorization` header: `Bearer <token>`
- Invalid or expired tokens return 401 Unauthorized
- The API extracts `user_id` from the JWT token for all operations

#### 2. Database Level (Row Level Security - RLS)

Supabase RLS policies ensure complete data isolation:

```sql
-- Example RLS policy
CREATE POLICY "Users can view own meals"
ON meals FOR SELECT
USING (user_id = auth.uid());
```

**RLS Policies Applied:**

- **profiles**: Users can view/update only their own profile
- **meals**: Users have full CRUD access only to their own meals
- **calorie_goals**: Users have full CRUD access only to their own goals
- **ai_generations**: Users have full CRUD access only to their own generations
- **error_logs**: No user access (admin only via Supabase Dashboard)

### Security Features

1. **Password Requirements**: Enforced by Supabase Auth (min 6 characters)
2. **Email Verification**: Optional, configurable in Supabase
3. **Rate Limiting**: Applied to AI generation endpoints (10 requests/minute per user)
4. **CORS**: Configured to allow only trusted frontend origins
5. **HTTPS Only**: All API communication must use HTTPS in production

## 4. Validation and Business Logic

### 4.1. Calorie Goals Validation

**Field Validation:**

- `daily_goal`: Required, integer, range 1-10000

**Business Rules:**

1. **First Goal**: Created automatically by database trigger when user registers
   - Default value: 2000 kcal
   - Effective from: CURRENT_DATE (exception for first goal only)

2. **Subsequent Goals**: Created via API
   - Effective from: CURRENT_DATE + 1 (always tomorrow)
   - Allows multiple changes in same day (updates effective_from date)

3. **Conflict Resolution**:
   - UNIQUE constraint on (user_id, effective_from)
   - Use UPSERT pattern: `ON CONFLICT (user_id, effective_from) DO UPDATE`

### 4.2. Meals Validation

**Field Validation:**

- `description`: Required, string, max 500 characters
- `calories`: Required, integer, range 1-10000
- `protein`: Optional, decimal(6,2), range 0-1000
- `carbs`: Optional, decimal(6,2), range 0-1000
- `fats`: Optional, decimal(6,2), range 0-1000
- `category`: Optional, enum [breakfast, lunch, dinner, snack, other]
- `input_method`: Required, enum [ai, manual, ai-edited]
- `meal_timestamp`: Required, ISO 8601 timestamp, cannot be in the future

**Business Rules:**

1. **Macronutrient Warning**: If macronutrients are provided, calculate:

   ```
   calculated_calories = (protein * 4) + (carbs * 4) + (fats * 9)
   difference_percentage = abs(calculated_calories - calories) / calories * 100
   ```

   If `difference_percentage > 5%`, add warning to response (but still save)

2. **Input Method Tracking**:
   - `ai`: Accepted AI result without edits
   - `ai-edited`: User modified AI-generated values
   - `manual`: Fully manual entry

   This enables tracking of AI metrics:
   - Trust Metric: COUNT(input_method='ai') / COUNT(input_method IN ('ai', 'ai-edited'))
   - Usefulness Metric: COUNT(input_method IN ('ai', 'ai-edited')) / COUNT(\*)

3. **Timestamp Validation**: `meal_timestamp` cannot be in the future (validated against server time)

4. **AI Generation Linking**:
   - If `input_method='ai'`, require `ai_generation_id`
   - After meal creation, update `ai_generations.meal_id = new_meal_id`

### 4.3. AI Generations Validation

**Field Validation:**

- `prompt`: Required, string, max 1000 characters
- `generated_calories`: Optional (set by AI), integer, range 1-10000
- `generated_protein`: Optional, decimal(6,2), range 0-1000
- `generated_carbs`: Optional, decimal(6,2), range 0-1000
- `generated_fats`: Optional, decimal(6,2), range 0-1000

**Business Rules:**

1. **Generation Flow**:

   ```
   POST /ai-generations (status: pending)
     → Call AI service
     → Update status: completed/failed
     → Return result
   ```

2. **Status Transitions**:
   - `pending`: Initial state while calling AI
   - `completed`: AI successfully generated estimates
   - `failed`: AI couldn't process (unclear description or error)

3. **Failure Handling**:
   - If AI cannot estimate, set `status='failed'`
   - Provide helpful `error_message` asking for clarification
   - Still save the generation for metrics

4. **Rate Limiting**: 10 requests per minute per user to prevent abuse

5. **History Tracking**:
   - All AI calls are saved (even failed ones)
   - `meal_id = NULL` until user accepts
   - Multiple generations can exist for one meal (regenerations)

### 4.4. Daily Progress Business Logic

**Calculation Rules:**

1. **Aggregation**: Sum all meals for a specific date:

   ```sql
   SELECT
     DATE(meal_timestamp) as date,
     SUM(calories) as total_calories,
     SUM(protein) as total_protein,
     SUM(carbs) as total_carbs,
     SUM(fats) as total_fats
   FROM meals
   WHERE user_id = $1 AND DATE(meal_timestamp) = $2
   GROUP BY DATE(meal_timestamp)
   ```

2. **Goal Retrieval**: Use `get_current_calorie_goal(user_id, date)` function:
   - Returns goal effective on that date (latest goal with effective_from <= date)
   - Falls back to 2000 kcal if no goal exists

3. **Percentage Calculation**:

   ```
   percentage = ROUND(total_calories * 100.0 / calorie_goal, 1)
   ```

4. **Status Assignment**:
   - `under`: total_calories < (calorie_goal - 100)
   - `on_track`: (calorie_goal - 100) <= total_calories <= (calorie_goal + 100)
   - `over`: total_calories > (calorie_goal + 100)

5. **Empty Days**: If no meals for a date, return zeros but still show calorie_goal

### 4.5. Error Handling

**Client Errors (4xx):**

- `400 Bad Request`: Validation errors, malformed JSON
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Resource doesn't exist or user doesn't have access
- `409 Conflict`: Duplicate resource (e.g., calorie goal for same date)
- `422 Unprocessable Entity`: Request is valid but cannot be processed (business logic violation)
- `429 Too Many Requests`: Rate limit exceeded

**Server Errors (5xx):**

- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: AI service or database unavailable

**Error Response Format:**

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field1": "Specific validation error",
    "field2": "Another validation error"
  }
}
```

### 4.6. Data Integrity

**Automatic Operations:**

1. **Timestamps**: `created_at` and `updated_at` managed by database triggers
2. **User ID**: Extracted from JWT, never accepted from request body
3. **Cascade Deletes**: Deleting a profile cascades to all related data (meals, goals, ai_generations)
4. **Referential Integrity**: Foreign key constraints prevent orphaned records

**Transaction Requirements:**

- Creating meal + updating ai_generation.meal_id must be atomic
- Use database transactions for multi-step operations

### 4.7. Performance Considerations

**Pagination:**

- Default limit: Varies by endpoint (20-50 records)
- Maximum limit: 100 records per request
- Use offset-based pagination for simplicity in MVP

**Indexes:**

- Compound indexes on (user_id, timestamp/date DESC) for fast queries
- Foreign key indexes for joins
- Specialized indexes for common filters

**Caching:**

- Current calorie goal can be cached (changes infrequently)
- Daily progress can be cached with short TTL (1-5 minutes)
- Implement cache invalidation on meal creation/update/delete

**N+1 Query Prevention:**

- Use JOINs or database views (e.g., `meals_with_latest_ai`)
- Batch load related data when returning lists

## 5. API Versioning

The API uses URL path versioning: `/api/v1/...`

This allows for future breaking changes to be introduced in `/api/v2/` while maintaining backward compatibility.

## 6. Notes for Implementation

### Technology Stack Alignment

- **Astro + React**: API returns JSON, frontend handles rendering
- **Supabase**: Use Supabase client SDK for auth, direct PostgreSQL for data operations
- **OpenRouter.ai**: Call from backend/serverless function, not directly from frontend
- **TypeScript**: Generate TypeScript types from database schema using Supabase CLI

### Recommended Architecture

```
Frontend (Astro + React)
  ↓ HTTP + JWT
Edge Functions/API Routes (Astro endpoints)
  ↓ Supabase SDK
Supabase (PostgreSQL + Auth + RLS)
  ↓ HTTP
OpenRouter.ai (AI models)
```

### Security Checklist

- [ ] All endpoints validate JWT tokens
- [ ] RLS policies enabled on all tables
- [ ] Rate limiting configured for AI endpoints
- [ ] CORS configured for trusted origins only
- [ ] HTTPS enforced in production
- [ ] Input validation on all user-provided data
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (proper JSON encoding)

### Monitoring and Metrics

- Track AI metrics (trust, usefulness) from database queries
- Log errors to `error_logs` table
- Monitor AI generation success rate and duration
- Track API response times and error rates
- Set up alerts for high error rates or slow responses
