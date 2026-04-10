import { redirect } from "next/navigation";
import { ClipboardList, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Profile, TicketStatus } from "@/lib/supabase/types";
import StatCard from "@/components/StatCard";

const roleTitle: Record<Profile["role"], string> = {
  admin:     "Papan Pemuka Pentadbir",
  unit_aset: "Papan Pemuka Unit Aset",
  user:      "Papan Pemuka Saya",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Fetch tickets based on role
  const query = supabase.from("disposal_tickets").select("status");
  const { data: tickets } = profile.role === "user"
    ? await query.eq("created_by", user.id)
    : await query;

  const rows = tickets ?? [];

  const count = (status: TicketStatus) =>
    rows.filter((t) => t.status === status).length;

  const total              = rows.length;
  const menunggu_semakan   = count("menunggu_semakan");
  const proses_pelupusan   = count("proses_pelupusan");
  const selesai            = count("selesai");
  const ditolak            = count("ditolak");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          {roleTitle[profile.role as Profile["role"]]}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Selamat datang, {profile.full_name}
        </p>
      </div>

      {/* Main stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Jumlah"
          value={total}
          icon={<ClipboardList size={22} />}
          color="blue"
        />
        <StatCard
          label="Menunggu"
          value={menunggu_semakan}
          icon={<Clock size={22} />}
          color="yellow"
        />
        <StatCard
          label="Proses"
          value={proses_pelupusan}
          icon={<AlertTriangle size={22} />}
          color="orange"
        />
        <StatCard
          label="Selesai"
          value={selesai}
          icon={<CheckCircle size={22} />}
          color="green"
        />
      </div>

      {/* Ditolak card — only shown when there are rejections */}
      {ditolak > 0 && (
        <div className="max-w-xs">
          <StatCard
            label="Ditolak"
            value={ditolak}
            icon={<XCircle size={22} />}
            color="red"
          />
        </div>
      )}
    </div>
  );
}
