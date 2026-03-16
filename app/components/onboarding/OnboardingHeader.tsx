"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { steps } from "./steps";

type IdentityDocument = {
  identity_file_number?: string;
  file_path?: string;
  identity_uuid?: string;
};

export default function OnboardingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useParams<{token: string}>();

  // Track max step in ref
  const maxStepRef = useRef(0);

  const currentStepIndex = steps.findIndex((step) =>
    pathname.endsWith(step.path)
  );

  const safeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  // Initialize ref from localStorage
  useEffect(() => {
    if (!token || typeof window === "undefined") return;

    const storageKey = `max-step-${token}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      maxStepRef.current = Math.max(maxStepRef.current, parseInt(stored));
    }
  }, [token]);

  // Update localStorage when moving forward
  useEffect(() => {
    if (!token || safeIndex <= maxStepRef.current) return;

    const storageKey = `max-step-${token}`;
    localStorage.setItem(storageKey, safeIndex.toString());

    maxStepRef.current = safeIndex;
  }, [safeIndex, token]);

  const checkStepCompletion = (index: number): boolean => {
    if (typeof window === "undefined" || !token) return false;
    
    // Preview step is "complete" if all 5 core data steps are complete
    if (steps[index].path === "preview-page") {
       return [0,1,2,3,4,5].every(idx => checkStepCompletion(idx));
    }
    if (steps[index].path === "success") {
       return false;
    }

    let keyPart = steps[index].path;
    if (keyPart === "identity-documents") keyPart = "identity-details";
    
    const storageKey = `${keyPart}-${token}`;
    const data = localStorage.getItem(storageKey);
    if (!data) return false;
    
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed.length > 0;
      if (typeof parsed === "object" && parsed !== null) {
        // Special checks for specific pages to ensure they aren't just empty objects
        if (steps[index].path === "personal-details") {
          return !!(parsed.first_name && parsed.date_of_birth);
        }
        if (steps[index].path === "address-details") {
          // Check if permanent address exists
          return !!(parsed.permanent?.address_line1 && parsed.permanent?.city);
        }
        if (steps[index].path === "identity-documents") {
          return Array.isArray(parsed.documents) && 
                 parsed.documents.length > 0 && 
                 parsed.documents.some((d: IdentityDocument) => d.identity_file_number && (d.file_path || d.identity_uuid));
        }
        if (steps[index].path === "bank-pf-details") {
          return !!(
            parsed.account_holder_name &&
            parsed.bank_name &&
            parsed.account_number &&
            parsed.ifsc_code &&
            parsed.account_type
          );
        }
        return Object.keys(parsed).length > 0;
      }
      return !!parsed;
    } catch {
      return !!data;
    }
  };

  const completedSteps = steps.map((_, index) => checkStepCompletion(index));
  
  // Progress is based on the first 5 core steps
  const coreStepsCount = 6;
  const completedCoreCount = completedSteps.slice(0, coreStepsCount).filter(Boolean).length;
  const progressPercent = Math.round((completedCoreCount / coreStepsCount) * 100);

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 space-y-4">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          
          {/* LEFT: STEP INFO */}
          <div className="text-sm text-gray-700">
            <span className="font-semibold text-indigo-900">
              Step {safeIndex + 1} of {steps.length}
            </span>
            {" · "}
            <span className="text-indigo-600 font-bold uppercase tracking-wider text-xs">
              {steps[safeIndex]?.label}
            </span>
          </div>

          {/* RIGHT: PROGRESS BAR */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-indigo-700">
              {progressPercent}%
            </span>

            <div className="w-[180px] h-3 bg-indigo-50 rounded-full overflow-hidden border border-indigo-100 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* STEPS NAVIGATION */}
        <div className="flex items-center justify-between pt-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps[index];
            const isCurrent = index === safeIndex;
            // A step is reachable if it's completed, current, or the immediate next after the last completed
            const isReachable = isCompleted || isCurrent || (index > 0 && completedSteps[index - 1]) || index === 0;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">

                {/* STEP CIRCLE */}
                <button
                  disabled={!isReachable}
                  onClick={() =>
                    router.push(`/onboarding/${token}/${step.path}`)
                  }
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 shadow-sm
                    ${
                      isCompleted
                        ? "bg-indigo-600 text-white shadow-indigo-200"
                        : isCurrent
                        ? "bg-white border-2 border-indigo-600 text-indigo-600 scale-110 shadow-md"
                        : "bg-indigo-50 text-indigo-300 border border-indigo-100"
                    }
                    ${!isReachable ? "opacity-40 cursor-not-allowed grayscale" : "hover:scale-105 active:scale-95"}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </button>

                {/* LABEL */}
                <span
                  className={`ml-3 text-[10px] font-bold uppercase tracking-widest hidden lg:block transition-colors duration-300
                    ${
                      isCurrent
                        ? "text-indigo-600"
                        : isCompleted
                        ? "text-indigo-900"
                        : "text-indigo-300"
                    }
                  `}
                >
                  {step.label}
                </span>

                {/* CONNECTOR */}
                {index !== steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500
                      ${
                        isCompleted
                          ? "bg-indigo-600"
                          : "bg-indigo-100"
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>

      </div>
    </header>
  );
}
