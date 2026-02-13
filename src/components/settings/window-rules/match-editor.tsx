import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconTrash } from "@tabler/icons-react";
import type { MatchRule } from "@/lib/types";

interface MatchEditorProps {
  match: MatchRule;
  onChange: (match: MatchRule) => void;
  onRemove: () => void;
}

export function MatchEditor({ match, onChange, onRemove }: MatchEditorProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">App ID</Label>
            <Input
              value={match.appId ?? ""}
              placeholder="e.g. org.mozilla.firefox"
              onChange={(e) =>
                onChange({ ...match, appId: e.target.value || null })
              }
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              value={match.title ?? ""}
              placeholder="e.g. Settings"
              onChange={(e) =>
                onChange({ ...match, title: e.target.value || null })
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Is Floating</Label>
            <Select
              value={match.isFloating === null ? "__unset__" : String(match.isFloating)}
              onValueChange={(v) =>
                onChange({ ...match, isFloating: v === "__unset__" ? null : v === "true" })
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="__unset__">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Is Window Cast Target</Label>
            <Select
              value={match.isWindowCastTarget === null ? "__unset__" : String(match.isWindowCastTarget)}
              onValueChange={(v) =>
                onChange({ ...match, isWindowCastTarget: v === "__unset__" ? null : v === "true" })
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="__unset__">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Is Urgent</Label>
            <Select
              value={match.isUrgent === null ? "__unset__" : String(match.isUrgent)}
              onValueChange={(v) =>
                onChange({ ...match, isUrgent: v === "__unset__" ? null : v === "true" })
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="__unset__">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">At Startup</Label>
            <Select
              value={match.atStartup === null ? "__unset__" : String(match.atStartup)}
              onValueChange={(v) =>
                onChange({ ...match, atStartup: v === "__unset__" ? null : v === "true" })
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="__unset__">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="mt-5 shrink-0"
        onClick={onRemove}
      >
        <IconTrash size={14} />
      </Button>
    </div>
  );
}
