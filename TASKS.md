# Build order

Everything below already has a scaffold in place (routes registered, pages wired into nav,
Supabase schema written). The work left on each task is filling in / hardening logic, not
creating files from scratch. Work top to bottom — later phases assume earlier ones work.

## Phase 0 — Foundations
- [x] Run `supabase/schema.sql` against a real Supabase project, confirm the `trip-photos` bucket exists
- [x] Fill in `backend/.env` and `web/.env.local` from the `.env.example` files
- [x] Confirm `uvicorn app.main:app --reload --reload-dir app` boots and `/health` returns `{"status": "ok"}`
- [x] Confirm `npm run dev` in `web/` loads the three-page app at localhost:3000
- [x] Create one real user + trip row and wire the `DEMO_USER_ID` / `DEMO_TRIP_ID` constants in
      `web/src/app/**/page.tsx` to real ids. These need to be regenerated any time the demo data
      is reset — see [README.md](README.md#resetting-demo-data) for the reset script.

## Phase 1 — Route & Checkpoints
Files: `backend/app/services/exif.py`, `clustering.py`, `ai.py` (categorize_photo),
`backend/app/routers/checkpoints.py`, `web/src/app/page.tsx`, `web/src/components/RouteMap.tsx`

- [x] Test `extract_photo_metadata` against real original photo files — confirmed working with
      real GPS coordinates (resolved to e.g. Cannon Beach, Portland). Screenshots/re-saved copies
      still strip GPS EXIF, which is what the client-side `exifr` check in `page.tsx` warns about.
- [ ] Tune `max_distance_m` in `cluster_into_checkpoints` (currently 150m) against a real set of
      trip photos — too small splits one stop into several, too large merges nearby stops
- [x] Wire a real `GEMINI_API_KEY` and confirm `categorize_photo` returns sane labels — confirmed
      working. Free-tier quota is tight (15 requests/min for the model in use) and shared with
      `summarize_checkpoint`; `ai.py` now rate-limits and retries with backoff on 429s, so large
      batches just take longer rather than silently dropping photos.
- [x] Replace the placeholder `place_name` ("Stop 1", "Stop 2", ...) with a real reverse-geocode
      call — done via `backend/app/services/geocode.py` (OpenStreetMap's free Nominatim API),
      called from `_summarize_and_save` in `checkpoints.py` right after `checkpoint_center`. Note:
      Nominatim's landmark-level tagging is inconsistent (sometimes falls back to just the town
      name instead of a specific attraction) — a paid geocoding API would fix that if it matters.
- [x] Verify the Leaflet polyline/markers render correctly and the photo-grid modal opens per
      checkpoint — confirmed working (fixed a z-index bug where the map covered the modal)

## Phase 2 — Trip Summary
Files: `backend/app/services/memories.py`, `backend/app/routers/summary.py`,
`web/src/app/summary/page.tsx`

- [x] Confirm `compute_travel_dna` percentages sum to ~100 given real categorized photos — confirmed
- [x] Validate the three core-memory rules (longest food stop, most-photographed stop, revisited
      place) against a real trip — confirmed, all three showed up correctly. Add more rules here
      if the hackathon demo wants more variety (e.g. "most unique place" by comparing category
      rarity across the user's trips)
- [x] Decided: `trip_stats` is recomputed on every `/summary` call rather than cached — this is
      what makes the Summary page's Refresh button (added to work around Next.js's client router
      cache serving a stale page) actually show new data immediately after an upload.

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
