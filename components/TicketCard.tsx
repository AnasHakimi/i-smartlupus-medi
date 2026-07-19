"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { DisposalTicket } from "@/lib/supabase/types";
import { StatusChip } from "@/components/StatusChip";
import { ListItem } from "@/components/ui/list-item";

interface TicketCardProps {
  ticket: DisposalTicket;
}

/**
 * TicketCard is a wrapper around ListItem for DisposalTicket objects.
 * It follows the "Flat List" institutional pattern (iOS Settings style).
 */
export default function TicketCard({ ticket }: TicketCardProps) {
  const router = useRouter();

  return (
    <ListItem
      onClick={() => router.push(`/semua/${ticket.id}`)}
      showChevron
      title={
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-semibold text-[var(--primary)] tracking-tight">
            {ticket.ticket_no}
          </span>
          <StatusChip status={ticket.status} />
        </div>
      }
      subtitle={
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="truncate">{ticket.asset_type}</span>
          <span aria-hidden className="text-[var(--border-strong)]">·</span>
          <span className="shrink-0">{formatDate(ticket.created_at)}</span>
        </div>
      }
    />
  );
}
