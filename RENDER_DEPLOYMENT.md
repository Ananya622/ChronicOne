# ChronicOne — Render Production Deployment & Environment Guide

This guide details the deployment configuration, environment variables, security safeguards, and MongoDB Atlas network access requirements for deploying **ChronicOne** to **Render** as a Node.js Web Service.

---

## 1. Architecture & Deployment Model

ChronicOne is structured as a decoupled full-stack application within a unified repository:
- **Backend**: Express.js MVC API with Mongoose (`backend/`)
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript (`frontend/`) served as static assets by Express
- **Authentication**: Native `HttpOnly` cookie sessions (`chronicone_token`) with CSRF defense
- **Persistence**: MongoDB Atlas as the authoritative data store (zero executable `localStorage` or `sessionStorage` in the client)

Because the Express server serves both the REST API (`/api/*`) and the static frontend, ChronicOne deploys as a single **Render Web Service**.

---

## 2. Render Web Service Configuration

In the [Render Dashboard](https://dashboard.render.com), create a new **Web Service** connected to your repository.

### Option A: Standard Deployment from Repository Root (Recommended)
This uses the automated root scripts in `package.json` to install backend dependencies and start the application cleanly:
- **Environment**: `Node`
- **Region**: Select the region closest to your MongoDB Atlas cluster (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`)
- **Branch**: `main` (or your active release branch)
- **Root Directory**: *(Leave blank / default to repo root)*
- **Build Command**: `npm run build` *(or `npm install`, which triggers `postinstall`)*
- **Start Command**: `npm start` *(executes `node backend/server.js`)*

### Option B: Backend-Scoped Deployment
Alternatively, configure Render to execute directly within the `backend/` directory:
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start` *(or `node server.js`)*

---

## 3. Required Environment Variables

Configure these variables in the Render Dashboard under **Environment Variables**. Never commit production secrets to Git.

| Variable Name | Required | Example / Recommended Format | Purpose & Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations, activates Express `trust proxy` for HTTPS load balancers, and enforces `Secure: true` on session cookies. |
| `PORT` | **Yes** | `10000` | Render default web service internal port. Express binds to `process.env.PORT \|\| 3000`. |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority` | Authenticated MongoDB Atlas connection string. Keep credentials confidential. |
| `JWT_SECRET` | **Yes** | *(High-entropy random string, 32+ characters)* | Secret signing key used to sign and verify session JSON Web Tokens stored in the `HttpOnly` cookie. |

> [!IMPORTANT]
> **No Secrets in Version Control:** Ensure `.env` is never committed. A `.env.example` template is maintained in `backend/` for local reference without sensitive values.

---

## 4. MongoDB Atlas Network Access & Security Trade-Off Analysis

### The Technical Constraint on Cloud Platforms (Render)
Render Web Services (Free and Individual/Team tiers) operate on dynamic shared cloud infrastructure (AWS/GCP). Outbound requests originate from broad dynamic IP pools rather than a single static IP. Consequently, adding a personal laptop IP (e.g. `152.59.84.98/32`) will result in connection rejection (`MongooseServerSelectionError: SSL alert number 80`).

### Access Options & Security Trade-Offs

#### Option 1: Broad Cloud Access (`0.0.0.0/0` — Allow Access from Anywhere)
* **How to configure:** In MongoDB Atlas > **Network Access** > **Add IP Address** > click **Allow Access from Anywhere** (`0.0.0.0/0`).
* **Security Risk:** Exposes port `27017` to connection attempts across the public internet.
* **Compensating Controls (Defense-in-Depth):**
  1. **Strong Authentication:** MongoDB Atlas enforces SCRAM-SHA-256 or X.509 challenge-response authentication. Passwords should be long, high-entropy strings.
  2. **Encrypted Transport:** TLS 1.3 is enforced; unencrypted traffic is dropped.
  3. **Least-Privilege Database User:** Create a dedicated database user with `readWrite` permissions scoped strictly to the `chronicone` database, never an administrative role (`atlasAdmin`).
  4. **Temporary Whitelisting:** Atlas allows setting an expiration time (e.g., 6 hours or 24 hours) for `0.0.0.0/0` during demonstration or testing phases.

#### Option 2: Private Networking / VPC Peering (Enterprise Production)
* **Availability:** Requires an Atlas Dedicated Tier (`M10` or higher) and a dedicated Render VPC/Private Service.
* **Security Benefit:** Traffic travels across private AWS/GCP backbones without public internet exposure.
* **Limitation:** Not available on free/shared tiers (Atlas `M0`/`M2`/`M5`).

#### Option 3: Local Development (Narrowest Surface)
* For development on your local machine, retain only your current outbound IP (e.g. `152.59.84.98/32`) on the Atlas IP Access List.

---

## 5. Security & Session Integrity in Production

1. **Reverse Proxy Trust:**
   `backend/server.js` enables `app.set('trust proxy', 1);` when `NODE_ENV === 'production'`. This allows Express to safely inspect `X-Forwarded-Proto: https` added by Render's TLS termination proxy, ensuring `req.secure` is `true`.

2. **Cookie Attributes in Production:**
   - `HttpOnly: true` — Inaccessible to JavaScript, defending against cross-site scripting (XSS) token extraction.
   - `Secure: true` — Transmitted strictly over encrypted HTTPS connections in production.
   - `SameSite: Lax` — Prevents cross-site cookie leakage while permitting top-level navigation.
   - `Max-Age: 7 Days` — Sessions automatically expire after 7 days of inactivity.

3. **CSRF Protection:**
   The server enforces same-origin validation on all state-modifying requests (`POST`, `PUT`, `PATCH`, `DELETE`). The `Origin` header must match the host header (`req.get('host')`), blocking cross-origin forge attempts.

4. **Zero Browser Storage:**
   The client operates strictly via in-memory cache synchronized with MongoDB Atlas. No authentication tokens, user credentials, or habits are ever stored in `localStorage` or `sessionStorage`.

---

## 6. Pre-Flight Deployment Checklist

Before triggering deployment on Render:
- [ ] Root `package.json` contains `"start": "node backend/server.js"` and `"build": "npm --prefix backend install"`.
- [ ] `backend/package.json` contains all dependencies (`bcryptjs`, `cookie-parser`, `dotenv`, `express`, `jsonwebtoken`, `mongoose`).
- [ ] All 29 JavaScript files pass syntax checks (`node -c`).
- [ ] `NODE_ENV=production`, `PORT=10000`, `MONGODB_URI`, and `JWT_SECRET` are added to Render Environment Variables.
- [ ] MongoDB Atlas Network Access contains the appropriate access rule for the target environment.
- [ ] Render Web Service builds and passes `/api/health` returning `HTTP 200` (`status: "healthy"`, `database: "connected"`).
