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

Implement the data tier first, followed by the API logic tier and then the presentation tier. Each tier depends on stable contracts from the tier below: validated models and representative data make API behavior predictable, while a working API provides the UI with a reliable contract to consume. Keep changes small and run each tier's focused contract tests before moving on.

- Presentation tier decision: Use React 19, Vite, React Router, and Bootstrap for navigation and accessible API-data presentation. Each capability view must provide loading, empty, success, and error states. Use the shared `src/api/client.ts` for requests; components must not construct API URLs or call `fetch` directly.
- Logic tier decision: Use Express and TypeScript for HTTP routes under `/api/` and business behavior in service functions. Validate request bodies and referenced IDs, and return deliberate 4xx responses for invalid or unknown input rather than cast-related 500 errors.
- Data tier decision: Use Mongoose schemas to define required fields, defaults, and relationships. Seed stable demo records with upserts so repeated runs are idempotent and do not delete or overwrite unrelated application data. When a demo user changes teams, remove that user's membership from the previous team.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`. Verify that both referenced records exist, persist their IDs, calculate `points` and `occurredAt`, and expose created and listed activities through the API.
- Team management approach: Validate required team fields, create and list teams, and preserve the member references specified by the API contract.
- Leaderboard approach: Aggregate activity points by team, sort teams by descending total, and return `teamName`, `totalPoints`, and a 1-based `rank`.
- Workout suggestions approach: Find the requested user by email and use the user's goal and/or recent activities to select matching workouts. Include a human-readable reason and return a 4xx response if no user matches.
- Security and environment: Use port `27017` for MongoDB, `8000` for Express, and `5173` for Vite. Browser requests must use relative `/api` paths through the Vite proxy to `http://localhost:8000`; do not expose the unauthenticated API port publicly. `VITE_API_BASE_URL` remains an optional override. Authentication is intentionally out of scope for this exercise.

## Test plan

### Red Test Baseline (confirmed 2026-10-27)

The following focused suites were run against the current implementation:

- `npm run test:data --prefix octofit-tracker/backend` — **4 failed, 1 passed (5 total)**. The user, team, activity, and workout schema-validation cases fail because the required-field constraints are missing. The seed case passed, including checks for idempotency and preservation of unrelated records.
- `npm run test:api --prefix octofit-tracker/backend` — **4 failed (4 total)**. Activity and team creation return `501` instead of the expected validation response; the leaderboard is empty; and workout suggestions do not match the requested user's goal or activity.
- `npm test --prefix octofit-tracker/frontend` — **15 failed (15 total)**. The capability pages display a pending placeholder instead of fetching and rendering API data or showing the required loading, empty, and error states.

These results were observed by running the test suites; they are not predictions based on code inspection. The summaries above identify the failing assertions reported by the test runner. The build commands and repository-level exercise-validation suite were not run for this baseline.

### Commands for implementation and verification

Run each focused suite as its tier is implemented, in data → API → frontend order:

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — failures indicate problems with schema validation, fixture relationships, seed idempotency, or preservation of unrelated data.
- API tier: `npm run test:api --prefix octofit-tracker/backend` — failures indicate that request validation, status codes, persistence, leaderboard ranking, or user-specific suggestions do not meet the API contract.
- Frontend tier: `npm test --prefix octofit-tracker/frontend` — failures indicate that a view is not using the shared API client, rendering API data, or exposing accessible loading, empty, and error states.
- Backend type check: `npm run build --prefix octofit-tracker/backend`
- Frontend type check and production build: `npm run build --prefix octofit-tracker/frontend`

After the focused tests pass, rerun all three contract suites and both builds to verify that the tiers remain consistent. Preserve the existing port and proxy restrictions, and never use a seed procedure that clears collections or removes unrelated records.
