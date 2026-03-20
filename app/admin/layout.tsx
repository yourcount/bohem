export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#111a2a_0%,#162235_44%,#1d2333_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 14% 12%, rgba(242,139,14,0.24) 0%, transparent 34%), radial-gradient(circle at 84% 18%, rgba(67,135,133,0.18) 0%, transparent 36%)"
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
