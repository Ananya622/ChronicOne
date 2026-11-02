# ChronicOne 🩺

### Build consistency. Track progress. Recover with confidence.

A personalized chronic-condition habit tracker that brings daily
adherence, health measurements, mood, and progress into one place.

[![Live
Demo](https://img.shields.io/badge/Live%20Demo-Render-5B8DEF?style=for-the-badge)](https://chronicone-1.onrender.com)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-43853D?style=flat-square)](#tech-stack)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat-square)](#tech-stack)

------------------------------------------------------------------------

## Overview

Managing a chronic condition often involves several recurring
activities: following daily habits, recording health measurements, and
understanding changes over time. ChronicOne brings these activities
together in a single web application.

Users select the conditions and habits they want to track during
onboarding. The application then presents a personalized tracking
experience with daily check-ins, health records, mood logging, streak
information, and a calendar view.

> **Note:** ChronicOne is a habit-tracking and record-keeping
> application. It is not a diagnostic tool and does not replace
> professional medical advice.

## Key Features

### Daily check-ins

-   Record progress for configured daily habits.
-   Calculate a daily adherence score.
-   Classify a day as **Full**, **Partial**, **Low**, or **Missed**
    according to the check-in result.
-   Retrieve saved check-in history.

### Streak and recovery tracking

-   View current and best streak information.
-   Track grace-day usage.
-   Apply relapse and recovery logic to streak progression.
-   Retrieve streak information through the backend API.

### Health records

Record and review measurements such as: - Blood pressure - Body weight -
Heart rate - Blood glucose - Peak flow - Joint pain - Sleep duration

The available tracking options are intended to adapt to the user's
selected conditions.

### Wellness and mood

-   Record a daily mood value.
-   Retrieve mood history.
-   View wellness information alongside other tracking data.

### Personalized dashboard and calendar

-   Bring habit progress, streak information, health records, and mood
    into one dashboard.
-   Review adherence over time using a calendar heatmap.
-   Navigate between calendar months and inspect daily details.

### Themes and achievements

-   Choose between the available light and dark themes.
-   View progress-related achievements and milestones.

------------------------------------------------------------------------

## Application Flow

``` text
Register / Login
       |
       v
Select health conditions
       |
       v
Choose habits and measurements
       |
       v
Personalized dashboard
       |
       +-------------------+
       |         |         |
       v         v         v
   Check-ins  Health     Mood
       |      records   tracking
       |         |         |
       +---------+---------+
                 |
                 v
         Streak calculation
                 |
                 v
          Calendar & history
```

------------------------------------------------------------------------


---
## Application Screenshots


### ChronicOne Login Page

<img width="1535" height="727" alt="Screenshot 2026-11-02 070501" src="https://github.com/user-attachments/assets/9f957a0e-ef35-4c05-8ba9-29ee2c64b9fb" />
<img width="1112" height="650" alt="Screenshot 2026-11-02 071232" src="https://github.com/user-attachments/assets/dc037ad0-1fa3-4fd8-82db-ee1c3c6c38f0" />



### ChronicOne Sign Up Page

<img width="1535" height="718" alt="Screenshot 2026-11-02 070519" src="https://github.com/user-attachments/assets/ae6b9d01-8b9f-46ac-90e3-3cc3360dc708" />


### Health Conditions Selection

<img width="1173" height="713" alt="Screenshot 2026-11-02 070549" src="https://github.com/user-attachments/assets/7b24f3c2-0c1f-484a-8ee5-23de7662381f" />


### Personalized Onboarding

<img width="1130" height="681" alt="Screenshot 2026-11-02 070615" src="https://github.com/user-attachments/assets/0afa9089-7bc7-4791-91f3-ca433433462f" />


### ChronicOne Dashboard

<img width="1533" height="730" alt="Screenshot 2026-11-02 070837" src="https://github.com/user-attachments/assets/848a6ae9-9339-497a-9dcd-456711828090" />


### Health Tracking

<img width="1010" height="697" alt="Screenshot 2026-11-02 070855" src="https://github.com/user-attachments/assets/96caf13d-c035-4b1c-9f1a-603830642138" />


### Condition Based Tracking

<img width="1533" height="611" alt="Screenshot 2026-11-02 070924" src="https://github.com/user-attachments/assets/5951f365-15e4-470b-8ba5-df83316e790a" />


### Progress Calendar

<img width="1535" height="726" alt="Screenshot 2026-11-02 070958" src="https://github.com/user-attachments/assets/e5f343b5-33e5-4bab-a75a-1c9ff13dc201" />


### Daily Details

<img width="1140" height="717" alt="Screenshot 2026-11-02 071020" src="https://github.com/user-attachments/assets/79dc6f68-9a9b-41d3-9e1b-63b6722b80ab" />


## Tech Stack

  -----------------------------------------------------------------------
  Layer                               Technologies
  ----------------------------------- -----------------------------------
  Frontend                            HTML5, CSS3, Vanilla JavaScript

  Backend                             Node.js, Express.js

  Database                            MongoDB Atlas, Mongoose

  Authentication                      JWT-based authentication with
                                      HttpOnly cookie support and
                                      Bearer-token support

  API testing                         Postman

  Deployment                          Render

  Version control                     Git and GitHub
  -----------------------------------------------------------------------

The frontend communicates with the Express backend through REST API
endpoints. User profiles and tracking records are persisted in MongoDB
Atlas; the frontend uses an in-memory cache to display synchronized
application data.

------------------------------------------------------------------------

## Live Application

**Live URL:** <https://chronicone-1.onrender.com>

The deployed application is hosted on Render and connects to MongoDB
Atlas.

------------------------------------------------------------------------

## API Overview

All protected endpoints require authentication. In Postman, use the
latest token returned by login in **Authorization → Bearer Token**, or
use the `chronicone_token` cookie where cookie authentication is being
tested.

  Method    Endpoint                     Purpose
  --------- ---------------------------- -------------------------------------------
  `GET`     `/api/health`                Check server and database health
  `POST`    `/api/auth/register`         Create a user account
  `POST`    `/api/auth/login`            Authenticate an existing user
  `GET`     `/api/auth/me`               Retrieve the authenticated user's profile
  `PATCH`   `/api/auth/profile`          Update profile preferences
  `POST`    `/api/auth/logout`           End the authenticated session
  `POST`    `/api/checkin`               Create or update a daily check-in
  `GET`     `/api/checkin`               Retrieve check-in history
  `GET`     `/api/checkin/today`         Retrieve today's check-in
  `GET`     `/api/streak`                Retrieve calculated streak information
  `POST`    `/api/health-records`        Create or update a health record
  `GET`     `/api/health-records`        Retrieve health records
  `POST`    `/api/wellness/mood`         Create or update a daily mood record
  `GET`     `/api/wellness/mood`         Retrieve mood history
  `GET`     `/api/wellness/mood/today`   Retrieve today's mood record

The endpoint list above is a quick reference to the main routes. Refer
to the backend route files for the complete route definitions and
validation rules.

### API test results recorded during live testing

The following requests were manually tested against the deployed
application during the current testing session:

  Test                         Observed result
  ---------------------------- -------------------------------------------------
  `GET /api/health`            `200 OK`; healthy server and connected database
  `POST /api/auth/register`    Registration succeeded
  `POST /api/auth/login`       Login succeeded and returned a token
  `GET /api/auth/me`           `200 OK`
  `PATCH /api/auth/profile`    `200 OK`
  `POST /api/checkin`          `201 Created`
  `GET /api/checkin`           `200 OK`
  `GET /api/streak`            `200 OK`
  `POST /api/health-records`   `201 Created`
  `GET /api/health-records`    `200 OK`
  `POST /api/wellness/mood`    Request succeeded
  `GET /api/wellness/mood`     Request succeeded

These are the results observed in the manual test session, not a claim
that every endpoint or every negative/security test has been tested.
DELETE operations, cross-user isolation, and the full
validation/security suite were not verified in that session.

------------------------------------------------------------------------

## Running Locally

### 1. Clone the repository

``` bash
git clone https://github.com/Ananya622/ChronicOne.git
cd ChronicOne
```

### 2. Install backend dependencies

``` bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory using the project's
`.env.example` as a reference.

Configure the values required by the backend, including: - MongoDB
connection URI - JWT signing secret - Port (if required) - Application
timezone (`Asia/Kolkata` for Indian local-date handling)

Use your own credentials. Do not commit `.env` or publish database
credentials, signing secrets, or session tokens.

### 4. Start the backend

``` bash
node server.js
```

The server listens on the configured port. For the default local setup,
open:

``` text
http://localhost:3000
```

If the backend package defines a start script, `npm start` can also be
used from the `backend/` directory.

------------------------------------------------------------------------

## Repository Structure

The repository is organized into separate frontend and backend
directories.

``` text
ChronicOne/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Request handling and application logic
│   ├── middleware/      # Authentication and request middleware
│   ├── models/          # MongoDB/Mongoose data models
│   ├── routes/          # REST API route definitions
│   ├── utils/           # Shared utilities and streak engine
│   ├── .env.example     # Environment variable template
│   └── server.js        # Express application entry point
│
├── frontend/
│   ├── css/             # Application styles
│   ├── js/              # Frontend modules
│   ├── index.html       # Login and registration
│   ├── dashboard.html   # Main dashboard
│   └── calendar.html    # Calendar and history
│
├── postman/             # API testing collection (if present in checkout)
├── README.md
├── package.json
└── package-lock.json
```

------------------------------------------------------------------------

## Important Notes

-   Use demonstration data when testing; do not enter real medical
    information into a public demo account.
-   Keep MongoDB credentials and JWT secrets private.
-   A successful API response confirms that the tested request
    succeeded; it does not establish clinical accuracy.
-   The application is intended for tracking and awareness, not medical
    diagnosis or treatment decisions.

------------------------------------------------------------------------

## Future Improvements

-   Expand condition-specific tracking options.
-   Add more progress analytics and visualizations.
-   Extend achievements and engagement features.
-   Improve the range of wellness tracking options.

------------------------------------------------------------------------

**ChronicOne --- making everyday health routines easier to track,
understand, and maintain.**
