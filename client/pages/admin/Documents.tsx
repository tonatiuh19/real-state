import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Image,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  RefreshCw,
  Download,
  Loader2,
} from "lucide-react";
import { MetaHelmet } from "@/components/MetaHelmet";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminPageMeta } from "@/lib/seo-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAllDocuments,
  deleteDocument,
  downloadDocumentLabeled,
  bulkDownloadDocuments,
  setSearchQuery,
  setFilterType,
  setFilterBroker,
  clearFilters,
} from "@/store/slices/documentsSlice";
import { fetchBrokers } from "@/store/slices/brokersSlice";
import { toast } from "@/hooks/use-toast";

const BASE_URL = "https://disruptinglabs.com/data/api";
const PAGE_SIZE = 30;

const toFullUrl = (path: string) =>
  path ? (path.startsWith("http") ? path : `${BASE_URL}${path}`) : "";

type DocumentRow = {
  id: number;
  task_id: number;
  document_type: "pdf" | "image";
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  task_title: string;
  task_type: string;
  application_number: string;
  broker_id: number;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  broker_first_name: string | null;
  broker_last_name: string | null;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown";
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${kb.toFixed(2)} KB`;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Documents = () => {
  const dispatch = useAppDispatch();
  const {
    documents,
    pagination,
    isLoading,
    searchQuery,
    filterType,
    filterBroker,
  } = useAppSelector((state) => state.documents);
  const { user } = useAppSelector((state) => state.brokerAuth);
  const { brokers } = useAppSelector((state) => state.brokers);

  const hasGlobalDocumentAccess = user?.role === "platform_owner";
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortBy, setSortBy] = React.useState("uploaded_at");
  const [sortDir, setSortDir] = React.useState<"ASC" | "DESC">("DESC");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const doFetch = useCallback(
    (params: {
      page?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
      search?: string;
      filterType?: string;
      filterBroker?: number | null;
    }) => {
      const type = params.filterType ?? filterType;
      const broker = params.filterBroker ?? filterBroker;
      dispatch(
        fetchAllDocuments({
          limit: PAGE_SIZE,
          page: params.page ?? pagination?.page ?? 1,
          sortBy: params.sortBy ?? sortBy,
          sortOrder: params.sortOrder ?? sortDir,
          search: (params.search ?? searchQuery) || undefined,
          filterType: type !== "all" ? type : undefined,
          filterBroker: broker ?? undefined,
        }),
      );
    },
    [
      dispatch,
      filterBroker,
      filterType,
      pagination?.page,
      searchQuery,
      sortBy,
      sortDir,
    ],
  );

  useEffect(() => {
    doFetch({ page: 1 });
    if (hasGlobalDocumentAccess) {
      dispatch(fetchBrokers({ page: 1, limit: 200 }));
    }
  }, [dispatch, hasGlobalDocumentAccess]);

  const brokerOptions = useMemo(() => {
    if (!hasGlobalDocumentAccess) return [];
    return brokers
      .filter((b) => b.status === "active")
      .map((b) => ({
        id: b.id,
        name: `${b.first_name} ${b.last_name}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [brokers, hasGlobalDocumentAccess]);

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      doFetch({ page: 1, search: value });
    }, 300);
  };

  const handleSort = (field: string) => {
    const newDir = sortBy === field && sortDir === "ASC" ? "DESC" : "ASC";
    setSortBy(field);
    setSortDir(newDir);
    doFetch({ page: 1, sortBy: field, sortOrder: newDir });
  };

  const handleDelete = useCallback(
    async (documentId: number) => {
      try {
        await dispatch(deleteDocument(documentId)).unwrap();
        toast({
          title: "Document deleted",
          description: "Document has been removed successfully",
        });
        doFetch({ page: pagination?.page ?? 1 });
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    },
    [dispatch, doFetch, pagination?.page],
  );

  const handleClearFilters = () => {
    dispatch(clearFilters());
    doFetch({
      page: 1,
      search: "",
      filterType: "all",
      filterBroker: null,
    });
  };

  const renderDeleteAction = (doc: DocumentRow) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{doc.original_filename}"? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleDelete(doc.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const columns = useMemo((): DataGridColumn<DocumentRow>[] => {
    const base: DataGridColumn<DocumentRow>[] = [
      {
        key: "select" as any,
        label: "",
        shrink: true,
        render: (doc) => (
          <Checkbox
            checked={selectedIds.has(doc.id)}
            onCheckedChange={(checked) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (checked) next.add(doc.id);
                else next.delete(doc.id);
                return next;
              });
            }}
            aria-label={`Select ${doc.original_filename}`}
          />
        ),
      },
      {
        key: "document_type",
        label: "Type",
        shrink: true,
        render: (doc) =>
          doc.document_type === "pdf" ? (
            <FileText className="h-5 w-5 text-destructive" />
          ) : (
            <Image className="h-5 w-5 text-primary" />
          ),
      },
      {
        key: "original_filename",
        label: "Filename",
        sortable: true,
        className: "min-w-[220px]",
        render: (doc) => (
          <div className="max-w-xs">
            <div className="truncate font-medium">{doc.original_filename}</div>
            <div className="text-xs text-muted-foreground truncate">
              {doc.filename}
            </div>
          </div>
        ),
      },
      {
        key: "task_title",
        label: "Task",
        className: "min-w-[160px]",
        render: (doc) => (
          <div>
            <div className="font-medium">{doc.task_title}</div>
            <Badge variant="outline" className="mt-1 text-xs">
              {doc.task_type.replace("_", " ")}
            </Badge>
          </div>
        ),
      },
      {
        key: "client_first_name",
        label: "Client",
        sortable: true,
        className: "min-w-[160px]",
        render: (doc) => (
          <div>
            <div className="font-medium">
              {doc.client_first_name} {doc.client_last_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {doc.client_email}
            </div>
          </div>
        ),
      },
      {
        key: "application_number",
        label: "Application",
        sortable: true,
        shrink: true,
        render: (doc) => (
          <Badge variant="secondary" className="whitespace-nowrap">
            {doc.application_number}
          </Badge>
        ),
      },
    ];

    if (hasGlobalDocumentAccess) {
      base.push({
        key: "broker_first_name",
        label: "Broker",
        sortable: true,
        className: "min-w-[120px]",
        render: (doc) =>
          doc.broker_first_name && doc.broker_last_name ? (
            <span className="text-sm">
              {doc.broker_first_name} {doc.broker_last_name}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      });
    }

    base.push(
      {
        key: "file_size",
        label: "Size",
        sortable: true,
        shrink: true,
        render: (doc) => formatFileSize(doc.file_size),
      },
      {
        key: "uploaded_at",
        label: "Uploaded",
        sortable: true,
        shrink: true,
        className: "text-sm text-muted-foreground",
        render: (doc) => formatDate(doc.uploaded_at),
      },
      {
        key: "actions",
        label: "Actions",
        shrink: true,
        className: "text-right",
        headerClassName: "text-right",
        render: (doc) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              title="Download labeled file"
              onClick={async () => {
                const result = await dispatch(downloadDocumentLabeled(doc.id));
                if (downloadDocumentLabeled.rejected.match(result)) {
                  toast({
                    title: "Download failed",
                    description: String(result.payload || "Unknown error"),
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a
                href={toFullUrl(doc.file_path)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {renderDeleteAction(doc)}
          </div>
        ),
      },
    );

    return base;
  }, [hasGlobalDocumentAccess, handleDelete, selectedIds, dispatch]);

  const typedDocuments = documents as DocumentRow[];

  return (
    <>
      <MetaHelmet
        {...adminPageMeta("Documents", "Manage client documents and files")}
      />
      <div className="p-6 space-y-6">
        <PageHeader
          icon={<FileText className="h-7 w-7 text-primary" />}
          title="Documents"
          description={
            hasGlobalDocumentAccess
              ? "View and manage all client documents"
              : "View and manage your client documents"
          }
          className="mb-0"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.size === 0 || isBulkDownloading}
                aria-busy={isBulkDownloading}
                onClick={async () => {
                  setIsBulkDownloading(true);
                  try {
                    const result = await dispatch(
                      bulkDownloadDocuments({
                        document_ids: Array.from(selectedIds),
                      }),
                    );
                    if (bulkDownloadDocuments.rejected.match(result)) {
                      toast({
                        title: "Zip download failed",
                        description: String(result.payload || "Unknown error"),
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "Download ready",
                        description: `Zip of ${selectedIds.size} document(s) downloaded`,
                      });
                    }
                  } finally {
                    setIsBulkDownloading(false);
                  }
                }}
              >
                {isBulkDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isBulkDownloading
                  ? "Preparing…"
                  : `Download selected${selectedIds.size ? ` (${selectedIds.size})` : ""}`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={!searchQuery && filterType === "all" && !filterBroker}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => doFetch({ page: pagination?.page ?? 1 })}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          }
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by task, filename, client name, or application..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select
                value={filterType}
                onValueChange={(value: "all" | "pdf" | "image") => {
                  dispatch(setFilterType(value));
                  doFetch({ page: 1, filterType: value });
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDFs Only</SelectItem>
                  <SelectItem value="image">Images Only</SelectItem>
                </SelectContent>
              </Select>
              {hasGlobalDocumentAccess && brokerOptions.length > 0 && (
                <Select
                  value={filterBroker?.toString() || "all"}
                  onValueChange={(value) => {
                    const brokerId = value === "all" ? null : parseInt(value, 10);
                    dispatch(setFilterBroker(brokerId));
                    doFetch({ page: 1, filterBroker: brokerId });
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by broker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brokers</SelectItem>
                    {brokerOptions.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id.toString()}>
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
            <CardDescription>
              {pagination
                ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} documents`
                : typedDocuments.length > 0
                  ? `${typedDocuments.length} documents`
                  : "No documents loaded"}
              {searchQuery && ` matching "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataGrid<DocumentRow>
              data={typedDocuments}
              columns={columns}
              rowKey={(doc) => doc.id}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              pagination={pagination}
              onPageChange={(page) => doFetch({ page })}
              isLoading={isLoading}
              emptyMessage={
                searchQuery || filterType !== "all" || filterBroker
                  ? "No documents match your filters."
                  : "No documents have been uploaded yet."
              }
              mobileCard={(doc) => (
                <div className="rounded-lg border p-4 space-y-2 bg-white shadow-sm">
                  <div className="flex items-start gap-3">
                    {doc.document_type === "pdf" ? (
                      <FileText className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <Image className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {doc.original_filename}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.task_title}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {doc.client_first_name} {doc.client_last_name}
                    </span>
                    <span>{doc.application_number}</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{formatDate(doc.uploaded_at)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" asChild className="h-7">
                      <a
                        href={toFullUrl(doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    {renderDeleteAction(doc)}
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Documents;
