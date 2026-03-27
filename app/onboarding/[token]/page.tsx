"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";

export default function Page() {
  /* ---------------- ROUTER ---------------- */
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  /* ---------------- STATE ---------------- */
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(30);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  /* ---------------- OTP TIMER ---------------- */
  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, timer]);

  /* ---------------- SEND OTP ---------------- */
  const handleSendOtp = async () => {
    setError("");

    if (!email) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/otp/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send OTP");
      }
      console.log("OTP sent to email:", data);
      toast.success("OTP sent successfully");
      
      setStep(2);
      setTimer(30);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- OTP INPUT ---------------- */
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = async () => {
    setError("");
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/otp/verifyOtp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpValue }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Invalid OTP");
      }

      toast.success("OTP verified successfully");

      // ✅ Redirect to next onboarding step
      setTimeout(() => {
        router.push(`/onboarding/${token}/personal-details`);
      }, 1000);

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-center mb-2">
          Email Verification
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Verify your email to continue onboarding
        </p>

        {/* -------- STEP 1: EMAIL -------- */}
        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />

            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full mt-4 bg-[#1e3a8a] hover:bg-blue-800 transition-colors"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* -------- STEP 2: OTP -------- */}
        {step === 2 && (
          <>
            <div className="flex justify-between gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, index)
                  }
                  className="w-10 h-12 border text-center text-lg rounded-lg"
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center mb-2">
                {error}
              </p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-[#1e3a8a] text-white py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="text-center mt-4 text-sm text-gray-600">
              {timer > 0 ? (
                <>Resend OTP in {timer}s</>
              ) : (
                <button
                  onClick={handleSendOtp}
                  className="text-[#1e3a8a] hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
