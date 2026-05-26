/**
 * api/server.js
 * Production-ready Express backend for Render
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
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
} catch {
  console.log('[INFO] Using system environment variables');
}

/* ─────────────────────────────────────────────
   App Setup
───────────────────────────────────────────── */
const app = express();

const PORT = process.env.PORT || 3001;

const MAIL_USER = (process.env.MAIL_USER || '').trim();

const MAIL_PASS = (process.env.MAIL_PASS || '').replace(/\s/g, '');

/* ─────────────────────────────────────────────
   Validation
───────────────────────────────────────────── */
if (!MAIL_USER || !MAIL_PASS) {
  console.error('\n[ERROR] MAIL_USER or MAIL_PASS missing\n');
}

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

      // Replace with your Vercel frontend URL
      'https://port-folio-nine-bice.vercel.app/',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

/* ─────────────────────────────────────────────
   OTP Store
───────────────────────────────────────────── */
const otpStore = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;

/* ─────────────────────────────────────────────
   Nodemailer Transporter
───────────────────────────────────────────── */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
}

/* ─────────────────────────────────────────────
   Root Route
───────────────────────────────────────────── */
app.get('/', (_, res) => {
  res.send('Portfolio API Running');
});

/* ─────────────────────────────────────────────
   Health Check
───────────────────────────────────────────── */
app.get('/api/health', (_, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date().toISOString(),
  });
});

/* ─────────────────────────────────────────────
   Send OTP
───────────────────────────────────────────── */
app.post('/api/send-otp', async (req, res) => {
  const { email, name } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address',
    });
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt,
    name,
  });

  console.log(`[OTP] Sending OTP to ${email}`);

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Mounish Portfolio" <${MAIL_USER}>`,
      to: email,
      subject: 'Your OTP Verification Code',
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2>Email Verification</h2>

          <p>Hello <strong>${name}</strong>,</p>

          <p>Your OTP code is:</p>

          <h1 style="letter-spacing:5px;color:#c9a227;">
            ${otp}
          </h1>

          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    });

    console.log(`[OTP] OTP sent to ${email}`);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    console.error('[OTP ERROR]', err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ─────────────────────────────────────────────
   Verify OTP & Send Message
───────────────────────────────────────────── */
app.post('/api/verify-and-send', async (req, res) => {
  const { name, email, message, otp } = req.body || {};

  if (!name || !email || !message || !otp) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required',
    });
  }

  const key = email.toLowerCase();

  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({
      success: false,
      error: 'No OTP found',
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);

    return res.status(400).json({
      success: false,
      error: 'OTP expired',
    });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid OTP',
    });
  }

  otpStore.delete(key);

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Portfolio Contact" <${MAIL_USER}>`,
      to: MAIL_USER,
      replyTo: email,
      subject: `Portfolio Message from ${name}`,
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2>New Portfolio Message</h2>

          <p><strong>Name:</strong> ${name}</p>

          <p><strong>Email:</strong> ${email}</p>

          <hr />

          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });

    console.log(`[MESSAGE] Message received from ${email}`);

    return res.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (err) {
    console.error('[MESSAGE ERROR]', err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ─────────────────────────────────────────────
   Start Server
───────────────────────────────────────────── */
const server = app.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}\n`);
});

/* ─────────────────────────────────────────────
   Error Handling
───────────────────────────────────────────── */
server.on('error', (err) => {
  console.error('[SERVER ERROR]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('SIGINT', () => {
  console.log('\nStopping server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nStopping server...');
  process.exit(0);
});
