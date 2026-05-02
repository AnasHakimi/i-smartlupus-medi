"use client";

import { useState } from "react";
import { CheckCircle, Hammer } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { DisposalTicket, DisposalMethod } from "@/lib/supabase/types";
import { DISPOSAL_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  ticket: DisposalTicket;
}

export default function TicketActions({ ticket }: Props) {
  const [method, setMethod] = useState<DisposalMethod | "">("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (ticket.status !== "proses_pelupusan") return null;

  async function handleComplete() {
    if (!method) {
      toast.error("Sila pilih kaedah pelupusan.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: ticketError } = await supabase.rpc(
        "complete_disposal_ticket",
        {
          p_ticket_id: ticket.id,
          p_disposal_method: method,
        },
      );

      if (ticketError) throw ticketError;

      const ticketRef = ticket.ticket_no ?? ticket.id;
      toast.success(`${ticketRef} telah diselesaikan!`);
      router.refresh();
    } catch {
      toast.error("Ralat berlaku. Sila cuba semula.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 animate-in">
      <div className="flex items-center gap-2 mb-4">
        <Hammer className="h-4 w-4 text-[var(--primary)]" />
        <p className="text-subhead font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Pelaksanaan Pelupusan
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {(Object.entries(DISPOSAL_METHODS) as [DisposalMethod, string][]).map(
          ([key, label]) => {
            const isActive = method === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMethod(key)}
                className={cn(
                  "h-11 rounded-md border text-subhead font-medium transition-all active:scale-95",
                  isActive
                    ? "bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-sm"
                    : "bg-[var(--bg)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
                )}
              >
                {label}
              </button>
            );
          }
        )}
      </div>

      <Button
        size="lg"
        className="w-full gap-2"
        disabled={!method}
        loading={loading}
        onClick={handleComplete}
      >
        <CheckCircle size={18} />
        Selesaikan Pelupusan
      </Button>
    </div>
  );
}
