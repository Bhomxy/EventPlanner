import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "interactive inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand)] text-white shadow-[0_1px_2px_rgb(var(--shadow-color)/0.08),0_4px_12px_-2px_color-mix(in_oklab,var(--brand)_35%,transparent)] hover:bg-[var(--brand-hover)] hover:-translate-y-px hover:shadow-[0_2px_4px_rgb(var(--shadow-color)/0.1),0_8px_20px_-4px_color-mix(in_oklab,var(--brand)_40%,transparent)]",
        secondary:
          "bg-stone-100 text-stone-900 hover:bg-stone-200/90 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700",
        outline:
          "border border-[var(--border)] bg-transparent hover:border-[color-mix(in_oklab,var(--brand)_25%,var(--border))] hover:bg-[var(--brand-muted)]/40 dark:hover:bg-[var(--brand-muted)]/20",
        ghost:
          "hover:bg-stone-100/80 dark:hover:bg-stone-800/80",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:-translate-y-px",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[var(--radius-sm)] px-3 text-xs",
        lg: "h-11 rounded-[var(--radius-md)] px-6 text-[0.9375rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
