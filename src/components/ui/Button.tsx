import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink hover:bg-brand/90 shadow-[0_8px_30px_-12px_hsl(var(--brand)/0.8)] active:translate-y-px",
  secondary:
    "bg-surface-2 text-ink border border-border hover:border-brand/60 hover:bg-surface-2/70 active:translate-y-px",
  ghost: "text-muted hover:text-ink hover:bg-surface-2/60",
  danger:
    "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25 active:translate-y-px",
  success:
    "bg-success/15 text-success border border-success/40 hover:bg-success/25 active:translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-lg gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
