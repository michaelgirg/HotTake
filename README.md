# HotTake

HotTake is a social tracking app focused on anime and anime-related formats. Users can register, log in, search titles, import anime metadata, log progress, rate titles, write and update reviews, add friends, view a friend activity feed, and edit profiles.

The current MVP stores titles locally in PostgreSQL, and can import anime metadata/posters from Jikan so users can track TV anime, anime movies, OVA, ONA, specials, and related formats without making the core app depend on a live third-party API for every page.

## Current MVP Features

- Session-based registration, login, logout, protected routes, and admin route checks.
- PostgreSQL-backed users, sessions, titles, logs, ratings, reviews, friends, feed, and profiles.
- Local anime title search, plus Jikan-powered anime search/import for posters, synopsis, format, score, episode count, and MAL IDs.
- Activity tracking with status, decimal ratings from 1.0 to 10.0, and editable reviews.
- Friend request flow with accept/decline and a friends list.
- Feed and profile pages that show recent activity with title posters when available.
- Profile editing for display name and bio.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, plain CSS |
| Backend | Node.js, Express |
| Auth | Passport local, `express-session` |
| Database | PostgreSQL with raw SQL |
| Sessions | PostgreSQL session store via `connect-pg-simple` |

Use Node 20. The repo includes `.nvmrc`.

## Local Setup

1. Create a local PostgreSQL database named `hottake`.
2. Configure backend env:

```bash
cd backend
cp .env.example .env
```

3. Edit `backend/.env` if your PostgreSQL URL differs:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SESSION_SECRET=replace-me-with-a-long-random-string
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hottake
PGSSL=false
```

4. Install backend dependencies, migrate, and seed:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

5. Configure and start the frontend in a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`; backend runs at `http://localhost:3001`.

## Scripts

Backend:

```bash
npm run migrate   # Create/update PostgreSQL schema
npm run seed      # Idempotently insert title seed data
npm run dev       # Start API with nodemon
npm start         # Start API normally
npm run lint      # Run backend ESLint
npm run format    # Format backend files
```

Frontend:

```bash
npm run dev       # Start Vite
npm run build     # Production build
npm run lint      # Run frontend ESLint
npm run preview   # Preview production build
```

## API Surface

Auth:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | Create session |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/protected` | Session smoke test |
| GET | `/api/admin` | Admin smoke test |

Titles:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/titles/search?q=` | Search titles |
| GET | `/api/titles/external/search?q=` | Search Jikan for anime metadata |
| POST | `/api/titles/import` | Import a Jikan anime into HotTake |
| GET | `/api/titles/:id` | View title details |

Activity:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/activity/logs` | Create/update a log |
| POST | `/api/activity/ratings` | Create/update a 1.0-10.0 rating |
| POST | `/api/activity/reviews` | Create/update a review |
| GET | `/api/activity/mine` | Current user's recent activity |
| GET | `/api/activity/titles/:titleId` | Current user's saved activity for one title |

Friends, feed, and profiles:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/friends` | Friends list |
| GET | `/api/friends/requests` | Pending received requests |
| POST | `/api/friends/requests` | Send friend request by username |
| POST | `/api/friends/requests/:id/respond` | Accept or decline request |
| GET | `/api/feed` | Current user and friend activity feed |
| GET | `/api/profile/me` | Current user's profile |
| PATCH | `/api/profile/me` | Edit display name and bio |
| GET | `/api/profile/:id` | View a user profile |

Moderation:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| DELETE | `/api/admin/moderation/reviews/:id` | Remove a review |
| DELETE | `/api/admin/moderation/logs/:id` | Remove a log |
| PATCH | `/api/admin/moderation/users/:id/deactivate` | Deactivate a user |

## Verification Flow

1. Register a user from `/register`.
2. Log in from `/login`; successful login lands on `/feed`.
3. Search for a title from `/search`.
4. If the title is not local yet, click **Search Jikan** and import it.
5. Use `/activity` to create a log, decimal rating, and review.
6. Click **Edit review** from Recent logs and confirm the form loads the saved status/rating/review for updates.
7. Register a second user in another browser/session.
8. Send a friend request by username from `/friends`.
9. Log in as the receiving user, accept the request, and confirm both users appear in friends lists.
10. Create activity as either user and confirm it appears in `/feed`.
11. Open `/profile`, update display name and bio, refresh, and confirm they persist.
12. Log out and confirm protected pages redirect or return 401.

## Render Deployment

Backend service:

- Build command: `npm install && npm run migrate`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `PORT` from Render
  - `DATABASE_URL` from Render PostgreSQL
  - `PGSSL=true`
  - `SESSION_SECRET` set to a long random value
  - `CLIENT_URL=https://your-frontend-host.example`

Run `npm run seed` manually after the first deployment or through a one-off Render job. Do not run seed on every deploy unless you intentionally want to refresh seed titles.

Any deployment that includes schema changes should redeploy the backend with `npm run migrate` before users test the app. Recent schema changes include Jikan metadata fields on `titles` and decimal ratings on `ratings`.

The Jikan import feature does not need an API key. It does need outbound network access from the backend service.

Frontend service:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL=https://your-backend-service.onrender.com`

Because auth uses cookies across frontend/backend origins, production cookies are `secure` and `sameSite=none`. Keep backend CORS `CLIENT_URL` aligned with the deployed frontend URL.
