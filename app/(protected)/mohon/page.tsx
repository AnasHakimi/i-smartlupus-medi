"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Package } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { AssetCondition } from "@/lib/supabase/types";
import { ASSET_CONDITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MohonPage() {
  const router = useRouter();
  const supabase = createClient();

  const [assetName, setAssetName] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [assetCondition, setAssetCondition] = useState<AssetCondition>("rosak");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!assetName.trim()) {
      toast.error("Sila masukkan nama aset.");
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

      const { data: ticket, error: insertError } = await supabase
        .from("disposal_tickets")
        .insert({
          asset_name: assetName.trim(),
          inventory_id: inventoryId.trim() || null,
          asset_condition: assetCondition,
          location: location.trim() || null,
          created_by: user.id,
        })
        .select("id, ticket_no")
        .single();

      if (insertError || !ticket) {
        toast.error("Permohonan gagal dihantar. Sila cuba lagi.");
        return;
      }

      await supabase.from("audit_logs").insert({
        ticket_id: ticket.id,
        action: "permohonan_dibuat",
        new_value: "menunggu_semakan",
        performed_by: user.id,
      });

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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Permohonan Baru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mohon pelupusan aset perubatan
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Aset */}
            <div className="space-y-1.5">
              <label
                htmlFor="asset-name"
                className="block text-sm font-medium text-slate-700"
              >
                Nama Aset{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="asset-name"
                type="text"
                required
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Cth: Kerusi Roda Pesakit"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* No. Inventori */}
            <div className="space-y-1.5">
              <label
                htmlFor="inventory-id"
                className="block text-sm font-medium text-slate-700"
              >
                No. Inventori
              </label>
              <input
                id="inventory-id"
                type="text"
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
                placeholder="Cth: INV-2024-001"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Keadaan Aset */}
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-700">
                Keadaan Aset{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </span>
              <div className="flex gap-3">
                {(Object.keys(ASSET_CONDITIONS) as AssetCondition[]).map(
                  (condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => setAssetCondition(condition)}
                      className={cn(
                        "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                        assetCondition === condition
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600"
                      )}
                    >
                      {ASSET_CONDITIONS[condition]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Lokasi */}
            <div className="space-y-1.5">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-slate-700"
              >
                Lokasi
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Cth: Wad 3A, Tingkat 2"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Menghantar..." : "Hantar Permohonan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
