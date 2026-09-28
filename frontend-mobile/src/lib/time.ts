/** "Hace 18 min" / "Hace 3 h" / "Hace 2 días", a partir de un ISO timestamp. */
export function hace(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const dias = Math.floor(hrs / 24);
  return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
}
