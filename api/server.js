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
} catch (err) {
  // Only log if the file is missing (expected behavior on Render)
  if (err.code === 'ENOENT') {
    console.log('[INFO] .env file not found. Using Render environment variables.');
  } else {
    console.warn('[WARNING] Error loading .env file:', err.message);
  }
}

/* ─────────────────────────────────────────────
   App Setup & Validation
───────────────────────────────────────────── */
const app = express();
const PORT = process.env.PORT || 3001;

const MAIL_USER = (process.env.MAIL_USER || '').trim();
const MAIL_PASS = (process.env.MAIL_PASS || '').replace(/\s/g, '');

if (!MAIL_USER || !MAIL_PASS) {
  console.error('\n[ERROR] CRITICAL: MAIL_USER or MAIL_PASS environment variables are missing!\n');
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
      'https://port-folio-nine-bice.vercel.app', // Your Vercel frontend
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

/* ─────────────────────────────────────────────
   OTP Store & Memory Cleanup
───────────────────────────────────────────── */
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup routine (Runs every 10 minutes) to prevent memory leaks from abandoned OTP requests
setInterval(() => {
  const now = Date.now();
  let clearedCount = 0;
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
      clearedCount++;
    }
  }
  if (clearedCount > 0) {
    console.log(`[CLEANUP] Automatically flushed ${clearedCount} expired unverified records.`);
  }
}, 10 * 60 * 1000);

/* ─────────────────────────────────────────────
   Nodemailer Transporter Configuration
───────────────────────────────────────────── */
function createTransporter() {
  // Switched to Port 587 + secure: false to bypass Render's Port 465 outbound block
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: true,
      ciphers: 'SSLv3',
    },
    connectionTimeout: 15000, // 15 seconds limit
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
}

/* ─────────────────────────────────────────────
   Routes
───────────────────────────────────────────── */

// Root Route
app.get('/', (_, res) => {
  res.send('Portfolio API Running');
});

// Health Check
app.get('/api/health', (_, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date().toISOString(),
  });
});

// Send OTP
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

  console.log(`[OTP] Preparing to send code to ${email}`);

  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Mounish Portfolio" <${MAIL_USER}>`,
      to: email,
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

    console.log(`[OTP] Successfully dispatched code to ${email}`);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    console.error('[OTP ERROR]', err.message);
    return res.status(500).json({
      success: false,
      error: `Mail transmission failed: ${err.message}`,
    });
  }
});

// Verify OTP & Send Message
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
      error: 'No active OTP verification request found',
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({
      success: false,
      error: 'OTP code expired. Please request a new one.',
    });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid OTP code. Please verify and try again.',
    });
  }

  // Clear token record immediately upon successful verification match
  otpStore.delete(key);

  try {
    console.log(`[MESSAGE] OTP Verified. Transmitting feedback from ${email}`);
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Portfolio Contact" <${MAIL_USER}>`,
      to: MAIL_USER,
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

    console.log(`[MESSAGE] Form successfully forwarded to ${MAIL_USER}`);

    return res.json({
      success: true,
      message: 'Message delivered successfully',
    });
  } catch (err) {
    console.error('[MESSAGE EXCHANGE ERROR]', err.message);
    return res.status(500).json({
      success: false,
      error: `Failed to deliver contact form payload: ${err.message}`,
    });
  }
});

/* ─────────────────────────────────────────────
   Start Server & Global Error Handling
───────────────────────────────────────────── */
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Backend operational on port ${PORT}\n`);
});

server.on('error', (err) => {
  console.error('[SERVER CRITICAL ERROR]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION FALLBACK]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION FALLBACK]', reason);
});

const gracefulShutdown = (signal) => {
  console.log(`\n[${signal}] Received. Closing down active port loops gracefully.`);
  server.close(() => {
    console.log('HTTP Server closed safely.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
