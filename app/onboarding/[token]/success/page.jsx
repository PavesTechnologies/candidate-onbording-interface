"use client";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-6 md:p-12">
      {/* Premium Background with wider gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-white pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-200/30 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div className="mb-12 flex justify-center">
          <div className="w-22 h-22 bg-green-50 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-100/50 border border-green-100 rotate-3 hover:rotate-0 transition-transform duration-500">
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-indigo-950 tracking-tight mb-8 leading-[1.1]">
          Onboarding <span className="text-[#1e3a8a]">Successfully</span> <br />
          Complete
        </h1>

        <div className="h-2 w-32 bg-[#1e3a8a] shadow-blue-100 shadow-xl"></div>

        <p className="text-1xl md:text-1xl text-indigo-900/60 font-semibold leading-relaxed max-w-2xl mx-auto">
          We've received all your information. Our team is already reviewing it and will reach out shortly via email.
        </p>

        <div className="mt-24 space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 text-[#1e3a8a] border-blue-100">
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
            Review in Progress
          </div>
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] pt-4">
            You may now close this window safely
          </p>
        </div>
      </div>
    </div>
  );
}

