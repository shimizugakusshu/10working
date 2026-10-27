# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Implement the data tier first, then the API logic tier, and finally the presentation tier. Each layer relies on stable contracts from the layer below it: validated models and representative data make API behavior predictable, and a working API gives the UI a reliable contract to render. Keep changes small and run the focused contract tests for each tier before proceeding.

- **Presentation tier (React 19, Vite, React Router, Bootstrap):** Own navigation and accessible display of API data. Each capability view must show loading, empty, success, and error states. Use the shared `src/api/client.ts` for requests; components must not construct API URLs or call `fetch` directly.
- **Logic tier (Express and TypeScript):** Keep HTTP routes under `/api/` and business behavior in service functions. Validate request bodies and referenced IDs, calculate activity points and leaderboard totals, produce reasoned workout suggestions, and return deliberate 4xx responses for invalid or unknown input rather than cast-related 500s.
- **Data tier (Mongoose and MongoDB):** Define required fields, defaults, and relationships in schemas. Seed stable demo records with upserts so reruns are idempotent and do not clear or overwrite unrelated application data. When a demo user changes teams, remove that user's membership from the previous team.
- **Activity tracking:** Accept `userId`, `teamId`, `type`, and `minutes`; validate that both referenced records exist, persist their IDs, compute points and `occurredAt`, and expose created and listed activities through the API.
- **Team management:** Validate required team fields, create and list teams, and retain the member references provided by the API contract.
- **Leaderboard:** Aggregate activity points by team, sort totals descending, and return `teamName`, `totalPoints`, and a 1-based `rank`.
- **Workout suggestions:** Find the requested user by email, use the user's goal and/or recent activities to select matching workouts, and return a human-readable reason. Return 4xx when no user matches.
- **Security and environment:** Keep MongoDB on port `27017`, Express on `8000`, and Vite on `5173`. Browser requests use relative `/api` paths through the Vite proxy to `http://localhost:8000`; do not expose the unauthenticated API port publicly. `VITE_API_BASE_URL` remains an optional override. Authentication is intentionally out of scope for this exercise.

## Test plan

### Red Test Baseline (confirmed 2026-10-27)

The following focused suites were run against the current implementation:

- `npm run test:data --prefix octofit-tracker/backend` — **4 failed, 1 passed (5 total)**. The user, team, activity, and workout schema validation cases fail because required-field validation is absent. The seed case passed, including idempotency and preservation of unrelated records.
- `npm run test:api --prefix octofit-tracker/backend` — **4 failed (4 total)**. Activity and team creation return `501` rather than the expected validation response; the leaderboard is empty; and workout suggestions do not match the requested user's goal/activity.
- `npm test --prefix octofit-tracker/frontend` — **15 failed (15 total)**. The capability pages still display the pending placeholder instead of fetching and rendering API data or showing the required loading, empty, and error states.

These are observed test-run results, not predictions. The conclusions above identify the reported failing assertions; build commands and the repository-level exercise-validation suite were not run for this baseline.

### Commands for implementation and verification

Run each focused suite as its tier is implemented, in data → API → frontend order:

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — model validation or seed failures indicate schema invariants, fixture relationships, idempotency, or unrelated-data preservation are incorrect.
- API tier: `npm run test:api --prefix octofit-tracker/backend` — failures indicate request validation/status codes, persistence, ranking, or user-specific suggestions do not meet the API contract.
- Frontend tier: `npm test --prefix octofit-tracker/frontend` — failures indicate the view is not calling the shared client, rendering API data, or exposing accessible loading, empty, and error states.
- Backend type check: `npm run build --prefix octofit-tracker/backend`
- Frontend type check and production build: `npm run build --prefix octofit-tracker/frontend`

After the focused tests pass, run all three contract suites and both builds again to check that the tiers still agree. Keep the existing port and proxy restrictions, and never use a seed procedure that clears collections or removes unrelated records.
