# HotTake

HotTake is a social tracking app for anime, manga, movies, and TV. Users can register, log in, search titles, log progress, rate titles, write reviews, add friends, view a friend activity feed, and edit profiles.

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
| GET | `/api/titles/:id` | View title details |

Activity:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/activity/logs` | Create/update a log |
| POST | `/api/activity/ratings` | Create/update a 1-10 rating |
| POST | `/api/activity/reviews` | Create/update a review |
| GET | `/api/activity/mine` | Current user's recent activity |

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
4. Use `/activity` to create a log, rating, and review.
5. Register a second user in another browser/session.
6. Send a friend request by username from `/friends`.
7. Log in as the receiving user, accept the request, and confirm both users appear in friends lists.
8. Create activity as either user and confirm it appears in `/feed`.
9. Open `/profile`, update display name and bio, refresh, and confirm they persist.
10. Log out and confirm protected pages redirect or return 401.

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

Frontend service:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL=https://your-backend-service.onrender.com`

Because auth uses cookies across frontend/backend origins, production cookies are `secure` and `sameSite=none`. Keep backend CORS `CLIENT_URL` aligned with the deployed frontend URL.
