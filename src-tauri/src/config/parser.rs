use std::path::{Path, PathBuf};

use kdl::{KdlDocument, KdlNode, KdlValue};
use uuid::Uuid;

use super::types::*;

/// Error type for config parsing.
#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("KDL parse error: {0}")]
    Kdl(#[from] kdl::KdlError),
    #[error("Config error: {0}")]
    Config(String),
}

/// Parse a niri config file and all its includes.
/// Returns the parsed config, the main KDL document, and a list of included
/// file documents (path, doc) pairs.
pub fn parse_config(
    path: &Path,
) -> Result<(NiriConfig, KdlDocument, Vec<(PathBuf, KdlDocument)>), ParseError> {
    let content = std::fs::read_to_string(path)?;
    // Niri configs use KDL v1 syntax — explicitly parse as v1
    let main_doc: KdlDocument = KdlDocument::parse_v1(&content)?;

    let config_dir = path
        .parent()
        .ok_or_else(|| ParseError::Config("Config file has no parent directory".into()))?;

    // Collect includes
    let mut included_docs: Vec<(PathBuf, KdlDocument)> = Vec::new();
    for node in main_doc.nodes() {
        if node.name().value() == "include" {
            if let Some(include_path_raw) = get_string_arg(node) {
                let include_path = resolve_include_path(config_dir, include_path_raw);
                if include_path.exists() {
                    let include_content = std::fs::read_to_string(&include_path)?;
                    let include_doc: KdlDocument = KdlDocument::parse_v1(&include_content)?;
                    included_docs.push((include_path, include_doc));
                }
            }
        }
    }

    // Parse the main doc first, then overlay included files
    let mut config = NiriConfig::default();
    parse_document(&main_doc, &mut config);

    // Parse each included file and merge
    for (_, inc_doc) in &included_docs {
        parse_document(inc_doc, &mut config);
    }

    // Collect include paths
    config.includes = main_doc
        .nodes()
        .iter()
        .filter(|n| n.name().value() == "include")
        .filter_map(|n| get_string_arg(n).map(|s| s.to_string()))
        .collect();

    Ok((config, main_doc, included_docs))
}

fn resolve_include_path(config_dir: &Path, raw: &str) -> PathBuf {
    let expanded = if raw.starts_with('~') {
        if let Some(home) = dirs::home_dir() {
            home.join(raw.strip_prefix("~/").unwrap_or(&raw[1..]))
        } else {
            PathBuf::from(raw)
        }
    } else {
        PathBuf::from(raw)
    };

    if expanded.is_absolute() {
        expanded
    } else {
        config_dir.join(expanded)
    }
}

/// Parse a KDL document into the config, merging into the existing config.
fn parse_document(doc: &KdlDocument, config: &mut NiriConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "input" => {
                if let Some(children) = node.children() {
                    parse_input(children, &mut config.input);
                }
            }
            "output" => {
                let output = parse_output(node);
                // Merge by name: replace existing or append
                if let Some(existing) = config
                    .outputs
                    .iter_mut()
                    .find(|o| o.name == output.name)
                {
                    *existing = output;
                } else {
                    config.outputs.push(output);
                }
            }
            "layout" => {
                if let Some(children) = node.children() {
                    parse_layout(children, &mut config.layout);
                }
            }
            "spawn-at-startup" => {
                let args: Vec<String> = node
                    .entries()
                    .iter()
                    .filter(|e| e.name().is_none())
                    .filter_map(|e| match e.value() {
                        KdlValue::String(s) => Some(s.clone()),
                        _ => None,
                    })
                    .collect();
                if !args.is_empty() {
                    config
                        .spawn_at_startup
                        .push(SpawnAtStartup { command: args });
                }
            }
            "spawn-sh-at-startup" => {
                if let Some(s) = get_string_arg(node) {
                    config
                        .spawn_sh_at_startup
                        .push(SpawnShAtStartup { command: s.to_string() });
                }
            }
            "hotkey-overlay" => {
                if let Some(children) = node.children() {
                    config.hotkey_overlay.skip_at_startup = has_child_node(children, "skip-at-startup");
                    config.hotkey_overlay.hide_not_bound = has_child_node(children, "hide-not-bound");
                }
            }
            "prefer-no-csd" => {
                config.prefer_no_csd = true;
            }
            "screenshot-path" => {
                if let Some(val) = node.get(0) {
                    match val {
                        KdlValue::Null => {
                            config.screenshot_path = None;
                        }
                        KdlValue::String(s) => {
                            config.screenshot_path = Some(s.clone());
                        }
                        _ => {}
                    }
                }
            }
            "animations" => {
                if let Some(children) = node.children() {
                    parse_animations(children, &mut config.animations);
                }
            }
            "window-rule" => {
                let rule = parse_window_rule(node);
                config.window_rules.push(rule);
            }
            "layer-rule" => {
                let rule = parse_layer_rule(node);
                config.layer_rules.push(rule);
            }
            "binds" => {
                if let Some(children) = node.children() {
                    parse_binds(children, &mut config.key_bindings);
                }
            }
            "cursor" => {
                if let Some(children) = node.children() {
                    parse_cursor(children, &mut config.cursor);
                }
            }
            "environment" => {
                if let Some(children) = node.children() {
                    parse_environment(children, &mut config.environment);
                }
            }
            "workspace" => {
                let ws = parse_named_workspace(node);
                config.workspaces.push(ws);
            }
            "switch-events" => {
                if let Some(children) = node.children() {
                    parse_switch_events(children, &mut config.switch_events);
                }
            }
            "gestures" => {
                if let Some(children) = node.children() {
                    parse_gestures(children, &mut config.gestures);
                }
            }
            "overview" => {
                if let Some(children) = node.children() {
                    parse_overview(children, &mut config.overview);
                }
            }
            "clipboard" => {
                if let Some(children) = node.children() {
                    parse_clipboard(children, &mut config.clipboard);
                }
            }
            "xwayland-satellite" => {
                if let Some(children) = node.children() {
                    parse_xwayland_satellite(children, &mut config.xwayland_satellite);
                }
            }
            "config-notification" => {
                if let Some(children) = node.children() {
                    parse_config_notification(children, &mut config.config_notification);
                }
            }
            _ => {
                // Unknown top-level nodes are ignored
            }
        }
    }
}

// --- Helper functions ---

fn get_string_arg(node: &KdlNode) -> Option<&str> {
    node.entries()
        .iter()
        .find(|e| e.name().is_none())
        .and_then(|e| e.value().as_string())
}

fn get_int_arg(node: &KdlNode) -> Option<i64> {
    node.entries()
        .iter()
        .find(|e| e.name().is_none())
        .and_then(|e| e.value().as_integer())
        .map(|v| v as i64)
}

fn get_float_arg(node: &KdlNode) -> Option<f64> {
    node.entries()
        .iter()
        .find(|e| e.name().is_none())
        .and_then(|e| match e.value() {
            KdlValue::Float(f) => Some(*f),
            KdlValue::Integer(i) => Some(*i as f64),
            _ => None,
        })
}

fn get_bool_arg(node: &KdlNode) -> Option<bool> {
    node.entries()
        .iter()
        .find(|e| e.name().is_none())
        .and_then(|e| match e.value() {
            KdlValue::Bool(b) => Some(*b),
            KdlValue::String(s) => match s.as_str() {
                "true" => Some(true),
                "false" => Some(false),
                _ => None,
            },
            _ => None,
        })
}

fn get_string_prop<'a>(node: &'a KdlNode, name: &str) -> Option<&'a str> {
    node.get(name).and_then(|v| v.as_string())
}

fn get_int_prop(node: &KdlNode, name: &str) -> Option<i64> {
    node.get(name).and_then(|v| v.as_integer()).map(|v| v as i64)
}

fn get_float_prop(node: &KdlNode, name: &str) -> Option<f64> {
    node.get(name).and_then(|v| match v {
        KdlValue::Float(f) => Some(*f),
        KdlValue::Integer(i) => Some(*i as f64),
        _ => None,
    })
}

fn get_bool_prop(node: &KdlNode, name: &str) -> Option<bool> {
    node.get(name).and_then(|v| match v {
        KdlValue::Bool(b) => Some(*b),
        KdlValue::String(s) => match s.as_str() {
            "true" => Some(true),
            "false" => Some(false),
            _ => None,
        },
        _ => None,
    })
}

fn has_child_node(doc: &KdlDocument, name: &str) -> bool {
    doc.nodes().iter().any(|n| n.name().value() == name)
}

fn find_child_node<'a>(doc: &'a KdlDocument, name: &str) -> Option<&'a KdlNode> {
    doc.nodes().iter().find(|n| n.name().value() == name)
}

// --- Section parsers ---

fn parse_input(doc: &KdlDocument, input: &mut InputConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "keyboard" => {
                if let Some(children) = node.children() {
                    parse_keyboard(children, &mut input.keyboard);
                }
            }
            "touchpad" => {
                if let Some(children) = node.children() {
                    parse_pointer(children, &mut input.touchpad);
                }
            }
            "mouse" => {
                if let Some(children) = node.children() {
                    parse_pointer(children, &mut input.mouse);
                }
            }
            "trackpoint" => {
                if let Some(children) = node.children() {
                    parse_pointer(children, &mut input.trackpoint);
                }
            }
            "trackball" => {
                if let Some(children) = node.children() {
                    parse_pointer(children, &mut input.trackball);
                }
            }
            "tablet" => {
                if let Some(children) = node.children() {
                    parse_tablet(children, &mut input.tablet);
                }
            }
            "touch" => {
                if let Some(children) = node.children() {
                    parse_touch(children, &mut input.touch);
                }
            }
            "warp-mouse-to-focus" => {
                input.warp_mouse_to_focus = true;
            }
            "focus-follows-mouse" => {
                let max_scroll = get_string_prop(node, "max-scroll-amount").map(|s| s.to_string());
                input.focus_follows_mouse = Some(FocusFollowsMouseConfig {
                    max_scroll_amount: max_scroll,
                });
            }
            "disable-power-key-handling" => {
                input.disable_power_key_handling = true;
            }
            "workspace-auto-back-and-forth" => {
                input.workspace_auto_back_and_forth = true;
            }
            "mod-key" => {
                input.mod_key = get_string_arg(node).map(|s| s.to_string());
            }
            "mod-key-nested" => {
                input.mod_key_nested = get_string_arg(node).map(|s| s.to_string());
            }
            _ => {}
        }
    }
}

fn parse_keyboard(doc: &KdlDocument, keyboard: &mut KeyboardConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "xkb" => {
                if let Some(children) = node.children() {
                    parse_xkb(children, &mut keyboard.xkb);
                }
            }
            "numlock" => {
                keyboard.numlock = true;
            }
            "repeat-delay" => {
                keyboard.repeat_delay = get_int_arg(node);
            }
            "repeat-rate" => {
                keyboard.repeat_rate = get_int_arg(node);
            }
            "track-layout" => {
                keyboard.track_layout = get_string_arg(node).map(|s| s.to_string());
            }
            _ => {}
        }
    }
}

fn parse_xkb(doc: &KdlDocument, xkb: &mut XkbConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "layout" => xkb.layout = get_string_arg(node).map(|s| s.to_string()),
            "model" => xkb.model = get_string_arg(node).map(|s| s.to_string()),
            "rules" => xkb.rules = get_string_arg(node).map(|s| s.to_string()),
            "variant" => xkb.variant = get_string_arg(node).map(|s| s.to_string()),
            "options" => xkb.options = get_string_arg(node).map(|s| s.to_string()),
            _ => {}
        }
    }
}

fn parse_pointer(doc: &KdlDocument, ptr: &mut PointerConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "off" => ptr.off = true,
            "tap" => ptr.tap = true,
            "dwt" => ptr.dwt = true,
            "dwtp" => ptr.dwtp = true,
            "drag" => {
                ptr.drag = Some(get_bool_arg(node).unwrap_or(true));
            }
            "drag-lock" => ptr.drag_lock = true,
            "natural-scroll" => ptr.natural_scroll = true,
            "accel-speed" => ptr.accel_speed = get_float_arg(node),
            "accel-profile" => ptr.accel_profile = get_string_arg(node).map(|s| s.to_string()),
            "scroll-method" => ptr.scroll_method = get_string_arg(node).map(|s| s.to_string()),
            "disabled-on-external-mouse" => ptr.disabled_on_external_mouse = true,
            "scroll-button" => ptr.scroll_button = get_int_arg(node),
            "scroll-button-lock" => ptr.scroll_button_lock = true,
            "middle-emulation" => ptr.middle_emulation = true,
            "left-handed" => ptr.left_handed = true,
            "scroll-factor" => ptr.scroll_factor = get_float_arg(node),
            "tap-button-map" => ptr.tap_button_map = get_string_arg(node).map(|s| s.to_string()),
            "click-method" => ptr.click_method = get_string_arg(node).map(|s| s.to_string()),
            _ => {}
        }
    }
}

fn parse_tablet(doc: &KdlDocument, tablet: &mut TabletConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "map-to-output" => {
                tablet.map_to_output = get_string_arg(node).map(|s| s.to_string());
            }
            "left-handed" => {
                tablet.left_handed = true;
            }
            _ => {}
        }
    }
}

fn parse_touch(doc: &KdlDocument, touch: &mut TouchConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "map-to-output" => {
                touch.map_to_output = get_string_arg(node).map(|s| s.to_string());
            }
            _ => {}
        }
    }
}

fn parse_output(node: &KdlNode) -> OutputConfig {
    let name = get_string_arg(node).unwrap_or("").to_string();
    let mut output = OutputConfig {
        name,
        ..Default::default()
    };

    if let Some(children) = node.children() {
        for child in children.nodes() {
            match child.name().value() {
                "off" => output.off = true,
                "mode" => output.mode = get_string_arg(child).map(|s| s.to_string()),
                "scale" => {
                    output.scale = get_float_arg(child);
                }
                "transform" => output.transform = get_string_arg(child).map(|s| s.to_string()),
                "position" => {
                    output.position_x = get_int_prop(child, "x");
                    output.position_y = get_int_prop(child, "y");
                }
                _ => {}
            }
        }
    }

    output
}

fn parse_layout(doc: &KdlDocument, layout: &mut LayoutConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "gaps" => layout.gaps = get_int_arg(node),
            "center-focused-column" => {
                layout.center_focused_column = get_string_arg(node).map(|s| s.to_string());
            }
            "preset-column-widths" => {
                if let Some(children) = node.children() {
                    layout.preset_column_widths = parse_column_widths(children);
                }
            }
            "preset-window-heights" => {
                if let Some(children) = node.children() {
                    layout.preset_window_heights = parse_column_widths(children);
                }
            }
            "default-column-width" => {
                if let Some(children) = node.children() {
                    let widths = parse_column_widths(children);
                    layout.default_column_width = Some(widths);
                } else {
                    // "default-column-width" without children block
                    layout.default_column_width = None;
                }
            }
            "focus-ring" => {
                if let Some(children) = node.children() {
                    parse_ring_border(children, &mut layout.focus_ring);
                }
            }
            "border" => {
                if let Some(children) = node.children() {
                    parse_ring_border(children, &mut layout.border);
                }
            }
            "shadow" => {
                if let Some(children) = node.children() {
                    parse_shadow(children, &mut layout.shadow);
                }
            }
            "tab-indicator" => {
                if let Some(children) = node.children() {
                    parse_tab_indicator(children, &mut layout.tab_indicator);
                }
            }
            "insert-hint" => {
                if let Some(children) = node.children() {
                    parse_insert_hint(children, &mut layout.insert_hint);
                }
            }
            "struts" => {
                if let Some(children) = node.children() {
                    parse_struts(children, &mut layout.struts);
                }
            }
            "always-center-single-column" => {
                layout.always_center_single_column = true;
            }
            "empty-workspace-above-first" => {
                layout.empty_workspace_above_first = true;
            }
            "default-column-display" => {
                layout.default_column_display = get_string_arg(node).map(|s| s.to_string());
            }
            "background-color" => {
                layout.background_color = get_string_arg(node).map(|s| s.to_string());
            }
            _ => {}
        }
    }
}

fn parse_column_widths(doc: &KdlDocument) -> Vec<ColumnWidth> {
    let mut widths = Vec::new();
    for node in doc.nodes() {
        match node.name().value() {
            "proportion" => {
                if let Some(val) = get_float_arg(node) {
                    widths.push(ColumnWidth::Proportion { value: val });
                }
            }
            "fixed" => {
                if let Some(val) = get_int_arg(node) {
                    widths.push(ColumnWidth::Fixed { value: val });
                }
            }
            _ => {}
        }
    }
    widths
}

fn parse_ring_border(doc: &KdlDocument, rb: &mut RingBorderConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "off" => rb.off = true,
            "width" => rb.width = get_int_arg(node),
            "active-color" => rb.active_color = get_string_arg(node).map(|s| s.to_string()),
            "inactive-color" => rb.inactive_color = get_string_arg(node).map(|s| s.to_string()),
            "urgent-color" => rb.urgent_color = get_string_arg(node).map(|s| s.to_string()),
            "active-gradient" => rb.active_gradient = Some(parse_gradient(node)),
            "inactive-gradient" => rb.inactive_gradient = Some(parse_gradient(node)),
            "urgent-gradient" => rb.urgent_gradient = Some(parse_gradient(node)),
            _ => {}
        }
    }
}

fn parse_gradient(node: &KdlNode) -> GradientConfig {
    GradientConfig {
        from_color: get_string_prop(node, "from").unwrap_or("").to_string(),
        to_color: get_string_prop(node, "to").unwrap_or("").to_string(),
        angle: get_int_prop(node, "angle"),
        relative_to: get_string_prop(node, "relative-to").map(|s| s.to_string()),
        color_space: get_string_prop(node, "in").map(|s| s.to_string()),
    }
}

fn parse_shadow(doc: &KdlDocument, shadow: &mut ShadowConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "on" => shadow.on = true,
            "draw-behind-window" => shadow.draw_behind_window = get_bool_arg(node),
            "softness" => shadow.softness = get_int_arg(node),
            "spread" => shadow.spread = get_int_arg(node),
            "offset" => {
                shadow.offset_x = get_int_prop(node, "x");
                shadow.offset_y = get_int_prop(node, "y");
            }
            "color" => shadow.color = get_string_arg(node).map(|s| s.to_string()),
            "inactive-color" => shadow.inactive_color = get_string_arg(node).map(|s| s.to_string()),
            _ => {}
        }
    }
}

fn parse_tab_indicator(doc: &KdlDocument, ti: &mut TabIndicatorConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "off" => ti.off = true,
            "active-color" => ti.active_color = get_string_arg(node).map(|s| s.to_string()),
            "inactive-color" => ti.inactive_color = get_string_arg(node).map(|s| s.to_string()),
            "urgent-color" => ti.urgent_color = get_string_arg(node).map(|s| s.to_string()),
            "hide-when-single-tab" => ti.hide_when_single_tab = true,
            "place-within-column" => ti.place_within_column = true,
            "gap" => ti.gap = get_int_arg(node),
            "width" => ti.width = get_int_arg(node),
            "length" => ti.length = get_int_arg(node),
            "position" => ti.position = get_string_arg(node).map(|s| s.to_string()),
            "gaps-between-tabs" => ti.gaps_between_tabs = get_int_arg(node),
            "corner-radius" => ti.corner_radius = get_float_arg(node),
            "active-gradient" => ti.active_gradient = Some(parse_gradient(node)),
            "inactive-gradient" => ti.inactive_gradient = Some(parse_gradient(node)),
            "urgent-gradient" => ti.urgent_gradient = Some(parse_gradient(node)),
            _ => {}
        }
    }
}

fn parse_insert_hint(doc: &KdlDocument, ih: &mut InsertHintConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "off" => ih.off = true,
            "color" => ih.color = get_string_arg(node).map(|s| s.to_string()),
            "gradient" => ih.gradient = Some(parse_gradient(node)),
            _ => {}
        }
    }
}

fn parse_struts(doc: &KdlDocument, struts: &mut StrutsConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "left" => struts.left = get_int_arg(node),
            "right" => struts.right = get_int_arg(node),
            "top" => struts.top = get_int_arg(node),
            "bottom" => struts.bottom = get_int_arg(node),
            _ => {}
        }
    }
}

fn parse_animations(doc: &KdlDocument, anims: &mut AnimationsConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "off" => anims.off = true,
            "slowdown" => anims.slowdown = get_float_arg(node),
            "workspace-switch" => {
                if let Some(children) = node.children() {
                    anims.workspace_switch = Some(parse_individual_animation(children));
                }
            }
            "window-open" => {
                if let Some(children) = node.children() {
                    anims.window_open = Some(parse_individual_animation(children));
                }
            }
            "window-close" => {
                if let Some(children) = node.children() {
                    anims.window_close = Some(parse_individual_animation(children));
                }
            }
            "horizontal-view-movement" => {
                if let Some(children) = node.children() {
                    anims.horizontal_view_movement = Some(parse_individual_animation(children));
                }
            }
            "window-movement" => {
                if let Some(children) = node.children() {
                    anims.window_movement = Some(parse_individual_animation(children));
                }
            }
            "window-resize" => {
                if let Some(children) = node.children() {
                    anims.window_resize = Some(parse_individual_animation(children));
                }
            }
            "config-notification-open-close" => {
                if let Some(children) = node.children() {
                    anims.config_notification_open_close = Some(parse_individual_animation(children));
                }
            }
            "exit-confirmation-open-close" => {
                if let Some(children) = node.children() {
                    anims.exit_confirmation_open_close = Some(parse_individual_animation(children));
                }
            }
            "screenshot-ui-open" => {
                if let Some(children) = node.children() {
                    anims.screenshot_ui_open = Some(parse_individual_animation(children));
                }
            }
            "overview-open-close" => {
                if let Some(children) = node.children() {
                    anims.overview_open_close = Some(parse_individual_animation(children));
                }
            }
            "recent-windows-close" => {
                if let Some(children) = node.children() {
                    anims.recent_windows_close = Some(parse_individual_animation(children));
                }
            }
            _ => {}
        }
    }
}

fn parse_individual_animation(doc: &KdlDocument) -> IndividualAnimation {
    let mut custom_shader: Option<String> = None;

    // Look for custom-shader node
    if let Some(shader_node) = find_child_node(doc, "custom-shader") {
        custom_shader = get_string_arg(shader_node).map(|s| s.to_string());
    }

    // Look for spring or easing node
    if let Some(spring_node) = find_child_node(doc, "spring") {
        let damping_ratio = get_float_prop(spring_node, "damping-ratio").unwrap_or(1.0);
        let stiffness = get_float_prop(spring_node, "stiffness").unwrap_or(400.0);
        let epsilon = get_float_prop(spring_node, "epsilon").unwrap_or(0.0001);
        return IndividualAnimation {
            kind: AnimationKind::Spring {
                damping_ratio,
                stiffness,
                epsilon,
            },
            custom_shader,
        };
    }

    if let Some(easing_node) = find_child_node(doc, "easing") {
        let duration_ms = get_int_prop(easing_node, "duration-ms").unwrap_or(250);
        let curve = get_string_prop(easing_node, "curve")
            .unwrap_or("ease-out-cubic")
            .to_string();
        return IndividualAnimation {
            kind: AnimationKind::Easing {
                duration_ms,
                curve,
            },
            custom_shader,
        };
    }

    // Default to spring if neither specified
    IndividualAnimation {
        kind: AnimationKind::Spring {
            damping_ratio: 1.0,
            stiffness: 400.0,
            epsilon: 0.0001,
        },
        custom_shader,
    }
}

fn parse_window_rule(node: &KdlNode) -> WindowRule {
    let mut rule = WindowRule {
        id: Uuid::new_v4().to_string(),
        ..Default::default()
    };

    if let Some(children) = node.children() {
        for child in children.nodes() {
            match child.name().value() {
                "match" => {
                    let m = parse_match_rule(child);
                    rule.matches.push(m);
                }
                "exclude" => {
                    let m = parse_match_rule(child);
                    rule.excludes.push(m);
                }
                "default-column-width" => {
                    if let Some(inner) = child.children() {
                        rule.default_column_width = Some(parse_column_widths(inner));
                    } else {
                        // Empty braces means "let windows decide"
                        rule.default_column_width = Some(Vec::new());
                    }
                }
                "default-window-height" => {
                    if let Some(inner) = child.children() {
                        rule.default_window_height = Some(parse_column_widths(inner));
                    } else {
                        rule.default_window_height = Some(Vec::new());
                    }
                }
                "open-floating" => {
                    rule.open_floating = get_bool_arg(child);
                }
                "open-maximized" => {
                    rule.open_maximized = get_bool_arg(child);
                }
                "open-maximized-to-edges" => {
                    rule.open_maximized_to_edges = get_bool_arg(child);
                }
                "open-fullscreen" => {
                    rule.open_fullscreen = get_bool_arg(child);
                }
                "open-focused" => {
                    rule.open_focused = get_bool_arg(child);
                }
                "geometry-corner-radius" => {
                    rule.geometry_corner_radius = get_float_arg(child);
                }
                "clip-to-geometry" => {
                    rule.clip_to_geometry = get_bool_arg(child);
                }
                "block-out-from" => {
                    rule.block_out_from = get_string_arg(child).map(|s| s.to_string());
                }
                "draw-border-with-background" => {
                    rule.draw_border_with_background = get_bool_arg(child);
                }
                "opacity" => {
                    rule.opacity = get_float_arg(child);
                }
                "min-width" => {
                    rule.min_width = get_int_arg(child);
                }
                "max-width" => {
                    rule.max_width = get_int_arg(child);
                }
                "min-height" => {
                    rule.min_height = get_int_arg(child);
                }
                "max-height" => {
                    rule.max_height = get_int_arg(child);
                }
                "open-on-output" => {
                    rule.open_on_output = get_string_arg(child).map(|s| s.to_string());
                }
                "open-on-workspace" => {
                    rule.open_on_workspace = get_string_arg(child).map(|s| s.to_string());
                }
                "variable-refresh-rate" => {
                    rule.variable_refresh_rate = get_bool_arg(child);
                }
                "default-column-display" => {
                    rule.default_column_display = get_string_arg(child).map(|s| s.to_string());
                }
                "default-floating-position" => {
                    let mut fp = FloatingPosition::default();
                    fp.x = get_int_prop(child, "x");
                    fp.y = get_int_prop(child, "y");
                    fp.relative_to = get_string_prop(child, "relative-to").map(|s| s.to_string());
                    rule.default_floating_position = Some(fp);
                }
                "scroll-factor" => {
                    rule.scroll_factor = get_float_arg(child);
                }
                "tiled-state" => {
                    rule.tiled_state = get_string_arg(child).map(|s| s.to_string());
                }
                "baba-is-float" => {
                    rule.baba_is_float = get_bool_arg(child);
                }
                "focus-ring" => {
                    if let Some(inner) = child.children() {
                        let mut rb = RingBorderConfig::default();
                        parse_ring_border(inner, &mut rb);
                        rule.focus_ring = Some(rb);
                    }
                }
                "border" => {
                    if let Some(inner) = child.children() {
                        let mut rb = RingBorderConfig::default();
                        parse_ring_border(inner, &mut rb);
                        rule.border = Some(rb);
                    }
                }
                "shadow" => {
                    if let Some(inner) = child.children() {
                        let mut s = ShadowConfig::default();
                        parse_shadow(inner, &mut s);
                        rule.shadow = Some(s);
                    }
                }
                "tab-indicator" => {
                    if let Some(inner) = child.children() {
                        let mut ti = TabIndicatorConfig::default();
                        parse_tab_indicator(inner, &mut ti);
                        rule.tab_indicator = Some(ti);
                    }
                }
                _ => {}
            }
        }
    }

    rule
}

fn parse_match_rule(node: &KdlNode) -> MatchRule {
    MatchRule {
        app_id: get_string_prop(node, "app-id").map(|s| s.to_string()),
        title: get_string_prop(node, "title").map(|s| s.to_string()),
        is_focused: get_bool_prop(node, "is-focused"),
        is_active_in_column: get_bool_prop(node, "is-active-in-column"),
        is_floating: get_bool_prop(node, "is-floating"),
        is_window_cast_target: get_bool_prop(node, "is-window-cast-target"),
        is_urgent: get_bool_prop(node, "is-urgent"),
        at_startup: get_bool_prop(node, "at-startup"),
    }
}

fn parse_layer_rule(node: &KdlNode) -> LayerRule {
    let mut rule = LayerRule {
        id: Uuid::new_v4().to_string(),
        ..Default::default()
    };

    if let Some(children) = node.children() {
        for child in children.nodes() {
            match child.name().value() {
                "match" => {
                    let m = LayerMatchRule {
                        namespace: get_string_prop(child, "namespace").map(|s| s.to_string()),
                        at_startup: get_bool_prop(child, "at-startup"),
                    };
                    rule.matches.push(m);
                }
                "block-out-from" => {
                    rule.block_out_from = get_string_arg(child).map(|s| s.to_string());
                }
                "opacity" => {
                    rule.opacity = get_float_arg(child);
                }
                "place-within-backdrop" => {
                    rule.place_within_backdrop = get_bool_arg(child);
                }
                _ => {}
            }
        }
    }

    rule
}

fn parse_binds(doc: &KdlDocument, binds: &mut Vec<KeyBinding>) {
    for node in doc.nodes() {
        let key = node.name().value().to_string();

        // Extract properties from the bind node
        let repeat = get_bool_prop(node, "repeat");
        let cooldown_ms = get_int_prop(node, "cooldown-ms");
        let allow_when_locked = get_bool_prop(node, "allow-when-locked");
        let allow_inhibiting = get_bool_prop(node, "allow-inhibiting");

        // hotkey-overlay-title can be null or a string
        let hotkey_overlay_title = node.get("hotkey-overlay-title").map(|v| match v {
            KdlValue::Null => None,
            KdlValue::String(s) => Some(s.clone()),
            _ => None,
        });

        // Extract the action from children
        let mut action = String::new();
        let mut action_args: Vec<String> = Vec::new();

        if let Some(children) = node.children() {
            if let Some(action_node) = children.nodes().first() {
                action = action_node.name().value().to_string();
                // Collect all positional string/int args
                for entry in action_node.entries() {
                    if entry.name().is_none() {
                        match entry.value() {
                            KdlValue::String(s) => action_args.push(s.clone()),
                            KdlValue::Integer(i) => action_args.push(i.to_string()),
                            KdlValue::Float(f) => action_args.push(f.to_string()),
                            _ => {}
                        }
                    }
                }
            }
        }

        binds.push(KeyBinding {
            id: Uuid::new_v4().to_string(),
            key,
            action,
            action_args,
            repeat,
            cooldown_ms,
            allow_when_locked,
            allow_inhibiting,
            hotkey_overlay_title,
        });
    }
}

fn parse_cursor(doc: &KdlDocument, cursor: &mut CursorConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "xcursor-theme" => {
                cursor.xcursor_theme = get_string_arg(node).map(|s| s.to_string());
            }
            "xcursor-size" => {
                cursor.xcursor_size = get_int_arg(node);
            }
            "hide-when-typing" => {
                cursor.hide_when_typing = true;
            }
            "hide-after-inactive-ms" => {
                cursor.hide_after_inactive_ms = get_int_arg(node);
            }
            _ => {}
        }
    }
}

fn parse_environment(doc: &KdlDocument, env_list: &mut Vec<EnvironmentEntry>) {
    for node in doc.nodes() {
        let key = node.name().value().to_string();
        let value = get_string_arg(node).map(|s| s.to_string());
        env_list.push(EnvironmentEntry { key, value });
    }
}

fn parse_named_workspace(node: &KdlNode) -> NamedWorkspace {
    let name = get_string_arg(node).unwrap_or("").to_string();
    let mut ws = NamedWorkspace {
        id: Uuid::new_v4().to_string(),
        name,
        open_on_output: None,
    };

    if let Some(children) = node.children() {
        if let Some(output_node) = find_child_node(children, "open-on-output") {
            ws.open_on_output = get_string_arg(output_node).map(|s| s.to_string());
        }
    }

    ws
}

fn parse_switch_events(doc: &KdlDocument, switch_events: &mut SwitchEventsConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "lid-close" => {
                if let Some(children) = node.children() {
                    switch_events.lid_close = Some(parse_switch_action(children));
                }
            }
            "lid-open" => {
                if let Some(children) = node.children() {
                    switch_events.lid_open = Some(parse_switch_action(children));
                }
            }
            "tablet-mode-on" => {
                if let Some(children) = node.children() {
                    switch_events.tablet_mode_on = Some(parse_switch_action(children));
                }
            }
            "tablet-mode-off" => {
                if let Some(children) = node.children() {
                    switch_events.tablet_mode_off = Some(parse_switch_action(children));
                }
            }
            _ => {}
        }
    }
}

fn parse_switch_action(doc: &KdlDocument) -> SwitchAction {
    let mut action = SwitchAction::default();

    if let Some(spawn_node) = find_child_node(doc, "spawn") {
        action.spawn = spawn_node
            .entries()
            .iter()
            .filter(|e| e.name().is_none())
            .filter_map(|e| match e.value() {
                KdlValue::String(s) => Some(s.clone()),
                _ => None,
            })
            .collect();
    }

    action
}

fn parse_gestures(doc: &KdlDocument, gestures: &mut GesturesConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "dnd-edge-view-scroll" => {
                if let Some(children) = node.children() {
                    gestures.dnd_edge_view_scroll = Some(parse_edge_gesture(children));
                }
            }
            "dnd-edge-workspace-switch" => {
                if let Some(children) = node.children() {
                    gestures.dnd_edge_workspace_switch = Some(parse_edge_gesture(children));
                }
            }
            "hot-corners" => {
                if let Some(children) = node.children() {
                    gestures.hot_corners = Some(parse_hot_corners(children));
                }
            }
            _ => {}
        }
    }
}

fn parse_edge_gesture(doc: &KdlDocument) -> EdgeGestureConfig {
    let mut eg = EdgeGestureConfig::default();
    for node in doc.nodes() {
        match node.name().value() {
            "trigger-width" => eg.trigger_width = get_int_arg(node),
            "trigger-height" => eg.trigger_height = get_int_arg(node),
            "delay-ms" => eg.delay_ms = get_int_arg(node),
            "max-speed" => eg.max_speed = get_float_arg(node),
            _ => {}
        }
    }
    eg
}

fn parse_hot_corners(doc: &KdlDocument) -> HotCornersConfig {
    let mut hc = HotCornersConfig::default();
    for node in doc.nodes() {
        match node.name().value() {
            "off" => hc.off = true,
            "top-left" => hc.top_left = true,
            "top-right" => hc.top_right = true,
            "bottom-left" => hc.bottom_left = true,
            "bottom-right" => hc.bottom_right = true,
            _ => {}
        }
    }
    hc
}

fn parse_overview(doc: &KdlDocument, overview: &mut OverviewConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "zoom" => overview.zoom = get_float_arg(node),
            "backdrop-color" => {
                overview.backdrop_color = get_string_arg(node).map(|s| s.to_string());
            }
            "workspace-shadow" => {
                if let Some(children) = node.children() {
                    let mut shadow = ShadowConfig::default();
                    parse_shadow(children, &mut shadow);
                    overview.workspace_shadow = Some(shadow);
                }
            }
            _ => {}
        }
    }
}

fn parse_clipboard(doc: &KdlDocument, clipboard: &mut ClipboardConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "disable-primary" => clipboard.disable_primary = true,
            _ => {}
        }
    }
}

fn parse_xwayland_satellite(doc: &KdlDocument, xwayland: &mut XwaylandSatelliteConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "path" => {
                xwayland.path = get_string_arg(node).map(|s| s.to_string());
            }
            _ => {}
        }
    }
}

fn parse_config_notification(doc: &KdlDocument, config_notif: &mut ConfigNotificationConfig) {
    for node in doc.nodes() {
        match node.name().value() {
            "disable-failed" => config_notif.disable_failed = true,
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_basic_config() {
        let src = r##"
input {
    keyboard {
        xkb {
            layout "us"
        }
        numlock
    }
    touchpad {
        tap
        natural-scroll
    }
}

layout {
    gaps 16
    focus-ring {
        width 4
        active-color "#7fc8ff"
    }
    border {
        off
        width 4
    }
    shadow {
        softness 30
        offset x=0 y=5
        color "#0007"
    }
}

screenshot-path "~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"

animations {
    off
}

window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    open-floating true
}

binds {
    Mod+T hotkey-overlay-title="Open a Terminal" { spawn "alacritty"; }
    Mod+Q repeat=false { close-window; }
    Mod+WheelScrollDown cooldown-ms=150 { focus-workspace-down; }
}
"##;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);

        assert!(config.input.keyboard.numlock);
        assert!(config.input.touchpad.tap);
        assert!(config.input.touchpad.natural_scroll);
        assert_eq!(config.layout.gaps, Some(16));
        assert_eq!(config.layout.focus_ring.width, Some(4));
        assert_eq!(
            config.layout.focus_ring.active_color.as_deref(),
            Some("#7fc8ff")
        );
        assert!(config.layout.border.off);
        assert_eq!(config.layout.shadow.softness, Some(30));
        assert_eq!(config.layout.shadow.offset_x, Some(0));
        assert_eq!(config.layout.shadow.offset_y, Some(5));
        assert!(config.animations.off);

        assert_eq!(config.window_rules.len(), 1);
        assert_eq!(config.window_rules[0].matches.len(), 1);
        assert_eq!(
            config.window_rules[0].matches[0].app_id.as_deref(),
            Some("firefox$")
        );
        assert_eq!(config.window_rules[0].open_floating, Some(true));

        assert_eq!(config.key_bindings.len(), 3);
        assert_eq!(config.key_bindings[0].key, "Mod+T");
        assert_eq!(config.key_bindings[0].action, "spawn");
        assert_eq!(config.key_bindings[0].action_args, vec!["alacritty"]);
        assert_eq!(
            config.key_bindings[0].hotkey_overlay_title,
            Some(Some("Open a Terminal".to_string()))
        );
        assert_eq!(config.key_bindings[1].repeat, Some(false));
        assert_eq!(config.key_bindings[2].cooldown_ms, Some(150));
    }

    #[test]
    fn test_parse_screenshot_null() {
        let src = "screenshot-path null\n";
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.screenshot_path, None);
    }

    #[test]
    fn test_parse_screenshot_path() {
        let src = "screenshot-path \"~/Pictures/test.png\"\n";
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.screenshot_path, Some("~/Pictures/test.png".to_string()));
    }

    #[test]
    fn test_parse_empty_default_column_width() {
        let src = r#"
window-rule {
    default-column-width {}
}
"#;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.window_rules.len(), 1);
        assert_eq!(config.window_rules[0].default_column_width, Some(vec![]));
    }

    #[test]
    fn test_parse_cursor() {
        let src = r#"
cursor {
    xcursor-theme "Adwaita"
    xcursor-size 24
    hide-when-typing
    hide-after-inactive-ms 5000
}
"#;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.cursor.xcursor_theme.as_deref(), Some("Adwaita"));
        assert_eq!(config.cursor.xcursor_size, Some(24));
        assert!(config.cursor.hide_when_typing);
        assert_eq!(config.cursor.hide_after_inactive_ms, Some(5000));
    }

    #[test]
    fn test_parse_environment() {
        let src = r#"
environment {
    QT_QPA_PLATFORM "wayland"
    DISPLAY null
}
"#;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.environment.len(), 2);
        assert_eq!(config.environment[0].key, "QT_QPA_PLATFORM");
        assert_eq!(config.environment[0].value.as_deref(), Some("wayland"));
        assert_eq!(config.environment[1].key, "DISPLAY");
        assert_eq!(config.environment[1].value, None);
    }

    #[test]
    fn test_parse_workspace() {
        let src = r#"
workspace "browser" {
    open-on-output "eDP-1"
}
workspace "code"
"#;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.workspaces.len(), 2);
        assert_eq!(config.workspaces[0].name, "browser");
        assert_eq!(config.workspaces[0].open_on_output.as_deref(), Some("eDP-1"));
        assert_eq!(config.workspaces[1].name, "code");
        assert_eq!(config.workspaces[1].open_on_output, None);
    }

    #[test]
    fn test_parse_animations_individual() {
        let src = r##"
animations {
    workspace-switch {
        spring damping-ratio=0.8 stiffness=400.0 epsilon=0.0001
    }
    window-open {
        easing duration-ms=200 curve="ease-out-expo"
    }
}
"##;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert!(config.animations.workspace_switch.is_some());
        let ws = config.animations.workspace_switch.unwrap();
        match ws.kind {
            AnimationKind::Spring { damping_ratio, stiffness, epsilon } => {
                assert!((damping_ratio - 0.8).abs() < 0.001);
                assert!((stiffness - 400.0).abs() < 0.001);
                assert!((epsilon - 0.0001).abs() < 0.00001);
            }
            _ => panic!("Expected spring animation"),
        }
        assert!(config.animations.window_open.is_some());
        let wo = config.animations.window_open.unwrap();
        match wo.kind {
            AnimationKind::Easing { duration_ms, ref curve } => {
                assert_eq!(duration_ms, 200);
                assert_eq!(curve, "ease-out-expo");
            }
            _ => panic!("Expected easing animation"),
        }
    }

    #[test]
    fn test_parse_focus_follows_mouse() {
        let src = r#"
input {
    focus-follows-mouse max-scroll-amount="10%"
}
"#;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert!(config.input.focus_follows_mouse.is_some());
        let ffm = config.input.focus_follows_mouse.unwrap();
        assert_eq!(ffm.max_scroll_amount.as_deref(), Some("10%"));
    }

    #[test]
    fn test_parse_hotkey_overlay_hide_not_bound() {
        let src = r#"
hotkey-overlay {
    skip-at-startup
    hide-not-bound
}
"#;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert!(config.hotkey_overlay.skip_at_startup);
        assert!(config.hotkey_overlay.hide_not_bound);
    }

    #[test]
    fn test_parse_window_rule_excludes() {
        let src = r#"
window-rule {
    match app-id="firefox"
    exclude title="^Private"
    open-maximized true
}
"#;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.window_rules.len(), 1);
        assert_eq!(config.window_rules[0].matches.len(), 1);
        assert_eq!(config.window_rules[0].excludes.len(), 1);
        assert_eq!(config.window_rules[0].excludes[0].title.as_deref(), Some("^Private"));
    }

    #[test]
    fn test_parse_shadow_inactive_color() {
        let src = r##"
layout {
    shadow {
        on
        color "#0007"
        inactive-color "#0003"
    }
}
"##;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert!(config.layout.shadow.on);
        assert_eq!(config.layout.shadow.color.as_deref(), Some("#0007"));
        assert_eq!(config.layout.shadow.inactive_color.as_deref(), Some("#0003"));
    }

    #[test]
    fn test_parse_tab_indicator_new_fields() {
        let src = r##"
layout {
    tab-indicator {
        hide-when-single-tab
        place-within-column
        gap 4
        width 3
        length 20
        position "left"
        gaps-between-tabs 2
        corner-radius 1.5
        active-gradient from="#ff0000" to="#00ff00" angle=90
    }
}
"##;
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        let ti = &config.layout.tab_indicator;
        assert!(ti.hide_when_single_tab);
        assert!(ti.place_within_column);
        assert_eq!(ti.gap, Some(4));
        assert_eq!(ti.width, Some(3));
        assert_eq!(ti.length, Some(20));
        assert_eq!(ti.position.as_deref(), Some("left"));
        assert_eq!(ti.gaps_between_tabs, Some(2));
        assert!((ti.corner_radius.unwrap() - 1.5).abs() < 0.001);
        assert!(ti.active_gradient.is_some());
        let grad = ti.active_gradient.as_ref().unwrap();
        assert_eq!(grad.from_color, "#ff0000");
        assert_eq!(grad.to_color, "#00ff00");
        assert_eq!(grad.angle, Some(90));
    }

    #[test]
    fn test_parse_spawn_sh_at_startup() {
        let src = "spawn-sh-at-startup \"bash -c 'echo hello'\"\n";
        let doc: KdlDocument = src.parse().unwrap();
        let mut config = NiriConfig::default();
        parse_document(&doc, &mut config);
        assert_eq!(config.spawn_sh_at_startup.len(), 1);
        assert_eq!(config.spawn_sh_at_startup[0].command, "bash -c 'echo hello'");
    }
}
