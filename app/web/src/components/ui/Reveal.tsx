"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const SPRING = [0.22, 1, 0.36, 1] as const;

/** Fade up 20px on view — the reference's hero-fade-up, applied as sections enter. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "h2" | "h3" | "p" | "span" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: SPRING, delay }}
    >
      {children}
    </Tag>
  );
}
