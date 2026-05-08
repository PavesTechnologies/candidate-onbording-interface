import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const SPINNER = (
  <svg
    width="14" height="14" viewBox="0 0 14 14" fill="none"
    style={{ animation: "btn-spin 600ms linear infinite", flexShrink: 0 }}
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const BUTTON_CSS = `
  @keyframes btn-spin { to { transform: rotate(360deg); } }

  .ob-btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 7px; border: none; border-radius: 10px;
    font-weight: 600; font-family: inherit; cursor: pointer;
    transition: transform 140ms cubic-bezier(.34,1.56,.64,1),
                box-shadow 140ms ease, opacity 120ms ease,
                background 120ms ease;
    position: relative; white-space: nowrap;
  }
  .ob-btn:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
  .ob-btn:active:not(:disabled) { transform: scale(0.97) !important; }
  .ob-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  /* sizes */
  .ob-btn-sm { padding: 7px 14px; font-size: 12px; border-radius: 8px; }
  .ob-btn-md { padding: 10px 20px; font-size: 13.5px; }
  .ob-btn-lg { padding: 13px 28px; font-size: 14.5px; border-radius: 12px; }

  /* primary */
  .ob-btn-primary {
    background: #6366f1; color: #fff;
    box-shadow: 0 1px 3px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.2);
  }
  .ob-btn-primary:hover:not(:disabled) {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.4);
  }

  /* secondary */
  .ob-btn-secondary {
    background: #f8fafc; color: #374151;
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .ob-btn-secondary:hover:not(:disabled) {
    background: #f1f5f9;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
  }

  /* danger */
  .ob-btn-danger {
    background: #ef4444; color: #fff;
    box-shadow: 0 1px 3px rgba(239,68,68,0.3);
  }
  .ob-btn-danger:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(239,68,68,0.35);
  }

  /* success */
  .ob-btn-success {
    background: #10b981; color: #fff;
    box-shadow: 0 1px 3px rgba(16,185,129,0.3);
  }
  .ob-btn-success:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(16,185,129,0.35);
  }
`;

let cssInjected = false;

function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = BUTTON_CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps & { className?: string }) {
  if (typeof document !== "undefined") injectCSS();

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "ob-btn",
        `ob-btn-${size}`,
        `ob-btn-${variant}`,
        className,
      ].join(" ")}
    >
      {loading && SPINNER}
      {loading ? "Please wait…" : children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function LinkButton({ href, children, className = "" }: LinkButtonProps) {
  return (
    <a
      href={href}
      className={`text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors duration-200 hover:underline underline-offset-2 ${className}`}
    >
      {children}
    </a>
  );
}
