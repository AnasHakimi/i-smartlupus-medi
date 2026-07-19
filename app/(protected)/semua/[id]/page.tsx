"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, Camera, Info, History } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { DisposalTicket, AuditLog, Profile } from "@/lib/supabase/types";
import { ASSET_CONDITIONS, DISPOSAL_METHODS, ASSET_CATEGORIES, ASSET_SUB_CATEGORIES } from "@/lib/constants";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { StatusChip } from "@/components/StatusChip";
import TicketActions from "@/components/TicketActions";
import CertificateGenerator from "@/components/CertificateGenerator";
import { Button } from "@/components/ui/button";
import SkeletonPulse from "@/components/Skeleton";

const SIGNED_URL_TTL_SECONDS = 10 * 60;

function storagePathFromValue(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const marker = "/disposal-files/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

async function createSignedDisposalFileUrl(
  supabase: ReturnType<typeof createClient>,
  storageValue: string | null,
): Promise<string | null> {
  const path = storagePathFromValue(storageValue);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("disposal-files")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-9 w-9 rounded-md" />
        <div className="flex flex-1 items-center gap-2">
          <SkeletonPulse className="h-7 w-32" />
          <SkeletonPulse className="h-6 w-24" />
        </div>
      </div>
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 space-y-6">
        <SkeletonPulse className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <SkeletonPulse className="h-3 w-20" />
              <SkeletonPulse className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [ticket, setTicket] = useState<DisposalTicket | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assetPhotoUrl, setAssetPhotoUrl] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [borangUrl, setBorangUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Load current user profile for role checks and certificate name
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) setProfile(p as Profile);
    }

    const { data: t } = await supabase
      .from("disposal_tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (t) {
      const ticketRow = t as DisposalTicket;
      setTicket(ticketRow);

      const [photoUrl, certUrl, bUrl] = await Promise.all([
        createSignedDisposalFileUrl(supabase, ticketRow.image_url),
        createSignedDisposalFileUrl(supabase, ticketRow.cert_url),
        createSignedDisposalFileUrl(supabase, ticketRow.borang_ca_url),
      ]);

      setAssetPhotoUrl(photoUrl);
      setCertificateUrl(certUrl);
      setBorangUrl(bUrl);
    }

    const { data: a } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    setLogs((a as AuditLog[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <PageSkeleton />;
  if (!ticket) return (
    <div className="py-20 text-center space-y-4">
      <p className="text-body text-[var(--destructive)]">Tiket tidak ditemui.</p>
      <Button variant="secondary" onClick={() => router.push("/semua")}>Kembali ke Senarai</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-title-2 font-semibold text-[var(--fg)] tabular-nums truncate tracking-tight">
          {ticket.ticket_no}
        </span>
        <StatusChip status={ticket.status} />
      </div>

      {/* Main Info Card */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-none overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <Info className="h-4 w-4 text-[var(--primary)]" />
          <p className="text-subhead font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            Maklumat Aset
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Jenis Aset</p>
            <p className="text-body font-medium text-[var(--fg)] leading-tight">{ticket.asset_type}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Kategori</p>
            <p className="text-body font-medium text-[var(--fg)] leading-tight">
              {ticket.category ? ASSET_CATEGORIES[ticket.category] : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Sub-Kategori</p>
            <p className="text-body font-medium text-[var(--fg)] leading-tight">
              {ticket.sub_category ? ASSET_SUB_CATEGORIES[ticket.sub_category] : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">No. Siri Pendaftaran</p>
            <p className="text-body font-medium text-[var(--fg)] tabular-nums leading-tight">{ticket.serial_no || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">No. Aset Radicare</p>
            <p className="text-body font-medium text-[var(--fg)] leading-tight">{ticket.radicare_asset_no || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Tarikh Perolehan</p>
            <p className="text-body font-medium text-[var(--fg)] tabular-nums leading-tight">{formatDate(ticket.purchase_date)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Harga Perolehan</p>
            <p className="text-body font-medium text-[var(--fg)] tabular-nums leading-tight">
              {ticket.purchase_price ? formatCurrency(ticket.purchase_price) : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Keadaan</p>
            <p className="text-body font-medium text-[var(--fg)] leading-tight">{ASSET_CONDITIONS[ticket.asset_condition]}</p>
          </div>
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Lokasi</p>
            <p className="text-body font-medium text-[var(--fg)] leading-tight">{ticket.location || "-"}</p>
          </div>
          {ticket.disposal_method && (
            <div className="space-y-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Kaedah Pelupusan</p>
              <p className="text-body font-medium text-[var(--fg)] leading-tight">{DISPOSAL_METHODS[ticket.disposal_method]}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Tarikh Mohon</p>
            <p className="text-body font-medium text-[var(--fg)] tabular-nums leading-tight">{formatDateTime(ticket.created_at)}</p>
          </div>
        </div>

        {ticket.rejection_reason && (
          <div className="mt-8 rounded-md border border-[var(--destructive)] bg-[var(--destructive-tint)] p-4">
            <p className="mb-1 text-caption font-bold uppercase tracking-wider text-[var(--destructive)]">Sebab Ditolak</p>
            <p className="text-body text-[var(--destructive)]">{ticket.rejection_reason}</p>
          </div>
        )}

        {/* Photo Display Section (view / download only) */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-1.5">
            <Camera size={14} className="text-[var(--primary)]" />
            <p className="text-caption font-bold uppercase tracking-wider text-[var(--fg-muted)]">Foto Aset (Untuk Dilupuskan)</p>
          </div>
          {assetPhotoUrl ? (
            <>
              <a href={assetPhotoUrl} target="_blank" rel="noopener noreferrer"
                 className="relative block w-full aspect-[4/3] rounded-md overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
                <Image src={assetPhotoUrl} alt="Foto aset" fill className="object-cover" unoptimized />
              </a>
              <a href={assetPhotoUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full gap-2 text-[var(--primary)]">
                  <Camera size={18} /> Muat Turun Foto
                </Button>
              </a>
            </>
          ) : (
            <p className="text-caption text-[var(--fg-muted)] italic">Foto aset tidak dimuat naik.</p>
          )}
        </div>

        {ticket.sub_category === "alat_perubatan" && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--primary)]" />
              <p className="text-caption font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Borang CA (Laporan Kerosakan Aset)
              </p>
            </div>
            {borangUrl ? (
              <a href={borangUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full gap-2 text-[var(--primary)]">
                  <FileText size={18} /> Muat Turun Borang CA
                </Button>
              </a>
            ) : (
              <p className="text-caption text-[var(--fg-muted)] italic">Borang CA tidak dimuat naik.</p>
            )}
          </div>
        )}

        {certificateUrl && (
          <div className="mt-8">
            <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="secondary" className="w-full gap-2 text-[var(--primary)]">
                <FileText size={18} /> Muat Turun Sijil Pelupusan
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Action Zone (Executors Only) */}
      <TicketActions ticket={ticket} />

      {/* Certificate Generator (Visible only to Unit Aset/Admin when status is Selesai and cert is missing) */}
      {ticket.status === 'selesai' && !ticket.cert_url && profile && (profile.role === 'unit_aset' || profile.role === 'admin') && (
        <CertificateGenerator ticket={ticket} officerName={profile.full_name} />
      )}

      {/* Audit Log Card */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-none">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-4 w-4 text-[var(--primary)]" />
          <p className="text-subhead font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            Jejak Audit
          </p>
        </div>

        {logs.length === 0 ? (
          <p className="text-body text-[var(--fg-muted)] text-center py-4">Tiada rekod audit.</p>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[3px] before:w-[1.5px] before:bg-[var(--border)]">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 relative">
                <div className="mt-2.5 flex-shrink-0 z-10">
                  <div className="h-2 w-2 rounded-full bg-[var(--primary)] shadow-[0_0_0_3px_var(--surface)]" />
                </div>
                <div className="min-w-0 flex-1 bg-[var(--bg)] rounded-md p-3 border border-[var(--border)]">
                  <p className="text-subhead font-semibold capitalize text-[var(--fg)] leading-none">{log.action.replace(/_/g, " ")}</p>
                  {log.old_value && (
                    <div className="mt-2 text-footnote text-[var(--fg-muted)] flex items-center gap-1.5 flex-wrap">
                      <span className="line-through opacity-60 bg-[var(--border)] px-1 rounded-sm">{log.old_value}</span>
                      <span className="text-[var(--primary)]">→</span>
                      <span className="font-medium text-[var(--fg)] px-1 rounded-sm bg-[var(--primary-tint)]">{log.new_value}</span>
                    </div>
                  )}
                  <p className="mt-2 text-caption tabular-nums text-[var(--fg-muted)] opacity-80">{formatDateTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
