"use client";

import { Clock } from "lucide-react";
import type { ActivityEntry } from "@/lib/dashboard/unit-aset";

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

// Map audit action codes to Malay verbs + tone color.
function describeAction(action: string): { verb: string; tone: string } {
  switch (action) {
    case "permohonan_dibuat":
      return { verb: "hantar", tone: "var(--dim-category-rendah)" };
    case "permohonan_disemak":
    case "permohonan_diluluskan":
      return { verb: "luluskan", tone: "var(--dim-severity-fresh)" };
    case "permohonan_ditolak":
      return { verb: "tolak", tone: "var(--dim-severity-critical)" };
    case "permohonan_selesai":
      return { verb: "selesaikan", tone: "var(--primary)" };
    case "permohonan_dihantar_semula":
      return { verb: "hantar semula", tone: "var(--dim-category-modal)" };
    default:
      return { verb: action.replaceAll("_", " "), tone: "var(--fg-muted)" };
  }
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return "baru sekejap";
  if (mins < 60) return `${mins} min lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-8 text-center">
        <Clock className="h-6 w-6 mx-auto text-[var(--fg-muted)] mb-2" aria-hidden />
        <p className="text-footnote text-[var(--fg-muted)]">Tiada aktiviti 24 jam terakhir</p>
      </div>
    );
  }
  return (
    <ol className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
      {entries.map((e) => {
        const { verb, tone } = describeAction(e.action);
        return (
          <li key={e.id} className="flex items-start gap-3 px-4 py-3">
            <span
              className="mt-1 inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: tone }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <p className="text-footnote text-[var(--fg)]">
                <span className="font-semibold">{e.actor_name}</span>{" "}
                <span style={{ color: tone }} className="font-medium">
                  {verb}
                </span>{" "}
                <span className="font-semibold tabular-nums text-[var(--primary)]">
                  {e.ticket_no}
                </span>
              </p>
              <p className="text-caption text-[var(--fg-muted)]">{relativeTime(e.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
