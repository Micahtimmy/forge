import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to FORGE",
  description: "Set up your workspace and connect your tools",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
