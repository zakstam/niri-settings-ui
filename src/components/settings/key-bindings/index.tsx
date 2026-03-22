import { useState, useMemo } from "react";
import { useConfig } from "@/lib/config-context";
import { Button, Input, Badge, Card, CardContent } from "spatial-grid-nav/primitives";
import { PageHeader } from "spatial-grid-nav/layouts";
import { IconPlus, IconTrash, IconEdit, IconSearch } from "@tabler/icons-react";
import { BindingEditor } from "./binding-editor";
import type { KeyBinding } from "@/lib/types";
import { Kbd } from "./kbd";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function KeyBindingsSection() {
  const { config, updateConfig } = useConfig();
  const [search, setSearch] = useState("");
  const [editingBinding, setEditingBinding] = useState<KeyBinding | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const filteredBindings = useMemo(() => {
    if (!config) return [];
    if (!search) return config.keyBindings;
    const q = search.toLowerCase();
    return config.keyBindings.filter(
      (b) =>
        b.key.toLowerCase().includes(q) ||
        b.action.toLowerCase().includes(q) ||
        b.actionArgs.some((a) => a.toLowerCase().includes(q)) ||
        (b.hotkeyOverlayTitle ?? "").toLowerCase().includes(q),
    );
  }, [config, search]);

  if (!config) return null;

  function addBinding() {
    const newBinding: KeyBinding = {
      id: generateId(),
      key: "",
      action: "",
      actionArgs: [],
      repeat: null,
      cooldownMs: null,
      allowWhenLocked: null,
      allowInhibiting: null,
      hotkeyOverlayTitle: undefined,
    };
    setEditingBinding(newBinding);
    setEditorOpen(true);
  }

  function editBinding(binding: KeyBinding) {
    setEditingBinding({ ...binding });
    setEditorOpen(true);
  }

  function saveBinding(binding: KeyBinding) {
    updateConfig((prev) => {
      const idx = prev.keyBindings.findIndex((b) => b.id === binding.id);
      if (idx >= 0) {
        const bindings = [...prev.keyBindings];
        bindings[idx] = binding;
        return { ...prev, keyBindings: bindings };
      }
      return { ...prev, keyBindings: [...prev.keyBindings, binding] };
    });
  }

  function deleteBinding(id: string) {
    updateConfig((prev) => ({
      ...prev,
      keyBindings: prev.keyBindings.filter((b) => b.id !== id),
    }));
  }

  return (
    <div>
      <PageHeader
        title="Key Bindings"
        description="Configure keyboard shortcuts for niri actions"
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bindings..."
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={addBinding}>
              <IconPlus size={16} />
              Add
            </Button>
          </div>

          {filteredBindings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No bindings match your search."
                  : "No key bindings configured."}
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-360px)] space-y-1.5 overflow-y-auto overflow-x-visible pr-3 pl-2 pt-2">
              {filteredBindings.map((binding) => (
                <Card key={binding.id} size="sm">
                  <CardContent className="flex min-w-0 items-center gap-3 py-2.5">
                    <div className="flex flex-none flex-wrap items-center gap-1">
                      {binding.key.split("+").map((part, i) => (
                        <Kbd
                          key={i}
                          className="h-6 min-w-6 px-2 text-xs"
                        >
                          {part}
                        </Kbd>
                      ))}
                    </div>

                    <div className="min-w-0 flex-1 truncate">
                      <span className="inline-block max-w-full truncate text-sm font-medium">
                        {binding.action}
                      </span>
                      {binding.actionArgs.length > 0 && (
                        <span className="ml-1.5 inline-block max-w-full truncate text-xs text-muted-foreground">
                          {binding.actionArgs.join(" ")}
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                      {binding.allowWhenLocked && (
                        <Badge variant="outline" className="text-xs">
                          locked
                        </Badge>
                      )}
                      {binding.cooldownMs && (
                        <Badge variant="outline" className="text-xs">
                          {binding.cooldownMs}ms
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Edit"
                        onClick={() => editBinding(binding)}
                      >
                        <IconEdit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Delete"
                        onClick={() => deleteBinding(binding.id)}
                      >
                        <IconTrash size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingBinding && (
        <BindingEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          binding={editingBinding}
          onSave={saveBinding}
        />
      )}
    </div>
  );
}
