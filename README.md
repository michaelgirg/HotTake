# HotTake

A social media tracking web app for logging and sharing anime, manga, movies, and TV activity with friends.

Users can register, log in, search titles, log their progress, rate and review content, add friends, and view a live activity feed of what their friends are watching and reading.

---

## Team

| Name | Role |
|------|------|
| Nahjay Battieste | Backend Engineer + Data Engineer |
| Erlensky Regis | UX/UI + Frontend Engineer |
| Michael Girgis | Full Stack + DevOps |
| Quan Tanksley | Product Manager + QA Lead |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, plain CSS |
| Backend | Node.js, Express |
| Database | SQLite (raw SQL via better-sqlite3) |
| Auth | Passport.js local strategy + express-session |
| Hosting | Render |

---

## Project Structure

```
HotTake/
└── backend/
├── server.js
├── package.json
├── .env.example
├── config/
│ └── passport.js
├── db/
│ ├── database.js
│ └── seed.js
├── middleware/
│ └── authMiddleware.js
└── routes/
├── auth.js
└── titles.js
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd HotTake/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in SESSION_SECRET

# Seed the database with 120+ titles
npm run seed

# Start the server
npm start
```

Server runs at `http://localhost:3001`

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Log in and create session | No |
| POST | `/api/auth/logout` | Destroy session | Yes |

### Titles
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/titles/search?q=` | Search titles by name | Yes |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## Environment Variables

```
PORT=3001
SESSION_SECRET=your-secret-here
CLIENT_URL=http://localhost:3000
DB_PATH=./hottake.db
NODE_ENV=development
```


---

## Scripts

```bash
npm start       # Start the server
npm run dev     # Start with nodemon (auto-restart)
npm run seed    # Seed the database with titles
```

---

## Sprint Progress

### Sprint 1 — Authentication + Title Search ✅
- Users table + constraints
- Registration API
- Login API with Passport.js session
- Logout
- Authorization middleware (protected routes + admin role)
- Titles table + seed script (122 titles)
- Title search API

### Sprint 2 — In Progress
- Activity logging, ratings, reviews
- Friends system
- Activity feed
- User profiles