import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-skeleton rounded-md bg-stone-200", className)} />;
}
