import { useConfig } from "@/lib/config-context";
import {
  Switch,
  Slider,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "spatial-grid-nav/primitives";
import { SettingsGroup, SettingsRow } from "spatial-grid-nav/layouts";
import type { IndividualAnimation, AnimationKind, AnimationsConfig } from "@/lib/types";

const easingCurves = [
  { label: "Ease Out Expo", value: "ease-out-expo" },
  { label: "Ease Out Quad", value: "ease-out-quad" },
  { label: "Ease Out Cubic", value: "ease-out-cubic" },
  { label: "Linear", value: "linear" },
];

interface AnimationCardProps {
  name: string;
  label: string;
  description: string;
}

export function AnimationCard({ name, label, description }: AnimationCardProps) {
  const { config, updateConfig } = useConfig();

  if (!config) return null;

  const animation = config.animations[name as keyof AnimationsConfig] as IndividualAnimation | null;
  const enabled = animation !== null;

  const kind: AnimationKind = animation?.kind ?? {
    type: "spring",
    dampingRatio: 1.0,
    stiffness: 800,
    epsilon: 0.0001,
  };

  function updateAnimation(patch: Partial<IndividualAnimation>) {
    updateConfig((prev) => ({
      ...prev,
      animations: {
        ...prev.animations,
        [name]: {
          ...(prev.animations[name as keyof AnimationsConfig] as IndividualAnimation | null ?? {
            kind: { type: "spring", dampingRatio: 1.0, stiffness: 800, epsilon: 0.0001 },
            customShader: null,
          }),
          ...patch,
        },
      },
    }));
  }

  function setEnabled(v: boolean) {
    if (v) {
      updateConfig((prev) => ({
        ...prev,
        animations: {
          ...prev.animations,
          [name]: {
            kind: { type: "spring", dampingRatio: 1.0, stiffness: 800, epsilon: 0.0001 },
            customShader: null,
          },
        },
      }));
    } else {
      updateConfig((prev) => ({
        ...prev,
        animations: {
          ...prev.animations,
          [name]: null,
        },
      }));
    }
  }

  function setKindType(type: "spring" | "easing") {
    if (type === "spring") {
      updateAnimation({
        kind: { type: "spring", dampingRatio: 1.0, stiffness: 800, epsilon: 0.0001 },
      });
    } else {
      updateAnimation({
        kind: { type: "easing", durationMs: 250, curve: "ease-out-expo" },
      });
    }
  }

  return (
    <SettingsGroup title={label} description={description}>
      <SettingsRow label="Override" description="Use custom animation instead of default">
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </SettingsRow>

      {enabled && (
        <>
          <SettingsRow label="Mode" description="Animation timing mode">
            <Select value={kind.type} onValueChange={(v) => setKindType(v as "spring" | "easing")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="easing">Easing</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsRow>

          {kind.type === "spring" && (
            <>
              <SettingsRow label="Damping Ratio" description="Controls how quickly oscillations decay (0 to 2)">
                <div className="flex items-center gap-3">
                  <Slider
                    value={[kind.dampingRatio]}
                    min={0}
                    max={2}
                    step={0.01}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      updateAnimation({
                        kind: { ...kind, dampingRatio: v },
                      });
                    }}
                    className="w-32"
                  />
                  <Input
                    type="number"
                    value={kind.dampingRatio}
                    min={0}
                    max={2}
                    step={0.01}
                    className="w-20"
                    onChange={(e) =>
                      updateAnimation({
                        kind: { ...kind, dampingRatio: Number(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
              </SettingsRow>

              <SettingsRow label="Stiffness" description="Spring stiffness constant (0 to 2000)">
                <div className="flex items-center gap-3">
                  <Slider
                    value={[kind.stiffness]}
                    min={0}
                    max={2000}
                    step={1}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      updateAnimation({
                        kind: { ...kind, stiffness: v },
                      });
                    }}
                    className="w-32"
                  />
                  <Input
                    type="number"
                    value={kind.stiffness}
                    min={0}
                    max={2000}
                    step={1}
                    className="w-24"
                    onChange={(e) =>
                      updateAnimation({
                        kind: { ...kind, stiffness: Number(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
              </SettingsRow>

              <SettingsRow label="Epsilon" description="Threshold to consider the animation complete">
                <Input
                  type="number"
                  value={kind.epsilon}
                  step={0.0001}
                  min={0}
                  className="w-28"
                  onChange={(e) =>
                    updateAnimation({
                      kind: { ...kind, epsilon: Number(e.target.value) || 0.0001 },
                    })
                  }
                />
              </SettingsRow>
            </>
          )}

          {kind.type === "easing" && (
            <>
              <SettingsRow label="Duration (ms)" description="Animation duration in milliseconds">
                <Input
                  type="number"
                  value={kind.durationMs}
                  min={0}
                  step={10}
                  className="w-24"
                  onChange={(e) =>
                    updateAnimation({
                      kind: { ...kind, durationMs: Number(e.target.value) || 0 },
                    })
                  }
                />
              </SettingsRow>

              <SettingsRow label="Curve" description="Easing curve function">
                <Select
                  value={kind.curve}
                  onValueChange={(v) => {
                    if (v !== null) updateAnimation({
                      kind: { ...kind, curve: v },
                    });
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {easingCurves.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </SettingsRow>
            </>
          )}
        </>
      )}
    </SettingsGroup>
  );
}
