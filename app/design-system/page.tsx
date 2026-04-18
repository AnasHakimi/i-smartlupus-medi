"use client";

import {
  Check,
  Plus,
  Trash2,
  CircleDashed,
  Home,
  FileText,
  ClipboardCheck,
  User,
  Inbox,
  Clock,
  ArrowUpRight,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { ListItem } from "@/components/ui/list-item";
import { BentoCard } from "@/components/ui/bento-card";
import { Modal } from "@/components/ui/modal";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Stat } from "@/components/ui/stat";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">
      {children}
    </p>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-10">
      <span className="h-px flex-1 bg-[var(--border)]" />
      <SectionLabel>{label}</SectionLabel>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh">
      {/* Sticky page chrome — solid branded emerald */}
      <header className="sticky top-0 z-30 bg-emerald-600 dark:bg-emerald-800 text-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-footnote">
            <span className="font-bold text-white tracking-tight">i-SMARTLUPUS</span>
            <span aria-hidden className="text-white/50">/</span>
            <span className="text-white/70">Reka Bentuk</span>
            <span aria-hidden className="text-white/50">/</span>
            <span className="text-white">Primitive Demo</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 pb-24">
        {/* Hero block — branded tinted surface, not transparent */}
        <section className="mt-8 relative rounded-2xl overflow-hidden border border-[var(--border-strong)] shadow-sm">
          <div
            className="relative p-6 md:p-10"
            style={{
              background:
                "linear-gradient(135deg, var(--surface-tinted) 0%, var(--surface-elevated) 100%)",
            }}
          >
            {/* Decorative branded glow */}
            <div
              aria-hidden
              className="absolute -top-20 -right-10 w-64 h-64 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-caption font-semibold tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                SISTEM REKA BENTUK · v1.0
              </div>
              <h1 className="mt-4 text-display font-semibold tracking-tight text-[var(--fg)]">
                iOS-grade primitive kit <br />untuk i-SMARTLUPUS
              </h1>
              <p className="mt-3 text-body text-[var(--fg-muted)] max-w-2xl">
                Semua primitive di bawah digunakan dalam skrin sebenar aplikasi.
                Bertukar antara tema terang dan gelap di kanan atas.
              </p>
            </div>
          </div>
        </section>

        {/* COMPOSITION — fake dashboard preview */}
        <SectionDivider label="Pratonton · Papan Pemuka" />

        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-title-1 font-semibold">Selamat pagi, Anaskimi</h2>
              <p className="text-footnote text-[var(--fg-muted)]">
                Jumaat, 18 April 2026 · 6 permohonan aktif
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">
                <Bell className="h-3.5 w-3.5" />
                Notifikasi
              </Button>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                Mohon Baru
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <BentoCard>
              <Stat
                label="Menunggu Semakan"
                value={12}
                delta={{ value: 8.3, direction: "up" }}
                trend={[4, 6, 5, 8, 9, 11, 12]}
              />
            </BentoCard>
            <BentoCard>
              <Stat
                label="Dalam Pelaksanaan"
                value={5}
                delta={{ value: 2.1, direction: "down" }}
                trend={[8, 7, 6, 7, 6, 5, 5]}
              />
            </BentoCard>
            <BentoCard>
              <Stat
                label="Selesai Bulan Ini"
                value={47}
                delta={{ value: 24.5, direction: "up" }}
                trend={[2, 5, 8, 12, 18, 32, 47]}
              />
            </BentoCard>
            <BentoCard>
              <Stat
                label="Kadar Lulus"
                value="92%"
                delta={{ value: 3.2, direction: "up" }}
                trend={[85, 87, 88, 90, 91, 92, 92]}
              />
            </BentoCard>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <BentoCard span={2} className="md:col-span-2">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-footnote text-[var(--fg-muted)]">Aktiviti</p>
                  <p className="text-title-3 font-semibold mt-0.5">Permohonan terkini</p>
                </div>
                <Button size="sm" variant="ghost">
                  Lihat semua
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="divide-y divide-[var(--border)] -mx-5 -mb-5">
                <ListItem
                  leading={<Avatar name="Ali Bin Ahmad" role="pemohon" />}
                  title="PC Dell Optiplex 7070"
                  subtitle={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3 inline" /> 2 jam lepas · Ali Bin Ahmad
                    </span>
                  }
                  trailing={<Chip tone="reviewing">Semakan</Chip>}
                  onClick={() => {}}
                />
                <ListItem
                  leading={<Avatar name="Puan Siti" role="penyemak" />}
                  title="HP LaserJet M402"
                  subtitle={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3 inline" /> 4 jam lepas · Puan Siti
                    </span>
                  }
                  trailing={<Chip tone="executing">Pelaksanaan</Chip>}
                  onClick={() => {}}
                />
                <ListItem
                  leading={<Avatar name="Encik Rahman" role="pelulus" />}
                  title="Monitor Samsung S24F350"
                  subtitle={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3 inline" /> Semalam · Encik Rahman
                    </span>
                  }
                  trailing={<Chip tone="done" icon={<Check />}>Selesai</Chip>}
                  onClick={() => {}}
                />
              </div>
            </BentoCard>

            <BentoCard>
              <p className="text-footnote text-[var(--fg-muted)]">Ahli Pasukan</p>
              <p className="text-title-3 font-semibold mt-0.5 mb-4">Unit Aset</p>
              <div className="flex -space-x-2 mb-3">
                <Avatar name="Ali Bin Ahmad" role="pemohon" className="ring-2 ring-[var(--surface)]" />
                <Avatar name="Puan Siti" role="penyemak" className="ring-2 ring-[var(--surface)]" />
                <Avatar name="Encik Rahman" role="pelulus" className="ring-2 ring-[var(--surface)]" />
                <Avatar name="Siti Aminah" role="pentadbir" className="ring-2 ring-[var(--surface)]" />
              </div>
              <p className="text-footnote text-[var(--fg-muted)]">
                4 ahli aktif hari ini
              </p>
            </BentoCard>
          </div>
        </section>

        {/* PRIMITIVES */}
        <SectionDivider label="Primitive · Blok Asas" />

        <section className="space-y-4">
          <h2 className="text-title-2 font-semibold">Buttons</h2>
          <div className="space-y-4">
            <div>
              <p className="text-footnote text-[var(--fg-muted)] mb-2">
                <code>size=&quot;md&quot;</code> (default) · 36px · dense inline — use this almost always
              </p>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive"><Trash2 className="h-3.5 w-3.5" />Padam</Button>
                <Button variant="ghost">Ghost</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
            </div>
            <div>
              <p className="text-footnote text-[var(--fg-muted)] mb-2">
                <code>size=&quot;lg&quot;</code> · 48px · full-width sticky submit (login, form bottom bar)
              </p>
              <Button size="lg" className="w-full sm:w-auto">Hantar Permohonan</Button>
            </div>
            <div>
              <p className="text-footnote text-[var(--fg-muted)] mb-2">
                <code>size=&quot;sm&quot;</code> · 32px · ultra-dense (table rows)
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Simpan</Button>
                <Button size="sm" variant="secondary">Edit</Button>
                <Button size="sm" variant="destructive">Padam</Button>
                <Button size="sm" variant="ghost">Batal</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-title-2 font-semibold">Inputs</h2>
          <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
            <Input label="Nama Penuh" helper="Seperti dalam Kad Pengenalan" required />
            <Input label="No. Telefon" helper="Tanpa sempang" />
            <Input label="Emel" error="Format emel tidak sah" defaultValue="ali@" />
            <Input label="Disabled" disabled placeholder="Tidak boleh diedit" />
          </div>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-title-2 font-semibold">Chips</h2>
          <div className="flex flex-wrap gap-2">
            <Chip tone="pending" icon={<CircleDashed />}>Permohonan</Chip>
            <Chip tone="reviewing">Semakan</Chip>
            <Chip tone="executing">Pelaksanaan</Chip>
            <Chip tone="done" icon={<Check />}>Selesai</Chip>
            <Chip tone="rejected">Ditolak</Chip>
            <Chip tone="neutral">Neutral</Chip>
          </div>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-title-2 font-semibold">Avatars</h2>
          <div className="flex flex-wrap items-end gap-4">
            <Avatar name="Ali Bin Ahmad" size="sm" />
            <Avatar name="Puan Siti" role="penyemak" />
            <Avatar name="Encik Rahman" role="pelulus" size="lg" />
            <Avatar name="Siti Aminah" role="pentadbir" size="lg" />
            <Avatar name="Makcik" role="pemohon" size="lg" />
          </div>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-title-2 font-semibold">List items (flat iOS)</h2>
          <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
            <ListItem
              leading={<Avatar name="Ali Bin Ahmad" role="pemohon" />}
              title="PC Dell Optiplex 7070"
              subtitle="Ali Bin Ahmad · 2j lepas"
              trailing={<Chip tone="reviewing">Semakan</Chip>}
              onClick={() => {}}
            />
            <ListItem
              leading={<Avatar name="Puan Siti" role="penyemak" />}
              title="HP LaserJet M402"
              subtitle="Puan Siti · 4j lepas"
              trailing={<Chip tone="done">Selesai</Chip>}
              onClick={() => {}}
            />
            <ListItem
              title="Read-only row (no chevron, no hover)"
              subtitle="Demonstrates non-interactive variant"
            />
          </div>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-title-2 font-semibold">Empty state</h2>
          <EmptyState
            icon={<Inbox />}
            title="Tiada permohonan hari ini"
            description="Apabila pengguna menghantar permohonan pelupusan, ia akan muncul di sini."
            action={{ label: "+ Mohon Baru", onClick: () => {} }}
          />
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-title-2 font-semibold">Modal</h2>
          <Modal
            trigger={<Button variant="destructive"><Trash2 className="h-3.5 w-3.5" />Padam Permohonan</Button>}
            title="Padam permohonan?"
            description="Tindakan ini tidak boleh dibatalkan."
          >
            <div className="flex gap-3 justify-end mt-2">
              <Button variant="secondary">Batal</Button>
              <Button variant="destructive">Padam</Button>
            </div>
          </Modal>
        </section>

        <section className="space-y-4 mt-10 pb-24">
          <h2 className="text-title-2 font-semibold">Bottom nav</h2>
          <p className="text-footnote text-[var(--fg-muted)]">
            Sentiasa tersemat bahagian bawah pada mobile. Skrol ke bawah untuk lihat safe-area padding.
          </p>
        </section>
      </main>

      <BottomNav
        items={[
          { href: "/dashboard", label: "Utama", Icon: Home },
          { href: "/mohon", label: "Mohon", Icon: Plus },
          { href: "/semakan", label: "Semakan", Icon: ClipboardCheck },
          { href: "/semua", label: "Semua", Icon: FileText },
          { href: "/profil", label: "Profil", Icon: User },
        ]}
      />
    </div>
  );
}
