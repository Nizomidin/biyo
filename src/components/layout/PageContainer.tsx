import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
  contentClassName?: string;
}

export function PageContainer({
  children,
  className,
  contentClassName,
  ...props
}: PageContainerProps) {
  return (
    <section
      className={cn(
        "bg-background px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8",
        className
      )}
      {...props}
    >
      <div className={cn("mx-auto w-full max-w-[1400px]", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
