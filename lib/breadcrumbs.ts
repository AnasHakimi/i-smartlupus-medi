export interface BreadcrumbSegment {
  label: string;
  /** Omitted when this is the current page (last segment). */
  href?: string;
}

const HOME: BreadcrumbSegment = { label: "Papan Pemuka", href: "/dashboard" };

export function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  if (pathname.startsWith("/dashboard")) {
    return [{ label: "Papan Pemuka" }];
  }
  if (pathname.startsWith("/mohon")) {
    return [HOME, { label: "Mohon Pelupusan" }];
  }
  if (pathname.startsWith("/semakan")) {
    return [HOME, { label: "Semakan" }];
  }
  if (pathname.startsWith("/semua/")) {
    return [
      HOME,
      { label: "Semua Permohonan", href: "/semua" },
      { label: "Butiran Permohonan" },
    ];
  }
  if (pathname.startsWith("/semua")) {
    return [HOME, { label: "Semua Permohonan" }];
  }
  if (pathname.startsWith("/status")) {
    return [HOME, { label: "Status Permohonan" }];
  }
  if (pathname.startsWith("/pengguna")) {
    return [HOME, { label: "Pengguna" }];
  }
  if (pathname.startsWith("/profil")) {
    return [HOME, { label: "Profil" }];
  }
  return [{ label: "i-SMARTLUPUS" }];
}
