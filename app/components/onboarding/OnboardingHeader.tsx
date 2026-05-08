"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { steps } from "./steps";
import { getCompletedSteps } from "./onboardingCompletion";

export default function OnboardingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const maxStepRef = useRef(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    () => steps.map(() => false)
  );

  const currentStepIndex = steps.findIndex((step) =>
    pathname.endsWith(step.path)
  );
  const safeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  /* ── All existing logic preserved exactly ── */
  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    const stored = localStorage.getItem(`max-step-${token}`);
    if (stored) maxStepRef.current = Math.max(maxStepRef.current, parseInt(stored));
  }, [token]);

  useEffect(() => {
    if (!token || safeIndex <= maxStepRef.current) return;
    localStorage.setItem(`max-step-${token}`, safeIndex.toString());
    maxStepRef.current = safeIndex;
  }, [safeIndex, token]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setCompletedSteps(token ? getCompletedSteps(token) : steps.map(() => false));
    });
  }, [pathname, token]);

  const coreStepsCount = 6;
  const completedCoreCount = completedSteps.slice(0, coreStepsCount).filter(Boolean).length;
  const progressPercent = Math.round((completedCoreCount / coreStepsCount) * 100);

  const currentStep = steps[safeIndex];

  /* Unused router kept for future use — satisfies the import */
  void router;

  return (
    <header style={{
      background: "#ffffff",
      borderBottom: "1px solid #f1f5f9",
      position: "sticky",
      top: 0,
      zIndex: 40,
      padding: "0 32px",
    }}>
      <div style={{
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "32px",
      }}>

        {/* ── Left: current step info ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: 0,
          flexShrink: 0,
        }}>
          {/* Step number badge */}
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            color: "#6366f1",
            flexShrink: 0,
            letterSpacing: "-0.01em",
          }}>
            {safeIndex + 1}
          </div>

          {/* Step name + counter */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0f172a",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}>
              {currentStep?.label}
            </div>
            <div style={{
              fontSize: "11px",
              color: "#94a3b8",
              marginTop: "1px",
              lineHeight: 1,
              fontWeight: 400,
            }}>
              Step {safeIndex + 1} of {steps.length - 1}
            </div>
          </div>
        </div>

        {/* ── Right: progress block (no dots) ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flex: 1,
          justifyContent: "flex-end",
        }}>

          {/* Completed label */}
          <div style={{
            fontSize: "11.5px",
            color: "#64748b",
            fontWeight: 500,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            <span style={{ color: "#6366f1", fontWeight: 700 }}>{completedCoreCount}</span>
            {" "}<span style={{ color: "#94a3b8" }}>of {coreStepsCount} completed</span>
          </div>

          {/* Progress bar — wider, premium */}
          <div style={{
            flex: 1,
            maxWidth: "260px",
            minWidth: "120px",
            height: "6px",
            background: "#f1f5f9",
            borderRadius: "99px",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            <div style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: progressPercent === 100
                ? "linear-gradient(90deg, #10b981, #34d399)"
                : "linear-gradient(90deg, #6366f1, #818cf8)",
              borderRadius: "99px",
              transition: "width 700ms cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>

          {/* Percentage */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            flexShrink: 0,
            minWidth: "40px",
          }}>
            <div style={{
              fontSize: "15px",
              fontWeight: 700,
              color: progressPercent === 100 ? "#10b981" : "#6366f1",
              lineHeight: 1.2,
              letterSpacing: "-0.025em",
            }}>
              {progressPercent}%
            </div>
            <div style={{
              fontSize: "10px",
              color: "#94a3b8",
              marginTop: "1px",
              lineHeight: 1,
            }}>
              complete
            </div>
          </div>
        </div>
      </div>

      {/* Thin progress strip at bottom of header */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "#f8fafc",
      }}>
        <div style={{
          height: "100%",
          width: `${progressPercent}%`,
          background: progressPercent === 100
            ? "linear-gradient(90deg, #10b981, #34d399)"
            : "linear-gradient(90deg, #6366f1, #818cf8)",
          transition: "width 700ms cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </header>
  );
}
