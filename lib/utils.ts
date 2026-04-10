import { IC_DOMAIN } from "./constants";

export function icToEmail(ic: string): string {
  return `${ic}${IC_DOMAIN}`;
}

export function emailToIc(email: string): string {
  return email.replace(IC_DOMAIN, "");
}

export function validateIc(ic: string): boolean {
  return /^\d{12}$/.test(ic);
}

export function formatIc(ic: string): string {
  if (ic.length !== 12) return ic;
  return `${ic.slice(0, 6)}-${ic.slice(6, 8)}-${ic.slice(8)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
