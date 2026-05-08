"use client";

import Image from "next/image";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#eef3f8] flex flex-col overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

      <section className="relative flex flex-1 items-center justify-center px-5 py-10">
        <Image
          src="/logo.png"
          alt=""
          width={720}
          height={720}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[360px] -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.08] sm:w-[520px] md:w-[680px]"
        />
        <div className="relative z-10 w-full max-w-4xl px-2 py-10 md:px-8 md:py-12">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Submission received
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Onboarding successfully completed
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">
              We&apos;ve received all your information. Our team will review your submission and contact you by email if anything else is needed.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-4 py-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Submitted</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Next Step</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">HR Review</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Action</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">No Pending Task</p>
            </div>
          </div>

          <div className="mt-9 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Review in progress
            </div>
          </div>

          <p className="mt-7 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            You may now close this window safely
          </p>
        </div>
      </section>
    </main>
  );
}

