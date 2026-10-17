import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "lime" | "ink" | "white" | "ghost" | "ghostLime" | "outline" | "violet";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-semibold leading-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(.22,1,.36,1)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  lime: "bg-lime text-ink shadow-[var(--shadow-lime)] hover:bg-[#c4f00a]",
  ink: "bg-ink text-white shadow-soft hover:bg-ink-2",
  white: "bg-white text-ink-3 shadow-soft hover:bg-soft",
  ghost: "bg-transparent text-fg hover:bg-soft",
  ghostLime: "border border-lime/10 bg-lime/5 font-normal text-lime hover:bg-lime/10",
  outline: "border border-line-2 bg-white text-fg hover:bg-soft",
  violet: "bg-violet text-white shadow-cta hover:bg-violet-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClass(variant: Variant = "ink", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "ink",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "ink",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
