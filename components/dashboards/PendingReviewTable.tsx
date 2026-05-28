"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PendingQueueRow } from "@/lib/dashboard/unit-aset";

interface PendingReviewTableProps {
  rows: PendingQueueRow[];
}

function ageSeverity(days: number): { color: string; emoji: string } {
  if (days <= 3) return { color: "var(--dim-severity-fresh)", emoji: "🟢" };
  if (days <= 7) return { color: "var(--dim-severity-warm)", emoji: "🟡" };
  if (days <= 14) return { color: "var(--dim-severity-aging)", emoji: "🟠" };
  return { color: "var(--dim-severity-critical)", emoji: "🔴" };
}

function categoryChip(category: PendingQueueRow["category"]): { label: string; color: string } {
  if (category === "harta_modal") {
    return { label: "H. Modal", color: "var(--dim-category-modal)" };
  }
  if (category === "aset_bernilai_rendah") {
    return { label: "A. Rendah", color: "var(--dim-category-rendah)" };
  }
  return { label: "—", color: "var(--fg-muted)" };
}

export function PendingReviewTable({ rows }: PendingReviewTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-12 text-center">
        <p className="text-footnote text-[var(--fg-muted)]">
          Tiada permohonan menunggu semakan
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <table className="w-full text-footnote">
        <thead className="text-caption uppercase tracking-wide text-[var(--fg-muted)]">
          <tr className="border-b border-[var(--border)]">
            <th className="px-3 py-2 text-left font-medium">Tiket</th>
            <th className="px-3 py-2 text-left font-medium">Aset</th>
            <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Pemohon</th>
            <th className="px-3 py-2 text-left font-medium">Umur</th>
            <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Kategori</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const sev = ageSeverity(row.age_days);
            const cat = categoryChip(row.category);
            return (
              <tr
                key={row.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--primary-tint)] transition-colors"
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/semakan?ticket=${row.id}`}
                    className="text-[var(--primary)] font-semibold tabular-nums hover:underline"
                  >
                    {row.ticket_no}
                  </Link>
                </td>
                <td className="px-3 py-2.5 truncate max-w-[180px]">{row.asset_name}</td>
                <td className="px-3 py-2.5 text-[var(--fg-muted)] hidden md:table-cell truncate max-w-[140px]">
                  {row.requester_name}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="inline-flex items-center gap-1 font-semibold tabular-nums"
                    style={{ color: sev.color }}
                  >
                    {row.age_days}h <span aria-hidden>{sev.emoji}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell">
                  <span
                    className="inline-flex items-center gap-1 text-caption font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cat.color + "22", color: cat.color }}
                  >
                    {cat.label}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={`/semakan?ticket=${row.id}`}
                    aria-label={`Semak ${row.ticket_no}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--fg-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)]"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
