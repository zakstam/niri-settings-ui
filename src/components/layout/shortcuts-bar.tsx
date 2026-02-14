function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

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
        <Shortcut keys={['Ctrl', '←']} label="Previous section" />
        <Shortcut keys={['Ctrl', '→']} label="Next section" />
        <div className="h-3.5 w-px bg-border" />
        <Shortcut keys={['Alt', '↑↓←→']} label="Adjacent group" />
        <Shortcut keys={['Alt', 'Home']} label="First group" />
        <Shortcut keys={['Alt', 'End']} label="Last group" />
        <div className="h-3.5 w-px bg-border" />
        <Shortcut keys={['Tab']} label="Next item in group" />
        <Shortcut keys={['Shift', 'Tab']} label="Previous item in group" />
      </div>
    </div>
  );
}
