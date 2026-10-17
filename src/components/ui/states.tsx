"use client";

import Link from "next/link";
import { LockKeyhole, RefreshCcw, TriangleAlert, WifiOff } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { EmptyState } from "./misc";

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-surface-hover relative block overflow-hidden rounded-md",
        "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r",
        "after:from-transparent after:via-black/5 after:to-transparent",
        "after:[animation:shimmer_1.6s_infinite]",
        className,
      )}
    />
  );
}

/** Placeholder rows that keep the table's column rhythm while data loads. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="px-5 py-3">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="border-line flex items-center gap-4 border-b py-3 last:border-0">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          {Array.from({ length: columns - 1 }, (_, column) => (
            <Skeleton
              key={column}
              className="h-3.5 flex-1"
              /* Vary the widths so it reads as text, not a progress bar. */
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 p-5", className)}>
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * One place that turns an ApiError into something an admin can act on —
 * sign in again, retry, or read the actual message from the backend.
 */
export function ErrorState({
  error,
  onRetry,
  resource = "data",
}: {
  error: ApiError;
  onRetry?: () => void;
  resource?: string;
}) {
  if (error.status === 401) {
    return (
      <EmptyState
        icon={<LockKeyhole className="size-5" />}
        title="Sign in to load live data"
        description="This screen reads from the Next Holder API, which needs a signed-in landlord account."
        action={
          <Link href="/login">
            <Button variant="primary">Go to sign in</Button>
          </Link>
        }
      />
    );
  }

  if (error.status === 403) {
    return (
      <EmptyState
        icon={<LockKeyhole className="size-5" />}
        title="Not permitted"
        description={
          error.message ||
          "The signed-in account cannot see this record. Property endpoints are scoped to the owning landlord."
        }
      />
    );
  }

  const offline = error.status === 0;

  return (
    <EmptyState
      icon={offline ? <WifiOff className="size-5" /> : <TriangleAlert className="size-5" />}
      title={offline ? `Could not reach the API` : `Could not load ${resource}`}
      description={
        offline
          ? "No response from the backend. Check that the Django server is running and that NEXT_PUBLIC_API_BASE_URL points at it."
          : `${error.status}: ${error.message}`
      }
      action={
        onRetry && (
          <Button onClick={onRetry}>
            <RefreshCcw className="size-4" /> Try again
          </Button>
        )
      }
    />
  );
}

/** Small inline banner for a failure that should not replace the whole screen. */
export function InlineError({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className="bg-bad-soft border-bad/25 flex items-start gap-3 rounded-xl border p-3.5">
      <TriangleAlert className="text-bad mt-0.5 size-4 shrink-0" />
      <p className="text-bad min-w-0 flex-1 text-[13px] leading-5">
        {error.status ? `${error.status}: ` : ""}
        {error.message}
      </p>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
