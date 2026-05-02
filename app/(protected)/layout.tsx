"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { MobileDrawer } from "@/components/MobileDrawer";
import { getPageTitle } from "@/lib/page-title";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "sidebar-collapsed";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(COLLAPSE_KEY) : null;
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data) {
        router.push("/login");
        return;
      }

      setProfile(data as Profile);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, String(next));
  }

  async function handleLogOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-sm text-[var(--fg-muted)]">Memuatkan...</p>
      </div>
    );
  }

  if (!profile) return null;

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Sidebar
        role={profile.role}
        name={profile.full_name}
        collapsed={collapsed}
        onLogOut={handleLogOut}
      />
      <main
        className={cn(
          "transition-[margin-left] duration-base ease-ios-out",
          collapsed ? "md:ml-16" : "md:ml-60",
          "pb-20 md:pb-0",
        )}
      >
        <AppHeader
          pageTitle={pageTitle}
          sidebarCollapsed={collapsed}
          onToggleSidebar={toggleCollapsed}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
      <BottomNav role={profile.role} />
      <MobileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        role={profile.role}
        name={profile.full_name}
        onLogOut={handleLogOut}
      />
    </div>
  );
}
