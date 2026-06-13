"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Inbox, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DisposalTicket, TicketStatus } from "@/lib/supabase/types";
import { cn, formatDate } from "@/lib/utils";
import { ListItem } from "@/components/ui/list-item";
import { StatusChip } from "@/components/StatusChip";
import { EmptyState } from "@/components/ui/empty-state";
import SkeletonPulse from "@/components/Skeleton";

type FilterValue = "all" | TicketStatus;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "menunggu_semakan", label: "Menunggu" },
  { value: "proses_pelupusan", label: "Proses" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
];

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-32" />
      </div>
      <SkeletonPulse className="h-12 w-full rounded-md" />
      <div className="flex gap-2 overflow-hidden">
        <SkeletonPulse className="h-9 w-20 rounded-full shrink-0" />
        <SkeletonPulse className="h-9 w-24 rounded-full shrink-0" />
        <SkeletonPulse className="h-9 w-20 rounded-full shrink-0" />
      </div>
      <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-4 border-b border-[var(--border)] last:border-0">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-5 w-48" />
                <SkeletonPulse className="h-3 w-32" />
              </div>
              <SkeletonPulse className="h-5 w-5 rounded shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SemuaPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<DisposalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTickets() {
      const supabase = createClient();
      const { data } = await supabase
        .from("disposal_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setTickets(data as DisposalTicket[]);
      }
      setLoading(false);
    }
    fetchTickets();
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        ticket.ticket_no.toLowerCase().includes(query) ||
        ticket.asset_type.toLowerCase().includes(query) ||
        (ticket.location || "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, search]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <header>
        <h1 className="text-title-1 font-semibold text-[var(--fg)] tracking-tight">
          Semua Tiket
        </h1>
        <p className="text-footnote text-[var(--fg-muted)] mt-1">
          {filtered.length} jumlah tiket ditemui
        </p>
      </header>

      {/* Search and Filters Container */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] group-focus-within:text-[var(--primary)] transition-colors"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. tiket, aset, atau lokasi..."
            className={cn(
              "w-full h-12 pl-11 pr-4 rounded-md bg-[var(--surface)] text-body text-[var(--fg)]",
              "border border-[var(--border)] transition-[border-color,box-shadow]",
              "focus:outline-none focus:border-[var(--primary)] focus:shadow-ring",
              "placeholder:text-[var(--fg-muted)]"
            )}
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <div className="shrink-0 flex items-center pr-1 border-r border-[var(--border)] mr-1">
            <Filter size={14} className="text-[var(--fg-muted)]" />
          </div>
          {FILTER_OPTIONS.map((option) => {
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  "shrink-0 h-9 px-5 rounded-full text-subhead font-medium transition-all",
                  "border active:scale-95",
                  isActive
                    ? "bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-sm"
                    : "bg-[var(--surface)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-none">
        {filtered.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((ticket) => (
              <ListItem
                key={ticket.id}
                onClick={() => router.push(`/semua/${ticket.id}`)}
                showChevron
                title={
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold text-[var(--primary)] tracking-tight">
                      {ticket.ticket_no}
                    </span>
                    <StatusChip status={ticket.status} />
                  </span>
                }
                subtitle={
                  <span className="flex items-center gap-1.5 mt-0.5">
                    <span className="truncate">{ticket.asset_type}</span>
                    <span aria-hidden className="text-[var(--border-strong)]">·</span>
                    <span className="shrink-0">{formatDate(ticket.created_at)}</span>
                  </span>
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-20 px-6">
            <EmptyState
              icon={<Inbox className="h-10 w-10 text-[var(--fg-muted)] opacity-20" aria-hidden />}
              title="Tiada tiket ditemui"
              description={
                search || statusFilter !== "all"
                  ? "Cuba tukar kata kunci carian atau penapis status anda."
                  : "Belum ada rekod permohonan pelupusan setakat ini."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
