import { useState, useRef, useEffect } from "react";
import "./connect.css";
import { IconMail, IconMapPin, IconStatus, IconSend, IconKey } from "./Icons";

const socials = [
  {
    name: 'GitHub',
    href: 'https://github.com/mounishver-dev',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
    color: '#a0a0b8',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mounishver-s-85911b381/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: '#4f7cac',
  },
];

// Step: 'idle' | 'sending_otp' | 'otp_sent' | 'verifying' | 'success' | 'error'
export default function Connect() {
  const [form,    setForm]    = useState({ name: '', email: '', message: '' });
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const [focused, setFocused] = useState(null);
  const sectionRef = useRef(null);
  const cardRef    = useRef(null);
  const otpRef     = useRef(null);

  // Animate card in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cardRef.current)
          cardRef.current.classList.add('visible');
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Focus OTP input when modal appears
  useEffect(() => {
    if (step === 'otp_sent' && otpRef.current)
      setTimeout(() => otpRef.current?.focus(), 120);
  }, [step]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Step 1 — request OTP
  async function handleRequestOtp(e) {
    e.preventDefault();
    setStep('sending_otp');
    setErrMsg('');
    try {
      const res  = await fetch('/api/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: form.email, name: form.name }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('otp_sent');
      } else {
        setErrMsg(data.error || 'Could not send OTP. Please try again.');
        setStep('idle');
      }
    } catch {
      setErrMsg('Server is unreachable. Make sure the backend is running.');
      setStep('idle');
    }
  }

  // Step 2 — verify OTP and send message
  async function handleVerify(e) {
    e.preventDefault();
    if (otp.trim().length !== 6) { setErrMsg('Enter the 6-digit code sent to your email.'); return; }
    setStep('verifying');
    setErrMsg('');
    try {
      const res  = await fetch('/api/verify-and-send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
        setForm({ name: '', email: '', message: '' });
        setOtp('');
      } else {
        setErrMsg(data.error || 'Incorrect OTP. Please try again.');
        setStep('otp_sent');
      }
    } catch {
      setErrMsg('Server error. Please try again.');
      setStep('otp_sent');
    }
  }

  function handleResend() {
    setOtp('');
    setErrMsg('');
    setStep('idle');
  }

  const isLoading = step === 'sending_otp' || step === 'verifying';

  return (
    <section className="connect-section" id="connect" ref={sectionRef}>
      {/* Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Header */}
      <div className="connect-header">
        <p className="section-label">Let's Connect</p>
        <h1 className="connect-main-title">Let's Build<br />Something Great</h1>
        <p className="connect-intro">
          Available for freelance, full-time, or creative collaborations.
          Drop a message — I respond within 24 hours.
        </p>
      </div>

      {/* Card */}
      <div className="connect-card" ref={cardRef}>
        {/* Left — contact info */}
        <div className="contact-info">
          <div className="info-block">
            <span className="info-icon-svg"><IconMail size={20} color="var(--color-gold)" /></span>
            <div>
              <span className="info-label">Email</span>
              <a href="mailto:mounishver.s@gmail.com" className="info-value">
                mounishver.s@gmail.com
              </a>
            </div>
          </div>

          <div className="info-block">
            <span className="info-icon-svg"><IconMapPin size={20} color="var(--color-slate)" /></span>
            <div>
              <span className="info-label">Based in</span>
              <span className="info-value">India</span>
            </div>
          </div>

          <div className="info-block">
            <span className="info-icon-svg"><IconStatus size={20} color="var(--color-green)" /></span>
            <div>
              <span className="info-label">Status</span>
              <span className="info-value available">Available for work</span>
            </div>
          </div>

          <div className="socials-row">
            {socials.map(s => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                style={{ '--social-color': s.color }}
                aria-label={s.name}
              >
                <span className="social-icon">{s.icon}</span>
                <span>{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="connect-divider" />

        {/* Right — form */}
        {step === 'success' ? (
          <div className="success-state">
            <div className="success-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>Message Sent!</h3>
            <p>Thanks for reaching out. I'll get back to you within 24 hours.</p>
            <button className="btn-send" onClick={() => setStep('idle')} style={{ marginTop: '1rem' }}>
              <span className="btn-send-text">Send Another</span>
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={step === 'otp_sent' ? handleVerify : handleRequestOtp}>
            {/* Name + Email — hide during OTP step */}
            {step !== 'otp_sent' && step !== 'verifying' && (
              <>
                {[
                  { name: 'name',    type: 'text',  placeholder: 'Your Name'    },
                  { name: 'email',   type: 'email', placeholder: 'Your Email'   },
                ].map(field => (
                  <div
                    key={field.name}
                    className={`input-wrapper ${focused === field.name ? 'focused' : ''}`}
                  >
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={form[field.name]}
                      onChange={handleChange}
                      onFocus={() => setFocused(field.name)}
                      onBlur={() => setFocused(null)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                ))}

                <div className={`input-wrapper ${focused === 'message' ? 'focused' : ''}`}>
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    rows="4"
                    value={form.message}
                    onChange={handleChange}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {/* OTP step */}
            {(step === 'otp_sent' || step === 'verifying') && (
              <div className="otp-box">
                <div className="otp-box-header">
                  <IconKey size={18} color="var(--color-gold)" />
                  <span>A 6-digit code was sent to <strong>{form.email}</strong></span>
                </div>
                <div className={`input-wrapper ${focused === 'otp' ? 'focused' : ''}`}>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onFocus={() => setFocused('otp')}
                    onBlur={() => setFocused(null)}
                    className="otp-input"
                    required
                    disabled={step === 'verifying'}
                  />
                </div>
                <button
                  type="button"
                  className="btn-resend"
                  onClick={handleResend}
                  disabled={step === 'verifying'}
                >
                  Wrong email? Go back
                </button>
              </div>
            )}

            {/* Error */}
            {errMsg && <p className="form-error">{errMsg}</p>}

            <button
              className="btn-send"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-send-text">
                  {step === 'sending_otp' ? 'Sending code...' : 'Verifying...'}
                </span>
              ) : step === 'otp_sent' ? (
                <>
                  <span className="btn-send-text">Verify & Send</span>
                  <span className="btn-send-icon"><IconKey size={16} color="currentColor" /></span>
                </>
              ) : (
                <>
                  <span className="btn-send-text">Send Message</span>
                  <span className="btn-send-icon"><IconSend size={16} color="currentColor" /></span>
                </>
              )}
              <div className="btn-shimmer" />
            </button>
          </form>
        )}
      </div>

      <div className="connect-footer">
        <p>Designed &amp; Built by <span>Mounishver S</span> · 2026</p>
      </div>
    </section>
  );
}
