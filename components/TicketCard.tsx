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
    <Link href={`/semua/${ticket.id}`} className="block">
      <div className="group flex items-center gap-4 rounded-xl bg-white px-5 py-4 border border-slate-100 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              {ticket.ticket_no}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-base font-bold text-slate-800 truncate leading-snug">
            {ticket.asset_name}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[12px] font-medium">
            {ticket.location && <span className="text-slate-500">{ticket.location}</span>}
            {ticket.location && <span className="text-slate-300">·</span>}
            <span className="text-slate-500">{formatDate(ticket.created_at)}</span>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
      </div>
    </Link>
  );
}
