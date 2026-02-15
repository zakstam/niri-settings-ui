import { Kbd } from "@/components/settings/key-bindings/kbd";

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function ShortcutsBar() {
  return (
    <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
      <div className="glass flex items-center gap-5 rounded-xl px-5 py-2.5">
        <Shortcut keys={['Ctrl', '←/→']} label="Previous/Next section" />
        <div className="h-3.5 w-px bg-border" />
        <Shortcut keys={['Alt', '↑↓←→']} label="Adjacent group" />
        <div className="h-3.5 w-px bg-border" />
        <Shortcut keys={['Ctrl', 'S']} label="Save" />
        <div className="h-3.5 w-px bg-border" />
        <Shortcut keys={['Ctrl', 'D']} label="Discard" />
      </div>
    </div>
  );
}
