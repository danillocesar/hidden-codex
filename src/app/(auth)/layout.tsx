export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-bg-deep">
      <span
        aria-hidden
        className="pointer-events-none fixed left-[-2vw] top-[10vh] select-none font-jp text-[28vw] font-bold leading-none text-ice opacity-[0.025]"
      >
        雪
      </span>
      {children}
    </div>
  );
}
