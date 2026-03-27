"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { steps } from "./steps";

type IdentityDocument = {
  identity_file_number?: string;
  file_path?: string;
  identity_uuid?: string;
};

export default function OnboardingSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useParams<{token: string}>();

  const currentStepIndex = steps.findIndex((step) =>
    pathname.endsWith(step.path)
  );

  const safeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  const checkStepCompletion = (index: number): boolean => {
    if (typeof window === "undefined" || !token) return false;
    
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
        if (steps[index].path === "personal-details") {
          return !!(parsed.first_name && parsed.date_of_birth);
        }
        if (steps[index].path === "address-details") {
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

  return (
    <aside className="w-80 bg-[#1e3a8a] text-white flex flex-col min-h-screen overflow-y-auto">
      <div className="p-8">
        <h2 className="text-xl font-bold mb-8">Onboarding</h2>
        
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isCompleted = completedSteps[index];
            const isCurrent = index === safeIndex;
            const isReachable = isCompleted || isCurrent || (index > 0 && completedSteps[index - 1]) || index === 0;
            
            // Skip the success step in the sidebar list if desired, or keep it. 
            // The mockup doesn't show "Success" in the sidebar usually.
            if (step.path === 'success') return null;

            return (
              <div key={step.id} className="relative flex group">
                {/* Vertical Line */}
                {index !== steps.length - 2 && (
                  <div 
                    className={`absolute left-[17px] top-[36px] bottom-0 w-0.5 
                      ${isCompleted ? 'bg-blue-400' : 'bg-blue-800'}`} 
                  />
                )}
                
                <button
                  disabled={!isReachable}
                  onClick={() => router.push(`/onboarding/${token}/${step.path}`)}
                  className={`flex items-start w-full gap-4 py-4 text-left transition-all
                    ${!isReachable ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-800/50'}
                    ${isCurrent ? 'bg-blue-900/40 rounded-lg -mx-2 px-2' : ''}
                  `}
                >
                  {/* Icon/Circle */}
                  <div className={`relative z-10 w-9 h-9 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isCompleted 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : isCurrent 
                        ? 'bg-white border-white text-blue-900' 
                        : 'border-blue-400 text-blue-400'}
                  `}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">{step.id}</span>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col pt-0.5">
                    <span className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-blue-100'}`}>
                      {step.label}
                    </span>
                    {step.description && (
                      <span className="text-xs text-blue-300 mt-0.5 leading-tight">
                        {step.description}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Logo area */}
      <div className="mt-auto p-8 opacity-50 text-xs">
        <p>© 2026 PeopleStrong</p>
      </div>
    </aside>
  );
}
