import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Switch,
  Label,
  Separator,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "spatial-grid-nav/primitives";
import { IconPlus } from "@tabler/icons-react";
import { SliderInput } from "@/lib/slider-input";
import { MatchEditor } from "./match-editor";
import type { WindowRule, MatchRule, ColumnWidth } from "@/lib/types";

const blockOutFromItems = [
  { label: "None", value: "none" },
  { label: "Screen Capture", value: "screen-capture" },
  { label: "Screencast", value: "screencast" },
];

const widthTypeItems = [
  { label: "Proportion", value: "proportion" },
  { label: "Fixed", value: "fixed" },
];

interface RuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: WindowRule;
  onSave: (rule: WindowRule) => void;
}

export function RuleEditor({ open, onOpenChange, rule, onSave }: RuleEditorProps) {
  const [draft, setDraft] = useState<WindowRule>({ ...rule, matches: rule.matches.map((m) => ({ ...m })), excludes: rule.excludes.map((m) => ({ ...m })) });

  function updateDraft(patch: Partial<WindowRule>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function addMatch() {
    setDraft((prev) => ({
      ...prev,
      matches: [
        ...prev.matches,
        { appId: null, title: null, isFocused: null, isActiveInColumn: null, isFloating: null, isWindowCastTarget: null, isUrgent: null, atStartup: null },
      ],
    }));
  }

  function updateMatch(index: number, match: MatchRule) {
    setDraft((prev) => ({
      ...prev,
      matches: prev.matches.map((m, i) => (i === index ? match : m)),
    }));
  }

  function removeMatch(index: number) {
    setDraft((prev) => ({
      ...prev,
      matches: prev.matches.filter((_, i) => i !== index),
    }));
  }

  function addExclude() {
    setDraft((prev) => ({
      ...prev,
      excludes: [
        ...prev.excludes,
        { appId: null, title: null, isFocused: null, isActiveInColumn: null, isFloating: null, isWindowCastTarget: null, isUrgent: null, atStartup: null },
      ],
    }));
  }

  function updateExclude(index: number, match: MatchRule) {
    setDraft((prev) => ({
      ...prev,
      excludes: prev.excludes.map((m, i) => (i === index ? match : m)),
    }));
  }

  function removeExclude(index: number) {
    setDraft((prev) => ({
      ...prev,
      excludes: prev.excludes.filter((_, i) => i !== index),
    }));
  }

  function handleSave() {
    onSave(draft);
    onOpenChange(false);
  }

  // Determine default column width state
  const dcwState =
    draft.defaultColumnWidth == null
      ? "none"
      : draft.defaultColumnWidth.length === 0
        ? "empty"
        : "custom";

  const dcwValue =
    draft.defaultColumnWidth != null && draft.defaultColumnWidth.length > 0
      ? draft.defaultColumnWidth[0]
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Window Rule</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-5 pr-1">
            {/* Match conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Match Conditions</Label>
                <Button variant="outline" size="xs" onClick={addMatch}>
                  <IconPlus size={14} data-icon="inline-start" />
                  Add Match
                </Button>
              </div>
              {draft.matches.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No match conditions. This rule will apply to all windows.
                </p>
              ) : (
                <div className="space-y-2">
                  {draft.matches.map((match, index) => (
                    <MatchEditor
                      key={index}
                      match={match}
                      onChange={(m) => updateMatch(index, m)}
                      onRemove={() => removeMatch(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Exclude conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Exclude Conditions</Label>
                <Button variant="outline" size="xs" onClick={addExclude}>
                  <IconPlus size={14} data-icon="inline-start" />
                  Add Exclude
                </Button>
              </div>
              {draft.excludes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No exclude conditions.
                </p>
              ) : (
                <div className="space-y-2">
                  {draft.excludes.map((match, index) => (
                    <MatchEditor
                      key={index}
                      match={match}
                      onChange={(m) => updateExclude(index, m)}
                      onRemove={() => removeExclude(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Properties */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Properties</Label>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Open Floating</Label>
                <Switch
                  checked={draft.openFloating ?? false}
                  onCheckedChange={(v) => updateDraft({ openFloating: v || null })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Open Maximized</Label>
                <Switch
                  checked={draft.openMaximized ?? false}
                  onCheckedChange={(v) => updateDraft({ openMaximized: v || null })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Open Fullscreen</Label>
                <Switch
                  checked={draft.openFullscreen ?? false}
                  onCheckedChange={(v) => updateDraft({ openFullscreen: v || null })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Clip to Geometry</Label>
                <Switch
                  checked={draft.clipToGeometry ?? false}
                  onCheckedChange={(v) => updateDraft({ clipToGeometry: v || null })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Draw Border with Background</Label>
                <Switch
                  checked={draft.drawBorderWithBackground ?? false}
                  onCheckedChange={(v) =>
                    updateDraft({ drawBorderWithBackground: v || null })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Corner Radius</Label>
                <Input
                  type="number"
                  value={draft.geometryCornerRadius ?? ""}
                  placeholder="Not set"
                  min={0}
                  max={100}
                  className="w-24"
                  onChange={(e) =>
                    updateDraft({
                      geometryCornerRadius:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Opacity</Label>
                <SliderInput
                  value={draft.opacity ?? 1}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => updateDraft({ opacity: v })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Block Out From</Label>
                <Select
                  value={draft.blockOutFrom ?? "none"}
                  onValueChange={(v) =>
                    updateDraft({ blockOutFrom: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {blockOutFromItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Open on Output</Label>
                <Input
                  value={draft.openOnOutput ?? ""}
                  placeholder="Output name"
                  className="w-40"
                  onChange={(e) =>
                    updateDraft({ openOnOutput: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Open on Workspace</Label>
                <Input
                  value={draft.openOnWorkspace ?? ""}
                  placeholder="Workspace name"
                  className="w-40"
                  onChange={(e) =>
                    updateDraft({ openOnWorkspace: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Default Column Width</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={dcwState}
                    onValueChange={(v) => {
                      if (v === "none") {
                        updateDraft({ defaultColumnWidth: null });
                      } else if (v === "empty") {
                        updateDraft({ defaultColumnWidth: [] });
                      } else {
                        updateDraft({
                          defaultColumnWidth: [{ type: "proportion", value: 0.5 }],
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="none">Not Set</SelectItem>
                        <SelectItem value="empty">Empty</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {dcwValue && (
                    <>
                      <Select
                        value={dcwValue.type}
                        onValueChange={(v) =>
                          updateDraft({
                            defaultColumnWidth: [{
                              type: v as ColumnWidth["type"],
                              value:
                                v === "proportion" ? 0.5 : 800,
                            }],
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {widthTypeItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={dcwValue.value}
                        step={dcwValue.type === "proportion" ? 0.1 : 1}
                        className="w-20"
                        onChange={(e) =>
                          updateDraft({
                            defaultColumnWidth: [{
                              ...dcwValue!,
                              value: Number(e.target.value) || 0,
                            }],
                          })
                        }
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Default Window Height</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={
                      draft.defaultWindowHeight == null
                        ? "none"
                        : draft.defaultWindowHeight.length === 0
                          ? "empty"
                          : "custom"
                    }
                    onValueChange={(v) => {
                      if (v === "none") {
                        updateDraft({ defaultWindowHeight: null });
                      } else if (v === "empty") {
                        updateDraft({ defaultWindowHeight: [] });
                      } else {
                        updateDraft({
                          defaultWindowHeight: [{ type: "proportion", value: 0.5 }],
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="none">Not Set</SelectItem>
                        <SelectItem value="empty">Empty</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {draft.defaultWindowHeight != null && draft.defaultWindowHeight.length > 0 && (
                    <>
                      <Select
                        value={draft.defaultWindowHeight[0].type}
                        onValueChange={(v) =>
                          updateDraft({
                            defaultWindowHeight: [{
                              type: v as ColumnWidth["type"],
                              value: v === "proportion" ? 0.5 : 600,
                            }],
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {widthTypeItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={draft.defaultWindowHeight[0].value}
                        step={draft.defaultWindowHeight[0].type === "proportion" ? 0.1 : 1}
                        className="w-20"
                        onChange={(e) =>
                          updateDraft({
                            defaultWindowHeight: [{
                              ...draft.defaultWindowHeight![0],
                              value: Number(e.target.value) || 0,
                            }],
                          })
                        }
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Open Maximized to Edges</Label>
                <Switch
                  checked={draft.openMaximizedToEdges ?? false}
                  onCheckedChange={(v) => updateDraft({ openMaximizedToEdges: v || null })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Open Focused</Label>
                <Switch
                  checked={draft.openFocused ?? false}
                  onCheckedChange={(v) => updateDraft({ openFocused: v || null })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Variable Refresh Rate</Label>
                <Switch
                  checked={draft.variableRefreshRate ?? false}
                  onCheckedChange={(v) => updateDraft({ variableRefreshRate: v || null })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Default Column Display</Label>
                <Select
                  value={draft.defaultColumnDisplay ?? "none"}
                  onValueChange={(v) =>
                    updateDraft({ defaultColumnDisplay: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Not Set</SelectItem>
                      <SelectItem value="tabbed">Tabbed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Scroll Factor</Label>
                <Input
                  type="number"
                  value={draft.scrollFactor ?? ""}
                  placeholder="Not set"
                  min={0}
                  step={0.1}
                  className="w-24"
                  onChange={(e) =>
                    updateDraft({
                      scrollFactor:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Tiled State</Label>
                <Select
                  value={draft.tiledState ?? "none"}
                  onValueChange={(v) =>
                    updateDraft({ tiledState: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Not Set</SelectItem>
                      <SelectItem value="tiled">Tiled</SelectItem>
                      <SelectItem value="floating">Floating</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Baba Is Float</Label>
                <Switch
                  checked={draft.babaIsFloat ?? false}
                  onCheckedChange={(v) => updateDraft({ babaIsFloat: v || null })}
                />
              </div>
            </div>

            <Separator />

            {/* Style Overrides */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Style Overrides</Label>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Override Focus Ring</Label>
                <Switch
                  checked={draft.focusRing !== null}
                  onCheckedChange={(v) =>
                    updateDraft({
                      focusRing: v
                        ? { off: false, width: null, activeColor: null, inactiveColor: null, urgentColor: null, activeGradient: null, inactiveGradient: null, urgentGradient: null }
                        : null,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Override Border</Label>
                <Switch
                  checked={draft.border !== null}
                  onCheckedChange={(v) =>
                    updateDraft({
                      border: v
                        ? { off: false, width: null, activeColor: null, inactiveColor: null, urgentColor: null, activeGradient: null, inactiveGradient: null, urgentGradient: null }
                        : null,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Override Shadow</Label>
                <Switch
                  checked={draft.shadow !== null}
                  onCheckedChange={(v) =>
                    updateDraft({
                      shadow: v
                        ? { on: false, drawBehindWindow: null, softness: null, spread: null, offsetX: null, offsetY: null, color: null, inactiveColor: null }
                        : null,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Override Tab Indicator</Label>
                <Switch
                  checked={draft.tabIndicator !== null}
                  onCheckedChange={(v) =>
                    updateDraft({
                      tabIndicator: v
                        ? { off: false, activeColor: null, inactiveColor: null, urgentColor: null, hideWhenSingleTab: false, placeWithinColumn: false, gap: null, width: null, length: null, position: null, gapsBetweenTabs: null, cornerRadius: null, activeGradient: null, inactiveGradient: null, urgentGradient: null }
                        : null,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
