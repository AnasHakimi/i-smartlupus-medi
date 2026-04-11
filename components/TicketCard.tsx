import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { DisposalTicket } from "@/lib/supabase/types";
import StatusBadge from "@/components/StatusBadge";

interface TicketCardProps {
  ticket: DisposalTicket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link href={`/semua/${ticket.id}`}>
      <div className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              {ticket.ticket_no}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {ticket.asset_name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            {ticket.location && <span>{ticket.location}</span>}
            {ticket.location && <span>·</span>}
            <span>{formatDate(ticket.created_at)}</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 shrink-0 transition-colors" />
      </div>
    </Link>
  );
}
