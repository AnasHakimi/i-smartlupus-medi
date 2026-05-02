"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { icToEmail, validateIc } from "@/lib/utils";
import { formatIcProgressive } from "@/lib/format-ic-progressive";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [ic, setIc] = useState("");
  const [icError, setIcError] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleIcChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    setIc(digits);
    if (icError) setIcError(undefined);
  }

  function handleIcBlur() {
    if (ic.length === 0) {
      setIcError(undefined);
      return;
    }
    if (!validateIc(ic)) {
      setIcError("No. KP mestilah 12 digit.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateIc(ic)) {
      toast.error("No. Kad Pengenalan mestilah 12 digit.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: icToEmail(ic),
      password,
    });
    if (error) {
      toast.error("No. KP atau kata laluan tidak sah.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] font-black text-2xl tracking-tight mb-2">
            iS
          </div>
          <h1 className="text-title-2 font-semibold text-[var(--fg)] tracking-tight">
            i-SMARTLUPUS
          </h1>
          <p className="text-footnote text-[var(--fg-muted)]">
            Sistem Pelupusan Aset Perubatan
          </p>
        </header>

        <div className="space-y-6">
          <div>
            <h2 className="text-display font-semibold text-[var(--fg)] tracking-tight">
              Selamat datang
            </h2>
            <p className="mt-1 text-body text-[var(--fg-muted)]">
              Log masuk dengan No. Kad Pengenalan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="ic"
              label="No. Kad Pengenalan"
              inputMode="numeric"
              autoComplete="username"
              placeholder="Cth: 900101011234"
              value={formatIcProgressive(ic)}
              onChange={handleIcChange}
              onBlur={handleIcBlur}
              error={icError}
              required
              maxLength={14}
            />
            <Input
              id="password"
              label="Kata Laluan"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan kata laluan"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan kata laluan" : "Tunjukkan kata laluan"}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--primary-tint)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={loading || ic.length !== 12 || password.length === 0}
              className="w-full mt-2"
            >
              Log Masuk
            </Button>
          </form>
        </div>

        <p className="text-center text-footnote text-[var(--fg-muted)]">
          Masalah log masuk?{" "}
          <a href="tel:+60312345678" className="text-[var(--primary)] font-medium hover:underline">
            Hubungi Unit Aset
          </a>
        </p>
      </div>
    </main>
  );
}
