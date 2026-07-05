/**
 * api/server.js
 * Production-ready Express backend for Render (Native HTTP Brevo API)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

/* ─────────────────────────────────────────────
   Manual .env Loader
───────────────────────────────────────────── */
try {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const envStr = readFileSync(resolve(__dir, '../.env'), 'utf8');

  for (const line of envStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();

    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('[INFO] .env file not found. Using Render environment variables.');
  }
}

/* ─────────────────────────────────────────────
   App Setup & Validation
───────────────────────────────────────────── */
const app = express();
const PORT = process.env.PORT || 3001;

const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
const MAIL_USER = (process.env.MAIL_USER || '').trim(); // Your Gmail address

if (!BREVO_API_KEY) console.error('\n[ERROR] BREVO_API_KEY is missing!\n');
if (!MAIL_USER) console.error('\n[ERROR] MAIL_USER is missing!\n');

/* ─────────────────────────────────────────────
   Middleware
───────────────────────────────────────────── */
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3000',
      'https://port-folio-nine-bice.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

/* ─────────────────────────────────────────────
   OTP Store & Memory Cleanup
───────────────────────────────────────────── */
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) otpStore.delete(key);
  }
}, 10 * 60 * 1000);

/* ─────────────────────────────────────────────
   Routes
───────────────────────────────────────────── */

app.get('/', (_, res) => res.send('Portfolio API Running'));

// 1. Send OTP dynamically to ANY visitor address
app.post('/api/send-otp', async (req, res) => {
  const { email, name } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpStore.set(email.toLowerCase(), { otp, expiresAt, name });

  console.log(`[OTP] Dispatching verification code straight to visitor: ${email}`);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: "Mounish Portfolio", email: MAIL_USER },
        to: [{ email: email, name: name }], // Direct delivery to the visitor's inbox
        subject: "Your OTP Verification Code",
        htmlContent: `
          <div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;border:1px solid #eee;border-radius:8px;">
            <h2 style="color:#333;">Email Verification</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your OTP verification code for contacting Mounishver is:</p>
            <h1 style="letter-spacing:5px;color:#c9a227;background:#f9f9f9;padding:10px;text-align:center;border-radius:4px;">
              ${otp}
            </h1>
            <p style="color:#666;font-size:12px;">This code is valid for exactly 5 minutes.</p>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Brevo API rejected the dispatch request.');
    }

    console.log(`[OTP] Dispatched cleanly to ${email}. Message ID: ${data.messageId}`);
    return res.json({ success: true, message: 'OTP sent successfully' });

  } catch (err) {
    console.error('[BREVO OTP ERROR]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verify OTP & Forward Contact Text directly to YOUR inbox
app.post('/api/verify-and-send', async (req, res) => {
  const { name, email, message, otp } = req.body || {};

  if (!name || !email || !message || !otp) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  const key = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record || Date.now() > record.expiresAt || record.otp !== otp.toString().trim()) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP token.' });
  }

  otpStore.delete(key);

  try {
    console.log(`[MESSAGE] OTP validated. Routing text layout back to portfolio owner inbox.`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: "Portfolio Contact Form", email: MAIL_USER },
        to: [{ email: MAIL_USER, name: "Mounishver S" }], // Delivers message straight to you
        replyTo: { email: email, name: name },
        subject: `Portfolio Message from ${name}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;padding:20px;line-height:1.6;">
            <h2 style="color:#0056b3;border-bottom:1px solid #eee;padding-bottom:10px;">New Portfolio Message</h2>
            <p><strong>Sender Name:</strong> ${name}</p>
            <p><strong>Sender Email:</strong> ${email}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
            <div style="background:#f5f5f5;padding:15px;border-radius:4px;white-space:pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Brevo pipeline failed delivery.');
    }

    console.log(`[MESSAGE] Delivery successful.`);
    return res.json({ success: true, message: 'Message delivered successfully' });

  } catch (err) {
    console.error('[BREVO DELIVERY ERROR]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const server = app.listen(PORT, () => console.log(`\n🚀 Backend operational using Native Fetch API on port ${PORT}\n`));
