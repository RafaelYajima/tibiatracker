import type { ReactNode } from "react";

/**
 * Layout exclusivo para /login e /register.
 * Tela escura cheia com centralização perfeita — sem sidebar.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Grade decorativa de fundo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#d4a843 1px, transparent 1px), linear-gradient(90deg, #d4a843 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Brilho dourado central */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_60%,rgba(212,168,67,0.10),transparent)]" />
      <div className="relative w-full">{children}</div>
    </div>
  );
}
