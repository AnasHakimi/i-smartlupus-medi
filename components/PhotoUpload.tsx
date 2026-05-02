"use client";

import { useState, useRef } from "react";
import NextImage from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

interface PhotoUploadProps {
  ticketId: string;
  onUploaded: (path: string) => void;
}

export default function PhotoUpload({ ticketId, onUploaded }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Phase 2: MIME and Size validation
    if (!file.type.startsWith("image/")) {
      toast.error("Format fail tidak sah. Sila pilih fail gambar.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // Reduced to 5MB for PWA performance
      toast.error("Saiz gambar terlalu besar. Maksimum 5MB.");
      return;
    }

    setLoading(true);
    try {
      const compressed = await compressImage(file);
      const path = `photos/${ticketId}/asset-photo.jpg`;

      const { error } = await supabase.storage
        .from("disposal-files")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });

      if (error) throw error;

      // Phase 4: Use database function for security
      const { error: attachError } = await supabase.rpc(
        "attach_disposal_photo",
        {
          p_ticket_id: ticketId,
          p_image_path: path,
        },
      );

      if (attachError) throw attachError;

      const { data, error: signedUrlError } = await supabase.storage
        .from("disposal-files")
        .createSignedUrl(path, 60 * 60);

      if (signedUrlError) throw signedUrlError;

      setPreview(data.signedUrl);
      onUploaded(path);
      toast.success("Foto aset berjaya dimuat naik.");
    } catch {
      toast.error("Gagal memuat naik foto.");
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative group animate-in">
          <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden border border-[var(--border)]">
            <NextImage 
              src={preview} 
              alt="Pratonton foto aset" 
              fill 
              className="object-cover" 
              unoptimized 
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white transition-all active:scale-95"
            aria-label="Buang gambar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed py-10 transition-all active:scale-[0.99]",
            loading 
              ? "bg-[var(--muted)] border-[var(--border)] cursor-not-allowed" 
              : "bg-[var(--surface)] border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)]"
          )}
        >
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <div className="p-4 rounded-full bg-[var(--bg)] text-[var(--fg-muted)] transition-colors group-hover:bg-white">
              <Camera className="h-8 w-8" />
            </div>
          )}
          <div className="text-center space-y-1">
            <span className="text-body font-semibold">
              {loading ? "Sedang memuat naik..." : "Ambil Foto Aset"}
            </span>
            {!loading && (
              <p className="text-caption opacity-60">Format JPG atau PNG (Maks 5MB)</p>
            )}
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
