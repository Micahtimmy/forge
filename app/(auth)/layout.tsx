export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-surface-01 to-canvas p-12 flex-col justify-between">
        <div>
          <span className="font-display font-bold text-2xl text-iris">
            FORGE
          </span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-display font-bold text-text-primary mb-4">
            AI-powered program intelligence for modern teams
          </h1>
          <p className="text-text-secondary">
            Quality Gate, Signal, and Horizon — three modules that transform how
            you run sprints, communicate with stakeholders, and plan Program
            Increments.
          </p>
        </div>
        <div className="text-sm text-text-tertiary">
          Trusted by engineering teams worldwide
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
