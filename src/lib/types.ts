export interface NiriConfig {
  input: InputConfig;
  outputs: OutputConfig[];
  layout: LayoutConfig;
  windowRules: WindowRule[];
  layerRules: LayerRule[];
  keyBindings: KeyBinding[];
  spawnAtStartup: SpawnAtStartup[];
  hotkeyOverlay: HotkeyOverlay;
  animations: AnimationsConfig;
  screenshotPath: string | null;
  preferNoCsd: boolean;
  cursor: CursorConfig;
  environment: EnvironmentEntry[];
  workspaces: NamedWorkspace[];
  switchEvents: SwitchEventsConfig;
  gestures: GesturesConfig;
  overview: OverviewConfig;
  spawnShAtStartup: SpawnShAtStartup[];
  clipboard: ClipboardConfig;
  xwaylandSatellite: XwaylandSatelliteConfig;
  configNotification: ConfigNotificationConfig;
}

export interface InputConfig {
  keyboard: KeyboardConfig;
  touchpad: PointerConfig;
  mouse: PointerConfig;
  trackpoint: PointerConfig;
  trackball: PointerConfig;
  tablet: TabletConfig;
  touch: TouchConfig;
  warpMouseToFocus: boolean;
  focusFollowsMouse: FocusFollowsMouseConfig | null;
  disablePowerKeyHandling: boolean;
  workspaceAutoBackAndForth: boolean;
  modKey: string | null;
  modKeyNested: string | null;
}

export interface FocusFollowsMouseConfig {
  maxScrollAmount: string | null;
}

export interface KeyboardConfig {
  xkb: XkbConfig;
  numlock: boolean;
  repeatDelay: number | null;
  repeatRate: number | null;
  trackLayout: string | null;
}

export interface XkbConfig {
  layout: string | null;
  model: string | null;
  rules: string | null;
  variant: string | null;
  options: string | null;
}

export interface PointerConfig {
  off: boolean;
  tap: boolean;
  dwt: boolean;
  dwtp: boolean;
  drag: boolean | null;
  dragLock: boolean;
  naturalScroll: boolean;
  accelSpeed: number | null;
  accelProfile: string | null;
  scrollMethod: string | null;
  disabledOnExternalMouse: boolean;
  scrollButton: number | null;
  scrollButtonLock: boolean;
  middleEmulation: boolean;
  leftHanded: boolean;
  scrollFactor: number | null;
  tapButtonMap: string | null;
  clickMethod: string | null;
}

export interface TabletConfig {
  mapToOutput: string | null;
  leftHanded: boolean;
}

export interface TouchConfig {
  mapToOutput: string | null;
}

export interface OutputConfig {
  name: string;
  off: boolean;
  mode: string | null;
  scale: number | null;
  transform: string | null;
  positionX: number | null;
  positionY: number | null;
}

export interface LayoutConfig {
  gaps: number | null;
  centerFocusedColumn: string | null;
  presetColumnWidths: ColumnWidth[];
  presetWindowHeights: ColumnWidth[];
  defaultColumnWidth: ColumnWidth[] | null;
  focusRing: RingBorderConfig;
  border: RingBorderConfig;
  shadow: ShadowConfig;
  tabIndicator: TabIndicatorConfig;
  insertHint: InsertHintConfig;
  struts: StrutsConfig;
  alwaysCenterSingleColumn: boolean;
  emptyWorkspaceAboveFirst: boolean;
  defaultColumnDisplay: string | null;
  backgroundColor: string | null;
}

export type ColumnWidth =
  | { type: "proportion"; value: number }
  | { type: "fixed"; value: number };

export interface RingBorderConfig {
  off: boolean;
  width: number | null;
  activeColor: string | null;
  inactiveColor: string | null;
  urgentColor: string | null;
  activeGradient: GradientConfig | null;
  inactiveGradient: GradientConfig | null;
  urgentGradient: GradientConfig | null;
}

export interface GradientConfig {
  fromColor: string;
  toColor: string;
  angle: number | null;
  relativeTo: string | null;
  colorSpace: string | null;
}

export interface ShadowConfig {
  on: boolean;
  drawBehindWindow: boolean | null;
  softness: number | null;
  spread: number | null;
  offsetX: number | null;
  offsetY: number | null;
  color: string | null;
  inactiveColor: string | null;
}

export interface TabIndicatorConfig {
  off: boolean;
  activeColor: string | null;
  inactiveColor: string | null;
  urgentColor: string | null;
  hideWhenSingleTab: boolean;
  placeWithinColumn: boolean;
  gap: number | null;
  width: number | null;
  length: number | null;
  position: string | null;
  gapsBetweenTabs: number | null;
  cornerRadius: number | null;
  activeGradient: GradientConfig | null;
  inactiveGradient: GradientConfig | null;
  urgentGradient: GradientConfig | null;
}

export interface InsertHintConfig {
  off: boolean;
  color: string | null;
  gradient: GradientConfig | null;
}

export interface StrutsConfig {
  left: number | null;
  right: number | null;
  top: number | null;
  bottom: number | null;
}

export interface WindowRule {
  id: string;
  matches: MatchRule[];
  excludes: MatchRule[];
  defaultColumnWidth: ColumnWidth[] | null;
  defaultWindowHeight: ColumnWidth[] | null;
  openFloating: boolean | null;
  openMaximized: boolean | null;
  openMaximizedToEdges: boolean | null;
  openFullscreen: boolean | null;
  openFocused: boolean | null;
  geometryCornerRadius: number | null;
  clipToGeometry: boolean | null;
  blockOutFrom: string | null;
  drawBorderWithBackground: boolean | null;
  opacity: number | null;
  minWidth: number | null;
  maxWidth: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  openOnOutput: string | null;
  openOnWorkspace: string | null;
  variableRefreshRate: boolean | null;
  defaultColumnDisplay: string | null;
  defaultFloatingPosition: FloatingPosition | null;
  scrollFactor: number | null;
  tiledState: string | null;
  babaIsFloat: boolean | null;
  focusRing: RingBorderConfig | null;
  border: RingBorderConfig | null;
  shadow: ShadowConfig | null;
  tabIndicator: TabIndicatorConfig | null;
}

export interface FloatingPosition {
  x: number | null;
  y: number | null;
  relativeTo: string | null;
}

export interface MatchRule {
  appId: string | null;
  title: string | null;
  isFocused: boolean | null;
  isActiveInColumn: boolean | null;
  isFloating: boolean | null;
  isWindowCastTarget: boolean | null;
  isUrgent: boolean | null;
  atStartup: boolean | null;
}

export interface LayerRule {
  id: string;
  matches: LayerMatchRule[];
  blockOutFrom: string | null;
  opacity: number | null;
  placeWithinBackdrop: boolean | null;
}

export interface LayerMatchRule {
  namespace: string | null;
  atStartup: boolean | null;
}

export interface KeyBinding {
  id: string;
  key: string;
  action: string;
  actionArgs: string[];
  repeat: boolean | null;
  cooldownMs: number | null;
  allowWhenLocked: boolean | null;
  allowInhibiting: boolean | null;
  hotkeyOverlayTitle: string | null | undefined;
}

export interface SpawnAtStartup {
  command: string[];
}

export interface SpawnShAtStartup {
  command: string;
}

export interface HotkeyOverlay {
  skipAtStartup: boolean;
  hideNotBound: boolean;
}

export interface AnimationsConfig {
  off: boolean;
  slowdown: number | null;
  workspaceSwitch: IndividualAnimation | null;
  windowOpen: IndividualAnimation | null;
  windowClose: IndividualAnimation | null;
  horizontalViewMovement: IndividualAnimation | null;
  windowMovement: IndividualAnimation | null;
  windowResize: IndividualAnimation | null;
  configNotificationOpenClose: IndividualAnimation | null;
  exitConfirmationOpenClose: IndividualAnimation | null;
  screenshotUiOpen: IndividualAnimation | null;
  overviewOpenClose: IndividualAnimation | null;
  recentWindowsClose: IndividualAnimation | null;
}

export interface IndividualAnimation {
  kind: AnimationKind;
  customShader: string | null;
}

export type AnimationKind =
  | { type: "spring"; dampingRatio: number; stiffness: number; epsilon: number }
  | { type: "easing"; durationMs: number; curve: string };

export interface CursorConfig {
  xcursorTheme: string | null;
  xcursorSize: number | null;
  hideWhenTyping: boolean;
  hideAfterInactiveMs: number | null;
}

export interface EnvironmentEntry {
  key: string;
  value: string | null;
}

export interface NamedWorkspace {
  id: string;
  name: string;
  openOnOutput: string | null;
}

export interface SwitchEventsConfig {
  lidClose: SwitchAction | null;
  lidOpen: SwitchAction | null;
  tabletModeOn: SwitchAction | null;
  tabletModeOff: SwitchAction | null;
}

export interface SwitchAction {
  spawn: string[];
}

export interface GesturesConfig {
  dndEdgeViewScroll: EdgeGestureConfig | null;
  dndEdgeWorkspaceSwitch: EdgeGestureConfig | null;
  hotCorners: HotCornersConfig | null;
}

export interface EdgeGestureConfig {
  triggerWidth: number | null;
  triggerHeight: number | null;
  delayMs: number | null;
  maxSpeed: number | null;
}

export interface HotCornersConfig {
  off: boolean;
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}

export interface OverviewConfig {
  zoom: number | null;
  backdropColor: string | null;
  workspaceShadow: ShadowConfig | null;
}

export interface ClipboardConfig {
  disablePrimary: boolean;
}

export interface XwaylandSatelliteConfig {
  path: string | null;
}

export interface ConfigNotificationConfig {
  disableFailed: boolean;
}
