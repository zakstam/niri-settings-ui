import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { KeyRecorder } from "./key-recorder";
import { ActionPicker } from "./action-picker";
import type { KeyBinding } from "@/lib/types";

interface BindingEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binding: KeyBinding;
  onSave: (binding: KeyBinding) => void;
}

export function BindingEditor({
  open,
  onOpenChange,
  binding,
  onSave,
}: BindingEditorProps) {
  const [draft, setDraft] = useState<KeyBinding>(binding);

  function updateDraft(updates: Partial<KeyBinding>) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  function handleSave() {
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {binding.key ? "Edit Key Binding" : "Add Key Binding"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Key Combination</Label>
            <KeyRecorder
              value={draft.key}
              onChange={(key) => updateDraft({ key })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Action</Label>
            <ActionPicker
              value={draft.action}
              onChange={(action) => updateDraft({ action })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Action Arguments</Label>
            <Input
              value={draft.actionArgs.join(" ")}
              placeholder='e.g. "alacritty" or "+10%"'
              onChange={(e) => {
                const val = e.target.value;
                const args = val ? val.split(/\s+/) : [];
                updateDraft({ actionArgs: args });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Space-separated arguments for the action
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Properties</Label>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Repeat</p>
                <p className="text-xs text-muted-foreground">
                  Allow key repeat when held
                </p>
              </div>
              <Switch
                checked={draft.repeat ?? true}
                onCheckedChange={(v) =>
                  updateDraft({ repeat: v === true ? null : false })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Allow When Locked</p>
                <p className="text-xs text-muted-foreground">
                  Works even when the session is locked
                </p>
              </div>
              <Switch
                checked={draft.allowWhenLocked ?? false}
                onCheckedChange={(v) =>
                  updateDraft({ allowWhenLocked: v || null })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Allow Inhibiting</p>
                <p className="text-xs text-muted-foreground">
                  Can be inhibited by applications
                </p>
              </div>
              <Switch
                checked={draft.allowInhibiting ?? true}
                onCheckedChange={(v) =>
                  updateDraft({ allowInhibiting: v === true ? null : false })
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm">Cooldown (ms)</p>
                <Input
                  type="number"
                  value={draft.cooldownMs ?? ""}
                  placeholder="None"
                  className="w-24"
                  min={0}
                  onChange={(e) =>
                    updateDraft({
                      cooldownMs: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Rate-limit how often this bind triggers
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm">Hotkey Overlay Title</p>
                  <Switch
                    checked={draft.hotkeyOverlayTitle !== undefined}
                    onCheckedChange={(v) =>
                      updateDraft({
                        hotkeyOverlayTitle: v ? "" : undefined,
                      })
                    }
                  />
                </div>
              </div>
              {draft.hotkeyOverlayTitle !== undefined && (
                <Input
                  value={draft.hotkeyOverlayTitle ?? ""}
                  placeholder="Title shown in overlay (empty = null)"
                  onChange={(e) =>
                    updateDraft({
                      hotkeyOverlayTitle: e.target.value || null,
                    })
                  }
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!draft.key || !draft.action}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
