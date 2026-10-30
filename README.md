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

![ChronicOne Login Page](https://private-user-images.githubusercontent.com/180096674/647328893-d5ef1955-520f-49bd-a128-279f63a01ab7.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzI4ODkzLWQ1ZWYxOTU1LTUyMGYtNDliZC1hMTI4LTI3OWY2M2EwMWFiNy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00YWI1ZmUyNmIxNzMyMWFhYjU4YWJkMWQ3ZmU3ZjJiZmQ2MzVlN2ZmNzJiZjY1NDI4Mzc3NTY1MDA5ZTkzNTk1JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.GxlO5L8cGsDywLh_p4LW5V5DBg703RHt1rftHM51SFE)

### ChronicOne Sign Up Page

![ChronicOne Sign Up Page](https://private-user-images.githubusercontent.com/180096674/647329053-59ec4923-1754-4fda-a77a-8fc3be726452.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzI5MDUzLTU5ZWM0OTIzLTE3NTQtNGZkYS1hNzdhLThmYzNiZTcyNjQ1Mi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zNTg3MTk5NTdiMzVkZmQwMGE4YTIyZDNmM2JmOTI3YWM5NjI0OTIyMzM1OGM0NTM1NjA2NWQyODhhYmMxZGI2JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.2WWHpVhJwScV3QLRKV2zauIVyOVczvVXcpivbM5dSWg)

### Health Conditions Selection

![Health Conditions Selection](https://private-user-images.githubusercontent.com/180096674/647330005-ce18c6fa-a012-45ee-9c5e-245cadc0448f.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzMwMDA1LWNlMThjNmZhLWEwMTItNDVlZS05YzVlLTI0NWNhZGMwNDQ4Zi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zZGVjNDdhZDQxODU3YjZkOGEwZWE3Y2UwZTE0MDcyMDc1OGY3ZjU5ZDY3M2Y0NTFiNThkMzg5YzNiMzRiMjhjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.cIrKgRP1bJHziy4bjH5uASuIuyGKQO-jr5u2jxlxs_I)

### Personalized Onboarding

![Personalized Onboarding](https://private-user-images.githubusercontent.com/180096674/647330210-0065007c-d35c-44ea-8bbc-82d5b9b849ed.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzMwMjEwLTAwNjUwMDdjLWQzNWMtNDRlYS04YmJjLTgyZDViOWI4NDllZC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04ZjM2NWQyM2Q4ODNmNWM5NDM0OTc0MzVlNjhkY2E1NDlhNWMyYjYzYTE0ZWM4Mzg5NjIzYzAxOWU5MDI0MDFmJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.qsOfM3K16VZfzxUmOUlhxyghBDVwNsI2rqedSP1WfvU)

### ChronicOne Dashboard

![ChronicOne Dashboard](https://private-user-images.githubusercontent.com/180096674/647331077-d1aba6f0-2dd9-44a6-991a-bbcd8c65a3e0.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzMxMDc3LWQxYWJhNmYwLTJkZDktNDRhNi05OTFhLWJiY2Q4YzY1YTNlMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zZTY0YTk1Y2EwZWEzYmJlMjdlODZiYmNmNmFmOWJjOTNmM2YzYjhmZjYxM2NlNmNhMGZkYjE1MDBiY2Y3MDg4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.I_E5wGbVvu-mSoPbRS3uOb2F3qUFWRKvjf6tcBSl-Tg)

### Health Tracking

![Health Tracking](https://private-user-images.githubusercontent.com/180096674/647330900-fa26f3c9-2a33-4bb2-a74f-9c7290abc1c9.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzMwOTAwLWZhMjZmM2M5LTJhMzMtNGJiMi1hNzRmLTljNzI5MGFiYzFjOS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT01MTkzZTQyZGM4NDA5MTEzZGI2YmNhZWViODg2ZjNjMDRhM2Y3MjNiZTgyN2ZlZjZhNTJlMTZmYTdiNTAyNjBjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ._srCbxVxKUaZ7fDfahfN6uJ7rnHEPg6mlBhKbsEh8pc)

### Condition Based Tracking

![Condition Based Tracking](https://private-user-images.githubusercontent.com/180096674/647331238-ad42d8ae-9114-419b-8333-01c35708035f.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzMxMjM4LWFkNDJkOGFlLTkxMTQtNDE5Yi04MzMzLTAxYzM1NzA4MDM1Zi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03MjI3YmQ4YTA1NTVjMzMzOWI2MzJlOTllMTI3NWE4N2Q1YWFlMWJhMGY5M2I4MzdiYWJkYWNiYjU4YTVjNDQ1JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.N7tCdO77YsSa673m9eL6DfItjjd1GlYGhjqxffJy4_o)

### Progress Calendar

![Progress Calendar](https://private-user-images.githubusercontent.com/180096674/647332909-b7c4e8e5-4814-4f19-a966-7d7ce3c3a0be.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzMyOTA5LWI3YzRlOGU1LTQ4MTQtNGYxOS1hOTY2LTdkN2NlM2MzYTBiZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0yZjMxNjY3MTdlMWE0MDg0MDhiOGU1MGNmMDYxOGJlM2YwOGQ4MzZhYjY4ZGExYmVlODE1MDI0NTc5NGQwOWRkJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.ofygXQGbEtui3Eo0YGw1j95_NUUbYFEujqQ8NvoOLWM)

### Daily Details

![Daily Details](https://private-user-images.githubusercontent.com/180096674/647332823-200443ac-0a18-4804-8a11-7b4a89baaaaf.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTMzOTMxNzUsIm5iZiI6MTc5MzM5Mjg3NSwicGF0aCI6Ii8xODAwOTY2NzQvNjQ3MzMyODIzLTIwMDQ0M2FjLTBhMTgtNDgwNC04YTExLTdiNGE4OWJhYWFhZi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYxMDMwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MTAzMFQyMDQxMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04NTI2N2FhOGRhY2FhZDg1NWEzNTVjNTllZDllNTc3YzY4MTE4NmU4NGVkZTI1NDljYzBhMGUwNDg4MzMyMmZjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.oT8tVb-S-iErgEfc93WXJYsRr5ACOg7kAIzERkBwOTI)

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
