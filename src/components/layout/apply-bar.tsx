import { useState } from "react";
import { useConfig } from "@/lib/config-context";
import { getConfigDiff } from "@/lib/tauri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        "fixed bottom-0 right-0 left-52 z-40 transition-all duration-300 ease-out",
        isDirty
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      {/* Glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber to-transparent opacity-40" />

      <div className="border-t border-border bg-card/90 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-end gap-2.5">
          <div className="mr-auto flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-amber animate-pulse" />
            <span className="text-[12px] font-medium text-muted-foreground">
              Unsaved changes
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={discardChanges}
          >
            <IconX size={14} />
            Discard
          </Button>

          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger
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
                  onClick={() => setPreviewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
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
            onClick={() => void handleApply()}
            disabled={isApplying}
            className="bg-amber text-primary-foreground hover:bg-amber/90 shadow-[0_0_12px_var(--glow)]"
          >
            <IconCheck size={14} />
            {isApplying ? "Applying..." : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
