# FinPulse

FinPulse is a lightweight finance dashboard built with Express, EJS, MongoDB, and an optional Gemini-powered business coach.

## Scripts

- `npm run dev` starts the app with Nodemon.
- `npm start` starts the production server.
- `npm test` runs the local finance utility tests.

## Environment

- `MONGO_URI` is required.
- `GEMINI_API_KEY` enables the dashboard AI coach.
- `GEMINI_MODEL` is optional. Default: `gemini-2.5-flash`.

## Pages

- `/dashboard` utility-first workspace with AI chat
- `/transactions` full transaction log
- `/summary` KPI cards and monthly rollups
- `/analytics` chart-focused analytics view

## API

- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/summary`
- `GET /api/analytics`
- `POST /api/assistant`

