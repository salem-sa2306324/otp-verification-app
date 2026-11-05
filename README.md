# OTP Sign-In Website

A small website that signs people in with a one-time passcode (OTP) sent to either an **email address** or a **phone number** (SMS). There are no passwords. Built with React, Vite and Supabase Auth.

## How it works

1. The visitor picks **Email** or **Phone** and enters their address or number.
2. The app calls `supabase.auth.signInWithOtp()`. Supabase generates a 6-digit code and sends it by email or SMS.
3. The visitor types the code into the six boxes (pasting the full code works too, and phones can autofill it).
4. The app calls `supabase.auth.verifyOtp()` with the code. If it is correct, Supabase creates a session and the page shows the signed-in screen.
5. The session is stored by the Supabase client in the browser, so a refresh keeps the user signed in until they click **Sign out**.

If the visitor has never signed in before, Supabase creates the account automatically on the first successful verification.

## Features

- Email and phone sign-in in one interface
- Input checks before anything is sent: email format, and phone numbers in international format (`+` and country code, 8-15 digits, for example `+97455512345`)
- Six-digit code entry with auto-advance, backspace navigation, paste support and one-time-code autofill
- 30-second resend cooldown
- Clear error messages for a bad number, a wrong code or an expired code
- Session persistence and sign-out
- Light and dark mode, mobile-friendly layout, visible keyboard focus

## Project structure

```
otp-site/
├── index.html          Page shell and font
├── package.json        Dependencies and scripts
├── vite.config.js      Vite + React plugin
├── .env.example        Template for your Supabase keys
└── src/
    ├── main.jsx        App entry point
    ├── App.jsx         All UI and the OTP flow (request, verify, signed-in)
    ├── supabase.js     Supabase client, created from env variables
    └── styles.css      Styling
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then open **Project Settings → API** and copy the **Project URL** and the **anon public key**.

### 3. Add your keys

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is designed to be public in browser code. Never put the `service_role` key in this project.

### 4. Turn on email codes

In the Supabase dashboard go to **Authentication → Providers** and make sure **Email** is enabled.

By default Supabase emails a magic link, not a code. To send a code, go to **Authentication → Email Templates → Magic Link** (and **Confirm signup** for new users) and include the token in the template:

```html
<h2>Your sign-in code</h2>
<p>Enter this code: <strong>{{ .Token }}</strong></p>
```

Supabase's built-in email sender is rate limited and meant for testing. For real use, add your own SMTP server under **Project Settings → Authentication → SMTP**.

### 5. Turn on phone codes

Under **Authentication → Providers → Phone**, enable the provider and connect an SMS service (Twilio, MessageBird, Vonage or TextLocal). You need an account with that provider and a sender number or messaging service. SMS usually costs money per message.

For development, the Phone provider settings let you define **test phone numbers with fixed codes** so you can test without sending real SMS.

### 6. Run

```bash
npm run dev
```

Open the address Vite prints (normally http://localhost:5173).

### 7. Add your site URL

Under **Authentication → URL Configuration**, set the **Site URL** to your deployed address (and add `http://localhost:5173` as a redirect URL for development).

## Build and deploy

```bash
npm run build
```

This creates a `dist/` folder of static files. Upload it to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages). Set the same two `VITE_` variables in the host's environment settings before building.

## Security notes

- Codes are generated, stored, expire and are rate limited by Supabase. The app never sees or stores the correct code.
- Codes expire after one hour by default. You can shorten this under **Authentication → Providers → Email / Phone** (OTP expiry).
- Supabase limits how often a code can be requested for the same address. The 30-second cooldown in the UI matches the usual minimum gap, and the server enforces it regardless.
- Enable CAPTCHA (**Authentication → Attack Protection**) before going live to stop automated SMS abuse, since SMS costs money.
- If you add your own database tables, turn on Row Level Security for them.

## Troubleshooting

| Problem | Likely cause |
| --- | --- |
| "Almost ready" screen appears | `.env` is missing or the dev server was not restarted after creating it |
| Email arrives with a link, not a code | The email template does not contain `{{ .Token }}` |
| "Unable to validate phone" or SMS never arrives | Phone provider or SMS credentials are not set up, or the number is not in `+countrycode` format |
| "Email rate limit exceeded" | Built-in email sender limit reached; set up custom SMTP |
| Wrong or expired code message | Code was mistyped, already used, or older than the expiry time; request a new one |

## Customising

- **Code length**: change `LENGTH` in `src/App.jsx` and match it in the Supabase OTP length setting.
- **After sign-in**: replace the signed-in block in `App.jsx` with your own page or router.
- **Resend delay**: change `COOLDOWN` in `src/App.jsx`.
- **Colors and fonts**: edit the variables at the top of `src/styles.css`.
