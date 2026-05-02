"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, ClipboardCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { DisposalTicket } from "@/lib/supabase/types";
import { ASSET_CONDITIONS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { StatusChip } from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import SkeletonPulse from "@/components/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-32" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <SkeletonPulse className="h-4 w-20" />
                <SkeletonPulse className="h-5 w-24" />
              </div>
              <SkeletonPulse className="h-6 w-64" />
              <SkeletonPulse className="h-4 w-40" />
            </div>
            <div className="flex gap-2 pt-2">
              <SkeletonPulse className="h-9 flex-1 rounded-md" />
              <SkeletonPulse className="h-9 flex-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SemakanPage() {
  const [tickets, setTickets] = useState<DisposalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("disposal_tickets")
      .select("*")
      .eq("status", "menunggu_semakan")
      .order("created_at", { ascending: true });
    setTickets(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleLulus(ticket: DisposalTicket) {
    setIsActionLoading(ticket.id);
    const supabase = createClient();
    const { error: updateError } = await supabase.rpc(
      "approve_disposal_ticket",
      {
        p_ticket_id: ticket.id,
      },
    );

    if (updateError) {
      toast.error("Gagal meluluskan permohonan.");
      setIsActionLoading(null);
      return;
    }

    toast.success(`${ticket.ticket_no} telah diluluskan.`);
    await loadTickets();
    setIsActionLoading(null);
  }

  async function handleTolak(ticketId: string) {
    if (!rejectReason.trim()) {
      toast.error("Sila masukkan sebab penolakan.");
      return;
    }

    setIsActionLoading(ticketId);
    const supabase = createClient();
    const { error: updateError } = await supabase.rpc(
      "reject_disposal_ticket",
      {
        p_ticket_id: ticketId,
        p_rejection_reason: rejectReason.trim(),
      },
    );

    if (updateError) {
      toast.error("Gagal menolak permohonan.");
      setIsActionLoading(null);
      return;
    }

    toast.success("Permohonan telah ditolak.");
    setRejectId(null);
    setRejectReason("");
    await loadTickets();
    setIsActionLoading(null);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <header>
        <h1 className="text-title-1 font-semibold text-[var(--fg)] tracking-tight">
          Semakan Permohonan
        </h1>
        <p className="text-footnote text-[var(--fg-muted)] mt-1">
          {tickets.length} permohonan menunggu tindakan anda
        </p>
      </header>

      {/* Content */}
      {tickets.length === 0 ? (
        <div className="py-20 px-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <EmptyState
            icon={<ClipboardCheck className="h-10 w-10 text-[var(--primary)] opacity-20" aria-hidden />}
            title="Tiada permohonan menunggu"
            description="Semua permohonan telah disemak. Kerja yang bagus!"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 shadow-none space-y-4 transition-all"
            >
              {/* Top row: ticket number + status badge */}
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-caption font-bold text-[var(--primary)] uppercase tracking-wider">
                  {ticket.ticket_no}
                </span>
                <StatusChip status={ticket.status} />
              </div>

              {/* Asset Info */}
              <div className="space-y-1">
                <p className="text-title-3 font-semibold text-[var(--fg)]">
                  {ticket.asset_name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-footnote text-[var(--fg-muted)]">
                  <span className="flex items-center gap-1">
                    <AlertCircle size={12} className="text-[var(--primary)]" />
                    {ASSET_CONDITIONS[ticket.asset_condition]}
                  </span>
                  <span aria-hidden className="text-[var(--border-strong)]">·</span>
                  <span>{ticket.location}</span>
                  <span aria-hidden className="text-[var(--border-strong)]">·</span>
                  <span className="tabular-nums">{formatDate(ticket.created_at)}</span>
                </div>
              </div>

              {/* Rejection form (shown when this ticket is being rejected) */}
              {rejectId === ticket.id ? (
                <div className="space-y-3 pt-2 border-t border-[var(--border)] animate-in">
                  <div className="space-y-1.5">
                    <label htmlFor={`reject-${ticket.id}`} className="text-subhead font-medium text-[var(--fg)]">
                      Sebab Penolakan
                    </label>
                    <textarea
                      id={`reject-${ticket.id}`}
                      className={cn(
                        "w-full rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 text-body text-[var(--fg)]",
                        "placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--destructive)] focus:shadow-ring resize-none transition-all"
                      )}
                      rows={3}
                      autoFocus
                      placeholder="Nyatakan sebab mengapa permohonan ini ditolak..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() => {
                        setRejectId(null);
                        setRejectReason("");
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      loading={isActionLoading === ticket.id}
                      onClick={() => handleTolak(ticket.id)}
                    >
                      <X size={14} />
                      Tolak
                    </Button>
                  </div>
                </div>
              ) : (
                /* Action buttons */
                <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                  <Button
                    variant="primary"
                    className="flex-1 gap-2"
                    loading={isActionLoading === ticket.id}
                    onClick={() => handleLulus(ticket)}
                  >
                    <Check size={14} />
                    Lulus
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2 text-[var(--destructive)] bg-[var(--destructive-tint)] hover:bg-[var(--destructive)] hover:text-white"
                    onClick={() => {
                      setRejectId(ticket.id);
                      setRejectReason("");
                    }}
                  >
                    <X size={14} />
                    Tolak
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
