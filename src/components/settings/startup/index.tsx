import { useState } from "react";
import { useConfig } from "@/lib/config-context";
import { Button, Input, Switch, Card, CardContent } from "spatial-grid-nav/primitives";
import { PageHeader, SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX } from "@tabler/icons-react";

export function StartupSection() {
  const { config, updateConfig } = useConfig();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [shEditingIndex, setShEditingIndex] = useState<number | null>(null);
  const [shEditValue, setShEditValue] = useState("");
  const [envEditingIndex, setEnvEditingIndex] = useState<number | null>(null);
  const [envEditKey, setEnvEditKey] = useState("");
  const [envEditVal, setEnvEditVal] = useState("");

  if (!config) return null;

  const addSpawn = () => {
    const len = config.spawnAtStartup.length;
    updateConfig((prev) => ({
      ...prev,
      spawnAtStartup: [...prev.spawnAtStartup, { command: [""] }],
    }));
    setEditingIndex(len);
    setEditValue("");
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(config.spawnAtStartup[index].command.join(" "));
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const args = editValue.trim().split(/\s+/).filter(Boolean);
    if (args.length === 0) {
      deleteSpawn(editingIndex);
    } else {
      const idx = editingIndex;
      updateConfig((prev) => {
        const list = [...prev.spawnAtStartup];
        list[idx] = { command: args };
        return { ...prev, spawnAtStartup: list };
      });
    }
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    if (
      editingIndex !== null &&
      config.spawnAtStartup[editingIndex]?.command[0] === ""
    ) {
      deleteSpawn(editingIndex);
    }
    setEditingIndex(null);
  };

  const deleteSpawn = (index: number) => {
    updateConfig((prev) => ({
      ...prev,
      spawnAtStartup: prev.spawnAtStartup.filter((_, i) => i !== index),
    }));
    if (editingIndex === index) setEditingIndex(null);
  }

  // Shell startup commands
  const addShSpawn = () => {
    const len = config.spawnShAtStartup.length;
    updateConfig((prev) => ({
      ...prev,
      spawnShAtStartup: [...prev.spawnShAtStartup, { command: "" }],
    }));
    setShEditingIndex(len);
    setShEditValue("");
  };

  const startShEdit = (index: number) => {
    setShEditingIndex(index);
    setShEditValue(config.spawnShAtStartup[index].command);
  };

  const saveShEdit = () => {
    if (shEditingIndex === null) return;
    const cmd = shEditValue.trim();
    if (!cmd) {
      deleteShSpawn(shEditingIndex);
    } else {
      const idx = shEditingIndex;
      updateConfig((prev) => {
        const list = [...prev.spawnShAtStartup];
        list[idx] = { command: cmd };
        return { ...prev, spawnShAtStartup: list };
      });
    }
    setShEditingIndex(null);
  };

  const cancelShEdit = () => {
    if (
      shEditingIndex !== null &&
      config.spawnShAtStartup[shEditingIndex]?.command === ""
    ) {
      deleteShSpawn(shEditingIndex);
    }
    setShEditingIndex(null);
  };

  const deleteShSpawn = (index: number) => {
    updateConfig((prev) => ({
      ...prev,
      spawnShAtStartup: prev.spawnShAtStartup.filter((_, i) => i !== index),
    }));
    if (shEditingIndex === index) setShEditingIndex(null);
  };

  // Environment variables
  const addEnvVar = () => {
    const len = config.environment.length;
    updateConfig((prev) => ({
      ...prev,
      environment: [...prev.environment, { key: "", value: null }],
    }));
    setEnvEditingIndex(len);
    setEnvEditKey("");
    setEnvEditVal("");
  };

  const startEnvEdit = (index: number) => {
    setEnvEditingIndex(index);
    setEnvEditKey(config.environment[index].key);
    setEnvEditVal(config.environment[index].value ?? "");
  };

  const saveEnvEdit = () => {
    if (envEditingIndex === null) return;
    const key = envEditKey.trim();
    if (!key) {
      deleteEnvVar(envEditingIndex);
    } else {
      const idx = envEditingIndex;
      updateConfig((prev) => {
        const list = [...prev.environment];
        list[idx] = { key, value: envEditVal || null };
        return { ...prev, environment: list };
      });
    }
    setEnvEditingIndex(null);
  };

  const cancelEnvEdit = () => {
    if (
      envEditingIndex !== null &&
      config.environment[envEditingIndex]?.key === ""
    ) {
      deleteEnvVar(envEditingIndex);
    }
    setEnvEditingIndex(null);
  };

  const deleteEnvVar = (index: number) => {
    updateConfig((prev) => ({
      ...prev,
      environment: prev.environment.filter((_, i) => i !== index),
    }));
    if (envEditingIndex === index) setEnvEditingIndex(null);
  };

  return (
    <div>
      <PageHeader
        title="Startup"
        description="Configure programs to launch at startup and other startup options"
      />

      <div className="space-y-6">
        <SettingsGroup
          title="Spawn at Startup"
        >
          {config.spawnAtStartup.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">
                No startup programs configured.
              </p>
              <Button variant="outline" onClick={addSpawn}>
                <IconPlus size={16} />
                Add Program
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {config.spawnAtStartup.map((spawn, index) => (
                <Card key={index} size="sm">
                  <CardContent className="flex items-center gap-2 py-2">
                    {editingIndex === index ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="command arg1 arg2..."
                          className="flex-1"
                          autoFocus
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
                        <code className="flex-1 truncate text-sm">
                          {spawn.command.join(" ")}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit"
                          onClick={() => startEdit(index)}
                        >
                          <IconEdit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Delete"
                          onClick={() => deleteSpawn(index)}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addSpawn}>
                <IconPlus size={16} />
                Add Program
              </Button>
            </div>
          )}
        </SettingsGroup>

        <SettingsGroup title="Options">
          <SettingsRow
            label="Prefer No CSD"
            description="Ask clients to omit client-side decorations"
          >
            <Switch
              checked={config.preferNoCsd}
              onCheckedChange={(v) =>
                updateConfig((prev) => ({ ...prev, preferNoCsd: v }))
              }
            />
          </SettingsRow>

          <SettingsRow
            label="Screenshot Path"
            description="Where screenshots are saved (empty to disable)"
          >
            <div className="flex items-center gap-2">
              <Switch
                checked={config.screenshotPath !== null}
                onCheckedChange={(v) =>
                  updateConfig((prev) => ({
                    ...prev,
                    screenshotPath: v
                      ? "~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"
                      : null,
                  }))
                }
              />
              {config.screenshotPath !== null && (
                <Input
                  value={config.screenshotPath}
                  className="w-80"
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      screenshotPath: e.target.value,
                    }))
                  }
                />
              )}
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup
          title="Shell Startup Commands"
        >
          {config.spawnShAtStartup.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">
                No shell startup commands configured.
              </p>
              <Button variant="outline" onClick={addShSpawn}>
                <IconPlus size={16} />
                Add Command
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {config.spawnShAtStartup.map((spawn, index) => (
                <Card key={index} size="sm">
                  <CardContent className="flex items-center gap-2 py-2">
                    {shEditingIndex === index ? (
                      <>
                        <Input
                          value={shEditValue}
                          onChange={(e) => setShEditValue(e.target.value)}
                          placeholder="sh -c command..."
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveShEdit();
                            if (e.key === "Escape") cancelShEdit();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Save"
                          onClick={saveShEdit}
                        >
                          <IconCheck size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Cancel"
                          onClick={cancelShEdit}
                        >
                          <IconX size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <code className="flex-1 truncate text-sm">
                          {spawn.command}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit"
                          onClick={() => startShEdit(index)}
                        >
                          <IconEdit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Delete"
                          onClick={() => deleteShSpawn(index)}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addShSpawn}>
                <IconPlus size={16} />
                Add Command
              </Button>
            </div>
          )}
        </SettingsGroup>

        <SettingsGroup
          title="Environment Variables"
        >
          {config.environment.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">
                No environment variables configured.
              </p>
              <Button variant="outline" onClick={addEnvVar}>
                <IconPlus size={16} />
                Add Variable
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {config.environment.map((entry, index) => (
                <Card key={index} size="sm">
                  <CardContent className="flex items-center gap-2 py-2">
                    {envEditingIndex === index ? (
                      <>
                        <Input
                          value={envEditKey}
                          onChange={(e) => setEnvEditKey(e.target.value)}
                          placeholder="KEY"
                          className="w-32"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEnvEdit();
                            if (e.key === "Escape") cancelEnvEdit();
                          }}
                        />
                        <span className="text-sm text-muted-foreground">=</span>
                        <Input
                          value={envEditVal}
                          onChange={(e) => setEnvEditVal(e.target.value)}
                          placeholder="value (optional)"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEnvEdit();
                            if (e.key === "Escape") cancelEnvEdit();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Save"
                          onClick={saveEnvEdit}
                        >
                          <IconCheck size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Cancel"
                          onClick={cancelEnvEdit}
                        >
                          <IconX size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <code className="flex-1 truncate text-sm">
                          {entry.value !== null ? `${entry.key}=${entry.value}` : entry.key}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit"
                          onClick={() => startEnvEdit(index)}
                        >
                          <IconEdit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Delete"
                          onClick={() => deleteEnvVar(index)}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addEnvVar}>
                <IconPlus size={16} />
                Add Variable
              </Button>
            </div>
          )}
        </SettingsGroup>
      </div>
    </div>
  );
}
