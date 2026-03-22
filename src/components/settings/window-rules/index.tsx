import { useState } from "react";
import { useConfig } from "@/lib/config-context";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from "spatial-grid-nav/primitives";
import { PageHeader } from "spatial-grid-nav/layouts";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { RuleEditor } from "./rule-editor";
import type { WindowRule } from "@/lib/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getRuleSummary(rule: WindowRule): string {
  const props: string[] = [];
  if (rule.openFloating) props.push("floating");
  if (rule.openMaximized) props.push("maximized");
  if (rule.openFullscreen) props.push("fullscreen");
  if (rule.opacity != null) props.push(`opacity: ${rule.opacity}`);
  if (rule.geometryCornerRadius != null) props.push(`radius: ${rule.geometryCornerRadius}`);
  if (rule.blockOutFrom) props.push(`block-out: ${rule.blockOutFrom}`);
  if (rule.openOnOutput) props.push(`output: ${rule.openOnOutput}`);
  if (rule.openOnWorkspace) props.push(`workspace: ${rule.openOnWorkspace}`);
  if (rule.clipToGeometry) props.push("clip-to-geometry");
  if (rule.drawBorderWithBackground) props.push("border-with-bg");
  if (rule.defaultColumnWidth != null) {
    if (rule.defaultColumnWidth.length === 0) {
      props.push("width: auto");
    } else {
      const w = rule.defaultColumnWidth[0];
      props.push(
        `width: ${w.value}${w.type === "proportion" ? "" : "px"}`,
      );
    }
  }
  return props.length > 0 ? props.join(", ") : "No properties set";
}

export function WindowRulesSection() {
  const { config, updateConfig } = useConfig();
  const [editingRule, setEditingRule] = useState<WindowRule | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  if (!config) return null;

  function addRule() {
    const newRule: WindowRule = {
      id: generateId(),
      matches: [],
      excludes: [],
      defaultColumnWidth: null,
      defaultWindowHeight: null,
      openFloating: null,
      openMaximized: null,
      openMaximizedToEdges: null,
      openFullscreen: null,
      openFocused: null,
      geometryCornerRadius: null,
      clipToGeometry: null,
      blockOutFrom: null,
      drawBorderWithBackground: null,
      opacity: null,
      minWidth: null,
      maxWidth: null,
      minHeight: null,
      maxHeight: null,
      openOnOutput: null,
      openOnWorkspace: null,
      variableRefreshRate: null,
      defaultColumnDisplay: null,
      defaultFloatingPosition: null,
      scrollFactor: null,
      tiledState: null,
      babaIsFloat: null,
      focusRing: null,
      border: null,
      shadow: null,
      tabIndicator: null,
    };
    setEditingRule(newRule);
    setEditorOpen(true);
  }

  function editRule(rule: WindowRule) {
    setEditingRule(rule);
    setEditorOpen(true);
  }

  function saveRule(rule: WindowRule) {
    updateConfig((prev) => {
      const existingIndex = prev.windowRules.findIndex((r) => r.id === rule.id);
      if (existingIndex >= 0) {
        const rules = [...prev.windowRules];
        rules[existingIndex] = rule;
        return { ...prev, windowRules: rules };
      }
      return { ...prev, windowRules: [...prev.windowRules, rule] };
    });
  }

  function deleteRule(id: string) {
    updateConfig((prev) => ({
      ...prev,
      windowRules: prev.windowRules.filter((r) => r.id !== id),
    }));
  }

  return (
    <div>
      <PageHeader title="Window Rules" />

      {config.windowRules.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">
            No window rules configured.
          </p>
          <Button variant="outline" onClick={addRule}>
            <IconPlus size={16} data-icon="inline-start" />
            Add Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {config.windowRules.map((rule) => (
            <Card key={rule.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    {rule.matches.length === 0 ? (
                      <Badge variant="secondary">All windows</Badge>
                    ) : (
                      rule.matches.map((m, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {m.appId && (
                            <Badge variant="outline">{m.appId}</Badge>
                          )}
                          {m.title && (
                            <Badge variant="secondary">{m.title}</Badge>
                          )}
                          {!m.appId && !m.title && (
                            <Badge variant="secondary">Any</Badge>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Edit"
                      onClick={() => editRule(rule)}
                    >
                      <IconEdit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Delete"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {getRuleSummary(rule)}
                </p>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addRule}>
            <IconPlus size={16} data-icon="inline-start" />
            Add Rule
          </Button>
        </div>
      )}

      {editingRule && (
        <RuleEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          rule={editingRule}
          onSave={saveRule}
        />
      )}
    </div>
  );
}
