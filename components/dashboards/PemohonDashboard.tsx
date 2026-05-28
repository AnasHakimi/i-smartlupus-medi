"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCheck,
  Clock,
  Percent,
  PlusCircle,
  Inbox,
} from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { ROLE_LABELS } from "@/lib/constants";
import { getGreeting } from "@/lib/greeting";
import { DashboardSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import StatusChart from "@/components/StatusChart";
import { useTheme } from "@/components/theme-provider";
import type { Profile } from "@/lib/supabase/types";
import {
  fetchPemohonDashboard,
  type PemohonDashboardData,
} from "@/lib/dashboard/pemohon";
import { Section } from "./Section";
import { KpiCard } from "./KpiCard";
import { DualLineChart } from "./DualLineChart";
import { DurationHistogram } from "./DurationHistogram";
import { NestedDonut } from "./NestedDonut";
import { ActivityFeed } from "./ActivityFeed";
import { AttentionTable } from "./AttentionTable";

interface PemohonDashboardProps {
  profile: Profile;
}

function formatTodayMY(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Same palette as legacy dashboard (chartColors helper at app/(protected)/dashboard/page.tsx).
function chartColors(mode: "light" | "dark") {
  if (mode === "dark") {
    return { menunggu: "#facc15", proses: "#fb923c", selesai: "#34d399", ditolak: "#f87171" };
  }
  return { menunggu: "#eab308", proses: "#f97316", selesai: "#10b981", ditolak: "#ef4444" };
}

export function PemohonDashboard({ profile }: PemohonDashboardProps) {
  const [data, setData] = useState<PemohonDashboardData | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    fetchPemohonDashboard(profile.id).then(setData).catch((err) => {
      console.error("Failed to load pemohon dashboard", err);
    });
  }, [profile.id]);

  if (!data) {
    return (
      <div role="status">
        <DashboardSkeleton />
        <span className="sr-only">Memuatkan papan pemuka...</span>
      </div>
    );
  }

  // Brand-new user (no tickets ever) → Welcome panel
  if (data.isBrandNewUser) {
    return (
      <div className="space-y-6">
        <header className="animate-in">
          <h1 className="text-display font-bold text-[var(--fg)] tracking-tight">
            Selamat datang, {profile.full_name.split(" ")[0]}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-footnote text-[var(--fg-muted)]">
            <span>{formatTodayMY()}</span>
            <span aria-hidden>·</span>
            <Chip tone="neutral">{ROLE_LABELS[profile.role]}</Chip>
          </div>
        </header>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center animate-in [animation-delay:100ms]">
          <Inbox className="h-12 w-12 mx-auto text-[var(--fg-muted)]" aria-hidden />
          <h2 className="mt-4 text-headline font-semibold text-[var(--fg)]">
            Belum ada permohonan
          </h2>
          <p className="mt-2 text-body text-[var(--fg-muted)]">
            Mohon pelupusan pertama anda untuk mula.
          </p>
          <Link
            href="/mohon"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-body font-semibold text-[var(--primary-fg)] shadow-[var(--shadow-tactile)] hover:opacity-90"
          >
            <PlusCircle className="h-5 w-5" aria-hidden />
            Mohon Baru
          </Link>
        </section>
      </div>
    );
  }

  const { kpis } = data;
  const palette = chartColors(resolvedTheme);
  const statusData = data.statusBreakdown.map((b) => ({
    ...b,
    color:
      b.name === "Menunggu" ? palette.menunggu :
      b.name === "Proses"   ? palette.proses   :
      b.name === "Selesai"  ? palette.selesai  :
      palette.ditolak,
  }));

  // Per-widget zero state checks
  const statusTotal = data.statusBreakdown.reduce((sum, b) => sum + b.value, 0);
  const durationTotal = data.approvalDuration.buckets.reduce((sum, b) => sum + b.count, 0);
  const categoryTotal = Object.values(data.categoryMix).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-5">
      {/* Greeting strip */}
      <header className="flex items-start justify-between gap-4 animate-in">
        <div className="min-w-0">
          <h1 className="text-display font-bold text-[var(--fg)] tracking-tight">
            {getGreeting()}, {profile.full_name.split(" ")[0]}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-footnote text-[var(--fg-muted)]">
            <span>{formatTodayMY()}</span>
            <span aria-hidden>·</span>
            <Chip tone="neutral">{ROLE_LABELS[profile.role]}</Chip>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in [animation-delay:50ms]">
        <KpiCard
          label="Permohonan Aktif"
          value={kpis.activeCount.toString()}
          tone="emerald"
          icon={ClipboardList}
        />
        <KpiCard
          label="Diluluskan (30h)"
          value={kpis.approved30d.current.toString()}
          tone="amber"
          icon={CheckCheck}
          pctChange={kpis.approved30d.pctChange}
          goodDirection="up"
          spark={kpis.approvedSparkline}
          deltaWindow="vs 30h"
        />
        <KpiCard
          label="Median Masa Kelulusan"
          value={`${kpis.medianApprovalHours.current.toFixed(1)} jam`}
          tone="sky"
          icon={Clock}
          pctChange={kpis.medianApprovalHours.pctChange}
          goodDirection="down"
          spark={kpis.medianSparkline}
          deltaWindow="vs 30h"
        />
        <KpiCard
          label="Kadar Kelulusan"
          value={`${(kpis.approvalRate.current * 100).toFixed(0)}%`}
          tone="violet"
          icon={Percent}
          pctChange={kpis.approvalRate.pctChange}
          goodDirection="up"
          spark={kpis.approvalRateSparkline}
          deltaWindow="vs 30h"
        />
      </div>

      {/* Workflow */}
      <Section
        title="Aliran Permohonan Saya"
        subtitle="Permohonan dihantar vs selesai · 30 hari"
        className="animate-in [animation-delay:100ms]"
      >
        <DualLineChart data={data.workflow} />
      </Section>

      {/* Two-up: status + duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <Section
          title="Status Permohonan"
          subtitle="Taburan status semua permohonan saya"
          className="animate-in [animation-delay:150ms]"
        >
          {statusTotal === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8" aria-hidden />}
              title="Belum ada permohonan"
              description="Mohon yang pertama untuk lihat status."
            />
          ) : (
            <StatusChart data={statusData} />
          )}
        </Section>
        <Section
          title="Taburan Masa Kelulusan"
          subtitle="Berapa lama permohonan saya diluluskan · 30 hari"
          className="animate-in [animation-delay:200ms]"
        >
          {durationTotal === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8" aria-hidden />}
              title="Belum ada permohonan diluluskan"
              description="Data taburan masa akan muncul selepas permohonan pertama diluluskan."
            />
          ) : (
            <DurationHistogram
              buckets={data.approvalDuration.buckets}
              medianHours={data.approvalDuration.medianHours}
            />
          )}
        </Section>
      </div>

      {/* Two-up: category + attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <Section
          title="Kategori Aset Saya"
          subtitle="Kategori × keadaan aset · 30 hari"
          className="animate-in [animation-delay:250ms]"
        >
          {categoryTotal === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8" aria-hidden />}
              title="Belum ada permohonan"
              description="Carta kategori akan muncul selepas permohonan dihantar."
            />
          ) : (
            <NestedDonut mix={data.categoryMix} />
          )}
        </Section>
        <Section
          title="Permohonan Memerlukan Perhatian"
          subtitle="Ditolak (perlu pindaan) atau menunggu lebih 7 hari"
          className="animate-in [animation-delay:300ms]"
        >
          <AttentionTable rows={data.attentionRows} />
        </Section>
      </div>

      {/* Activity feed */}
      <section className="space-y-3 animate-in [animation-delay:350ms]">
        <div className="px-1">
          <h3 className="text-subhead font-semibold text-[var(--fg)] tracking-tight">
            Aktiviti Terkini Saya
          </h3>
          <p className="text-caption text-[var(--fg-muted)] mt-0.5">
            24 jam yang lalu · permohonan saya
          </p>
        </div>
        {data.activityFeed.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-8 w-8" aria-hidden />}
            title="Tiada aktiviti dalam 24 jam terakhir"
            description="Aktiviti pada permohonan anda akan dipaparkan di sini."
          />
        ) : (
          <ActivityFeed entries={data.activityFeed} />
        )}
      </section>
    </div>
  );
}
