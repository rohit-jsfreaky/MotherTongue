"use client";

import { createElement, useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

export type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "fade";

/** Reveal on scroll (ported from the studiomode landing): CSS in globals.css under [data-reveal]. */
export function Reveal({
  children,
  as = "div",
  className,
  direction = "up",
  delay = 0,
  duration,
  once = true,
  threshold = 0.15,
  rootMargin = "0px 0px -8% 0px",
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
  style?: CSSProperties;
}) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = node;
    if (!el) return; // reduced-motion users are shown everything by CSS ([data-reveal] override)
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [node, once, threshold, rootMargin]);

  return createElement(
    as,
    {
      ref: setNode,
      "data-reveal": direction,
      className: [visible ? "is-visible" : "", className ?? ""].join(" ").trim(),
      style: { ...style, transitionDelay: delay ? `${delay}ms` : undefined, transitionDuration: duration ? `${duration}ms` : undefined },
    },
    children,
  );
}
