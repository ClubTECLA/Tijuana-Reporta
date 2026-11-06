export type PaginationItem = number | "ellipsis";

export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  const pageCount = Math.max(1, Number.isFinite(totalPages) ? Math.floor(totalPages) : 1);
  const page = Math.min(
    Math.max(1, Number.isFinite(currentPage) ? Math.floor(currentPage) : 1),
    pageCount,
  );

  if (pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (page <= 2) {
    return [1, 2, "ellipsis", pageCount];
  }

  if (page >= pageCount - 1) {
    return [1, "ellipsis", pageCount - 1, pageCount];
  }

  return [1, "ellipsis", page, "ellipsis", pageCount];
}
