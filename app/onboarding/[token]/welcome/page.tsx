"use client";

import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useRef, useEffect } from "react";

const STEPS = [
  { label: "Personal",   d: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14a6 6 0 0 1 12 0" },
  { label: "Address",    d: "M8 2a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 10.5 3 7a5 5 0 0 1 5-5zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
  { label: "Identity",   d: "M2 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM5 8h2M9 8h2" },
  { label: "Education",  d: "M8 2L2 5.5l6 3.5 6-3.5L8 2zM2 9l6 3.5L14 9M2 12l6 3.5L14 12" },
  { label: "Experience", d: "M3 5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5zM9 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5zM3 11h10" },
  { label: "Bank & PF",  d: "M2 6h12M2 10h12M4 3h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" },
];

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; }

  .wp {
    --n950: #0C0A09; --n800: #292524; --n600: #57534E;
    --n500: #78716C; --n400: #A8A29E; --n300: #C4C0BC;
    --n200: #E7E5E4; --n150: #F0EFED; --n100: #F5F4F3;
    --a700: #1D40AF;  --a600: #1B4ED8;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: fixed; inset: 0;
    display: flex; overflow: hidden;
    background: var(--n100);
  }

  /* ── Left panel ── */
  .wp-l {
    position: relative;
    width: 55%; height: 100%;
    background: var(--n100);
    border-right: 1px solid var(--n200);
    display: flex; flex-direction: column;
    padding: 44px 48px;
    overflow: hidden;
    animation: slideL 420ms cubic-bezier(0,0,0.2,1) both;
  }

  /* ── Dot canvas ── */
  .wp-dots {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 0;
    width: 100%; height: 100%;
  }

  /* ── Left content (above canvas) ── */
  .wp-lc {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    height: 100%;
  }

  /* ── Giant text ── */
  .wp-hero {
    font-size: clamp(60px, 8vw, 88px);
    font-weight: 700;
    line-height: 0.9;
    color: #d8d3c8;
    letter-spacing: -0.05em;
    margin-bottom: 28px;
    user-select: none; pointer-events: none;
    flex-shrink: 0;
  }

  /* ── Step chips ── */
  .wp-chips {
    display: flex; gap: 12px; flex-wrap: wrap;
    margin-top: auto; padding-top: 24px;
  }
  .wp-chip {
    display: flex; flex-direction: column;
    align-items: center; gap: 6px;
    opacity: 0;
    animation: chipIn 350ms cubic-bezier(0,0,0.2,1) both;
  }
  .wp-chip-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: #fff; border: 1px solid var(--n200);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 3px rgba(12,10,9,.07);
  }
  .wp-chip-lbl {
    font-size: 9px; font-weight: 500;
    color: var(--n500); letter-spacing: .06em;
    text-transform: uppercase; white-space: nowrap;
  }

  /* ── Right panel ── */
  .wp-r {
    flex: 1; height: 100%; background: #fff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px;
    animation: slideR 420ms cubic-bezier(0,0,0.2,1) 80ms both;
  }
  .wp-card { width: 100%; max-width: 360px; }

  /* ── Button ── */
  .wp-btn {
    width: 100%; height: 48px;
    background: var(--a600); color: #fff;
    border: none; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 600;
    font-family: inherit; letter-spacing: .01em; cursor: pointer;
    transition: transform 140ms cubic-bezier(.34,1.56,.64,1),
                box-shadow 140ms ease, background 120ms ease;
  }
  .wp-btn:hover   { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,78,216,.3); background: var(--a700); }
  .wp-btn:active  { transform: translateY(0); box-shadow: none; }
  .wp-btn:focus-visible { outline: 2px solid var(--a600); outline-offset: 2px; }

  /* ── Divider ── */
  .wp-div {
    display: flex; align-items: center; gap: 12px;
    margin: 0 0 28px 0;
  }
  .wp-div-line { flex: 1; height: 1px; background: var(--n150); }
  .wp-div-txt  { font-size: 11px; font-weight: 500; color: var(--n300); letter-spacing: .1em; text-transform: uppercase; }

  /* ── Animations ── */
  @keyframes slideL { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideR { from{opacity:0;transform:translateX(20px)}  to{opacity:1;transform:translateX(0)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes chipIn { from{opacity:0;transform:translateY(6px)}   to{opacity:.75;transform:translateY(0)} }

  .wp-a1 { animation: fadeUp 300ms cubic-bezier(0,0,0.2,1) 160ms both; }
  .wp-a2 { animation: fadeUp 300ms cubic-bezier(0,0,0.2,1) 250ms both; }
  .wp-a3 { animation: fadeUp 300ms cubic-bezier(0,0,0.2,1) 340ms both; }
`;

/* ── Dot canvas with hover spotlight ── */
function DotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;

    const mouse = { x: -9999, y: -9999 };
    let rafId = 0;

    const resize = () => {
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const GAP = 24, BASE_R = 1.1, HOVER_R = 3.5, RADIUS = 140;

      ctx.clearRect(0, 0, W, H);

      for (let cx = GAP; cx < W; cx += GAP) {
        for (let cy = GAP; cy < H; cy += GAP) {
          const dx = cx - mouse.x, dy = cy - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          /* gradient mask: dots fade in toward the right edge */
          const edge = Math.min(1, (cx / W) * 1.8);
          let r: number, a: number;
          if (dist < RADIUS) {
            const t = 1 - dist / RADIUS;
            r = BASE_R + (HOVER_R - BASE_R) * t;
            a = (0.1 + 0.6 * t) * edge;
          } else {
            r = BASE_R;
            a = 0.1 * edge;
          }
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100,92,84,${a.toFixed(3)})`;
          ctx.fill();
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="wp-dots" />;
}

/* ── Page ── */
export default function WelcomePage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const handleStart = () => {
    localStorage.setItem(`onboarding-welcome-seen-${token}`, "true");
    router.push(`/onboarding/${token}`);
  };

  return (
    <div className="wp">
      <style>{CSS}</style>

      {/* ── Left Panel ── */}
      <div className="wp-l">
        <DotCanvas />
        <div className="wp-lc">

          {/* Logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", flexShrink: 0 }}>
            <Image
              src="/logo.png" alt="Paves Logo"
              width={44} height={44}
              style={{ objectFit: "contain", borderRadius: "9px", flexShrink: 0 }}
            />
            <span style={{ fontSize: "19px", fontWeight: 600, color: "var(--n800)", letterSpacing: "-0.01em" }}>
              Paves Intranet Portal
            </span>
          </div>

          {/* Giant decorative word */}
          <div className="wp-hero">
            On<br />boarding
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "22px", fontWeight: 700,
            color: "var(--n950)", letterSpacing: "-0.02em",
            lineHeight: 1.3, margin: "0 0 12px 0", flexShrink: 0,
          }}>
            Your onboarding<br />journey starts here
          </h1>

          {/* Description */}
          <p style={{
            fontSize: "14px", fontWeight: 400,
            color: "var(--n500)", lineHeight: 1.7,
            maxWidth: "400px", margin: 0, flexShrink: 0,
          }}>
            Complete your profile, upload required documents, and set up your
            accounts — all in one streamlined flow.
          </p>

          {/* Step chips — pinned to bottom via margin-top: auto */}
          <div className="wp-chips">
            {STEPS.map(({ label, d }, i) => (
              <div key={label} className="wp-chip" style={{ animationDelay: `${340 + i * 50}ms` }}>
                <div className="wp-chip-icon">
                  <svg width={15} height={15} viewBox="0 0 16 16"
                    fill="none" stroke="#57534E" strokeWidth={1.4}
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={d} />
                  </svg>
                </div>
                <span className="wp-chip-lbl">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="wp-r">
        <div className="wp-card">

          {/* Heading */}
          <div className="wp-a1" style={{ marginBottom: "36px" }}>
            <h2 style={{
              fontSize: "28px", fontWeight: 700,
              color: "var(--n950)", letterSpacing: "-0.022em",
              lineHeight: 1.2, margin: "0 0 8px 0",
            }}>
              Welcome to the team!
            </h2>
            <p style={{ fontSize: "14px", fontWeight: 400, color: "var(--n500)", lineHeight: 1.5, margin: 0 }}>
              We&apos;re excited to have you on board. Let&apos;s get your
              profile and documents set up in a few quick steps.
            </p>
          </div>

          {/* Divider */}
          <div className="wp-a2 wp-div">
            <div className="wp-div-line" />
            <span className="wp-div-txt">ready?</span>
            <div className="wp-div-line" />
          </div>

          {/* CTA */}
          <div className="wp-a3">
            <button className="wp-btn" onClick={handleStart}>
              Start Onboarding
            </button>
            <p style={{
              marginTop: "14px", textAlign: "center",
              fontSize: "11px", color: "var(--n300)", lineHeight: 1.6,
            }}>
              This link is unique to you and expires once your onboarding is complete.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
