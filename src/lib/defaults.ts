import type { GradientConfig } from "@/lib/types";

export const defaultGradient: GradientConfig = {
  fromColor: "#ff0000",
  toColor: "#0000ff",
  angle: 180,
  relativeTo: null,
  colorSpace: null,
};

export const accelProfileItems = [
  { label: "Adaptive", value: "adaptive" },
  { label: "Flat", value: "flat" },
];

export const mouseScrollMethodItems = [
  { label: "No Scroll", value: "no-scroll" },
  { label: "On Button Down", value: "on-button-down" },
];

export const touchpadScrollMethodItems = [
  { label: "Two Finger", value: "two-finger" },
  { label: "Edge", value: "edge" },
  { label: "On Button Down", value: "on-button-down" },
  { label: "No Scroll", value: "no-scroll" },
];
