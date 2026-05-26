/**
 * api/server.js
 * Production-ready Express backend for Render (Brevo API Edition)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import * as Brevo from '@getbrevo/brevo';
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
const MAIL_USER = (process.env.MAIL_USER || '').trim(); // Your personal email to receive forms

if (!BREVO_API_KEY) console.error('\n[ERROR] BREVO_API_KEY is missing!\n');
if (!MAIL_USER) console.error('\n[ERROR] MAIL_USER is missing!\n');

// Initialize Brevo API Client
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

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
   OTP Store
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

// Send OTP to ANY user email address
app.post('/api/send-otp', async (req, res) => {
  const { email, name } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpStore.set(email.toLowerCase(), { otp, expiresAt, name });

  console.log(`[OTP] Sending code to visitor: ${email}`);

  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Your OTP Verification Code";
    sendSmtpEmail.sender = { name: "Mounish Portfolio", email: MAIL_USER };
    sendSmtpEmail.to = [{ email: email, name: name }]; // Sends directly to the user's input email
    sendSmtpEmail.htmlContent = `
      <div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;border:1px solid #eee;border-radius:8px;">
        <h2>Email Verification</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your OTP verification code is:</p>
        <h1 style="letter-spacing:5px;color:#c9a227;background:#f9f9f9;padding:10px;text-align:center;">${otp}</h1>
        <p style="color:#666;font-size:12px;">This code expires in 5 minutes.</p>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[OTP] Successfully sent to ${email}`);
    return res.json({ success: true, message: 'OTP sent successfully' });

  } catch (err) {
    console.error('[BREVO OTP ERROR]', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send verification code.' });
  }
});

// Verify OTP & Forward the message to YOUR inbox
app.post('/api/verify-and-send', async (req, res) => {
  const { name, email, message, otp } = req.body || {};

  if (!name || !email || !message || !otp) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  const key = email.toLowerCase();
  const record = otpStore.get(key);

  if (!record || Date.now() > record.expiresAt || record.otp !== otp.toString().trim()) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
  }

  otpStore.delete(key);

  try {
    console.log(`[MESSAGE] OTP Verified. Forwarding message to portfolio owner.`);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Portfolio Message from ${name}`;
    sendSmtpEmail.sender = { name: "Portfolio Contact Form", email: MAIL_USER };
    sendSmtpEmail.to = [{ email: MAIL_USER }]; // Sends the final text directly to you
    sendSmtpEmail.replyTo = { email: email, name: name };
    sendSmtpEmail.htmlContent = `
      <div style="font-family:Arial,sans-serif;padding:20px;">
        <h2>New Portfolio Message</h2>
        <p><strong>Sender:</strong> ${name} (${email})</p>
        <hr />
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[MESSAGE] Successfully delivered to your inbox.`);
    return res.json({ success: true, message: 'Message delivered successfully' });

  } catch (err) {
    console.error('[BREVO DELIVER ERROR]', err.message);
    return res.status(500).json({ success: false, error: 'Failed to forward message.' });
  }
});

const server = app.listen(PORT, () => console.log(`\n🚀 Backend operational via Brevo API on port ${PORT}\n`));
