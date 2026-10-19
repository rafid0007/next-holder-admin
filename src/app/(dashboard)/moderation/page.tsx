"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareWarning, UserX } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Drawer, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, UserCell,
} from "@/components/ui/misc";
import { ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { ApiError } from "@/lib/api/client";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import {
  listComplaints, listProvisionalReports, resolveProvisionalReport, updateComplaint,
} from "@/lib/api/admin";
import type { BookingComplaint, ProvisionalReport } from "@/lib/api/admin-types";
import { formatDateTime, humanize, number, relativeTime } from "@/lib/utils";

export default function ModerationPage() {
  return (
    <RequirePermission codes={["reports.view", "complaints.view"]}>
      <Moderation />
    </RequirePermission>
  );
}

function Moderation() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState(can("complaints.view") ? "complaints" : "reports");

  return (
    <>
      <PageHeader
        title="Moderation"
        description="Booking complaints and reports filed against provisional tenants."
      />
      <Card>
        <Tabs
          items={[
            ...(can("complaints.view") ? [{ id: "complaints", label: "Complaints" }] : []),
            ...(can("reports.view") ? [{ id: "reports", label: "Tenant reports" }] : []),
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />
        {tab === "complaints" ? <Complaints /> : <Reports />}
      </Card>
    </>
  );
}

/* ------------------------------ complaints ------------------------------ */

function Complaints() {
  const { can } = useAdminSession();
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [open, setOpen] = useState<BookingComplaint | null>(null);

  const feed = useApi(
    useCallback(
      () =>
        listComplaints({
          status: status === "all" ? undefined : status,
          priority: priority === "all" ? undefined : priority,
        }),
      [status, priority],
    ),
  );
  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);

  const columns: Column<BookingComplaint>[] = [
    {
      key: "description",
      header: "Complaint",
      cell: (row) => (
        <span className="block max-w-72">
          <span className="text-ink block truncate text-[13px] font-medium">{row.description}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {humanize(row.category)} · booking #{row.bookingId} · {relativeTime(row.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: "property",
      header: "Property",
      hideOnMobile: true,
      cell: (row) => (
        <Link
          href={`/properties/${row.propertyId}`}
          className="focus-ring text-ink-muted block max-w-40 truncate text-[13px] hover:underline"
        >
          {row.propertyTitle}
        </Link>
      ),
    },
    {
      key: "from",
      header: "Raised by",
      hideOnMobile: true,
      cell: (row) => <UserCell name={row.submittedBy.fullName} meta={row.submittedBy.email} />,
    },
    { key: "priority", header: "Priority", cell: (row) => <PriorityBadge priority={row.priority} /> },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <Button size="sm" variant="subtle" onClick={() => setOpen(row)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="all">Any status</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
        <Select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-auto">
          <option value="all">Any priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <span className="text-ink-subtle ml-auto text-[13px]">
          {number(feed.data?.count ?? 0)} total
        </span>
      </FilterBar>

      {feed.error ? (
        <CardBody>
          <ErrorState error={feed.error} onRetry={feed.refetch} resource="complaints" />
        </CardBody>
      ) : feed.loading && !feed.data ? (
        <TableSkeleton rows={5} columns={5} />
      ) : rows.length === 0 ? (
        <CardBody>
          <EmptyState
            icon={<MessageSquareWarning className="size-5" />}
            title="No complaints"
            description="Complaints raised against bookings land here."
          />
        </CardBody>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
      )}

      <ComplaintDrawer
        complaint={open}
        canManage={can("complaints.manage")}
        onClose={() => setOpen(null)}
        onChanged={feed.refetch}
      />
    </>
  );
}

function ComplaintDrawer({
  complaint,
  canManage,
  onClose,
  onChanged,
}: {
  complaint: BookingComplaint | null;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  async function save(status?: string) {
    if (!complaint) return;
    setBusy(true);
    setFailure(null);
    try {
      await updateComplaint(complaint.id, {
        status,
        adminNote: note.trim() || undefined,
      });
      setNote("");
      onChanged();
      onClose();
    } catch (caught) {
      setFailure(caught instanceof ApiError ? caught : new ApiError(0, "Could not update"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={complaint != null}
      onClose={onClose}
      title={complaint ? `Complaint #${complaint.id}` : ""}
      subtitle={complaint?.propertyTitle}
      footer={
        canManage && complaint ? (
          <>
            <Button disabled={busy} onClick={() => save("in_progress")}>
              Mark in progress
            </Button>
            <Button variant="primary" disabled={busy} onClick={() => save("resolved")}>
              Resolve
            </Button>
          </>
        ) : null
      }
    >
      {complaint && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <Badge tone="neutral">{humanize(complaint.category)}</Badge>
          </div>

          {failure && <InlineError error={failure} />}

          <p className="text-ink-muted text-[13px] leading-6">{complaint.description}</p>

          <DefinitionList
            items={[
              { label: "Booking", value: `#${complaint.bookingId}` },
              { label: "Property", value: complaint.propertyTitle },
              { label: "Raised by", value: complaint.submittedBy.fullName },
              { label: "Landlord", value: complaint.landlord.fullName },
              { label: "Opened", value: formatDateTime(complaint.createdAt) },
              { label: "Updated", value: formatDateTime(complaint.updatedAt) },
            ]}
          />

          {complaint.ownerResolutionNote && (
            <div className="bg-surface-muted border-line rounded-xl border p-3.5">
              <p className="text-ink-subtle text-xs">Landlord&rsquo;s note</p>
              <p className="text-ink-muted mt-1 text-[13px] leading-5">
                {complaint.ownerResolutionNote}
              </p>
            </div>
          )}

          {complaint.adminNote && (
            <div className="bg-brand-soft rounded-xl p-3.5">
              <p className="text-brand-ink text-xs font-medium">Staff note</p>
              <p className="text-ink mt-1 text-[13px] leading-5">{complaint.adminNote}</p>
            </div>
          )}

          {canManage && (
            <Field label="Add a staff note" hint="Internal only — the landlord never sees it.">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Called the landlord, awaiting a response."
              />
            </Field>
          )}
        </div>
      )}
    </Drawer>
  );
}

/* --------------------------- provisional reports ------------------------ */

function Reports() {
  const { can } = useAdminSession();
  const [status, setStatus] = useState("open");
  const [resolving, setResolving] = useState<ProvisionalReport | null>(null);

  const feed = useApi(
    useCallback(
      () => listProvisionalReports({ status: status === "all" ? undefined : status }),
      [status],
    ),
  );
  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);

  const columns: Column<ProvisionalReport>[] = [
    {
      key: "tenant",
      header: "Provisional tenant",
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <UserCell name={row.provisionalTenant.fullName} meta={row.provisionalTenant.phoneNumber} />
          {row.tenantReportCount > 1 && (
            <Badge tone="bad">{row.tenantReportCount} reports</Badge>
          )}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (row) => (
        <span className="text-ink-muted block max-w-64 truncate text-[13px]">{row.reason}</span>
      ),
    },
    {
      key: "by",
      header: "Reported by",
      hideOnMobile: true,
      cell: (row) => <UserCell name={row.reportedBy.fullName} meta={row.reportedBy.email} />,
    },
    {
      key: "created",
      header: "Filed",
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-muted text-xs">{relativeTime(row.createdAt)}</span>,
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) =>
        row.status === "open" && can("reports.resolve") ? (
          <Button size="sm" variant="subtle" onClick={() => setResolving(row)}>
            Resolve
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <FilterBar>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="open">Open</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </Select>
        <span className="text-ink-subtle ml-auto text-[13px]">
          {number(feed.data?.count ?? 0)} total
        </span>
      </FilterBar>

      {feed.error ? (
        <CardBody>
          <ErrorState error={feed.error} onRetry={feed.refetch} resource="reports" />
        </CardBody>
      ) : feed.loading && !feed.data ? (
        <TableSkeleton rows={5} columns={5} />
      ) : rows.length === 0 ? (
        <CardBody>
          <EmptyState
            icon={<UserX className="size-5" />}
            title="No reports"
            description="Landlords report provisional tenants who do not honour a tenancy."
          />
        </CardBody>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
      )}

      <ResolveModal
        report={resolving}
        onClose={() => setResolving(null)}
        onDone={feed.refetch}
      />
    </>
  );
}

function ResolveModal({
  report,
  onClose,
  onDone,
}: {
  report: ProvisionalReport | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [action, setAction] = useState<"dismiss" | "deactivate_account">("dismiss");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  return (
    <Modal
      open={report != null}
      onClose={onClose}
      size="sm"
      title="Resolve this report"
      description="Deactivating marks every open report against that tenant as actioned."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={action === "deactivate_account" ? "danger" : "primary"}
            disabled={busy}
            onClick={async () => {
              if (!report) return;
              setBusy(true);
              setFailure(null);
              try {
                await resolveProvisionalReport(report.id, action, note || undefined);
                onDone();
                onClose();
                setNote("");
              } catch (caught) {
                setFailure(
                  caught instanceof ApiError ? caught : new ApiError(0, "Could not resolve"),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : action === "dismiss" ? "Dismiss report" : "Deactivate account"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {failure && <InlineError error={failure} />}
        {report && (
          <p className="text-ink-muted text-[13px]">
            <span className="text-ink font-medium">{report.provisionalTenant.fullName}</span> ·{" "}
            {report.tenantReportCount} report{report.tenantReportCount === 1 ? "" : "s"} on file
          </p>
        )}
        <Field label="Action">
          <Select value={action} onChange={(e) => setAction(e.target.value as typeof action)}>
            <option value="dismiss">Dismiss — no further action</option>
            <option value="deactivate_account">Deactivate the provisional account</option>
          </Select>
        </Field>
        <Field label="Note" hint="Optional, stored on the report and the audit log.">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Confirmed with both landlords."
          />
        </Field>
      </div>
    </Modal>
  );
}
