# OTP Verification App

A small Node.js and Express website that sends a one-time password (OTP) to an email address or phone number, then checks the code entered by the user.

The page uses plain HTML, CSS, and JavaScript. The server sends email through an SMTP account using Nodemailer, and text messages through Twilio.

## What the website does

1. The visitor selects **Email** or **Text message**.
2. They enter their email address or phone number.
3. The server validates the input, generates a random six-digit code, and sends it using the selected provider.
4. The visitor enters the code.
5. The server checks the code and confirms the contact if it is correct and has not expired.

If the required provider credentials are missing, the server returns a setup error. It does not show a success message or display a pretend code.

## Requirements

- Node.js 20 or newer
- An SMTP service/account for email, a Twilio account for SMS, or both
- VS Code (optional, but useful for editing the project)

## Install and start

Open this project folder in VS Code. In the integrated terminal, run:

```bash
npm install
```

Create your local environment file by copying the example:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS or Linux**

```bash
cp .env.example .env
```

Open `.env` and set `OTP_SECRET` to a private random value with at least 32 characters. You can generate one with:

```bash
node -p "require('node:crypto').randomBytes(32).toString('hex')"
```

Paste the generated value after `OTP_SECRET=` in `.env`. Keep this value private. Do not put it in source code or commit `.env` to GitHub.

Start the website:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Stop the server with Ctrl+C in the terminal.

For a normal start without automatic restart, use `npm start`.

## Configure email delivery

Email is sent through SMTP. In `.env`, set:

- `SMTP_HOST`: the SMTP server from your email provider.
- `SMTP_PORT`: usually `587` for STARTTLS or `465` for a direct secure connection.
- `SMTP_SECURE`: use `false` for port 587 and `true` for port 465.
- `SMTP_USER`: the SMTP username supplied by your provider.
- `SMTP_PASS`: the SMTP password or app password supplied by your provider.
- `EMAIL_FROM`: the sender address permitted by that provider.

Example format (replace the example values with your provider's actual details):

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=Your App <verified-sender@example.com>
```

Email providers use different SMTP servers and may require an app password or verified sender address. Follow your provider's SMTP instructions.

## Configure SMS delivery

Create/configure a Twilio phone number that can send SMS. In `.env`, set:

- `TWILIO_ACCOUNT_SID`: your Twilio account SID.
- `TWILIO_AUTH_TOKEN`: your Twilio auth token. Treat it like a password.
- `TWILIO_PHONE_NUMBER`: the Twilio number sending the message, including the leading plus sign and country code.

Example format:

```dotenv
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+15551234567
```

Enter recipient phone numbers in international format, such as `+15551234567`. Twilio trial accounts may only send to verified recipient numbers.

You can configure either provider or both. Email works when the SMTP fields are filled in; SMS works when the Twilio fields are filled in.

## Environment variables

The project reads these values from `.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | Local web server port. Defaults to `3000`. |
| `OTP_SECRET` | Private key used to create secure OTP hashes. Set a random value of 32+ characters. |
| `SMTP_HOST` | SMTP server hostname. |
| `SMTP_PORT` | SMTP port, commonly 587 or 465. |
| `SMTP_SECURE` | Set to `true` for direct TLS, otherwise `false`. |
| `SMTP_USER` | SMTP login name. |
| `SMTP_PASS` | SMTP password or app password. |
| `EMAIL_FROM` | Verified sender address/name. |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier. |
| `TWILIO_AUTH_TOKEN` | Twilio account secret. |
| `TWILIO_PHONE_NUMBER` | Your Twilio sending number. |

`.env.example` is safe to share because its values are blank or placeholders. A real `.env` file is ignored by Git.

## Security protections

- Codes are six digits and generated using Node.js cryptographic randomness.
- The server stores an HMAC-SHA-256 digest of the code, not the plain code.
- Each code expires after five minutes and is deleted after successful verification.
- A code can be used only once.
- A code allows up to five attempts.
- A destination can request a new code once per minute.
- Each IP address is rate-limited to five send/verify requests per 15 minutes.
- Email addresses and international phone numbers are validated before sending.
- Helmet adds common HTTP security headers, and JSON request bodies are size-limited.

## Tests

Run the included tests with:

```bash
npm test
```

The tests cover email input validation and check that OTP digests change when the destination or code changes.

## Project files

- `server.js`: Express server, validation, OTP creation, delivery, and verification endpoints.
- `public/index.html`: Website structure and form.
- `public/style.css`: Responsive, simple website styling.
- `public/app.js`: Handles the form and communicates with the server.
- `test/security.test.js`: Small automated security-related tests.
- `.env.example`: Template for local settings; copy it to `.env`.
- `.gitignore`: Prevents secrets and installed dependencies from being committed.
- `package.json`: Dependencies and commands.

## Troubleshooting

- **“Email delivery is not configured”**: Fill in all SMTP settings, then restart the server.
- **“SMS delivery is not configured”**: Fill in the Twilio SID, token, and sending number, then restart.
- **SMTP login or send error**: Check your provider's SMTP host, port, secure setting, password/app password, and verified sender.
- **Twilio error**: Check the SID and token, confirm the Twilio number can send SMS, and check whether a trial account requires recipient verification.
- **Phone number rejected**: Include the country code, for example `+1...`.
- **“OTP_SECRET” setup error**: Add a private random value at least 32 characters long to `.env`, then restart.
- **No code arrives**: Check the provider's delivery logs, spam folder, recipient number, provider account limits, and credentials.

## Important limitation

Active OTP challenges are kept in the server's memory. They disappear when the server restarts, and separate server instances do not share them. For a public production service, use shared storage such as Redis, add monitoring and destination-based abuse controls, serve the site over HTTPS, and review email/SMS consent requirements. This project is a learning starter, not a complete production identity system.
