# Build order

Everything below already has a scaffold in place (routes registered, screens wired into
navigation, Supabase schema written). The work left on each task is filling in / hardening logic,
not creating files from scratch. Work top to bottom — later phases assume earlier ones work.

## Phase 0 — Foundations
- [ ] Run `supabase/schema.sql` against a real Supabase project, confirm the `trip-photos` bucket exists
- [ ] Fill in `backend/.env` and `mobile/.env` from the `.env.example` files
- [ ] Confirm `uvicorn app.main:app --reload` boots and `/health` returns `{"status": "ok"}`
- [ ] Confirm `npm start` in `mobile/` loads the three-tab app in Expo Go
- [ ] Create one real user + trip row (via `/docs` Swagger UI is fine) and replace the
      `DEMO_USER_ID` / `DEMO_TRIP_ID` constants in `mobile/src/screens/*.tsx` with real ids, or
      build a minimal "create trip" screen if you want this dynamic sooner

## Phase 1 — Route & Checkpoints
Files: `backend/app/services/exif.py`, `clustering.py`, `ai.py` (categorize_photo),
`backend/app/routers/checkpoints.py`, `mobile/src/screens/RouteScreen.tsx`

- [ ] Test `extract_photo_metadata` against a real phone photo with location services on — iOS
      strips GPS from screenshots/edited photos, so use an original camera photo
- [ ] Tune `max_distance_m` in `cluster_into_checkpoints` (currently 150m) against a real set of
      trip photos — too small splits one stop into several, too large merges nearby stops
- [ ] Wire a real `GEMINI_API_KEY` and confirm `categorize_photo` returns sane labels for a batch
      of test photos; add a fallback/manual-override path if mislabeling is common
- [ ] On the mobile side: replace the placeholder `place_name` ("Stop 1", "Stop 2", ...) with a
      real reverse-geocode call (Expo has `Location.reverseGeocodeAsync`) either client-side or
      added as a backend step in `checkpoints.py` right after `checkpoint_center`
- [ ] Verify the map polyline/markers render correctly and the photo-grid modal opens per checkpoint

## Phase 2 — Trip Summary
Files: `backend/app/services/memories.py`, `backend/app/routers/summary.py`,
`mobile/src/screens/SummaryScreen.tsx`

- [ ] Confirm `compute_travel_dna` percentages sum to ~100 given real categorized photos
- [ ] Validate the three core-memory rules (longest food stop, most-photographed stop, revisited
      place) against a real trip — add more rules here if the hackathon demo wants more variety
      (e.g. "most unique place" by comparing category rarity across the user's trips)
- [ ] Decide whether `trip_stats` should be recomputed on every `/summary` call (current behavior)
      or cached until new photos are added — matters once trips have many photos

## Phase 3 — Travel Planner
Files: `backend/app/services/ai.py` (generate_trip_plan), `backend/app/routers/planner.py`,
`mobile/src/screens/PlannerScreen.tsx`

- [ ] Confirm `generate_trip_plan`'s JSON response always matches `PlannerResponse` — Gemini's
      `response_mime_type: application/json` constrains format but not your exact schema, so add
      a retry-on-parse-failure if this proves flaky in testing
- [ ] Once a few real trips exist with `trip_stats` populated, verify the planner actually reflects
      past Travel DNA / favorite places in its output (not just generic suggestions)
- [ ] Replace the free-text date/time `TextInput`s in `PlannerScreen.tsx` with a real date/time
      picker (`@react-native-community/datetimepicker`) once the manual-entry flow is validated

## Phase 4 — Polish (do last)
- [ ] Replace hardcoded demo ids with real auth (Supabase Auth) across all three screens
- [ ] Add loading/error states consistently (summary/planner screens have minimal error handling)
- [ ] Add a trip list / trip switcher screen so the app supports more than one trip
