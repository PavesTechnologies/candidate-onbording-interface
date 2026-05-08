"use client";

import OnboardingSidebar from "@/app/components/onboarding/OnboardingSidebar";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import { usePathname } from "next/navigation";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWelcomePage = pathname.endsWith("/welcome");
  const isSuccessPage = pathname.endsWith("/success");

  /* Welcome page and OTP/email page both render without the chrome */
  const isFullscreenPage =
    isWelcomePage ||
    isSuccessPage ||
    /\/onboarding\/[^/]+$/.test(pathname); /* matches /onboarding/[token] exactly */

  if (isFullscreenPage) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "#f8fafc",
    }}>
      {/* Sidebar */}
      <OnboardingSidebar />

      {/* Content column */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,  /* prevent flex item from expanding beyond parent */
      }}>
        <OnboardingHeader />

        <main style={{
          flex: 1,
          minHeight: 0,  /* required: lets flex child shrink and own its overflow */
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px 32px 20px",
          background: "#f8fafc",
        }}>
          <div className="ob-content" style={{ maxWidth: "900px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
