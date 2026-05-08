"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { API_CONFIG } from "@/app/utils/apiConfig";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(30);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && token) {
      const welcomeSeen = localStorage.getItem(`onboarding-welcome-seen-${token}`);
      if (welcomeSeen !== "true") router.replace(`/onboarding/${token}/welcome`);
    }
  }, [token, router]);

  useEffect(() => {
    if (step !== 2 || timer <= 0) return;

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = async () => {
    setError("");

    if (!email) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send OTP");

      toast.success("OTP sent successfully");
      setStep(2);
      setTimer(30);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/otp/verifyOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Invalid OTP");

      toast.success("OTP verified successfully");
      setTimeout(() => router.push(`/onboarding/${token}/personal-details`), 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-verify-page">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes otpSpin {
          to { transform: rotate(360deg); }
        }

        .email-verify-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.92)),
            #f4f7fb;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .verify-shell {
          width: 100%;
          max-width: 456px;
        }

        .verify-card {
          animation: fadeUp 400ms cubic-bezier(0,0,0.2,1) both;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 18px 50px rgba(15,23,42,0.10);
        }

        .verify-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
          color: #111827;
          font-size: 13px;
          font-weight: 700;
        }

        .verify-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
        }

        .verify-pill {
          display: inline-flex;
          align-items: center;
          height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .verify-title {
          font-size: 28px;
          font-weight: 750;
          color: #0f172a;
          letter-spacing: 0;
          margin: 0 0 8px;
          line-height: 1.15;
        }

        .verify-copy {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .verify-field {
          margin-top: 28px;
          margin-bottom: 16px;
        }

        .verify-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 7px;
        }

        .verify-email-input {
          width: 100%;
          height: 50px;
          padding: 0 14px;
          border: 1px solid #dbe3ef;
          border-radius: 12px;
          font-size: 14px;
          color: #1e293b;
          background: #ffffff;
          outline: none;
          font-family: inherit;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .verify-email-input:focus,
        .verify-otp-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
        }

        .verify-email-input::placeholder {
          color: #94a3b8;
        }

        .verify-error {
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 16px;
        }

        .verify-button {
          width: 100%;
          height: 50px;
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 140ms cubic-bezier(.34,1.56,.64,1),
            box-shadow 140ms ease, background 120ms ease;
          box-shadow: 0 10px 22px rgba(17,24,39,0.18);
        }

        .verify-button:hover:not(:disabled) {
          background: #1f2937;
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(17,24,39,0.22);
        }

        .verify-button:active:not(:disabled) {
          transform: scale(0.98);
          box-shadow: none;
        }

        .verify-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .verify-spinner {
          animation: otpSpin 600ms linear infinite;
        }

        .verify-policy {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .verify-policy a,
        .verify-resend {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }

        .verify-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          padding: 0 0 16px;
          font-family: inherit;
        }

        .verify-otp-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 28px 0 24px;
        }

        .verify-otp-input {
          width: 48px;
          height: 56px;
          border: 1px solid #dbe3ef;
          border-radius: 12px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          background: #ffffff;
          outline: none;
          font-family: inherit;
          transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
        }

        .verify-otp-input:not(:placeholder-shown) {
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .verify-timer {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #64748b;
        }

        .verify-resend {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        @media (max-width: 520px) {
          .verify-card {
            padding: 24px 18px;
            border-radius: 14px;
          }

          .verify-otp-row {
            gap: 8px;
          }

          .verify-otp-input {
            width: 42px;
            height: 52px;
          }
        }
      `}</style>

      <div className="verify-shell">
        <div className="verify-card">
          <div className="verify-brand">
            <span className="verify-logo">
              <Image
                src="/logo.png"
                alt="Paves"
                width={24}
                height={24}
                style={{ objectFit: "contain", borderRadius: "6px" }}
              />
            </span>
            <span>Paves Onboarding</span>
          </div>

          {step === 1 && (
            <>
              <div>
                <div className="verify-pill">Secure access</div>
                <h2 className="verify-title">Email Verification</h2>
                <p className="verify-copy">
                  Enter your work email to receive a one-time verification code.
                </p>
              </div>

              <div className="verify-field">
                <label className="verify-label">Work Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="verify-email-input"
                />
              </div>

              {error && <div className="verify-error">{error}</div>}

              <button
                className="verify-button"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading && (
                  <svg className="verify-spinner" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? "Sending..." : "Send Verification Code"}
              </button>

              <p className="verify-policy">
                By continuing, you agree to our <a href="#">User Policy</a>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <button className="verify-back" onClick={() => setStep(1)}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3L5 8l5 5" />
                  </svg>
                  Back
                </button>

                <h2 className="verify-title">Check your email</h2>
                <p className="verify-copy">
                  We sent a 6-digit code to <strong style={{ color: "#1e293b" }}>{email}</strong>
                </p>
              </div>

              <div className="verify-otp-row">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    placeholder="."
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="verify-otp-input"
                  />
                ))}
              </div>

              {error && <div className="verify-error">{error}</div>}

              <button
                className="verify-button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length < 6}
              >
                {loading && (
                  <svg className="verify-spinner" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="verify-timer">
                {timer > 0 ? (
                  <span>
                    Resend code in <strong style={{ color: "#2563eb" }}>{timer}s</strong>
                  </span>
                ) : (
                  <button className="verify-resend" onClick={handleSendOtp}>
                    Resend code
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
