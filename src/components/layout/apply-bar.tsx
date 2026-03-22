import { useState } from "react";
import { useConfig } from "@/lib/config-context";
import { getConfigDiff } from "@/lib/tauri";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
} from "spatial-grid-nav/primitives";
import { cn } from "@/lib/utils";
import { IconCheck, IconEye, IconX } from "@tabler/icons-react";

export function ApplyBar() {
  const { config, isDirty, applyChanges, discardChanges } = useConfig();
  const [diff, setDiff] = useState<string>("");
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function handlePreview() {
    if (config === null) return;
    try {
      setIsLoadingDiff(true);
      const result = await getConfigDiff(config);
      setDiff(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setDiff(`Error loading diff:\n${message}`);
    } finally {
      setIsLoadingDiff(false);
    }
  }

  async function handleApply() {
    try {
      setIsApplying(true);
      await applyChanges();
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 left-0 z-40 transition-all duration-300 ease-out",
        isDirty
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      {/* Warm accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent-color/30 to-transparent" />

      <div className="glass-surface border-t border-glass-border px-6 py-3.5">
        <div className="flex items-center justify-end gap-3">
          <div className="mr-auto flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-accent-color" />
            <span className="text-[11px] font-medium text-muted-foreground">
              Unsaved changes
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            tabIndex={-1}
            className="text-muted-foreground"
            onClick={discardChanges}
          >
            <IconX size={14} />
            Discard
          </Button>

          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger
              tabIndex={-1}
              render={<Button variant="outline" size="sm" />}
              onClick={() => void handlePreview()}
            >
              <IconEye size={14} />
              Preview
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configuration Diff</DialogTitle>
                <DialogDescription>
                  Changes that will be written to your niri config file.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <pre className="whitespace-pre-wrap rounded-lg bg-background p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {isLoadingDiff ? "Loading diff..." : diff || "No changes"}
                </pre>
              </ScrollArea>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  tabIndex={-1}
                  onClick={() => setPreviewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  tabIndex={-1}
                  onClick={() => {
                    setPreviewOpen(false);
                    void handleApply();
                  }}
                >
                  Apply Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            tabIndex={-1}
            onClick={() => void handleApply()}
            disabled={isApplying}
          >
            <IconCheck size={14} />
            {isApplying ? "Applying..." : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
