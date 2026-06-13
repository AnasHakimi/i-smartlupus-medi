"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, AlertCircle, Camera, FileText } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { AssetCondition, AssetCategory, AssetSubCategory } from "@/lib/supabase/types";
import { ASSET_CONDITIONS, ASSET_CATEGORIES, ASSET_SUB_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MohonPage() {
  const router = useRouter();
  const supabase = createClient();

  const [category, setCategory] = useState<AssetCategory>("harta_modal");
  const [subCategory, setSubCategory] = useState<AssetSubCategory>("alat_perubatan");
  const [serialNo, setSerialNo] = useState("");
  const [assetType, setAssetType] = useState("");
  const [radicareAssetNo, setRadicareAssetNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [assetCondition, setAssetCondition] = useState<AssetCondition>("rosak");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!assetType.trim()) {
      toast.error("Sila masukkan jenis/jenama/model aset.");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Sesi tamat. Sila log masuk semula.");
        return;
      }

      const { data: ticket, error: insertError } = await supabase.rpc(
        "submit_disposal_ticket",
        {
          p_asset_condition: assetCondition,
          p_location: location.trim() || null,
          p_category: category,
          p_sub_category: subCategory,
          p_serial_no: serialNo.trim() || null,
          p_asset_type: assetType.trim(),
          p_radicare_asset_no: radicareAssetNo.trim() || null,
          p_purchase_date: purchaseDate || null,
          p_purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        },
      );

      if (insertError || !ticket) {
        toast.error("Permohonan gagal dihantar. Sila cuba lagi.");
        return;
      }

      toast.success(`Permohonan ${ticket.ticket_no} berjaya dihantar!`);
      router.push("/status");
      router.refresh();
    } catch {
      toast.error("Ralat tidak dijangka. Sila cuba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <header className="py-2">
        <h1 className="text-display font-bold text-[var(--fg)] tracking-tight">
          Permohonan Baru
        </h1>
        <p className="text-body font-medium text-[var(--fg-muted)] mt-1">
          Sila lengkapkan butiran aset
        </p>
      </header>

      {/* Form Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6 shadow-none">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            {/* Kategori Aset */}
            <div className="space-y-2">
              <span className="text-subhead font-medium text-[var(--fg)]">
                Kategori Aset
                <span className="text-[var(--destructive)] ml-0.5" aria-hidden="true">*</span>
              </span>
              <div className="flex gap-2">
                {(Object.keys(ASSET_CATEGORIES) as AssetCategory[]).map((cat) => {
                  const isActive = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex-1 h-11 rounded-md border text-subhead font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
                        isActive
                          ? "bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-sm"
                          : "bg-[var(--bg)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
                      )}
                    >
                      {ASSET_CATEGORIES[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Kategori */}
            <div className="space-y-3">
              <span className="text-subhead font-medium text-[var(--fg)]">
                Sub-Kategori
                <span className="text-[var(--destructive)] ml-0.5" aria-hidden="true">*</span>
              </span>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(ASSET_SUB_CATEGORIES) as AssetSubCategory[]).map((sub) => {
                  const isActive = subCategory === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubCategory(sub)}
                      className={cn(
                        "flex items-center gap-3 px-4 h-12 rounded-md border text-body transition-all active:scale-[0.98]",
                        isActive
                          ? "bg-[var(--primary-tint)] text-[var(--primary)] border-[var(--primary)]"
                          : "bg-[var(--surface)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                        isActive ? "border-[var(--primary)]" : "border-[var(--border-strong)]"
                      )}>
                        {isActive && <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />}
                      </div>
                      {ASSET_SUB_CATEGORIES[sub]}
                    </button>
                  );
                })}
              </div>
            </div>

            {subCategory === "alat_perubatan" && (
              <div className="rounded-md border border-[var(--primary)] bg-[var(--primary-tint)] p-4 space-y-1">
                <p className="text-subhead font-semibold text-[var(--primary)] flex items-center gap-2">
                  <FileText size={16} /> Borang CA (Laporan Kerosakan Aset)
                </p>
                <p className="text-footnote text-[var(--fg-muted)]">
                  Wajib dimuat naik selepas permohonan dihantar, di halaman butiran tiket.
                </p>
              </div>
            )}

            {/* No. Siri Pendaftaran */}
            <Input
              label="No. Siri Pendaftaran"
              required
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="Cth: KKM/HOSP/2024/001"
            />

            {/* Jenis/Jenama/Model Aset */}
            <Input
              label="Jenis/Jenama/Model Aset"
              required
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              placeholder="Cth: Ventilator Dräger Evita V300"
            />

            {/* No. Aset Radicare */}
            <Input
              label="No. Aset Radicare"
              value={radicareAssetNo}
              onChange={(e) => setRadicareAssetNo(e.target.value)}
              placeholder="Cth: RAD-2024-00123"
              helper="Biarkan kosong jika tiada no. aset Radicare."
            />

            {/* Tarikh Perolehan / Tarikh Diterima */}
            <Input
              label="Tarikh Perolehan / Tarikh Diterima"
              required
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />

            {/* Harga Perolehan Asal (RM) */}
            <Input
              label="Harga Perolehan Asal (RM)"
              required
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
            />

            {/* Keadaan Aset */}
            <div className="space-y-2">
              <span className="text-subhead font-medium text-[var(--fg)]">
                Keadaan Aset
                <span className="text-[var(--destructive)] ml-0.5" aria-hidden="true">*</span>
              </span>
              <div className="flex gap-2">
                {(Object.keys(ASSET_CONDITIONS) as AssetCondition[]).map(
                  (condition) => {
                    const isActive = assetCondition === condition;
                    return (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => setAssetCondition(condition)}
                        className={cn(
                          "flex-1 h-11 rounded-md border text-subhead font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
                          isActive
                            ? "bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-sm"
                            : "bg-[var(--bg)] text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
                        )}
                      >
                        {isActive && <AlertCircle size={14} />}
                        {ASSET_CONDITIONS[condition]}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Lokasi */}
            <Input
              label="Lokasi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Cth: Wad 3A, Tingkat 2"
            />
            
            {/* Foto Aset Section */}
            <div className="space-y-2">
              <span className="text-subhead font-medium text-[var(--fg)] flex items-center gap-2">
                <Camera size={16} className="text-[var(--primary)]" />
                Foto Aset (Untuk Dilupuskan)
              </span>
              <p className="text-footnote text-[var(--fg-muted)] mb-4">
                Sila ambil gambar aset sebagai bukti keadaan semasa. Anda boleh memuat naik foto selepas menghantar permohonan di halaman butiran tiket.
              </p>
              <div className="p-4 rounded-md bg-[var(--bg)] border border-[var(--border)] border-dashed text-center">
                 <p className="text-footnote text-[var(--fg-muted)] italic">
                   Fungsi ambil foto di sini akan diaktifkan sebaik sahaja permohonan dihantar.
                 </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              loading={isLoading}
            >
              <Send className="h-5 w-5" />
              Hantar Permohonan
            </Button>
            <p className="text-center text-caption text-[var(--fg-muted)] mt-4">
              Pastikan maklumat aset adalah tepat sebelum menghantar.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
