export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground">
        <div className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <span className="text-lg font-bold">O</span>
          </div>
          <span className="text-xl font-bold">ODYSSEY</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">
            International Student Service System
          </h1>
          <p className="text-lg text-primary-foreground/80">
            University of Batangas - International Student Services Office
          </p>
          <p className="text-primary-foreground/60">
            Manage your inquiries, appointments, visa documents, and more in one
            centralized platform.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">
          &copy; {new Date().getFullYear()} University of Batangas. All rights
          reserved.
        </p>
      </div>

      {/* Right panel - auth form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
