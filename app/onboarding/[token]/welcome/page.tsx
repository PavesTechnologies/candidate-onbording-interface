"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/onboarding/ButtonComponents";

/* ===================== ICONS ===================== */

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconMapPin = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconFileCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconGraduationCap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const IconBriefcase = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconCreditCard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconClock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconShieldCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconSave = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const IconChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const IconHeadphones = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 10V7a6 6 0 10-12 0v3m12 0a3 3 0 01-3 3H9a3 3 0 01-3-3m12 0v5a3 3 0 01-3 3H9a3 3 0 01-3-3v-5" />
  </svg>
);

export default function WelcomePage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if welcome already seen
    const welcomeSeen = localStorage.getItem(`onboarding-welcome-seen-${token}`);
    if (welcomeSeen === "true") {
      router.replace(`/onboarding/${token}`);
    }
  }, [token, router]);

  if (!mounted) return null;

  const handleStart = () => {
    localStorage.setItem(`onboarding-welcome-seen-${token}`, "true");
    router.push(`/onboarding/${token}`);
  };

  const steps = [
    { icon: <IconUser />, label: "Personal Details" },
    { icon: <IconMapPin />, label: "Residential Address" },
    { icon: <IconFileCheck />, label: "Identity Verification" },
    { icon: <IconGraduationCap />, label: "Educational Background" },
    { icon: <IconBriefcase />, label: "Work Experience" },
    { icon: <IconCreditCard />, label: "Bank & PF Details" },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-700">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Column: Hero & Steps */}
          <div className="flex-1 p-8 md:p-12 bg-gradient-to-br from-white to-blue-50/30">
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-[#1e3a8a] mb-4 tracking-tight leading-tight">
                Welcome to the Team!
              </h1>
              <p className="text-lg text-blue-900/70 font-medium leading-relaxed">
                We're excited to have you on board. Let's get your onboarding started with a few quick steps to set up your profile and documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="bg-blue-50 text-[#1e3a8a] p-2 rounded-lg">
                    {step.icon}
                  </div>
                  <span className="text-sm font-semibold text-blue-900">{step.label}</span>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={handleStart}
              className="w-full sm:w-auto px-10 py-4 text-lg font-bold group shadow-lg shadow-blue-500/20"
            >
              <span className="flex items-center gap-2">
                Start Onboarding
                <IconChevronRight />
              </span>
            </Button>
          </div>

          {/* Right Column: Key Info Cards */}
          <div className="w-full md:w-80 bg-[#1e3a8a] p-8 md:p-10 text-white flex flex-col justify-between">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-1">
                  <IconClock />
                  <h3 className="font-bold text-blue-100 uppercase tracking-widest text-xs">Estimated Time</h3>
                </div>
                <p className="text-xl font-bold">10 – 15 Minutes</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-1">
                  <IconSave />
                  <h3 className="font-bold text-blue-100 uppercase tracking-widest text-xs">Progress Saved</h3>
                </div>
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  Your information is saved automatically as you complete each section. You can return at any time.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-1">
                  <IconShieldCheck />
                  <h3 className="font-bold text-blue-100 uppercase tracking-widest text-xs">Data Privacy</h3>
                </div>
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  Your data is encrypted and securely stored. Information is used strictly for official onboarding purposes.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <IconHeadphones />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Need Help?</span>
              </div>
              <p className="text-xs text-blue-200/60 leading-relaxed">
                If you encounter any issues, please contact your HR representative or reach out to our support team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
