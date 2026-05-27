"use client";

import { useEffect, useState } from "react";
import {
  Inbox,
  CheckCheck,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { ROLE_LABELS } from "@/lib/constants";
import { getGreeting } from "@/lib/greeting";
import { DashboardSkeleton } from "@/components/Skeleton";
import type { Profile } from "@/lib/supabase/types";
import {
  fetchUnitAsetDashboard,
  type UnitAsetDashboardData,
} from "@/lib/dashboard/unit-aset";
import { KpiCard } from "./KpiCard";
import { DualLineChart } from "./DualLineChart";
import { AgeBucketBar } from "./AgeBucketBar";
import { DurationHistogram } from "./DurationHistogram";
import { NestedDonut } from "./NestedDonut";
import { TopLocationsBar } from "./TopLocationsBar";
import { PendingReviewTable } from "./PendingReviewTable";
import { ActivityFeed } from "./ActivityFeed";

interface UnitAsetDashboardProps {
  profile: Profile;
}

function formatTodayMY(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function Section({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-5 ${className}`}
    >
      <header className="mb-3">
        <h3 className="text-subhead font-semibold text-[var(--fg)] tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-caption text-[var(--fg-muted)] mt-0.5">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

export function UnitAsetDashboard({ profile }: UnitAsetDashboardProps) {
  const [data, setData] = useState<UnitAsetDashboardData | null>(null);

  useEffect(() => {
    fetchUnitAsetDashboard(profile.id).then(setData).catch((err) => {
      console.error("Failed to load unit_aset dashboard", err);
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

  const { kpis } = data;

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in [animation-delay:50ms]">
        <KpiCard
          label="Antrian Saya"
          value={kpis.queueSize.toString()}
          tone="emerald"
          icon={Inbox}
        />
        <KpiCard
          label="Disemak (7h)"
          value={kpis.reviewed7d.current.toString()}
          tone="amber"
          icon={CheckCheck}
          pctChange={kpis.reviewed7d.pctChange}
          goodDirection="up"
          spark={kpis.reviewedSparkline}
          deltaWindow="vs 7h"
        />
        <KpiCard
          label="Median Masa"
          value={`${kpis.medianReviewHours.current.toFixed(1)} jam`}
          tone="sky"
          icon={Clock}
          pctChange={kpis.medianReviewHours.pctChange}
          goodDirection="down"
          spark={kpis.medianSparkline}
          deltaWindow="vs 30h"
        />
        <KpiCard
          label="Kadar Tolakan"
          value={`${(kpis.rejectionRate.current * 100).toFixed(0)}%`}
          tone="rose"
          icon={XCircle}
          pctChange={kpis.rejectionRate.pctChange}
          goodDirection="down"
          spark={kpis.rejectionSparkline}
          deltaWindow="vs 30h"
        />
        <KpiCard
          label="Tertunggak >7h"
          value={kpis.overdueCount.toString()}
          tone="violet"
          icon={AlertTriangle}
        />
      </div>

      {/* Dual-line flow */}
      <Section
        title="Aliran Kerja"
        subtitle="Permohonan masuk vs disemak oleh saya · 30 hari"
        className="animate-in [animation-delay:100ms]"
      >
        <DualLineChart data={data.workflow} />
      </Section>

      {/* Two-up: age buckets + duration histogram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <Section
          title="Antrian Mengikut Umur"
          subtitle="Permohonan menunggu semakan, mengikut umur"
          className="animate-in [animation-delay:150ms]"
        >
          <AgeBucketBar buckets={data.ageBuckets} />
        </Section>
        <Section
          title="Taburan Masa Semakan"
          subtitle="Berapa lama setiap semakan saya ambil · 30 hari"
          className="animate-in [animation-delay:200ms]"
        >
          <DurationHistogram
            buckets={data.reviewDuration.buckets}
            medianHours={data.reviewDuration.medianHours}
          />
        </Section>
      </div>

      {/* Two-up: category mix + top locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <Section
          title="Kategori Masuk"
          subtitle="Kategori × keadaan aset · 30 hari"
          className="animate-in [animation-delay:250ms]"
        >
          <NestedDonut mix={data.categoryMix} />
        </Section>
        <Section
          title="Lokasi Aset Teratas"
          subtitle="Lokasi paling kerap menjana permohonan · 30 hari"
          className="animate-in [animation-delay:300ms]"
        >
          <TopLocationsBar data={data.topLocations} />
        </Section>
      </div>

      {/* Pending queue table */}
      <section className="space-y-3 animate-in [animation-delay:350ms]">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-subhead font-semibold text-[var(--fg)] tracking-tight">
              Antrian Untuk Disemak
            </h3>
            <p className="text-caption text-[var(--fg-muted)] mt-0.5">
              5 permohonan paling lama menunggu
            </p>
          </div>
        </div>
        <PendingReviewTable rows={data.pendingQueue} />
      </section>

      {/* Activity feed */}
      <section className="space-y-3 animate-in [animation-delay:400ms]">
        <div className="px-1">
          <h3 className="text-subhead font-semibold text-[var(--fg)] tracking-tight">
            Aktiviti Terkini
          </h3>
          <p className="text-caption text-[var(--fg-muted)] mt-0.5">
            24 jam yang lalu
          </p>
        </div>
        <ActivityFeed entries={data.activityFeed} />
      </section>
    </div>
  );
}
