import type { ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PaginationInfo } from "@shared/api";

// ─── Column definition ───────────────────────────────────────────────────────

export interface DataGridColumn<T> {
  /** Field name — also used as the sort key when `sortable: true` */
  key: string;
  label: string;
  sortable?: boolean;
  /** Applied to both <TableHead> and <TableCell> */
  className?: string;
  /** Override class for the header cell only */
  headerClassName?: string;
  /**
   * Custom cell renderer. When omitted the raw field value is rendered as a
   * string (or "—" when nullish).
   */
  render?: (item: T, index: number) => ReactNode;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  /** Return a stable unique key for each row */
  rowKey: (item: T) => string | number;

  // Sorting — managed by the parent so the parent can dispatch API calls
  sortBy: string;
  sortDir: "ASC" | "DESC";
  onSort: (key: string) => void;

  // Pagination
  pagination?: PaginationInfo | null;
  onPageChange: (page: number) => void;

  isLoading?: boolean;
  /** Shown when `data` is empty and not loading */
  emptyMessage?: string;

  /**
   * Renders a single item as a card for the mobile layout.
   * If omitted the mobile view is hidden (tables-only layout).
   */
  mobileCard?: (item: T) => ReactNode;

  /** CSS min-width applied to the <Table> element — e.g. "820px" */
  tableMinWidth?: string;
  /** Number of columns — used for colspan on empty/loading rows */
  colSpan?: number;
  /** Optional row click handler */
  onRowClick?: (item: T) => void;
}

// ─── Sort icon helper ─────────────────────────────────────────────────────────

function SortIcon({
  column,
  sortBy,
  sortDir,
}: {
  column: string;
  sortBy: string;
  sortDir: "ASC" | "DESC";
}) {
  if (sortBy !== column)
    return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return sortDir === "ASC" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataGrid<T>({
  data,
  columns,
  rowKey,
  sortBy,
  sortDir,
  onSort,
  pagination,
  onPageChange,
  isLoading = false,
  emptyMessage = "No data found.",
  mobileCard,
  tableMinWidth,
  colSpan,
  onRowClick,
}: DataGridProps<T>) {
  const effectiveColSpan = colSpan ?? columns.length;

  // ── Pagination footer ──────────────────────────────────────────────────────
  const paginationFooter = pagination && pagination.totalPages > 1 && (
    <div className="flex items-center justify-between mt-4 px-2 text-sm text-muted-foreground">
      <span>
        Showing {(pagination.page - 1) * pagination.limit + 1}–
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!isLoading && data.length === 0) {
    return (
      <p className="text-center py-10 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* Mobile card list -------------------------------------------------- */}
      {mobileCard && (
        <div className="block lg:hidden space-y-3">
          {data.map((item) => (
            <div key={rowKey(item)}>{mobileCard(item)}</div>
          ))}
        </div>
      )}

      {/* Desktop table ----------------------------------------------------- */}
      <div
        className={cn(
          mobileCard ? "hidden lg:block" : "block",
          "overflow-x-auto",
        )}
      >
        <Table style={tableMinWidth ? { minWidth: tableMinWidth } : undefined}>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap",
                    col.className,
                    col.headerClassName,
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.label}{" "}
                      <SortIcon
                        column={col.key}
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={rowKey(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(item, index)
                      : String(
                          (item as Record<string, unknown>)[col.key] ?? "—",
                        )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination -------------------------------------------------------- */}
      {paginationFooter}
    </>
  );
}
