# Build order

Everything below already has a scaffold in place (routes registered, pages wired into nav,
Supabase schema written). The work left on each task is filling in / hardening logic, not
creating files from scratch. Work top to bottom — later phases assume earlier ones work.

## Phase 0 — Foundations
- [ ] Run `supabase/schema.sql` against a real Supabase project, confirm the `trip-photos` bucket exists
- [ ] Fill in `backend/.env` and `web/.env.local` from the `.env.example` files
- [ ] Confirm `uvicorn app.main:app --reload --reload-dir app` boots and `/health` returns `{"status": "ok"}`
- [ ] Confirm `npm run dev` in `web/` loads the three-page app at localhost:3000
- [ ] Create one real user + trip row (via `/docs` Swagger UI is fine) and replace the
      `DEMO_USER_ID` / `DEMO_TRIP_ID` constants in `web/src/app/**/page.tsx` with real ids, or
      build a minimal "create trip" page if you want this dynamic sooner

## Phase 1 — Route & Checkpoints
Files: `backend/app/services/exif.py`, `clustering.py`, `ai.py` (categorize_photo),
`backend/app/routers/checkpoints.py`, `web/src/app/page.tsx`, `web/src/components/RouteMap.tsx`

- [ ] Test `extract_photo_metadata` against a real original photo file (not a screenshot or
      re-saved copy — those strip GPS EXIF). The web page's client-side `exifr` check in
      `page.tsx` warns before upload if a file has no GPS data, so trust that warning
- [ ] Tune `max_distance_m` in `cluster_into_checkpoints` (currently 150m) against a real set of
      trip photos — too small splits one stop into several, too large merges nearby stops
- [ ] Wire a real `GEMINI_API_KEY` and confirm `categorize_photo` returns sane labels for a batch
      of test photos; add a fallback/manual-override path if mislabeling is common
- [ ] Replace the placeholder `place_name` ("Stop 1", "Stop 2", ...) with a real reverse-geocode
      call — easiest as a backend step in `checkpoints.py` right after `checkpoint_center` (e.g.
      Nominatim/OpenStreetMap's free reverse-geocoding API, consistent with the Leaflet/OSM tiles
      already in use)
- [ ] Verify the Leaflet polyline/markers render correctly and the photo-grid modal opens per checkpoint

## Phase 2 — Trip Summary
Files: `backend/app/services/memories.py`, `backend/app/routers/summary.py`,
`web/src/app/summary/page.tsx`

- [ ] Confirm `compute_travel_dna` percentages sum to ~100 given real categorized photos
- [ ] Validate the three core-memory rules (longest food stop, most-photographed stop, revisited
      place) against a real trip — add more rules here if the hackathon demo wants more variety
      (e.g. "most unique place" by comparing category rarity across the user's trips)
- [ ] Decide whether `trip_stats` should be recomputed on every `/summary` call (current behavior)
      or cached until new photos are added — matters once trips have many photos

## Phase 3 — Travel Planner
Files: `backend/app/services/ai.py` (generate_trip_plan), `backend/app/routers/planner.py`,
`web/src/app/planner/page.tsx`

- [ ] Confirm `generate_trip_plan`'s JSON response always matches `PlannerResponse` — Gemini's
      `response_mime_type: application/json` constrains format but not your exact schema, so add
      a retry-on-parse-failure if this proves flaky in testing
- [ ] Once a few real trips exist with `trip_stats` populated, verify the planner actually reflects
      past Travel DNA / favorite places in its output (not just generic suggestions)
- [ ] The date/time inputs already use native HTML `<input type="date">`/`<input type="time">`
      pickers — no further work needed there unless you want a nicer custom widget

## Phase 4 — Polish (do last)
- [ ] Replace hardcoded demo ids with real auth (Supabase Auth) across all three pages
- [ ] Add loading/error states consistently (summary/planner pages have minimal error handling)
- [ ] Add a trip list / trip switcher page so the app supports more than one trip
- [ ] Deploy: `web/` to Vercel, `backend/` to Railway/Render/Fly — both are a single `git push` away
      once you pick a host
