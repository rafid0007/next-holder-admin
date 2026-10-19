"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { NoAdminAccess } from "@/components/layout/permission-gate";
import { AdminSessionProvider, useAdminSession } from "@/lib/api/admin-session";
import { tokenStore } from "@/lib/api/client";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <Shell>{children}</Shell>
    </AdminSessionProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, me, forbidden, unauthenticated } = useAdminSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function signOut() {
    tokenStore.clear();
    router.push("/login");
  }

  // `/admin/me` is the gate: 401 means no session, 403 means not an admin.
  if (ready && unauthenticated) {
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <SignInPrompt onGo={() => router.push("/login")} />
      </div>
    );
  }
  if (ready && !me && forbidden) return <NoAdminAccess onSignOut={signOut} />;

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenMobileNav={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main
          className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8"
          style={{ animation: "fade-up 240ms ease-out" }}
        >
          {children}
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function SignInPrompt({ onGo }: { onGo: () => void }) {
  return (
    <div className="text-center">
      <p className="text-ink text-[15px] font-semibold">Sign in to continue</p>
      <p className="text-ink-muted mt-1 text-[13px]">
        The admin console needs a signed-in staff account.
      </p>
      <button
        type="button"
        onClick={onGo}
        className="bg-brand focus-ring mt-4 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
      >
        Go to sign in
      </button>
    </div>
  );
}
