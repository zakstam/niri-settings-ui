import { Kbd } from "@/components/settings/key-bindings/kbd";

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}

export function ShortcutsBar() {
  return (
    <div className="fixed bottom-4 right-4 z-20">
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] text-muted-foreground opacity-60 transition-opacity hover:opacity-100">
        <Shortcut keys={['Ctrl', '←/→']} label="Section" />
        <Shortcut keys={['Alt', '↑↓←→']} label="Group" />
        <Shortcut keys={['Ctrl', 'S']} label="Save" />
        <Shortcut keys={['Ctrl', 'D']} label="Discard" />
      </div>
    </div>
  );
}
