"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { clientLogout } from "@/lib/logout";

export type CurrentUserType = "citizen" | "advertiser" | "lga" | "admin";

export interface CurrentUser {
  /** Still resolving one or both auth sources. */
  loading: boolean;
  authenticated: boolean;
  type: CurrentUserType | null;
  name: string | null;
  email: string | null;
  /** Where "Dashboard" should take this user. */
  dashboardHref: string | null;
  /** Where "Settings" should take this user (null when no settings page exists). */
  settingsHref: string | null;
  /** Sign this user out through the correct mechanism, then land on "/". */
  logout: () => Promise<void>;
}

interface LgaSessionResponse {
  authenticated: boolean;
  lgaId?: string;
  role?: "CHAIRMAN" | "STAFF";
  lgaName?: string | null;
  chairmanName?: string | null;
}

/**
 * Resolve the currently signed-in user across the app's two auth systems:
 *   - Citizens and advertisers authenticate via NextAuth (useSession).
 *   - LGA chairmen/staff authenticate via a separate HttpOnly `lga_session`
 *     cookie, surfaced through GET /api/lga/session.
 *
 * NextAuth takes precedence when both happen to be present. Returns everything
 * the navbar needs to render an account menu and to sign the user out correctly.
 */
export function useCurrentUser(): CurrentUser {
  const { data: nextAuthSession, status } = useSession();
  const [lga, setLga] = useState<LgaSessionResponse | null>(null);
  const [lgaChecked, setLgaChecked] = useState(false);

  // Only probe the LGA cookie when there is no NextAuth user to describe.
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      setLgaChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lga/session", { cache: "no-store" });
        const data: LgaSessionResponse = await res.json();
        if (cancelled) return;
        setLga(data);
        // Restore the client hint the LGA dashboard's guard reads, so following
        // the "Dashboard" link from here (e.g. in a fresh tab) doesn't bounce
        // the chairman back to /lga-login.
        if (data.authenticated && data.lgaId) {
          try { sessionStorage.setItem("lgaId", data.lgaId); } catch { /* ignore */ }
        }
      } catch {
        if (!cancelled) setLga({ authenticated: false });
      } finally {
        if (!cancelled) setLgaChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [status]);

  const loading = status === "loading" || (status === "unauthenticated" && !lgaChecked);

  // NextAuth user (citizen / advertiser / admin).
  if (status === "authenticated" && nextAuthSession?.user) {
    const user = nextAuthSession.user as { name?: string | null; email?: string | null; role?: string };
    const role = user.role ?? "CITIZEN";
    const map: Record<string, { type: CurrentUserType; dashboard: string; settings: string | null }> = {
      CITIZEN:    { type: "citizen",    dashboard: "/profile",   settings: "/settings" },
      ADVERTISER: { type: "advertiser", dashboard: "/advertiser", settings: null },
      ADMIN:      { type: "admin",      dashboard: "/admin",      settings: null },
    };
    const entry = map[role] ?? map.CITIZEN;
    return {
      loading: false,
      authenticated: true,
      type: entry.type,
      name: user.name ?? null,
      email: user.email ?? null,
      dashboardHref: entry.dashboard,
      settingsHref: entry.settings,
      logout: () => clientLogout("/"),
    };
  }

  // LGA chairman / staff.
  if (lga?.authenticated) {
    return {
      loading: false,
      authenticated: true,
      type: "lga",
      name: lga.chairmanName ?? lga.lgaName ?? "LGA Admin",
      email: null,
      dashboardHref: "/lga-dashboard",
      settingsHref: "/lga-dashboard/settings",
      logout: async () => {
        try {
          await fetch("/api/lga/logout", { method: "POST" });
        } catch { /* clear client state regardless */ }
        try { sessionStorage.removeItem("lgaId"); } catch { /* ignore */ }
        window.location.href = "/";
      },
    };
  }

  return {
    loading,
    authenticated: false,
    type: null,
    name: null,
    email: null,
    dashboardHref: null,
    settingsHref: null,
    logout: () => clientLogout("/"),
  };
}
