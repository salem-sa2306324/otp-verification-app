# OTP Sign-in: email + phone verification

A small website that signs people in with a one-time passcode (OTP). The user enters
an **email address or a phone number**, receives a 6-digit code, types it in, and is signed in.
There are no passwords.

Built with **React 18 + Vite** for the front end and **Supabase Auth** for sending and
checking the codes.

---

## 1. What the website does

1. **Request screen.** The user picks the **Email** or **Phone** tab and enters their contact.
   - Email is checked for a valid format.
   - Phone uses a country-code picker plus the national number. The app combines them into
     international (E.164) format, for example `+97455123456`, which is what Supabase expects.
2. **Send code.** The app asks Supabase to send a 6-digit code by email or SMS.
3. **Verify screen.** Six boxes for the code.
   - Digits auto-advance; Backspace moves back; pasting a full code fills all boxes.
   - On phones, the code can be auto-suggested from the SMS (`autocomplete="one-time-code"`).
   - The contact is masked on screen (for example `j•••@gmail.com`).
   - **Resend code** is available after a 30-second cooldown.
   - **Change email / number** returns to step 1.
4. **Signed-in screen.** After a correct code, Supabase creates a session and the app shows
   the user's email or phone and ID, with a **Sign out** button.
5. **Stay signed in.** Supabase stores the session in the browser (localStorage), so a page
   refresh keeps the user signed in until they sign out or the session is revoked.

The layout is responsive and follows the device's light or dark mode.

---

## 2. How it works (the flow)

```
User enters email/phone
        │
        ▼
supabase.auth.signInWithOtp({ email })   or   ({ phone })
        │        Supabase generates a code and sends it
        ▼        (email via your SMTP / Supabase, SMS via your SMS provider)
User types the 6-digit code
        │
        ▼
supabase.auth.verifyOtp({ email, token, type: 'email' })
supabase.auth.verifyOtp({ phone, token, type: 'sms' })
        │
        ▼
Session returned ──► onAuthStateChange fires ──► App shows the signed-in screen
```

The code itself is generated, stored, expired and checked **by Supabase**, not by this app.
The front end never sees the correct code, which is what makes it secure.

---

## 3. Project structure

```
otp-app/
├── README.md              this file
├── package.json           dependencies and npm scripts
├── vite.config.js         Vite + React plugin
├── index.html             page shell; loads src/main.jsx
├── .env.example           template for your Supabase keys (copy to .env)
├── .gitignore
├── demo/
│   └── otp-demo.html      standalone demo of the same UI (no Supabase, no install)
└── src/
    ├── main.jsx           React entry point
    ├── App.jsx            page logic: setup notice, session check, sign-in vs signed-in
    ├── App.css            page layout and theme colors
    ├── OtpAuth.jsx        the OTP component (the main piece)
    ├── OtpAuth.css        styles for the component, themable via CSS variables
    └── supabaseClient.js  creates the Supabase client from your .env values
```

### What each file does

- **`OtpAuth.jsx`** holds all the OTP logic: tabs, validation, phone formatting, sending,
  verifying, resend timer, and the code boxes. It can be copied into any other React project.
- **`App.jsx`** decides which screen to show. It reads any existing session on load
  (`getSession`), listens for changes (`onAuthStateChange`), and shows a setup message if
  the `.env` values are missing.
- **`supabaseClient.js`** exports `supabase` and `isConfigured`. If your keys are missing,
  `supabase` is `null` and the app shows a friendly setup notice instead of crashing.
- **`demo/otp-demo.html`** is a single-file preview. It generates the code in the browser and
  displays it on screen, so you can see the interface without any backend. It does **not**
  send real messages.

---

## 4. Setup

### Requirements
- Node.js 18 or newer
- A free [Supabase](https://supabase.com) project

### Step 1: install
```bash
npm install
```

### Step 2: add your Supabase keys
```bash
cp .env.example .env
```
Open `.env` and fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
Both values are in the Supabase dashboard under **Project Settings → API**.
Use the **anon / public** key. Never put the `service_role` key in a front-end app.

### Step 3: configure Supabase (required, or codes won't arrive)

**Email codes**
1. Go to **Authentication → Email Templates**.
2. Edit **Magic Link** and **Confirm signup** so the message body includes `{{ .Token }}`,
   for example: `Your code is {{ .Token }}`.
   If the template only contains `{{ .ConfirmationURL }}`, Supabase emails a clickable link
   and the user never receives a code.
3. Make sure **Authentication → Providers → Email** is enabled.
4. For real use, add your own SMTP server under **Authentication → SMTP Settings**.
   Supabase's built-in email sender is meant for testing and has very low sending limits.

**Phone (SMS) codes**
1. Go to **Authentication → Providers → Phone** and enable it.
2. Choose an SMS provider (Twilio, MessageBird, Vonage, etc.) and enter its credentials.
3. SMS costs money per message, billed by the provider. Check your provider's coverage for the
   countries you need (for example Qatar `+974`).

### Step 4: run it
```bash
npm run dev
```
Open the printed address (usually http://localhost:5173).

### Build and deploy
```bash
npm run build      # creates the dist/ folder
npm run preview    # test the production build locally
```
Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the host's
settings, because `.env` is not uploaded.

---

## 5. Using the component in another project

```jsx
import OtpAuth from './OtpAuth';

<OtpAuth onVerified={(session, user) => console.log(user)} />
```

| Prop | Type | Description |
|---|---|---|
| `onVerified` | `(session, user) => void` (optional) | Called after a correct code. Supabase also stores the session automatically. |

Copy `OtpAuth.jsx`, `OtpAuth.css` and `supabaseClient.js` (or change the import in
`OtpAuth.jsx` to your existing Supabase client).

---

## 6. Customizing

| What | Where |
|---|---|
| Country codes in the picker | `COUNTRIES` array at the top of `OtpAuth.jsx` |
| Code length | `CODE_LENGTH` in `OtpAuth.jsx`. Must match the length set in Supabase (6 by default). |
| Resend cooldown | `RESEND_SECONDS` in `OtpAuth.jsx` |
| Colors | CSS variables on `.otp-card` in `OtpAuth.css` (`--otp-accent`, `--otp-bg`, ...) |
| Page background and layout | `src/App.css` |
| Wording | The text inside `OtpAuth.jsx` and `App.jsx` |
| Login only, no new accounts | Pass `{ options: { shouldCreateUser: false } }` as a second field in `signInWithOtp` |

Example for login-only email sign-in inside `sendCode()`:
```js
const payload = mode === 'email'
  ? { email: value, options: { shouldCreateUser: false } }
  : { phone: value, options: { shouldCreateUser: false } };
```

---

## 7. Security notes

- **Codes are checked by Supabase**, never in the browser. Don't move verification client-side.
- The **anon key is public by design**. Protect your data with Supabase Row Level Security
  (RLS) policies on your tables. Never expose the `service_role` key.
- **Expiry and rate limits** are controlled in the Supabase dashboard
  (Authentication → Rate Limits and the email/phone OTP expiry setting). The default OTP
  lifetime is long (about an hour), so lower it if you want stricter codes.
- The 30-second resend cooldown in the UI is a convenience, not protection. Real throttling
  happens on Supabase's side.
- Entering an unknown email or number **creates an account** by default
  (see "Login only" above to change this).
- SMS OTP can be abused to run up costs (SMS pumping). Keep Supabase rate limits on, and
  consider CAPTCHA (Authentication → Attack Protection) before a public launch.

---

## 8. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| "Supabase isn't connected" screen | `.env` missing or misspelled. Names must start with `VITE_`. Restart `npm run dev` after editing. |
| Email arrives with a link, not a code | Email template lacks `{{ .Token }}`. See Setup, Step 3. |
| No email arrives | Check spam. The built-in sender is heavily limited. Add custom SMTP. |
| No SMS arrives | Phone provider not enabled or misconfigured, number not in E.164 format, or the provider doesn't support that country. |
| "Token has expired or is invalid" | Wrong digits, an old code, or a newer code was requested. Use the latest one. |
| "email rate limit exceeded" / 429 errors | Too many requests. Wait, or raise limits / use custom SMTP. |
| Phone sign-in says phone provider disabled | Enable **Authentication → Providers → Phone**. |
| Works locally but not after deploying | Add the two `VITE_` variables in your host's settings and redeploy. |

---

## 9. Limitations

- Phone numbers are not checked per country beyond length (6 to 14 digits). For strict validation,
  add a library such as `libphonenumber-js`.
- Only the country codes in `COUNTRIES` appear in the picker.
- No profile page, roles, or protected routes. After sign-in the app only shows the user's details.
  Add your own pages and check `session` in `App.jsx`.
- The component was written without a live Supabase project to test against, so test both email
  and SMS once your dashboard is configured.

---

## 10. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
