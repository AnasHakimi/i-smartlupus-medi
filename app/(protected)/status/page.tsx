"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DisposalTicket } from "@/lib/supabase/types";
import TicketCard from "@/components/TicketCard";
import SkeletonPulse from "@/components/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-64" />
      </div>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-none">
        {[1, 2, 3, 4].map((i) => (
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

export default function StatusPage() {
  const [tickets, setTickets] = useState<DisposalTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("disposal_tickets")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      setTickets((data as DisposalTicket[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in">
      <header>
        <h1 className="text-title-1 font-semibold text-[var(--fg)] tracking-tight">
          Status Permohonan
        </h1>
        <p className="text-footnote text-[var(--fg-muted)] mt-1">
          Senarai permohonan pelupusan aset perubatan anda
        </p>
      </header>

      {!tickets.length ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl py-20 px-6">
          <EmptyState
            icon={<ClipboardList className="h-10 w-10 text-[var(--primary)] opacity-20" aria-hidden />}
            title="Belum ada permohonan"
            description="Untuk memulakan pelupusan aset, tekan butang Mohon Baru di menu bawah."
          />
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-none divide-y divide-[var(--border)]">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
