# ChronicOne API Documentation

## Overview

ChronicOne provides API endpoints for authentication, daily habit check-ins, health records, wellness/mood tracking, and streak retrieval.

**Live API base URL:** `https://chronicone-1.onrender.com`

> Use the base URL followed by an endpoint path. Protected endpoints require authentication. Never publish tokens, passwords, database credentials, or environment variables.

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and receive an authentication token |
| GET | `/api/auth/me` | Retrieve the authenticated user's account information |
| PATCH | `/api/auth/profile` | Update supported profile settings |

### Example: update theme

`PATCH /api/auth/profile`

```json
{
  "theme": "dark"
}
```

## Habit check-ins

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/checkin` | Submit a daily habit check-in |
| GET | `/api/checkin` | Retrieve check-in records |
| GET | `/api/streak` | Retrieve streak information |

### Example: submit a check-in

`POST /api/checkin`

```json
{
  "date": "YYYY-MM-DD",
  "habits": {
    "medication": 1,
    "exercise": 1,
    "diet": 1
  }
}
```

The tested request used numeric habit scores from `0` to `1`. A request using boolean values was rejected during testing, so use the numeric format unless backend validation is deliberately changed.

## Health records

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/health-records` | Add a health record |
| GET | `/api/health-records` | Retrieve health records |

### Example: add a blood-pressure record

`POST /api/health-records`

```json
{
  "type": "blood_pressure",
  "value": 120,
  "unit": "mmHg",
  "date": "YYYY-MM-DD"
}
```

This is the example request used in the recorded API test. Check the backend model/controller for all supported record types and validation rules.

## Wellness and mood

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/wellness/mood` | Submit a mood record |
| GET | `/api/wellness/mood` | Retrieve mood records |

The exact request fields depend on backend validation and the model. Refer to the implementation before adding more request examples.

## Health check

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server and database health |

## Authentication when testing

For protected endpoints, sign in first and use the returned token in the authorization header if testing with Bearer-token authentication:

`Authorization: Bearer <your_token>`

Never commit a real token or private user information.

## Notes

- The live backend is deployed on Render.
- Persistent application data is stored in MongoDB Atlas.
- This document lists endpoints and examples confirmed in the project's testing notes. Check route/controller validation before adding new API behavior.
