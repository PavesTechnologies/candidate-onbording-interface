import OnboardingSidebar from "@/app/components/onboarding/OnboardingSidebar";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 flex-row overflow-hidden">
      {/* Sidebar Stepper */}
      <OnboardingSidebar />

      {/* Dynamic Page Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
