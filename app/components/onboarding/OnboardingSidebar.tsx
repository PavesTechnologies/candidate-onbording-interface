"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { steps } from "./steps";
import { getCompletedSteps } from "./onboardingCompletion";

export default function OnboardingSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    () => steps.map(() => false)
  );

  const currentStepIndex = steps.findIndex((step) =>
    pathname.endsWith(step.path)
  );
  const safeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  /* ── All existing completion logic preserved exactly ── */
  useEffect(() => {
    Promise.resolve().then(() => {
      setCompletedSteps(token ? getCompletedSteps(token) : steps.map(() => false));
    });
  }, [pathname, token]);

  const visibleSteps = steps.filter((s) => s.path !== "success");
  const completedCount = completedSteps.slice(0, 6).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 6) * 100);

  return (
    <aside
      style={{
        width: "304px",
        minWidth: "304px",
        height: "100vh",
        background: "linear-gradient(180deg, #081028 0%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* ── Brand ── */}
      <div style={{
        padding: "24px 22px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "11px",
          marginBottom: "20px",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Image
              src="/logo.png"
              alt="Paves"
              width={22}
              height={22}
              style={{ objectFit: "contain", borderRadius: "4px" }}
            />
          </div>
          <div>
            <div style={{
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#f1f5f9",
              letterSpacing: "-0.015em",
              lineHeight: 1.3,
            }}>
              Paves Onboarding
            </div>
            <div style={{
              fontSize: "10.5px",
              color: "#94A3B8",
              marginTop: "1px",
              letterSpacing: "0.01em",
            }}>
              Employee Portal
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}>
            <span style={{
              fontSize: "10px",
              color: "#94A3B8",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}>
              Progress
            </span>
            <span style={{ fontSize: "11px", color: "#818cf8", fontWeight: 700 }}>
              {completedCount}<span style={{ color: "#475569", fontWeight: 400 }}>/6</span>
            </span>
          </div>
          <div style={{
            height: "3px",
            borderRadius: "99px",
            background: "rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #6366f1, #818cf8)",
              borderRadius: "99px",
              transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>
      </div>

      {/* ── Steps ── */}
      <nav style={{ flex: 1, padding: "16px 12px 8px" }}>
        {visibleSteps.map((step, index) => {
          const isCompleted = completedSteps[index];
          const isCurrent = index === safeIndex;
          const isReachable =
            isCompleted || isCurrent || (index > 0 && completedSteps[index - 1]) || index === 0;
          const isLast = index === visibleSteps.length - 1;

          /* ── Design-spec color tokens ── */
          const labelColor = isCurrent
            ? "#FFFFFF"
            : isCompleted
            ? "#E2E8F0"
            : "#CBD5E1";

          const descColor = isCurrent
            ? "#C7D2FE"
            : "#94A3B8";

          const indicatorBg = isCompleted || isCurrent
            ? "#6366F1"
            : "rgba(255,255,255,0.04)";

          const indicatorBorder = isCompleted || isCurrent
            ? "2px solid #6366F1"
            : "1.5px solid #475569";

          const indicatorColor = isCompleted || isCurrent
            ? "#FFFFFF"
            : "#CBD5E1";

          return (
            <div key={step.id} style={{ position: "relative" }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: "absolute",
                  left: "29px",
                  top: "44px",
                  width: "1px",
                  height: "calc(100% - 20px)",
                  background: isCompleted
                    ? "#6366F1"
                    : "rgba(148,163,184,0.18)",
                  transition: "background 400ms ease",
                  zIndex: 0,
                }} />
              )}

              <button
                disabled={!isReachable}
                onClick={() => router.push(`/onboarding/${token}/${step.path}`)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  width: "100%",
                  padding: "10px 10px",
                  borderRadius: "10px",
                  border: "none",
                  background: isCurrent ? "rgba(99,102,241,0.18)" : "transparent",
                  boxShadow: isCurrent ? "inset 2.5px 0 0 #6366f1" : "none",
                  cursor: isReachable ? "pointer" : "not-allowed",
                  opacity: isReachable ? 1 : 0.3,
                  transition: "background 200ms ease, box-shadow 200ms ease",
                  textAlign: "left",
                  position: "relative",
                  zIndex: 1,
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (isReachable && !isCurrent)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(99,102,241,0.12)";
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent)
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {/* Step indicator circle */}
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: indicatorBg,
                  border: indicatorBorder,
                  color: indicatorColor,
                  transition: "all 300ms ease",
                }}>
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                {/* Label + description */}
                <div style={{ paddingTop: "2px", flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "12.5px",
                    fontWeight: isCurrent ? 600 : isCompleted ? 500 : 500,
                    color: labelColor,
                    lineHeight: 1.4,
                    transition: "color 200ms ease",
                    wordBreak: "break-word",
                  }}>
                    {step.label}
                  </div>
                  {step.description && (
                    <div style={{
                      fontSize: "10.5px",
                      color: descColor,
                      marginTop: "3px",
                      lineHeight: 1.5,
                    }}>
                      {step.description}
                    </div>
                  )}
                </div>

                {/* Active indicator dot */}
                {isCurrent && (
                  <div style={{
                    marginLeft: "auto",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#818cf8",
                    flexShrink: 0,
                    alignSelf: "center",
                  }} />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: "16px 22px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        fontSize: "10px",
        color: "#475569",
      }}>
        © 2026 Paves Technologies
      </div>
    </aside>
  );
}
