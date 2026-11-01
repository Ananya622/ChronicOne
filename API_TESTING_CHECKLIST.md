# ChronicOne API Testing Checklist

## Purpose

This checklist records API checks performed against the deployed ChronicOne backend and identifies tests that still need verification.

**Base URL:** `https://chronicone-1.onrender.com`

> Use test accounts and non-sensitive sample data. Never commit passwords, access tokens, or personal health information.

## Tests performed

| Area | Method and endpoint | Observed result | Status |
|---|---|---|---|
| Server health | `GET /api/health` | HTTP 200; server and database reported healthy/connected | Passed |
| Registration | `POST /api/auth/register` | Registration succeeded | Passed |
| Login | `POST /api/auth/login` | Login succeeded and returned a token | Passed |
| Current user | `GET /api/auth/me` | HTTP 200 | Passed |
| Profile update | `PATCH /api/auth/profile` | Theme update to `dark` returned HTTP 200 | Passed |
| Create check-in | `POST /api/checkin` | Numeric habit scores from 0 to 1 returned HTTP 201 | Passed |
| Retrieve check-ins | `GET /api/checkin` | HTTP 200 | Passed |
| Retrieve streak | `GET /api/streak` | HTTP 200 | Passed |
| Create health record | `POST /api/health-records` | HTTP 201 | Passed |
| Retrieve health records | `GET /api/health-records` | HTTP 200 | Passed |
| Create mood record | `POST /api/wellness/mood` | Request succeeded | Passed |
| Retrieve mood records | `GET /api/wellness/mood` | Request succeeded | Passed |

## Sample requests used

### Check-in

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

### Health record

`POST /api/health-records`

```json
{
  "type": "blood_pressure",
  "value": 120,
  "unit": "mmHg",
  "date": "YYYY-MM-DD"
}
```

## Additional tests to perform

These cases were not confirmed in the recorded test run. Mark them complete only after actually testing them.

- [ ] Registration with an already-used email is rejected appropriately.
- [ ] Login with an incorrect password is rejected.
- [ ] A protected endpoint rejects a request with no token.
- [ ] A protected endpoint rejects an invalid or expired token.
- [ ] A user cannot read or modify another user's records.
- [ ] Invalid or missing check-in fields return an appropriate validation error.
- [ ] Invalid health-record values return an appropriate validation error.
- [ ] Duplicate check-ins for the same date behave as intended.
- [ ] Delete/update operations are tested, if supported by the API.
- [ ] Data remains available after the backend service restarts.

## Test execution notes

When recording a new test, include:
1. Date of testing.
2. HTTP method and endpoint.
3. Sanitized request body (no secrets or personal data).
4. Expected status/result.
5. Actual status/result.
6. Pass/fail and any relevant error message.

Do not describe an untested case as passed. Update this checklist as additional tests are completed.
