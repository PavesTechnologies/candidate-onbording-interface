"use client";

import { ReactNode, useEffect, useState } from "react";
import OnboardingHeader from "../../components/onboarding/OnboardingHeader";
import { API_CONFIG } from "../../utils/apiConfig";



export default function OnboardingLayout({
  children,
  params,
}: { children: ReactNode ; params: { token: string }; }) {
  const  token  = params.token;

  /**
   * ✅ Initial state is DERIVED, not set in useEffect
   * - null  → verifying
   * - false → token missing or invalid
   * - true  → valid
   */
  const [isValid, setIsValid] = useState<boolean | null>(
    token ? null : false
  );
console.log("OnboardingLayout token:", token);
  useEffect(() => {
    // ⛔ No token → nothing to verify
    if (!token) return;

    let cancelled = false;

    const verifyToken = async () => {
      try {
        const res = await fetch(
          `${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/token-verification/verify_token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw_token: token }),
            cache: "no-store",
          }
        );

        if (!cancelled) {
          setIsValid(res.ok);
        }
      } catch {
        if (!cancelled) {
          setIsValid(false);
        }
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /* ---------- LOADING ---------- */
  if (isValid === null) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        Verifying onboarding link...
      </div>
    );
  }

  /* ---------- INVALID ---------- */
  if (isValid === false) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "red",
          fontSize: 22,
        }}
      >
        Invalid or expired onboarding link
      </div>
    );
  }

  /* ---------- VALID ---------- */
  return (
    <>
      <OnboardingHeader />
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </main>
    </>
  );
}
