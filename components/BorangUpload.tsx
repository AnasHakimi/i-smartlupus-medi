"use client";

import { useState, useRef } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface BorangUploadProps {
  ticketId: string;
  onUploaded: (path: string) => void;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

export default function BorangUpload({ ticketId, onUploaded }: BorangUploadProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error("Format fail tidak sah. Sila pilih PDF, JPG atau PNG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Saiz fail terlalu besar. Maksimum 10MB.");
      return;
    }

    setLoading(true);
    try {
      const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const path = `borang_ca/${ticketId}/borang-ca.${ext}`;

      const { error } = await supabase.storage
        .from("disposal-files")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;

      const { error: attachError } = await supabase.rpc("attach_disposal_borang_ca", {
        p_ticket_id: ticketId,
        p_borang_path: path,
      });
      if (attachError) throw attachError;

      onUploaded(path);
      toast.success("Borang CA berjaya dimuat naik.");
    } catch {
      toast.error("Gagal memuat naik Borang CA.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed py-8 transition-all active:scale-[0.99]",
          loading
            ? "bg-[var(--muted)] border-[var(--border)] cursor-not-allowed"
            : "bg-[var(--surface)] border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)]"
        )}
      >
        {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <FileText className="h-7 w-7" />}
        <span className="text-body font-semibold">
          {loading ? "Sedang memuat naik..." : "Muat Naik Borang CA"}
        </span>
        {!loading && <p className="text-caption opacity-60">Format PDF, JPG atau PNG (Maks 10MB)</p>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
