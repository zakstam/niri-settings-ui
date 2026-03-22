import { useState } from "react";
import { useConfig } from "@/lib/config-context";
import { Button, Input, Card, CardContent } from "spatial-grid-nav/primitives";
import { PageHeader, SettingsGroup } from "spatial-grid-nav/layouts";
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX } from "@tabler/icons-react";
import type { NamedWorkspace } from "@/lib/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function WorkspacesSection() {
  const { config, updateConfig } = useConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOutput, setEditOutput] = useState("");

  if (!config) return null;

  const addWorkspace = () => {
    const newWs: NamedWorkspace = {
      id: generateId(),
      name: "",
      openOnOutput: null,
    };
    updateConfig((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, newWs],
    }));
    setEditingId(newWs.id);
    setEditName("");
    setEditOutput("");
  };

  const startEdit = (ws: NamedWorkspace) => {
    setEditingId(ws.id);
    setEditName(ws.name);
    setEditOutput(ws.openOnOutput ?? "");
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const name = editName.trim();
    if (!name) {
      deleteWorkspace(editingId);
      return;
    }
    const id = editingId;
    const output = editOutput.trim() || null;
    updateConfig((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === id ? { ...ws, name, openOnOutput: output } : ws,
      ),
    }));
    setEditingId(null);
  };

  const cancelEdit = () => {
    if (editingId !== null) {
      const ws = config.workspaces.find((w) => w.id === editingId);
      if (ws && ws.name === "") {
        deleteWorkspace(editingId);
      }
    }
    setEditingId(null);
  };

  const deleteWorkspace = (id: string) => {
    updateConfig((prev) => ({
      ...prev,
      workspaces: prev.workspaces.filter((ws) => ws.id !== id),
    }));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="Configure named workspaces and their output assignments"
      />

      <SettingsGroup
        title="Named Workspaces"
        description="Workspaces with persistent names and optional output assignments"
      >
        {config.workspaces.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">
              No named workspaces configured.
            </p>
            <Button variant="outline" onClick={addWorkspace}>
              <IconPlus size={16} />
              Add Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {config.workspaces.map((ws) => (
              <Card key={ws.id} size="sm">
                <CardContent className="flex items-center gap-2 py-2">
                  {editingId === ws.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Workspace name"
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <Input
                        value={editOutput}
                        onChange={(e) => setEditOutput(e.target.value)}
                        placeholder="Output (optional)"
                        className="w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Save"
                        onClick={saveEdit}
                      >
                        <IconCheck size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Cancel"
                        onClick={cancelEdit}
                      >
                        <IconX size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        <code className="truncate text-sm font-medium">
                          {ws.name}
                        </code>
                        {ws.openOnOutput && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            on {ws.openOnOutput}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Edit"
                        onClick={() => startEdit(ws)}
                      >
                        <IconEdit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Delete"
                        onClick={() => deleteWorkspace(ws.id)}
                      >
                        <IconTrash size={14} />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addWorkspace}>
              <IconPlus size={16} />
              Add Workspace
            </Button>
          </div>
        )}
      </SettingsGroup>
    </div>
  );
}
