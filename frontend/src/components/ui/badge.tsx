import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-avalanche-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-avalanche-500 text-white shadow hover:bg-avalanche-600",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
        destructive:
          "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
        outline: "text-zinc-950 dark:text-zinc-50",
        success:
          "border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-600",
        warning:
          "border-transparent bg-amber-500 text-white shadow hover:bg-amber-600",
        info: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        kite: "border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow",
        avalanche:
          "border-transparent bg-gradient-to-r from-avalanche-500 to-avalanche-600 text-white shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
