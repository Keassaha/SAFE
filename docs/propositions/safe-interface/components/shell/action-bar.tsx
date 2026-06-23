import { Button } from "@/components/ui/core";

export function ActionBar({
  note,
  cancelLabel = "Annuler",
  confirmLabel,
}: {
  note: string;
  cancelLabel?: string;
  confirmLabel: string;
}) {
  return (
    <div className="fixed bottom-0 left-[230px] right-0 bg-surface/[0.86] backdrop-blur-md border-t border-line px-9 py-4 flex items-center gap-3.5">
      <div className="text-xs text-muted">{note}</div>
      <div className="ml-auto" />
      <Button variant="ghost">{cancelLabel}</Button>
      <Button variant="primary">{confirmLabel}</Button>
    </div>
  );
}
