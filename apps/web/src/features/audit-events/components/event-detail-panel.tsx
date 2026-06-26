import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import type { AuditEventRow } from "@/src/features/audit-events/domain/types";
import { getAuditEventsCopy } from "@/src/features/audit-events/product/audit-product-copy";

interface EventDetailPanelProps {
  event: AuditEventRow | null;
  onClose: () => void;
}

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  if (!event) {
    return null;
  }

  const copy = getAuditEventsCopy();

  return (
    <DialogContent aria-label="Event detail modal" className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[var(--foreground)]">
            {copy.detailTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--muted)]">
            {copy.detailDescription}
          </DialogDescription>
        </DialogHeader>
        <Button onClick={onClose} size="sm" type="button" variant="ghost">
          {copy.detailCloseLabel}
        </Button>
      </div>

      <dl className="grid gap-4">
        <DetailItem label={copy.detailLabels.event} value={event.event} />
        <DetailItem label={copy.detailLabels.created} value={event.createdAt} />
        <DetailItem label={copy.detailLabels.actor} value={event.actor} />
        <DetailItem label={copy.detailLabels.target} value={event.target} />
        <div className="grid gap-2">
          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            {copy.detailLabels.metadata}
          </dt>
          <dd className="m-0 overflow-x-auto rounded-lg bg-[var(--panel-subtle)] p-3 text-sm">
            <pre className="m-0 whitespace-pre-wrap break-words font-mono">{event.metadata}</pre>
          </dd>
        </div>
      </dl>
    </DialogContent>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="m-0 text-sm text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
