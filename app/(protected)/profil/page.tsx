"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { ROLE_LABELS } from "@/lib/constants";
import SkeletonPulse from "@/components/Skeleton";

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="py-2 space-y-2">
        <SkeletonPulse className="h-10 w-64" />
        <SkeletonPulse className="h-5 w-32" />
      </div>
      <div className="space-y-3">
        <SkeletonPulse className="h-3 w-32 ml-1" />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <SkeletonPulse className="h-10 w-10 rounded-md" />
              <div className="space-y-2 flex-1">
                <SkeletonPulse className="h-3 w-24" />
                <SkeletonPulse className="h-5 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data as Profile);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  if (loading) return <PageSkeleton />;
  if (!profile) return null;

  return (
    <div className="space-y-6 animate-in">
      {/* Header Profile Section */}
      <header className="py-2">
        <h1 className="text-display font-bold text-[var(--fg)] tracking-tight uppercase">
          {profile.full_name}
        </h1>
        <p className="text-body font-medium text-[var(--primary)] mt-1">
          {ROLE_LABELS[profile.role]}
        </p>
      </header>

      <div className="space-y-3">
        <p className="text-caption font-bold uppercase tracking-widest text-[var(--fg-muted)] px-1">
          Maklumat Peribadi
        </p>

        {/* Info Card */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-none p-5 space-y-6">
          {/* Email */}
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-md bg-[var(--bg)] flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-[var(--fg-muted)]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-caption font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                E-mel
              </p>
              <p className="text-body font-semibold text-[var(--fg)]">
                {profile.email}
              </p>
            </div>
          </div>

          {/* Unit / Jabatan */}
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-md bg-[var(--bg)] flex items-center justify-center shrink-0">
              <Building className="h-5 w-5 text-[var(--fg-muted)]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-caption font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Unit / Jabatan
              </p>
              <p className="text-body font-semibold text-[var(--fg)]">
                {profile.unit_name ?? "-"}
              </p>
            </div>
          </div>

          {/* Peranan */}
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-md bg-[var(--bg)] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-[var(--fg-muted)]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-caption font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Peranan Sistem
              </p>
              <p className="text-body font-semibold text-[var(--fg)]">
                {ROLE_LABELS[profile.role]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
