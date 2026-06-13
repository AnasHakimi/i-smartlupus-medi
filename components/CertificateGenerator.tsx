"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Award } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

import { createClient } from "@/lib/supabase/client";
import type { DisposalTicket } from "@/lib/supabase/types";
import { DISPOSAL_METHODS, ASSET_CONDITIONS, ASSET_CATEGORIES, ASSET_SUB_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Props {
  ticket: DisposalTicket;
  officerName: string;
}

// DB row may have extra fields not in the TS type
type TicketRow = DisposalTicket & Record<string, unknown>;

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

function generateCertPdf(ticket: DisposalTicket, officerName: string): Blob {
  const row = ticket as TicketRow;

  const ticketNo =
    (row.ticket_no as string | undefined) ?? ticket.ticket_no ?? ticket.id;
  const location = (row.location as string | undefined) ?? "-";
  const completedAt =
    (row.completed_at as string | undefined) ?? (row.updated_at as string | undefined) ?? null;

  const conditionLabel =
    ticket.asset_condition ? ASSET_CONDITIONS[ticket.asset_condition] ?? ticket.asset_condition : "-";
  const methodLabel =
    ticket.disposal_method ? DISPOSAL_METHODS[ticket.disposal_method] ?? ticket.disposal_method : "-";
  const categoryLabel =
    ticket.category ? ASSET_CATEGORIES[ticket.category] ?? ticket.category : "-";
  const subCategoryLabel =
    ticket.sub_category ? ASSET_SUB_CATEGORIES[ticket.sub_category] ?? ticket.sub_category : "-";

  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SIJIL PELUPUSAN ASET", 105, 30, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("i-SMARTLUPUS", 105, 40, { align: "center" });

  // Ticket number
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`No. Tiket: ${ticketNo}`, 20, 55);

  // Details table
  const details: Array<[string, string]> = [
    ["Jenis Aset", ticket.asset_type],
    ["Kategori", categoryLabel],
    ["Sub-Kategori", subCategoryLabel],
    ["No. Siri Pendaftaran", ticket.serial_no ?? "-"],
    ["Tarikh Perolehan", formatDate(ticket.purchase_date)],
    ["Harga Perolehan", ticket.purchase_price ? formatCurrency(ticket.purchase_price) : "-"],
    ["Keadaan", conditionLabel],
    ["Lokasi", location],
    ["Kaedah Pelupusan", methodLabel],
    ["Tarikh Permohonan", formatDate(ticket.created_at)],
    ["Tarikh Selesai", formatDate(completedAt)],
    ["Pegawai Pelupusan", officerName],
  ];

  doc.setFontSize(10);
  let y = 70;
  for (const [label, value] of details) {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 80, y);
    y += 8;
  }

  // Signature section
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Disahkan oleh:", 20, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.line(20, y, 90, y);

  y += 6;
  doc.text(officerName, 20, y);

  y += 6;
  doc.text(formatDate(new Date().toISOString()), 20, y);

  return doc.output("blob");
}

export default function CertificateGenerator({ ticket, officerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Only render when ticket is selesai AND cert_url is not yet generated
  const row = ticket as TicketRow;
  const certUrl = row.cert_url as string | null | undefined;
  if (ticket.status !== "selesai" || certUrl) return null;

  async function handleGenerate() {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Generate PDF blob
      const blob = generateCertPdf(ticket, officerName);

      // 2. Upload to Supabase Storage
      const storagePath = `certificates/${ticket.id}/sijil-pelupusan.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("disposal-files")
        .upload(storagePath, blob, {
          upsert: true,
          contentType: "application/pdf",
        });

      if (uploadError) throw uploadError;

      // 3. Attach certificate path and write audit log through the database boundary
      const { error: ticketError } = await supabase.rpc(
        "attach_disposal_certificate",
        {
          p_ticket_id: ticket.id,
          p_cert_url: storagePath,
        },
      );

      if (ticketError) throw ticketError;

      // 4. Toast + refresh
      toast.success("Sijil pelupusan berjaya dijana!");
      router.refresh();
    } catch {
      toast.error("Gagal menjana sijil. Sila cuba semula.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 animate-in">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-4 w-4 text-[var(--primary)]" />
        <p className="text-subhead font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Sijil Pelupusan
        </p>
      </div>
      
      <p className="text-footnote text-[var(--fg-muted)] mb-6">
        Sijil rasmi pelupusan aset belum dijana untuk tiket ini.
      </p>

      <Button
        size="lg"
        className="w-full gap-2"
        loading={loading}
        onClick={handleGenerate}
      >
        <FileText size={18} />
        Jana Sijil Pelupusan
      </Button>
    </div>
  );
}
