"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ApiError, tokenStore } from "@/lib/api/client";
import { signIn } from "@/lib/api/resources";
import type { SignInResponse } from "@/lib/api/types";

export const SESSION_USER_KEY = "nh.user";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // The backend's identifier field takes either an email or a phone number.
      const session: SignInResponse = await signIn(identifier.trim(), password);
      tokenStore.set(session.access, session.refresh);
      try {
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user));
      } catch {
        /* storage can be blocked; the token in memory still authenticates */
      }
      router.push("/properties");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.status === 0
            ? "Could not reach the API. Check that the Django server is running."
            : caught.message
          : "Sign in failed.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm" style={{ animation: "fade-up 260ms ease-out" }}>
          <span className="bg-brand grid size-10 place-items-center rounded-xl text-white">
            <Building2 className="size-5" />
          </span>
          <h1 className="text-ink mt-6 text-[22px] font-semibold tracking-[-0.01em]">
            Sign in to Next Holder
          </h1>
          <p className="text-ink-muted mt-1.5 text-sm">
            Admin console for properties, tenancies, bookings and payments.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email or phone number">
              <Input
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@nextholder.app"
              />
            </Field>

            <div>
              <Field label="Password">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="focus-ring text-ink-subtle hover:text-ink absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="text-brand-ink focus-ring rounded text-[13px] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-bad-soft border-bad/25 flex items-start gap-2.5 rounded-xl border p-3"
              >
                <TriangleAlert className="text-bad mt-0.5 size-4 shrink-0" />
                <p className="text-bad text-[13px] leading-5">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={busy}
              className="w-full justify-center"
            >
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-ink-subtle mt-8 text-xs leading-5">
            Property screens read live data and need a landlord account. Sessions use JWT access
            tokens valid for 60 minutes, refreshed automatically.
          </p>
        </div>
      </div>

      <div className="bg-brand relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-md">
            <p className="text-2xl leading-9 font-medium tracking-[-0.01em]">
              One console for the whole portfolio — listings, tenancies, bookings, rent collection
              and the people behind them.
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
