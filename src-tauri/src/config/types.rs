use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NiriConfig {
    pub input: InputConfig,
    pub outputs: Vec<OutputConfig>,
    pub layout: LayoutConfig,
    pub spawn_at_startup: Vec<SpawnAtStartup>,
    pub hotkey_overlay: HotkeyOverlay,
    pub prefer_no_csd: bool,
    /// None = not set or explicitly null. Some(path) = set to a path.
    pub screenshot_path: Option<String>,
    pub animations: AnimationsConfig,
    pub window_rules: Vec<WindowRule>,
    pub layer_rules: Vec<LayerRule>,
    pub key_bindings: Vec<KeyBinding>,
    #[serde(default)]
    pub includes: Vec<String>,
    pub cursor: CursorConfig,
    #[serde(default)]
    pub environment: Vec<EnvironmentEntry>,
    #[serde(default)]
    pub workspaces: Vec<NamedWorkspace>,
    pub switch_events: SwitchEventsConfig,
    pub gestures: GesturesConfig,
    pub overview: OverviewConfig,
    #[serde(default)]
    pub spawn_sh_at_startup: Vec<SpawnShAtStartup>,
    pub clipboard: ClipboardConfig,
    pub xwayland_satellite: XwaylandSatelliteConfig,
    pub config_notification: ConfigNotificationConfig,
}

// --- Input ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct InputConfig {
    pub keyboard: KeyboardConfig,
    pub touchpad: PointerConfig,
    pub mouse: PointerConfig,
    pub trackpoint: PointerConfig,
    pub trackball: PointerConfig,
    pub tablet: TabletConfig,
    pub touch: TouchConfig,
    pub warp_mouse_to_focus: bool,
    pub focus_follows_mouse: Option<FocusFollowsMouseConfig>,
    pub disable_power_key_handling: bool,
    pub workspace_auto_back_and_forth: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mod_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mod_key_nested: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FocusFollowsMouseConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_scroll_amount: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KeyboardConfig {
    pub xkb: XkbConfig,
    pub numlock: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repeat_delay: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repeat_rate: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub track_layout: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct XkbConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub layout: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rules: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PointerConfig {
    pub off: bool,
    pub tap: bool,
    pub dwt: bool,
    pub dwtp: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub drag: Option<bool>,
    pub drag_lock: bool,
    pub natural_scroll: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accel_speed: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accel_profile: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scroll_method: Option<String>,
    pub disabled_on_external_mouse: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scroll_button: Option<i64>,
    pub scroll_button_lock: bool,
    pub middle_emulation: bool,
    pub left_handed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scroll_factor: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tap_button_map: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub click_method: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TabletConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map_to_output: Option<String>,
    pub left_handed: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TouchConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map_to_output: Option<String>,
}

// --- Output ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct OutputConfig {
    pub name: String,
    pub off: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub position_x: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub position_y: Option<i64>,
}

// --- Layout ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LayoutConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gaps: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub center_focused_column: Option<String>,
    pub preset_column_widths: Vec<ColumnWidth>,
    pub preset_window_heights: Vec<ColumnWidth>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_column_width: Option<Vec<ColumnWidth>>,
    pub focus_ring: RingBorderConfig,
    pub border: RingBorderConfig,
    pub shadow: ShadowConfig,
    pub tab_indicator: TabIndicatorConfig,
    pub insert_hint: InsertHintConfig,
    pub struts: StrutsConfig,
    pub always_center_single_column: bool,
    pub empty_workspace_above_first: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_column_display: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum ColumnWidth {
    Proportion { value: f64 },
    Fixed { value: i64 },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct RingBorderConfig {
    pub off: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inactive_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub urgent_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_gradient: Option<GradientConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inactive_gradient: Option<GradientConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub urgent_gradient: Option<GradientConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GradientConfig {
    pub from_color: String,
    pub to_color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub angle: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub relative_to: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_space: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ShadowConfig {
    pub on: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub draw_behind_window: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub softness: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spread: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset_x: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset_y: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inactive_color: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TabIndicatorConfig {
    pub off: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inactive_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub urgent_color: Option<String>,
    pub hide_when_single_tab: bool,
    pub place_within_column: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gap: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub length: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub position: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gaps_between_tabs: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub corner_radius: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_gradient: Option<GradientConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inactive_gradient: Option<GradientConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub urgent_gradient: Option<GradientConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct InsertHintConfig {
    pub off: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gradient: Option<GradientConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StrutsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub left: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub right: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bottom: Option<i64>,
}

// --- Window Rule ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WindowRule {
    pub id: String,
    pub matches: Vec<MatchRule>,
    #[serde(default)]
    pub excludes: Vec<MatchRule>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_column_width: Option<Vec<ColumnWidth>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_window_height: Option<Vec<ColumnWidth>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_floating: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_maximized: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_maximized_to_edges: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_fullscreen: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_focused: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub geometry_corner_radius: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clip_to_geometry: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_out_from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub draw_border_with_background: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub opacity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_width: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_width: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_on_output: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_on_workspace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variable_refresh_rate: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_column_display: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_floating_position: Option<FloatingPosition>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scroll_factor: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tiled_state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub baba_is_float: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub focus_ring: Option<RingBorderConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border: Option<RingBorderConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shadow: Option<ShadowConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tab_indicator: Option<TabIndicatorConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FloatingPosition {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub relative_to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MatchRule {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_focused: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_active_in_column: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_floating: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_window_cast_target: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_urgent: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub at_startup: Option<bool>,
}

// --- Layer Rule ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LayerRule {
    pub id: String,
    pub matches: Vec<LayerMatchRule>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_out_from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub opacity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub place_within_backdrop: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LayerMatchRule {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub namespace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub at_startup: Option<bool>,
}

// --- Key Binding ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KeyBinding {
    pub id: String,
    pub key: String,
    pub action: String,
    #[serde(default)]
    pub action_args: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repeat: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cooldown_ms: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allow_when_locked: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allow_inhibiting: Option<bool>,
    /// None means the property is absent. Some(None) means `hotkey-overlay-title=null`.
    /// Some(Some(s)) means `hotkey-overlay-title="..."`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hotkey_overlay_title: Option<Option<String>>,
}

// --- Spawn at Startup ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SpawnAtStartup {
    pub command: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SpawnShAtStartup {
    pub command: String,
}

// --- Hotkey Overlay ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyOverlay {
    pub skip_at_startup: bool,
    pub hide_not_bound: bool,
}

// --- Animations ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AnimationsConfig {
    pub off: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slowdown: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workspace_switch: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_open: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_close: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub horizontal_view_movement: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_movement: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_resize: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_notification_open_close: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exit_confirmation_open_close: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub screenshot_ui_open: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overview_open_close: Option<IndividualAnimation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recent_windows_close: Option<IndividualAnimation>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndividualAnimation {
    pub kind: AnimationKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_shader: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum AnimationKind {
    Spring {
        damping_ratio: f64,
        stiffness: f64,
        epsilon: f64,
    },
    Easing {
        duration_ms: i64,
        curve: String,
    },
}

// --- Cursor ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CursorConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xcursor_theme: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub xcursor_size: Option<i64>,
    pub hide_when_typing: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hide_after_inactive_ms: Option<i64>,
}

// --- Environment ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentEntry {
    pub key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

// --- Named Workspace ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NamedWorkspace {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub open_on_output: Option<String>,
}

// --- Switch Events ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SwitchEventsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lid_close: Option<SwitchAction>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lid_open: Option<SwitchAction>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tablet_mode_on: Option<SwitchAction>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tablet_mode_off: Option<SwitchAction>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SwitchAction {
    pub spawn: Vec<String>,
}

// --- Gestures ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GesturesConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dnd_edge_view_scroll: Option<EdgeGestureConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dnd_edge_workspace_switch: Option<EdgeGestureConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hot_corners: Option<HotCornersConfig>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EdgeGestureConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_width: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_height: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delay_ms: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_speed: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct HotCornersConfig {
    pub off: bool,
    pub top_left: bool,
    pub top_right: bool,
    pub bottom_left: bool,
    pub bottom_right: bool,
}

// --- Overview ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct OverviewConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub zoom: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backdrop_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workspace_shadow: Option<ShadowConfig>,
}

// --- Clipboard ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardConfig {
    pub disable_primary: bool,
}

// --- Xwayland Satellite ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct XwaylandSatelliteConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

// --- Config Notification ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ConfigNotificationConfig {
    pub disable_failed: bool,
}
