import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        xp: "border-primary/30 bg-primary/10 text-primary font-mono",
        level: "border-accent/30 bg-accent/10 text-accent font-bold",
        bronze: "border-[hsl(30_80%_50%/0.3)] bg-[hsl(30_80%_50%/0.1)] text-[hsl(30_80%_50%)]",
        silver: "border-[hsl(220_10%_70%/0.3)] bg-[hsl(220_10%_70%/0.1)] text-[hsl(220_10%_70%)]",
        gold: "border-[hsl(45_90%_55%/0.3)] bg-[hsl(45_90%_55%/0.1)] text-[hsl(45_90%_55%)]",
        platinum: "border-[hsl(200_30%_75%/0.3)] bg-[hsl(200_30%_75%/0.1)] text-[hsl(200_30%_75%)]",
        diamond: "border-[hsl(195_100%_70%/0.3)] bg-[hsl(195_100%_70%/0.1)] text-[hsl(195_100%_70%)]",
        new: "border-transparent bg-gradient-to-r from-primary to-accent text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
