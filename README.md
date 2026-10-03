# Trip Tracker

Monorepo for the Stormhacks 2026 trip-tracking app: upload trip photos, auto-build a route of
checkpoints, see a "Travel DNA" summary, and get an AI-generated trip planner for future trips.

## Structure

```
mobile/      Expo (React Native + TypeScript) app
backend/     FastAPI service: EXIF extraction, clustering, Gemini calls, Supabase access
supabase/    schema.sql — run this once against your Supabase project
```

See [TASKS.md](TASKS.md) for an incremental, feature-by-feature build order.

## One-time setup

### 1. Supabase project
1. Create a project at supabase.com.
2. Open the SQL editor and run [supabase/schema.sql](supabase/schema.sql).
3. Copy your project URL, anon key, and service-role key.

### 2. Backend
```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY
.venv/bin/uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs

### 3. Mobile app
```bash
cd mobile
cp .env.example .env   # EXPO_PUBLIC_API_URL should point at your backend (use your LAN IP for a real device)
npm start
```
Scan the QR code with Expo Go, or press `i` / `a` for a simulator.

## Notes
- The mobile app currently hardcodes a `demo-trip` / `demo-user` id in each screen (see the
  `DEMO_TRIP_ID` / `DEMO_USER_ID` constants) so each feature can be built and tested in isolation
  before trip creation and auth are wired up end-to-end — see TASKS.md Phase 0.
- Gemini calls in `backend/app/services/ai.py` require `GEMINI_API_KEY` to be set; without it the
  photo-upload and planner endpoints will error.
