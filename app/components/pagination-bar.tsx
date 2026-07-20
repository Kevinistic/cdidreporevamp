"use client";

type PaginationItem = number | "ellipsis";

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage === 1) {
    return [1, 2, "ellipsis", totalPages];
  }

  if (currentPage === 2) {
    return [1, 2, 3, "ellipsis", totalPages];
  }

  if (currentPage === 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage === 4) {
    return [1, "ellipsis", 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage === totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, "ellipsis", totalPages];
  }

  if (currentPage === totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  if (currentPage === totalPages - 1) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  if (currentPage === totalPages) {
    return [1, "ellipsis", totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="flex flex-1 items-center justify-center gap-2 overflow-x-auto px-2 text-sm text-white">
      {paginationItems.map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-1 text-zinc-500">
              ..
            </span>
          );
        }

        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={`min-w-9 rounded-md border px-2 py-1 transition-colors ${
              item === currentPage
                ? "border-white bg-white text-zinc-900"
                : "border-zinc-500 text-white hover:bg-zinc-800"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}