/**
 * api/server.js
 * Production-ready Express backend for Render (Resend API Edition)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
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

// Initialize Resend
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const MAIL_USER = (process.env.MAIL_USER || '').trim(); // Your receiving email

if (!RESEND_API_KEY) {
  console.error('\n[ERROR] CRITICAL: RESEND_API_KEY environment variable is missing!\n');
}
if (!MAIL_USER) {
  console.error('\n[ERROR] CRITICAL: MAIL_USER environment variable is missing!\n');
}

const resend = new Resend(RESEND_API_KEY);

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

app.get('/', (_, res) => {
  res.send('Portfolio API Running');
});

app.get('/api/health', (_, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// Send OTP via Resend API (Port 443 HTTPS)
app.post('/api/send-otp', async (req, res) => {
  const { email, name } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(email.toLowerCase(), { otp, expiresAt, name });

  console.log(`[OTP] Preparing to send code to ${email} via Resend API`);

  try {
    // Note: Free Resend tier allows sending to your own registered email address layout 
    // or verification loops. To send to anyone, you can format it or configure domain.
    const { data, error } = await resend.emails.send({
      from: 'Portfolio Verification <onboarding@resend.dev>',
      to: MAIL_USER, // Crucial: Free-tier sends to your registered Resend account email!
      subject: 'Your OTP Verification Code',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#333;">Email Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your OTP verification code for contacting Mounishver is:</p>
          <h1 style="letter-spacing:5px;color:#c9a227;background:#f9f9f9;padding:10px;text-align:center;border-radius:4px;">
            ${otp}
          </h1>
          <p style="color:#666;font-size:12px;">This code is strictly valid for 5 minutes.</p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);

    console.log(`[OTP] Successfully dispatched code via API to ${email}`);
    return res.json({ success: true, message: 'OTP sent successfully' });

  } catch (err) {
    console.error('[RESEND OTP ERROR]', err.message);
    return res.status(500).json({
      success: false,
      error: `API Mail transmission failed: ${err.message}`,
    });
  }
});

// Verify OTP & Forward Contact Form Data
app.post('/api/verify-and-send', async (req, res) => {
  const { name, email, message, otp } = req.body || {};

  if (!name || !email || !message || !otp) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  const key = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ success: false, error: 'No active OTP verification request found' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ success: false, error: 'OTP code expired.' });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ success: false, error: 'Invalid OTP code.' });
  }

  otpStore.delete(key);

  try {
    console.log(`[MESSAGE] OTP Verified. Routing portfolio message via Resend API.`);

    const { data, error } = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: MAIL_USER, // Sends the completed form directly to YOUR inbox
      replyTo: email,
      subject: `Portfolio Message from ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;line-height:1.6;">
          <h2 style="color:#0056b3;border-bottom:1px solid #eee;padding-bottom:10px;">New Portfolio Message</h2>
          <p><strong>Sender Name:</strong> ${name}</p>
          <p><strong>Sender Email:</strong> ${email}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <div style="background:#f5f5f5;padding:15px;border-radius:4px;white-space:pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
        </div>
      `,
    });

    if (error) throw new Error(error.message);

    console.log(`[MESSAGE] Form successfully forwarded to ${MAIL_USER}`);
    return res.json({ success: true, message: 'Message delivered successfully' });

  } catch (err) {
    console.error('[RESEND DELIVER ERROR]', err.message);
    return res.status(500).json({
      success: false,
      error: `Failed to deliver contact form layout: ${err.message}`,
    });
  }
});

/* ─────────────────────────────────────────────
   Start Server
───────────────────────────────────────────── */
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Backend operational using Resend API on port ${PORT}\n`);
});

process.on('uncaughtException', (err) => console.error('[UNCAUGHT]', err));
process.on('unhandledRejection', (reason) => console.error('[UNHANDLED]', reason));

const gracefulShutdown = () => {
  server.close(() => process.exit(0));
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
