"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const START = "mt:nav-start";
const STOP = "mt:nav-stop";

/** Starts the top bar from code that navigates without a link click (a server action that redirects, router.push). */
export function startTopLoader() {
  window.dispatchEvent(new Event(START));
}

/** Finishes the bar when such a navigation didn't happen after all (the action failed). */
export function stopTopLoader() {
  window.dispatchEvent(new Event(STOP));
}

/**
 * A thin bar at the top of the window, like YouTube's: it starts the moment a link is clicked and finishes when the
 * new URL renders. Driven straight on the DOM node, so it never re-renders the page.
 */
export function TopLoader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const bar = useRef<HTMLDivElement>(null);
  const state = useRef<{ running: boolean; p: number; tick?: number; safety?: number; hide?: number }>({ running: false, p: 0 });
  const finish = useRef<() => void>(() => {});

  useEffect(() => {
    const el = bar.current!;
    const s = state.current;
    const paint = (p: number, ms: number) => {
      el.style.transition = `transform ${ms}ms ease-out, opacity 300ms ease`;
      el.style.transform = `scaleX(${p})`;
    };
    const start = () => {
      if (s.running) return;
      s.running = true;
      window.clearTimeout(s.hide);
      el.style.transition = "none";
      el.style.transform = "scaleX(0)";
      el.style.opacity = "1";
      s.p = 0.12;
      requestAnimationFrame(() => paint(s.p, 200));
      // creep towards 90% and never get there: the real finish comes from the new URL
      s.tick = window.setInterval(() => {
        s.p += (0.9 - s.p) * 0.09;
        paint(s.p, 200);
      }, 200);
      s.safety = window.setTimeout(done, 15000);
    };
    const done = () => {
      if (!s.running) return;
      s.running = false;
      window.clearInterval(s.tick);
      window.clearTimeout(s.safety);
      paint(1, 180);
      s.hide = window.setTimeout(() => {
        el.style.opacity = "0";
      }, 200);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page or a #hash
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(START, start);
    window.addEventListener(STOP, done);
    finish.current = done;
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START, start);
      window.removeEventListener(STOP, done);
      window.clearInterval(s.tick);
      window.clearTimeout(s.safety);
      window.clearTimeout(s.hide);
    };
  }, []);

  // a new URL has rendered: finish the bar
  useEffect(() => {
    finish.current();
  }, [pathname, search]);

  return (
    <div
      ref={bar}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] origin-left bg-violet opacity-0 shadow-[0_0_10px_rgba(91,65,248,0.7),0_0_4px_rgba(91,65,248,0.5)]"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
