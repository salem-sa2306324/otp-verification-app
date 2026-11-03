# OTP Verification App

Express starter for email (SMTP/Nodemailer) and SMS (Twilio) one-time verification.

## Run
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`; set a random `OTP_SECRET` of at least 32 characters and provider credentials.
4. Run `npm run dev`, then visit http://localhost:3000.

Missing provider settings produce an explicit error; the app never claims codes were delivered when they were not.

Codes are generated cryptographically, stored as HMAC digests, expire after five minutes, allow five attempts, and work once. Resends are limited to once per destination per minute and each IP is limited to five requests per 15 minutes. Inputs are validated. Active challenges are in memory; use shared storage such as Redis for multi-instance production. Never commit `.env`.
