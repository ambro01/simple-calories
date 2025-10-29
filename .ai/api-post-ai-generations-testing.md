# Testing Guide: POST /api/v1/ai-generations

## Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
DEFAULT_USER_ID=your-user-uuid-from-supabase
OPENROUTER_API_KEY=not-needed-for-mocks
OPENROUTER_MODEL=mock-gpt-4
OPENROUTER_TIMEOUT=30000
PUBLIC_APP_URL=http://localhost:4321
```

**Getting DEFAULT_USER_ID:**
1. Go to your Supabase Dashboard → Authentication → Users
2. Copy the user ID from an existing user, OR
3. Run SQL: `SELECT id FROM profiles LIMIT 1;`

### 2. Start Development Server

```bash
npm run dev
```

The server should start on `http://localhost:4321`

---

## API Endpoints

### POST /api/v1/ai-generations

Creates a new AI-powered nutritional estimation.

**Request:**
```bash
curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "grilled chicken breast 200g with rice"}'
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "prompt": "grilled chicken breast 200g with rice",
  "status": "completed",
  "generated_calories": 650,
  "generated_protein": 45,
  "generated_carbs": 60,
  "generated_fats": 18,
  "assumptions": "Założenia: 200g grillowanego piersi kurczaka...",
  "error_message": null,
  "model_used": "mock-gpt-4",
  "generation_duration": 1200,
  "meal_id": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/v1/ai-generations

Lists all AI generations for the user with pagination.

**Request:**
```bash
curl http://localhost:4321/api/v1/ai-generations?limit=10&offset=0
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "prompt": "...",
      "status": "completed",
      ...
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

### GET /api/v1/ai-generations/:id

Retrieves a single AI generation by ID.

**Request:**
```bash
curl http://localhost:4321/api/v1/ai-generations/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "grilled chicken breast 200g with rice",
  "status": "completed",
  ...
}
```

---

## Test Scenarios

### Scenario 1: Successful Estimation (Specific Meal)

**Request:**
```bash
curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "grilled chicken breast 200g with rice 150g"}'
```

**Expected Result:**
- Status: `201 Created`
- `status`: `"completed"`
- All nutritional values filled (calories, protein, carbs, fats)
- `assumptions` contains detailed explanation
- `error_message` is `null`

---

### Scenario 2: Vague Description (AI Error)

**Request:**
```bash
curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "lunch"}'
```

**Expected Result:**
- Status: `201 Created` (record created, but AI failed)
- `status`: `"failed"`
- All nutritional values are `null`
- `error_message`: `"Opis jest zbyt ogólny. Proszę podać konkretne danie..."`
- `assumptions` is `null`

**Other vague keywords to test:**
- `"dinner"`, `"breakfast"`, `"obiad"`, `"śniadanie"`, `"kolacja"`

---

### Scenario 3: Complex Meal

**Request:**
```bash
curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "burger with fries and coleslaw"}'
```

**Expected Result:**
- Status: `201 Created`
- `status`: `"completed"`
- Higher calorie values (around 1200 kcal)
- Detailed assumptions about fast-food portions

---

### Scenario 4: Validation Error (Empty Prompt)

**Request:**
```bash
curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": ""}'
```

**Expected Result:**
- Status: `400 Bad Request`
- Response:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "prompt": "Prompt is required and cannot be empty"
  }
}
```

---

### Scenario 5: Validation Error (Too Long)

**Request:**
```bash
curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$(printf 'a%.0s' {1..1001})\"}"
```

**Expected Result:**
- Status: `400 Bad Request`
- `details.prompt`: `"Prompt cannot exceed 1000 characters"`

---

### Scenario 6: Validation Error (Missing Prompt)

**Request:**
```bash
curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**
- Status: `400 Bad Request`
- `details.prompt`: `"Prompt is required"`

---

### Scenario 7: Rate Limiting

**Request (run 11 times quickly):**
```bash
for i in {1..11}; do
  curl -X POST http://localhost:4321/api/v1/ai-generations \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test meal '$i'"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 0.5
done
```

**Expected Result:**
- First 10 requests: `201 Created`
- 11th request: `429 Too Many Requests`
- Response includes:
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retry_after": 45000
}
```
- Header: `Retry-After: 45` (seconds)

---

### Scenario 8: List Pagination

**Request:**
```bash
# Create some records first
for i in {1..5}; do
  curl -X POST http://localhost:4321/api/v1/ai-generations \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test meal '$i'"}'
  sleep 1
done

# Test pagination
curl "http://localhost:4321/api/v1/ai-generations?limit=2&offset=0"
curl "http://localhost:4321/api/v1/ai-generations?limit=2&offset=2"
```

**Expected Result:**
- Each response contains max 2 records
- `pagination.total` shows total count
- `pagination.offset` matches request
- Records ordered by `created_at DESC` (newest first)

---

### Scenario 9: Get Single Record

**Request:**
```bash
# Create a record and get its ID
RESPONSE=$(curl -X POST http://localhost:4321/api/v1/ai-generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test meal for get"}')

ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Retrieve it
curl "http://localhost:4321/api/v1/ai-generations/$ID"
```

**Expected Result:**
- Status: `200 OK`
- Returns the exact record with matching ID

---

### Scenario 10: Not Found

**Request:**
```bash
curl "http://localhost:4321/api/v1/ai-generations/00000000-0000-0000-0000-000000000000"
```

**Expected Result:**
- Status: `404 Not Found`
```json
{
  "error": "NOT_FOUND",
  "message": "AI generation not found"
}
```

---

## Mock Behavior Reference

The OpenRouter service is currently mocked with the following behavior:

### Default Response (Specific Meals)
- Any prompt that doesn't match vague/complex keywords
- Returns: 650 kcal, 45g protein, 60g carbs, 18g fats

### Vague Response
- Keywords: `lunch`, `dinner`, `breakfast`, `obiad`, `śniadanie`, `kolacja`, `something`, `coś`, `posiłek`
- Returns: `status=failed` with error message

### Complex Response
- Keywords: `burger`, `pizza`, `kebab`, `zestaw`, `menu`
- Returns: 1200 kcal, 65g protein, 120g carbs, 42g fats

### Delay Simulation
- All mocked responses have a random delay of 500-1500ms to simulate real API behavior

---

## Troubleshooting

### Error: "Failed to initialize AI generation"
- Check if Supabase connection is working
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check if `DEFAULT_USER_ID` exists in the `profiles` table

### Error: Rate limit not working
- Rate limiter uses in-memory storage
- Restarting the server will reset all rate limits
- Each user (DEFAULT_USER_ID) has their own limit counter

### Build Errors
```bash
# Run type check
npm run build

# Check for ESLint issues
npm run lint
```

---

## Next Steps

When ready to integrate real OpenRouter API:

1. Add valid `OPENROUTER_API_KEY` to `.env`
2. Change `OPENROUTER_MODEL` to real model (e.g., `"gpt-4"`)
3. Update `openrouter.service.ts` to make real HTTP calls
4. Remove mock response logic
5. Add proper error handling for API failures
6. Consider implementing retry logic with exponential backoff
