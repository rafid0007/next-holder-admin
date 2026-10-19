"use client";

import { createContext, useCallback, useContext } from "react";
import { useApi, type QueryState } from "./hooks";
import { getAdminMe } from "./admin";
import type { AdminMe, PermissionCode } from "./admin-types";

interface AdminSession {
  me: AdminMe | null;
  /** True once `/admin/me` has answered, either way. */
  ready: boolean;
  /** Signed in but not an admin — `/admin/me` returned 403. */
  forbidden: boolean;
  /** Not signed in at all. */
  unauthenticated: boolean;
  can: (...codes: PermissionCode[]) => boolean;
  canAny: (...codes: PermissionCode[]) => boolean;
  refetch: () => void;
}

const Context = createContext<AdminSession | null>(null);

/**
 * Loads `/admin/me` once for the whole console and exposes the permission
 * checks every screen gates on. A superuser holds every code, so `can` short
 * circuits for them rather than relying on the list containing `*`.
 */
export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const query: QueryState<AdminMe> = useApi(useCallback(() => getAdminMe(), []));

  const me = query.data;
  const status = query.error?.status;

  const can = useCallback(
    (...codes: PermissionCode[]) => {
      if (!me) return false;
      if (me.isSuperuser) return true;
      return codes.every((code) => me.permissions.includes(code));
    },
    [me],
  );

  const canAny = useCallback(
    (...codes: PermissionCode[]) => {
      if (!me) return false;
      if (me.isSuperuser) return true;
      return codes.some((code) => me.permissions.includes(code));
    },
    [me],
  );

  return (
    <Context.Provider
      value={{
        me: me ?? null,
        ready: !query.loading,
        forbidden: status === 403,
        unauthenticated: status === 401,
        can,
        canAny,
        refetch: query.refetch,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useAdminSession(): AdminSession {
  const value = useContext(Context);
  if (!value) {
    throw new Error("useAdminSession must be used inside AdminSessionProvider");
  }
  return value;
}

/** Convenience for the common `can(...)` call. */
export const usePermission = (...codes: PermissionCode[]) => useAdminSession().can(...codes);
