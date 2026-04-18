/**
 * Map the current pathname to a Malay page title shown in the sticky AppHeader.
 * Order matters: longer/more-specific prefixes listed first.
 */
const routes: Array<{ prefix: string; title: string }> = [
  { prefix: "/semua/",    title: "Butiran Permohonan" }, // /semua/:id
  { prefix: "/dashboard", title: "Papan Pemuka" },
  { prefix: "/mohon",     title: "Mohon Pelupusan" },
  { prefix: "/semakan",   title: "Semakan" },
  { prefix: "/semua",     title: "Semua Permohonan" },
  { prefix: "/status",    title: "Status Permohonan" },
  { prefix: "/pengguna",  title: "Pengguna" },
  { prefix: "/profil",    title: "Profil" },
];

export function getPageTitle(pathname: string): string {
  for (const route of routes) {
    if (pathname.startsWith(route.prefix)) return route.title;
  }
  return "i-SMARTLUPUS";
}
