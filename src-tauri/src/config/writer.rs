use std::path::PathBuf;

use kdl::{KdlDocument, KdlEntry, KdlNode, KdlValue};
use similar::{ChangeTag, TextDiff};

use super::types::*;

/// Error type for config writing.
#[derive(Debug, thiserror::Error)]
pub enum WriteError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Write error: {0}")]
    Write(String),
}

/// Apply changes from old config to new config by modifying the KDL AST.
/// This preserves comments and formatting for unchanged parts.
pub fn apply_changes(
    main_doc: &mut KdlDocument,
    _included: &mut [(PathBuf, KdlDocument)],
    old: &NiriConfig,
    new: &NiriConfig,
) -> Result<(), WriteError> {
    apply_input_changes(main_doc, &old.input, &new.input);
    apply_output_changes(main_doc, &old.outputs, &new.outputs);
    apply_layout_changes(main_doc, &old.layout, &new.layout);
    apply_spawn_changes(main_doc, &old.spawn_at_startup, &new.spawn_at_startup);
    apply_hotkey_overlay_changes(main_doc, &old.hotkey_overlay, &new.hotkey_overlay);
    apply_prefer_no_csd_changes(main_doc, old.prefer_no_csd, new.prefer_no_csd);
    apply_screenshot_changes(main_doc, &old.screenshot_path, &new.screenshot_path);
    apply_animations_changes(main_doc, &old.animations, &new.animations);
    apply_window_rule_changes(main_doc, &old.window_rules, &new.window_rules);
    apply_layer_rule_changes(main_doc, &old.layer_rules, &new.layer_rules);
    apply_binds_changes(main_doc, &old.key_bindings, &new.key_bindings);
    apply_cursor_changes(main_doc, &old.cursor, &new.cursor);
    apply_environment_changes(main_doc, &old.environment, &new.environment);
    apply_workspace_changes(main_doc, &old.workspaces, &new.workspaces);
    apply_switch_events_changes(main_doc, &old.switch_events, &new.switch_events);
    apply_gestures_changes(main_doc, &old.gestures, &new.gestures);
    apply_overview_changes(main_doc, &old.overview, &new.overview);
    apply_spawn_sh_changes(main_doc, &old.spawn_sh_at_startup, &new.spawn_sh_at_startup);
    apply_clipboard_changes(main_doc, &old.clipboard, &new.clipboard);
    apply_xwayland_satellite_changes(main_doc, &old.xwayland_satellite, &new.xwayland_satellite);
    apply_config_notification_changes(main_doc, &old.config_notification, &new.config_notification);

    Ok(())
}

/// Write the documents back to disk.
/// Ensures v1 format since niri configs use KDL v1 syntax.
pub fn write_config(
    main_doc: &mut KdlDocument,
    config_path: &std::path::Path,
    included: &mut [(PathBuf, KdlDocument)],
) -> Result<(), WriteError> {
    // Niri uses KDL v1 — ensure all nodes serialize as v1
    // (new nodes created programmatically default to v2 syntax)
    main_doc.ensure_v1();
    std::fs::write(config_path, main_doc.to_string())?;
    for (path, doc) in included {
        doc.ensure_v1();
        std::fs::write(path, doc.to_string())?;
    }
    Ok(())
}

/// Generate a unified diff between original and modified text.
pub fn generate_diff(original: &str, modified: &str) -> String {
    let diff = TextDiff::from_lines(original, modified);
    let mut output = String::new();

    for change in diff.iter_all_changes() {
        let sign = match change.tag() {
            ChangeTag::Delete => "-",
            ChangeTag::Insert => "+",
            ChangeTag::Equal => " ",
        };
        output.push_str(&format!("{}{}", sign, change));
        if !change.missing_newline() {
            // newline already included
        } else {
            output.push('\n');
        }
    }

    output
}

// --- Helpers for manipulating KDL AST ---

/// Find or create a top-level node with the given name.
fn ensure_node<'a>(doc: &'a mut KdlDocument, name: &str) -> &'a mut KdlNode {
    // Check if it already exists
    let exists = doc.nodes().iter().any(|n| n.name().value() == name);
    if !exists {
        let mut node = KdlNode::new(name);
        node.set_children(KdlDocument::new());
        doc.nodes_mut().push(node);
    }
    doc.get_mut(name).unwrap()
}

/// Find or create a child node within a parent node's children.
fn ensure_child_node<'a>(parent: &'a mut KdlNode, name: &str) -> &'a mut KdlNode {
    let children = parent.ensure_children();
    let exists = children.nodes().iter().any(|n| n.name().value() == name);
    if !exists {
        let node = KdlNode::new(name);
        children.nodes_mut().push(node);
    }
    children.get_mut(name).unwrap()
}

/// Remove a top-level node by name.
fn remove_node(doc: &mut KdlDocument, name: &str) {
    doc.nodes_mut().retain(|n| n.name().value() != name);
}

/// Remove a child node from a parent.
fn remove_child_node(parent: &mut KdlNode, name: &str) {
    if let Some(children) = parent.children_mut() {
        children.nodes_mut().retain(|n| n.name().value() != name);
    }
}

/// Set a node to have a single string argument.
fn set_string_arg(node: &mut KdlNode, val: &str) {
    node.clear();
    node.push(KdlEntry::new(KdlValue::String(val.to_string())));
}

/// Set a node to have a single integer argument.
fn set_int_arg(node: &mut KdlNode, val: i64) {
    node.clear();
    node.push(KdlEntry::new(KdlValue::Integer(val as i128)));
}

/// Set a node to have a single float argument.
fn set_float_arg(node: &mut KdlNode, val: f64) {
    node.clear();
    node.push(KdlEntry::new(KdlValue::Float(val)));
}

/// Set a node to have a single bool argument.
fn set_bool_arg(node: &mut KdlNode, val: bool) {
    node.clear();
    node.push(KdlEntry::new(KdlValue::Bool(val)));
}

/// Ensure a flag node exists (presence = true) or is removed (absence = false)
/// within a parent node's children.
fn set_flag_in_parent(parent: &mut KdlNode, name: &str, value: bool) {
    let children = parent.ensure_children();
    let exists = children.nodes().iter().any(|n| n.name().value() == name);
    if value && !exists {
        children.nodes_mut().push(KdlNode::new(name));
    } else if !value && exists {
        children.nodes_mut().retain(|n| n.name().value() != name);
    }
}

/// Ensure a flag node exists (presence = true) or is removed (absence = false)
/// at the document top level.
fn set_flag_in_doc(doc: &mut KdlDocument, name: &str, value: bool) {
    let exists = doc.nodes().iter().any(|n| n.name().value() == name);
    if value && !exists {
        doc.nodes_mut().push(KdlNode::new(name));
    } else if !value && exists {
        doc.nodes_mut().retain(|n| n.name().value() != name);
    }
}

/// Set or remove an optional string child node in a parent node.
fn set_optional_string_child(parent: &mut KdlNode, name: &str, val: &Option<String>) {
    match val {
        Some(s) => {
            let child = ensure_child_node(parent, name);
            set_string_arg(child, s);
        }
        None => remove_child_node(parent, name),
    }
}

/// Set or remove an optional int child node.
fn set_optional_int_child(parent: &mut KdlNode, name: &str, val: &Option<i64>) {
    match val {
        Some(v) => {
            let child = ensure_child_node(parent, name);
            set_int_arg(child, *v);
        }
        None => remove_child_node(parent, name),
    }
}

/// Set or remove an optional float child node.
fn set_optional_float_child(parent: &mut KdlNode, name: &str, val: &Option<f64>) {
    match val {
        Some(v) => {
            let child = ensure_child_node(parent, name);
            set_float_arg(child, *v);
        }
        None => remove_child_node(parent, name),
    }
}

/// Set or remove an optional bool child node (where the bool has an explicit value argument).
fn set_optional_bool_child(parent: &mut KdlNode, name: &str, val: &Option<bool>) {
    match val {
        Some(v) => {
            let child = ensure_child_node(parent, name);
            set_bool_arg(child, *v);
        }
        None => remove_child_node(parent, name),
    }
}

// --- Section change appliers ---

fn apply_input_changes(doc: &mut KdlDocument, old: &InputConfig, new: &InputConfig) {
    if old == new {
        return;
    }

    let input_node = ensure_node(doc, "input");

    // Keyboard
    {
        let kb_node = ensure_child_node(input_node, "keyboard");

        // XKB
        if old.keyboard.xkb != new.keyboard.xkb {
            let xkb_node = ensure_child_node(kb_node, "xkb");
            set_optional_string_child(xkb_node, "layout", &new.keyboard.xkb.layout);
            set_optional_string_child(xkb_node, "model", &new.keyboard.xkb.model);
            set_optional_string_child(xkb_node, "rules", &new.keyboard.xkb.rules);
            set_optional_string_child(xkb_node, "variant", &new.keyboard.xkb.variant);
            set_optional_string_child(xkb_node, "options", &new.keyboard.xkb.options);
        }

        // Numlock
        if old.keyboard.numlock != new.keyboard.numlock {
            set_flag_in_parent(kb_node, "numlock", new.keyboard.numlock);
        }

        // repeat-delay
        if old.keyboard.repeat_delay != new.keyboard.repeat_delay {
            set_optional_int_child(kb_node, "repeat-delay", &new.keyboard.repeat_delay);
        }

        // repeat-rate
        if old.keyboard.repeat_rate != new.keyboard.repeat_rate {
            set_optional_int_child(kb_node, "repeat-rate", &new.keyboard.repeat_rate);
        }

        // track-layout
        if old.keyboard.track_layout != new.keyboard.track_layout {
            set_optional_string_child(kb_node, "track-layout", &new.keyboard.track_layout);
        }
    }

    // Pointer devices
    if old.touchpad != new.touchpad {
        let tp_node = ensure_child_node(input_node, "touchpad");
        apply_pointer_changes(tp_node, &new.touchpad);
    }
    if old.mouse != new.mouse {
        let mouse_node = ensure_child_node(input_node, "mouse");
        apply_pointer_changes(mouse_node, &new.mouse);
    }
    if old.trackpoint != new.trackpoint {
        let tp_node = ensure_child_node(input_node, "trackpoint");
        apply_pointer_changes(tp_node, &new.trackpoint);
    }
    if old.trackball != new.trackball {
        let tb_node = ensure_child_node(input_node, "trackball");
        apply_pointer_changes(tb_node, &new.trackball);
    }

    // tablet
    if old.tablet != new.tablet {
        let tablet_node = ensure_child_node(input_node, "tablet");
        set_optional_string_child(tablet_node, "map-to-output", &new.tablet.map_to_output);
        set_flag_in_parent(tablet_node, "left-handed", new.tablet.left_handed);
    }

    // touch
    if old.touch != new.touch {
        let touch_node = ensure_child_node(input_node, "touch");
        set_optional_string_child(touch_node, "map-to-output", &new.touch.map_to_output);
    }

    // warp-mouse-to-focus
    if old.warp_mouse_to_focus != new.warp_mouse_to_focus {
        set_flag_in_parent(input_node, "warp-mouse-to-focus", new.warp_mouse_to_focus);
    }

    // focus-follows-mouse
    if old.focus_follows_mouse != new.focus_follows_mouse {
        let children = input_node.ensure_children();
        match &new.focus_follows_mouse {
            Some(ffm_config) => {
                let exists = children
                    .nodes()
                    .iter()
                    .any(|n| n.name().value() == "focus-follows-mouse");
                if !exists {
                    children
                        .nodes_mut()
                        .push(KdlNode::new("focus-follows-mouse"));
                }
                let ffm = children.get_mut("focus-follows-mouse").unwrap();
                match &ffm_config.max_scroll_amount {
                    Some(val) => {
                        ffm.insert(
                            "max-scroll-amount",
                            KdlEntry::new_prop(
                                "max-scroll-amount",
                                KdlValue::String(val.clone()),
                            ),
                        );
                    }
                    None => {
                        ffm.remove("max-scroll-amount");
                    }
                }
            }
            None => {
                children
                    .nodes_mut()
                    .retain(|n| n.name().value() != "focus-follows-mouse");
            }
        }
    }

    // disable-power-key-handling
    if old.disable_power_key_handling != new.disable_power_key_handling {
        set_flag_in_parent(input_node, "disable-power-key-handling", new.disable_power_key_handling);
    }

    // workspace-auto-back-and-forth
    if old.workspace_auto_back_and_forth != new.workspace_auto_back_and_forth {
        set_flag_in_parent(input_node, "workspace-auto-back-and-forth", new.workspace_auto_back_and_forth);
    }

    // mod-key
    if old.mod_key != new.mod_key {
        set_optional_string_child(input_node, "mod-key", &new.mod_key);
    }

    // mod-key-nested
    if old.mod_key_nested != new.mod_key_nested {
        set_optional_string_child(input_node, "mod-key-nested", &new.mod_key_nested);
    }
}

fn apply_pointer_changes(parent: &mut KdlNode, ptr: &PointerConfig) {
    set_flag_in_parent(parent, "off", ptr.off);
    set_flag_in_parent(parent, "tap", ptr.tap);
    set_flag_in_parent(parent, "dwt", ptr.dwt);
    set_flag_in_parent(parent, "dwtp", ptr.dwtp);

    // drag can be absent, or have an explicit bool value
    match ptr.drag {
        Some(val) => {
            let child = ensure_child_node(parent, "drag");
            set_bool_arg(child, val);
        }
        None => remove_child_node(parent, "drag"),
    }

    set_flag_in_parent(parent, "drag-lock", ptr.drag_lock);
    set_flag_in_parent(parent, "natural-scroll", ptr.natural_scroll);
    set_optional_float_child(parent, "accel-speed", &ptr.accel_speed);
    set_optional_string_child(parent, "accel-profile", &ptr.accel_profile);
    set_optional_string_child(parent, "scroll-method", &ptr.scroll_method);
    set_flag_in_parent(
        parent,
        "disabled-on-external-mouse",
        ptr.disabled_on_external_mouse,
    );
    set_optional_int_child(parent, "scroll-button", &ptr.scroll_button);
    set_flag_in_parent(parent, "scroll-button-lock", ptr.scroll_button_lock);
    set_flag_in_parent(parent, "middle-emulation", ptr.middle_emulation);
    set_flag_in_parent(parent, "left-handed", ptr.left_handed);
    set_optional_float_child(parent, "scroll-factor", &ptr.scroll_factor);
    set_optional_string_child(parent, "tap-button-map", &ptr.tap_button_map);
    set_optional_string_child(parent, "click-method", &ptr.click_method);
}

fn apply_output_changes(
    doc: &mut KdlDocument,
    old_outputs: &[OutputConfig],
    new_outputs: &[OutputConfig],
) {
    // Remove outputs that no longer exist
    for old in old_outputs {
        if !new_outputs.iter().any(|n| n.name == old.name) {
            doc.nodes_mut()
                .retain(|n| !(n.name().value() == "output" && has_output_name(n, &old.name)));
        }
    }

    // Add or update outputs
    for new_out in new_outputs {
        let existing = doc.nodes_mut().iter_mut().find(|n| {
            n.name().value() == "output" && has_output_name(n, &new_out.name)
        });

        if let Some(node) = existing {
            apply_single_output_changes(node, new_out);
        } else {
            // Create new output node
            let mut node = KdlNode::new("output");
            node.push(KdlEntry::new(KdlValue::String(new_out.name.clone())));
            let children_doc = node.ensure_children();

            if new_out.off {
                children_doc.nodes_mut().push(KdlNode::new("off"));
            }
            if let Some(mode) = &new_out.mode {
                let mut mode_node = KdlNode::new("mode");
                set_string_arg(&mut mode_node, mode);
                children_doc.nodes_mut().push(mode_node);
            }
            if let Some(scale) = new_out.scale {
                let mut scale_node = KdlNode::new("scale");
                set_float_arg(&mut scale_node, scale);
                children_doc.nodes_mut().push(scale_node);
            }
            if let Some(transform) = &new_out.transform {
                let mut t_node = KdlNode::new("transform");
                set_string_arg(&mut t_node, transform);
                children_doc.nodes_mut().push(t_node);
            }
            if new_out.position_x.is_some() || new_out.position_y.is_some() {
                let mut pos_node = KdlNode::new("position");
                if let Some(x) = new_out.position_x {
                    pos_node.push(KdlEntry::new_prop("x", KdlValue::Integer(x as i128)));
                }
                if let Some(y) = new_out.position_y {
                    pos_node.push(KdlEntry::new_prop("y", KdlValue::Integer(y as i128)));
                }
                children_doc.nodes_mut().push(pos_node);
            }

            doc.nodes_mut().push(node);
        }
    }
}

fn has_output_name(node: &KdlNode, name: &str) -> bool {
    node.entries()
        .iter()
        .any(|e| e.name().is_none() && e.value().as_string() == Some(name))
}

fn apply_single_output_changes(node: &mut KdlNode, out: &OutputConfig) {
    let children = node.ensure_children();

    // off flag
    let has_off = children.nodes().iter().any(|n| n.name().value() == "off");
    if out.off && !has_off {
        children.nodes_mut().push(KdlNode::new("off"));
    } else if !out.off && has_off {
        children
            .nodes_mut()
            .retain(|n| n.name().value() != "off");
    }

    // mode
    match &out.mode {
        Some(mode) => {
            let exists = children
                .nodes()
                .iter()
                .any(|n| n.name().value() == "mode");
            if !exists {
                children.nodes_mut().push(KdlNode::new("mode"));
            }
            let mode_node = children.get_mut("mode").unwrap();
            set_string_arg(mode_node, mode);
        }
        None => {
            children
                .nodes_mut()
                .retain(|n| n.name().value() != "mode");
        }
    }

    // scale
    match out.scale {
        Some(scale) => {
            let exists = children
                .nodes()
                .iter()
                .any(|n| n.name().value() == "scale");
            if !exists {
                children.nodes_mut().push(KdlNode::new("scale"));
            }
            let scale_node = children.get_mut("scale").unwrap();
            set_float_arg(scale_node, scale);
        }
        None => {
            children
                .nodes_mut()
                .retain(|n| n.name().value() != "scale");
        }
    }

    // transform
    match &out.transform {
        Some(transform) => {
            let exists = children
                .nodes()
                .iter()
                .any(|n| n.name().value() == "transform");
            if !exists {
                children.nodes_mut().push(KdlNode::new("transform"));
            }
            let t_node = children.get_mut("transform").unwrap();
            set_string_arg(t_node, transform);
        }
        None => {
            children
                .nodes_mut()
                .retain(|n| n.name().value() != "transform");
        }
    }

    // position
    if out.position_x.is_some() || out.position_y.is_some() {
        let exists = children
            .nodes()
            .iter()
            .any(|n| n.name().value() == "position");
        if !exists {
            children.nodes_mut().push(KdlNode::new("position"));
        }
        let pos_node = children.get_mut("position").unwrap();
        pos_node.clear();
        if let Some(x) = out.position_x {
            pos_node.push(KdlEntry::new_prop("x", KdlValue::Integer(x as i128)));
        }
        if let Some(y) = out.position_y {
            pos_node.push(KdlEntry::new_prop("y", KdlValue::Integer(y as i128)));
        }
    } else {
        children
            .nodes_mut()
            .retain(|n| n.name().value() != "position");
    }
}

fn apply_layout_changes(doc: &mut KdlDocument, old: &LayoutConfig, new: &LayoutConfig) {
    if old == new {
        return;
    }

    let layout_node = ensure_node(doc, "layout");

    // gaps
    if old.gaps != new.gaps {
        set_optional_int_child(layout_node, "gaps", &new.gaps);
    }

    // center-focused-column
    if old.center_focused_column != new.center_focused_column {
        set_optional_string_child(layout_node, "center-focused-column", &new.center_focused_column);
    }

    // preset-column-widths
    if old.preset_column_widths != new.preset_column_widths {
        apply_column_widths_changes(layout_node, "preset-column-widths", &new.preset_column_widths);
    }

    // preset-window-heights
    if old.preset_window_heights != new.preset_window_heights {
        apply_column_widths_changes(layout_node, "preset-window-heights", &new.preset_window_heights);
    }

    // default-column-width
    if old.default_column_width != new.default_column_width {
        match &new.default_column_width {
            Some(widths) => {
                let child = ensure_child_node(layout_node, "default-column-width");
                let children_doc = child.ensure_children();
                children_doc.nodes_mut().clear();
                for w in widths {
                    children_doc.nodes_mut().push(column_width_to_node(w));
                }
            }
            None => remove_child_node(layout_node, "default-column-width"),
        }
    }

    // focus-ring
    if old.focus_ring != new.focus_ring {
        apply_ring_border_changes(layout_node, "focus-ring", &new.focus_ring);
    }

    // border
    if old.border != new.border {
        apply_ring_border_changes(layout_node, "border", &new.border);
    }

    // shadow
    if old.shadow != new.shadow {
        apply_shadow_changes(layout_node, &new.shadow);
    }

    // tab-indicator
    if old.tab_indicator != new.tab_indicator {
        apply_tab_indicator_changes(layout_node, &new.tab_indicator);
    }

    // insert-hint
    if old.insert_hint != new.insert_hint {
        apply_insert_hint_changes(layout_node, &new.insert_hint);
    }

    // struts
    if old.struts != new.struts {
        apply_struts_changes(layout_node, &new.struts);
    }

    // always-center-single-column
    if old.always_center_single_column != new.always_center_single_column {
        set_flag_in_parent(layout_node, "always-center-single-column", new.always_center_single_column);
    }

    // empty-workspace-above-first
    if old.empty_workspace_above_first != new.empty_workspace_above_first {
        set_flag_in_parent(layout_node, "empty-workspace-above-first", new.empty_workspace_above_first);
    }

    // default-column-display
    if old.default_column_display != new.default_column_display {
        set_optional_string_child(layout_node, "default-column-display", &new.default_column_display);
    }

    // background-color
    if old.background_color != new.background_color {
        set_optional_string_child(layout_node, "background-color", &new.background_color);
    }
}

fn apply_column_widths_changes(parent: &mut KdlNode, name: &str, widths: &[ColumnWidth]) {
    if widths.is_empty() {
        remove_child_node(parent, name);
    } else {
        let child = ensure_child_node(parent, name);
        let children_doc = child.ensure_children();
        children_doc.nodes_mut().clear();
        for w in widths {
            children_doc.nodes_mut().push(column_width_to_node(w));
        }
    }
}

fn column_width_to_node(w: &ColumnWidth) -> KdlNode {
    match w {
        ColumnWidth::Proportion { value } => {
            let mut node = KdlNode::new("proportion");
            set_float_arg(&mut node, *value);
            node
        }
        ColumnWidth::Fixed { value } => {
            let mut node = KdlNode::new("fixed");
            set_int_arg(&mut node, *value);
            node
        }
    }
}

fn apply_ring_border_changes(parent: &mut KdlNode, name: &str, rb: &RingBorderConfig) {
    let rb_node = ensure_child_node(parent, name);
    set_flag_in_parent(rb_node, "off", rb.off);
    set_optional_int_child(rb_node, "width", &rb.width);
    set_optional_string_child(rb_node, "active-color", &rb.active_color);
    set_optional_string_child(rb_node, "inactive-color", &rb.inactive_color);
    set_optional_string_child(rb_node, "urgent-color", &rb.urgent_color);

    // Gradients
    apply_gradient_change(rb_node, "active-gradient", &rb.active_gradient);
    apply_gradient_change(rb_node, "inactive-gradient", &rb.inactive_gradient);
    apply_gradient_change(rb_node, "urgent-gradient", &rb.urgent_gradient);
}

fn apply_gradient_change(parent: &mut KdlNode, name: &str, grad: &Option<GradientConfig>) {
    match grad {
        Some(g) => {
            let child = ensure_child_node(parent, name);
            child.clear();
            child.push(KdlEntry::new_prop("from", KdlValue::String(g.from_color.clone())));
            child.push(KdlEntry::new_prop("to", KdlValue::String(g.to_color.clone())));
            if let Some(angle) = g.angle {
                child.push(KdlEntry::new_prop("angle", KdlValue::Integer(angle as i128)));
            }
            if let Some(relative_to) = &g.relative_to {
                child.push(KdlEntry::new_prop(
                    "relative-to",
                    KdlValue::String(relative_to.clone()),
                ));
            }
            if let Some(cs) = &g.color_space {
                child.push(KdlEntry::new_prop("in", KdlValue::String(cs.clone())));
            }
        }
        None => remove_child_node(parent, name),
    }
}

fn apply_shadow_changes(parent: &mut KdlNode, shadow: &ShadowConfig) {
    let shadow_node = ensure_child_node(parent, "shadow");
    set_flag_in_parent(shadow_node, "on", shadow.on);
    set_optional_bool_child(shadow_node, "draw-behind-window", &shadow.draw_behind_window);
    set_optional_int_child(shadow_node, "softness", &shadow.softness);
    set_optional_int_child(shadow_node, "spread", &shadow.spread);

    // offset uses named properties
    if shadow.offset_x.is_some() || shadow.offset_y.is_some() {
        let offset_node = ensure_child_node(shadow_node, "offset");
        offset_node.clear();
        if let Some(x) = shadow.offset_x {
            offset_node.push(KdlEntry::new_prop("x", KdlValue::Integer(x as i128)));
        }
        if let Some(y) = shadow.offset_y {
            offset_node.push(KdlEntry::new_prop("y", KdlValue::Integer(y as i128)));
        }
    } else {
        remove_child_node(shadow_node, "offset");
    }

    set_optional_string_child(shadow_node, "color", &shadow.color);
    set_optional_string_child(shadow_node, "inactive-color", &shadow.inactive_color);
}

/// Write a ShadowConfig into a parent node under the given child name.
/// Used for overview workspace-shadow and window rule shadow overrides.
fn write_shadow_to_node(parent: &mut KdlNode, name: &str, shadow: &ShadowConfig) {
    let shadow_node = ensure_child_node(parent, name);
    // Clear existing children to rebuild
    if let Some(children) = shadow_node.children_mut() {
        children.nodes_mut().clear();
    }
    set_flag_in_parent(shadow_node, "on", shadow.on);
    set_optional_bool_child(shadow_node, "draw-behind-window", &shadow.draw_behind_window);
    set_optional_int_child(shadow_node, "softness", &shadow.softness);
    set_optional_int_child(shadow_node, "spread", &shadow.spread);

    if shadow.offset_x.is_some() || shadow.offset_y.is_some() {
        let offset_node = ensure_child_node(shadow_node, "offset");
        offset_node.clear();
        if let Some(x) = shadow.offset_x {
            offset_node.push(KdlEntry::new_prop("x", KdlValue::Integer(x as i128)));
        }
        if let Some(y) = shadow.offset_y {
            offset_node.push(KdlEntry::new_prop("y", KdlValue::Integer(y as i128)));
        }
    } else {
        remove_child_node(shadow_node, "offset");
    }

    set_optional_string_child(shadow_node, "color", &shadow.color);
    set_optional_string_child(shadow_node, "inactive-color", &shadow.inactive_color);
}

fn apply_tab_indicator_changes(parent: &mut KdlNode, ti: &TabIndicatorConfig) {
    let ti_node = ensure_child_node(parent, "tab-indicator");
    set_flag_in_parent(ti_node, "off", ti.off);
    set_optional_string_child(ti_node, "active-color", &ti.active_color);
    set_optional_string_child(ti_node, "inactive-color", &ti.inactive_color);
    set_optional_string_child(ti_node, "urgent-color", &ti.urgent_color);
    set_flag_in_parent(ti_node, "hide-when-single-tab", ti.hide_when_single_tab);
    set_flag_in_parent(ti_node, "place-within-column", ti.place_within_column);
    set_optional_int_child(ti_node, "gap", &ti.gap);
    set_optional_int_child(ti_node, "width", &ti.width);
    set_optional_int_child(ti_node, "length", &ti.length);
    set_optional_string_child(ti_node, "position", &ti.position);
    set_optional_int_child(ti_node, "gaps-between-tabs", &ti.gaps_between_tabs);
    set_optional_float_child(ti_node, "corner-radius", &ti.corner_radius);

    // Gradients
    apply_gradient_change(ti_node, "active-gradient", &ti.active_gradient);
    apply_gradient_change(ti_node, "inactive-gradient", &ti.inactive_gradient);
    apply_gradient_change(ti_node, "urgent-gradient", &ti.urgent_gradient);
}

fn apply_insert_hint_changes(parent: &mut KdlNode, ih: &InsertHintConfig) {
    let ih_node = ensure_child_node(parent, "insert-hint");
    set_flag_in_parent(ih_node, "off", ih.off);
    set_optional_string_child(ih_node, "color", &ih.color);
    apply_gradient_change(ih_node, "gradient", &ih.gradient);
}

fn apply_struts_changes(parent: &mut KdlNode, struts: &StrutsConfig) {
    let struts_node = ensure_child_node(parent, "struts");
    set_optional_int_child(struts_node, "left", &struts.left);
    set_optional_int_child(struts_node, "right", &struts.right);
    set_optional_int_child(struts_node, "top", &struts.top);
    set_optional_int_child(struts_node, "bottom", &struts.bottom);
}

fn apply_spawn_changes(
    doc: &mut KdlDocument,
    old: &[SpawnAtStartup],
    new: &[SpawnAtStartup],
) {
    if old == new {
        return;
    }

    // Remove all existing spawn-at-startup nodes
    doc.nodes_mut()
        .retain(|n| n.name().value() != "spawn-at-startup");

    // Add new ones
    for spawn in new {
        let mut node = KdlNode::new("spawn-at-startup");
        for arg in &spawn.command {
            node.push(KdlEntry::new(KdlValue::String(arg.clone())));
        }
        doc.nodes_mut().push(node);
    }
}

fn apply_spawn_sh_changes(
    doc: &mut KdlDocument,
    old: &[SpawnShAtStartup],
    new: &[SpawnShAtStartup],
) {
    if old == new {
        return;
    }

    // Remove all existing spawn-sh-at-startup nodes
    doc.nodes_mut()
        .retain(|n| n.name().value() != "spawn-sh-at-startup");

    // Add new ones
    for spawn in new {
        let mut node = KdlNode::new("spawn-sh-at-startup");
        node.push(KdlEntry::new(KdlValue::String(spawn.command.clone())));
        doc.nodes_mut().push(node);
    }
}

fn apply_hotkey_overlay_changes(
    doc: &mut KdlDocument,
    old: &HotkeyOverlay,
    new: &HotkeyOverlay,
) {
    if old == new {
        return;
    }

    let ho_node = ensure_node(doc, "hotkey-overlay");
    if old.skip_at_startup != new.skip_at_startup {
        set_flag_in_parent(ho_node, "skip-at-startup", new.skip_at_startup);
    }
    if old.hide_not_bound != new.hide_not_bound {
        set_flag_in_parent(ho_node, "hide-not-bound", new.hide_not_bound);
    }
}

fn apply_prefer_no_csd_changes(doc: &mut KdlDocument, old: bool, new: bool) {
    if old == new {
        return;
    }
    set_flag_in_doc(doc, "prefer-no-csd", new);
}

fn apply_screenshot_changes(
    doc: &mut KdlDocument,
    old_path: &Option<String>,
    new_path: &Option<String>,
) {
    if old_path == new_path {
        return;
    }

    match new_path {
        Some(path) => {
            // Ensure screenshot-path node exists, set string arg
            let exists = doc
                .nodes()
                .iter()
                .any(|n| n.name().value() == "screenshot-path");
            if !exists {
                doc.nodes_mut().push(KdlNode::new("screenshot-path"));
            }
            let node = doc.get_mut("screenshot-path").unwrap();
            set_string_arg(node, path);
        }
        None => {
            // If there was a node before, remove it
            let exists = doc
                .nodes()
                .iter()
                .any(|n| n.name().value() == "screenshot-path");
            if exists {
                remove_node(doc, "screenshot-path");
            }
        }
    }
}

fn apply_animations_changes(doc: &mut KdlDocument, old: &AnimationsConfig, new: &AnimationsConfig) {
    if old == new {
        return;
    }

    let anims_node = ensure_node(doc, "animations");
    if old.off != new.off {
        set_flag_in_parent(anims_node, "off", new.off);
    }
    if old.slowdown != new.slowdown {
        set_optional_float_child(anims_node, "slowdown", &new.slowdown);
    }

    // Individual animations
    if old.workspace_switch != new.workspace_switch {
        apply_individual_animation_change(anims_node, "workspace-switch", &new.workspace_switch);
    }
    if old.window_open != new.window_open {
        apply_individual_animation_change(anims_node, "window-open", &new.window_open);
    }
    if old.window_close != new.window_close {
        apply_individual_animation_change(anims_node, "window-close", &new.window_close);
    }
    if old.horizontal_view_movement != new.horizontal_view_movement {
        apply_individual_animation_change(anims_node, "horizontal-view-movement", &new.horizontal_view_movement);
    }
    if old.window_movement != new.window_movement {
        apply_individual_animation_change(anims_node, "window-movement", &new.window_movement);
    }
    if old.window_resize != new.window_resize {
        apply_individual_animation_change(anims_node, "window-resize", &new.window_resize);
    }
    if old.config_notification_open_close != new.config_notification_open_close {
        apply_individual_animation_change(anims_node, "config-notification-open-close", &new.config_notification_open_close);
    }
    if old.exit_confirmation_open_close != new.exit_confirmation_open_close {
        apply_individual_animation_change(anims_node, "exit-confirmation-open-close", &new.exit_confirmation_open_close);
    }
    if old.screenshot_ui_open != new.screenshot_ui_open {
        apply_individual_animation_change(anims_node, "screenshot-ui-open", &new.screenshot_ui_open);
    }
    if old.overview_open_close != new.overview_open_close {
        apply_individual_animation_change(anims_node, "overview-open-close", &new.overview_open_close);
    }
    if old.recent_windows_close != new.recent_windows_close {
        apply_individual_animation_change(anims_node, "recent-windows-close", &new.recent_windows_close);
    }
}

fn apply_individual_animation_change(
    parent: &mut KdlNode,
    name: &str,
    anim: &Option<IndividualAnimation>,
) {
    match anim {
        Some(a) => {
            let child = ensure_child_node(parent, name);
            // Clear existing children to rebuild
            if let Some(children) = child.children_mut() {
                children.nodes_mut().clear();
            }
            let children_doc = child.ensure_children();

            match &a.kind {
                AnimationKind::Spring {
                    damping_ratio,
                    stiffness,
                    epsilon,
                } => {
                    let mut spring_node = KdlNode::new("spring");
                    spring_node.push(KdlEntry::new_prop(
                        "damping-ratio",
                        KdlValue::Float(*damping_ratio),
                    ));
                    spring_node.push(KdlEntry::new_prop(
                        "stiffness",
                        KdlValue::Float(*stiffness),
                    ));
                    spring_node.push(KdlEntry::new_prop(
                        "epsilon",
                        KdlValue::Float(*epsilon),
                    ));
                    children_doc.nodes_mut().push(spring_node);
                }
                AnimationKind::Easing {
                    duration_ms,
                    curve,
                } => {
                    let mut easing_node = KdlNode::new("easing");
                    easing_node.push(KdlEntry::new_prop(
                        "duration-ms",
                        KdlValue::Integer(*duration_ms as i128),
                    ));
                    easing_node.push(KdlEntry::new_prop(
                        "curve",
                        KdlValue::String(curve.clone()),
                    ));
                    children_doc.nodes_mut().push(easing_node);
                }
            }

            if let Some(shader) = &a.custom_shader {
                let mut shader_node = KdlNode::new("custom-shader");
                set_string_arg(&mut shader_node, shader);
                children_doc.nodes_mut().push(shader_node);
            }
        }
        None => remove_child_node(parent, name),
    }
}

fn apply_window_rule_changes(
    doc: &mut KdlDocument,
    old: &[WindowRule],
    new: &[WindowRule],
) {
    // Simple strategy: only modify if changed.
    // Use IDs to match old rules to new rules.
    let old_ids: Vec<&str> = old.iter().map(|r| r.id.as_str()).collect();
    let new_ids: Vec<&str> = new.iter().map(|r| r.id.as_str()).collect();

    if old_ids == new_ids && old == new {
        return;
    }

    // Remove all window-rule nodes and rebuild from new
    doc.nodes_mut()
        .retain(|n| n.name().value() != "window-rule");

    for rule in new {
        doc.nodes_mut().push(build_window_rule_node(rule));
    }
}

fn build_match_node(m: &MatchRule, node_name: &str) -> KdlNode {
    let mut match_node = KdlNode::new(node_name);
    if let Some(app_id) = &m.app_id {
        match_node.push(KdlEntry::new_prop("app-id", KdlValue::String(app_id.clone())));
    }
    if let Some(title) = &m.title {
        match_node.push(KdlEntry::new_prop("title", KdlValue::String(title.clone())));
    }
    if let Some(is_focused) = m.is_focused {
        match_node.push(KdlEntry::new_prop("is-focused", KdlValue::Bool(is_focused)));
    }
    if let Some(is_active) = m.is_active_in_column {
        match_node.push(KdlEntry::new_prop(
            "is-active-in-column",
            KdlValue::Bool(is_active),
        ));
    }
    if let Some(is_floating) = m.is_floating {
        match_node.push(KdlEntry::new_prop("is-floating", KdlValue::Bool(is_floating)));
    }
    if let Some(is_window_cast_target) = m.is_window_cast_target {
        match_node.push(KdlEntry::new_prop(
            "is-window-cast-target",
            KdlValue::Bool(is_window_cast_target),
        ));
    }
    if let Some(is_urgent) = m.is_urgent {
        match_node.push(KdlEntry::new_prop("is-urgent", KdlValue::Bool(is_urgent)));
    }
    if let Some(at_startup) = m.at_startup {
        match_node.push(KdlEntry::new_prop("at-startup", KdlValue::Bool(at_startup)));
    }
    match_node
}

/// Build a ring/border config section for window rule style overrides.
fn build_ring_border_section(doc: &mut KdlDocument, name: &str, rb: &RingBorderConfig) {
    let mut rb_node = KdlNode::new(name);
    let children = rb_node.ensure_children();

    if rb.off {
        children.nodes_mut().push(KdlNode::new("off"));
    }
    if let Some(w) = &rb.width {
        let mut n = KdlNode::new("width");
        set_int_arg(&mut n, *w);
        children.nodes_mut().push(n);
    }
    add_optional_string_node(children, "active-color", &rb.active_color);
    add_optional_string_node(children, "inactive-color", &rb.inactive_color);
    add_optional_string_node(children, "urgent-color", &rb.urgent_color);
    if let Some(g) = &rb.active_gradient {
        build_gradient_node(children, "active-gradient", g);
    }
    if let Some(g) = &rb.inactive_gradient {
        build_gradient_node(children, "inactive-gradient", g);
    }
    if let Some(g) = &rb.urgent_gradient {
        build_gradient_node(children, "urgent-gradient", g);
    }

    doc.nodes_mut().push(rb_node);
}

/// Build a shadow config section for window rule style overrides.
fn build_shadow_section(doc: &mut KdlDocument, shadow: &ShadowConfig) {
    let mut shadow_node = KdlNode::new("shadow");
    let children = shadow_node.ensure_children();

    if shadow.on {
        children.nodes_mut().push(KdlNode::new("on"));
    }
    if let Some(v) = &shadow.draw_behind_window {
        let mut n = KdlNode::new("draw-behind-window");
        set_bool_arg(&mut n, *v);
        children.nodes_mut().push(n);
    }
    if let Some(v) = &shadow.softness {
        let mut n = KdlNode::new("softness");
        set_int_arg(&mut n, *v);
        children.nodes_mut().push(n);
    }
    if let Some(v) = &shadow.spread {
        let mut n = KdlNode::new("spread");
        set_int_arg(&mut n, *v);
        children.nodes_mut().push(n);
    }
    if shadow.offset_x.is_some() || shadow.offset_y.is_some() {
        let mut offset_node = KdlNode::new("offset");
        if let Some(x) = shadow.offset_x {
            offset_node.push(KdlEntry::new_prop("x", KdlValue::Integer(x as i128)));
        }
        if let Some(y) = shadow.offset_y {
            offset_node.push(KdlEntry::new_prop("y", KdlValue::Integer(y as i128)));
        }
        children.nodes_mut().push(offset_node);
    }
    add_optional_string_node(children, "color", &shadow.color);
    add_optional_string_node(children, "inactive-color", &shadow.inactive_color);

    doc.nodes_mut().push(shadow_node);
}

/// Build a tab-indicator config section for window rule style overrides.
fn build_tab_indicator_section(doc: &mut KdlDocument, ti: &TabIndicatorConfig) {
    let mut ti_node = KdlNode::new("tab-indicator");
    let children = ti_node.ensure_children();

    if ti.off {
        children.nodes_mut().push(KdlNode::new("off"));
    }
    add_optional_string_node(children, "active-color", &ti.active_color);
    add_optional_string_node(children, "inactive-color", &ti.inactive_color);
    add_optional_string_node(children, "urgent-color", &ti.urgent_color);
    if ti.hide_when_single_tab {
        children.nodes_mut().push(KdlNode::new("hide-when-single-tab"));
    }
    if ti.place_within_column {
        children.nodes_mut().push(KdlNode::new("place-within-column"));
    }
    add_optional_int_node(children, "gap", &ti.gap);
    add_optional_int_node(children, "width", &ti.width);
    add_optional_int_node(children, "length", &ti.length);
    add_optional_string_node(children, "position", &ti.position);
    add_optional_int_node(children, "gaps-between-tabs", &ti.gaps_between_tabs);
    add_optional_float_node(children, "corner-radius", &ti.corner_radius);
    if let Some(g) = &ti.active_gradient {
        build_gradient_node(children, "active-gradient", g);
    }
    if let Some(g) = &ti.inactive_gradient {
        build_gradient_node(children, "inactive-gradient", g);
    }
    if let Some(g) = &ti.urgent_gradient {
        build_gradient_node(children, "urgent-gradient", g);
    }

    doc.nodes_mut().push(ti_node);
}

/// Build a gradient node and add it to a KdlDocument.
fn build_gradient_node(doc: &mut KdlDocument, name: &str, g: &GradientConfig) {
    let mut node = KdlNode::new(name);
    node.push(KdlEntry::new_prop("from", KdlValue::String(g.from_color.clone())));
    node.push(KdlEntry::new_prop("to", KdlValue::String(g.to_color.clone())));
    if let Some(angle) = g.angle {
        node.push(KdlEntry::new_prop("angle", KdlValue::Integer(angle as i128)));
    }
    if let Some(relative_to) = &g.relative_to {
        node.push(KdlEntry::new_prop("relative-to", KdlValue::String(relative_to.clone())));
    }
    if let Some(cs) = &g.color_space {
        node.push(KdlEntry::new_prop("in", KdlValue::String(cs.clone())));
    }
    doc.nodes_mut().push(node);
}

fn build_window_rule_node(rule: &WindowRule) -> KdlNode {
    let mut node = KdlNode::new("window-rule");
    let children_doc = node.ensure_children();

    // match rules
    for m in &rule.matches {
        children_doc.nodes_mut().push(build_match_node(m, "match"));
    }

    // exclude rules
    for m in &rule.excludes {
        children_doc.nodes_mut().push(build_match_node(m, "exclude"));
    }

    // default-column-width
    if let Some(widths) = &rule.default_column_width {
        let mut dcw_node = KdlNode::new("default-column-width");
        if !widths.is_empty() {
            let inner = dcw_node.ensure_children();
            for w in widths {
                inner.nodes_mut().push(column_width_to_node(w));
            }
        } else {
            dcw_node.set_children(KdlDocument::new());
        }
        children_doc.nodes_mut().push(dcw_node);
    }

    // default-window-height
    if let Some(heights) = &rule.default_window_height {
        let mut dwh_node = KdlNode::new("default-window-height");
        if !heights.is_empty() {
            let inner = dwh_node.ensure_children();
            for w in heights {
                inner.nodes_mut().push(column_width_to_node(w));
            }
        } else {
            dwh_node.set_children(KdlDocument::new());
        }
        children_doc.nodes_mut().push(dwh_node);
    }

    add_optional_bool_node(children_doc, "open-floating", &rule.open_floating);
    add_optional_bool_node(children_doc, "open-maximized", &rule.open_maximized);
    add_optional_bool_node(children_doc, "open-maximized-to-edges", &rule.open_maximized_to_edges);
    add_optional_bool_node(children_doc, "open-fullscreen", &rule.open_fullscreen);
    add_optional_bool_node(children_doc, "open-focused", &rule.open_focused);
    add_optional_float_node(children_doc, "geometry-corner-radius", &rule.geometry_corner_radius);
    add_optional_bool_node(children_doc, "clip-to-geometry", &rule.clip_to_geometry);
    add_optional_string_node(children_doc, "block-out-from", &rule.block_out_from);
    add_optional_bool_node(children_doc, "draw-border-with-background", &rule.draw_border_with_background);
    add_optional_float_node(children_doc, "opacity", &rule.opacity);
    add_optional_int_node(children_doc, "min-width", &rule.min_width);
    add_optional_int_node(children_doc, "max-width", &rule.max_width);
    add_optional_int_node(children_doc, "min-height", &rule.min_height);
    add_optional_int_node(children_doc, "max-height", &rule.max_height);
    add_optional_string_node(children_doc, "open-on-output", &rule.open_on_output);
    add_optional_string_node(children_doc, "open-on-workspace", &rule.open_on_workspace);
    add_optional_bool_node(children_doc, "variable-refresh-rate", &rule.variable_refresh_rate);
    add_optional_string_node(children_doc, "default-column-display", &rule.default_column_display);
    add_optional_float_node(children_doc, "scroll-factor", &rule.scroll_factor);
    add_optional_string_node(children_doc, "tiled-state", &rule.tiled_state);
    add_optional_bool_node(children_doc, "baba-is-float", &rule.baba_is_float);

    // default-floating-position
    if let Some(fp) = &rule.default_floating_position {
        let mut fp_node = KdlNode::new("default-floating-position");
        if let Some(x) = fp.x {
            fp_node.push(KdlEntry::new_prop("x", KdlValue::Integer(x as i128)));
        }
        if let Some(y) = fp.y {
            fp_node.push(KdlEntry::new_prop("y", KdlValue::Integer(y as i128)));
        }
        if let Some(relative_to) = &fp.relative_to {
            fp_node.push(KdlEntry::new_prop(
                "relative-to",
                KdlValue::String(relative_to.clone()),
            ));
        }
        children_doc.nodes_mut().push(fp_node);
    }

    // Style override sections
    if let Some(fr) = &rule.focus_ring {
        build_ring_border_section(children_doc, "focus-ring", fr);
    }
    if let Some(b) = &rule.border {
        build_ring_border_section(children_doc, "border", b);
    }
    if let Some(s) = &rule.shadow {
        build_shadow_section(children_doc, s);
    }
    if let Some(ti) = &rule.tab_indicator {
        build_tab_indicator_section(children_doc, ti);
    }

    node
}

fn add_optional_bool_node(doc: &mut KdlDocument, name: &str, val: &Option<bool>) {
    if let Some(v) = val {
        let mut node = KdlNode::new(name);
        set_bool_arg(&mut node, *v);
        doc.nodes_mut().push(node);
    }
}

fn add_optional_string_node(doc: &mut KdlDocument, name: &str, val: &Option<String>) {
    if let Some(v) = val {
        let mut node = KdlNode::new(name);
        set_string_arg(&mut node, v);
        doc.nodes_mut().push(node);
    }
}

fn add_optional_int_node(doc: &mut KdlDocument, name: &str, val: &Option<i64>) {
    if let Some(v) = val {
        let mut node = KdlNode::new(name);
        set_int_arg(&mut node, *v);
        doc.nodes_mut().push(node);
    }
}

fn add_optional_float_node(doc: &mut KdlDocument, name: &str, val: &Option<f64>) {
    if let Some(v) = val {
        let mut node = KdlNode::new(name);
        set_float_arg(&mut node, *v);
        doc.nodes_mut().push(node);
    }
}

fn apply_layer_rule_changes(
    doc: &mut KdlDocument,
    old: &[LayerRule],
    new: &[LayerRule],
) {
    let old_ids: Vec<&str> = old.iter().map(|r| r.id.as_str()).collect();
    let new_ids: Vec<&str> = new.iter().map(|r| r.id.as_str()).collect();

    if old_ids == new_ids && old == new {
        return;
    }

    doc.nodes_mut()
        .retain(|n| n.name().value() != "layer-rule");

    for rule in new {
        doc.nodes_mut().push(build_layer_rule_node(rule));
    }
}

fn build_layer_rule_node(rule: &LayerRule) -> KdlNode {
    let mut node = KdlNode::new("layer-rule");
    let children_doc = node.ensure_children();

    for m in &rule.matches {
        let mut match_node = KdlNode::new("match");
        if let Some(ns) = &m.namespace {
            match_node.push(KdlEntry::new_prop(
                "namespace",
                KdlValue::String(ns.clone()),
            ));
        }
        if let Some(at_startup) = m.at_startup {
            match_node.push(KdlEntry::new_prop("at-startup", KdlValue::Bool(at_startup)));
        }
        children_doc.nodes_mut().push(match_node);
    }

    add_optional_string_node(children_doc, "block-out-from", &rule.block_out_from);
    add_optional_float_node(children_doc, "opacity", &rule.opacity);
    add_optional_bool_node(children_doc, "place-within-backdrop", &rule.place_within_backdrop);

    node
}

fn apply_binds_changes(doc: &mut KdlDocument, old: &[KeyBinding], new: &[KeyBinding]) {
    let old_ids: Vec<&str> = old.iter().map(|b| b.id.as_str()).collect();
    let new_ids: Vec<&str> = new.iter().map(|b| b.id.as_str()).collect();

    if old_ids == new_ids && old == new {
        return;
    }

    // Rebuild binds section entirely
    let binds_node = ensure_node(doc, "binds");
    let children = binds_node.ensure_children();
    children.nodes_mut().clear();

    for bind in new {
        children.nodes_mut().push(build_bind_node(bind));
    }
}

fn build_bind_node(bind: &KeyBinding) -> KdlNode {
    let mut node = KdlNode::new(bind.key.as_str());

    // Properties
    if let Some(repeat) = bind.repeat {
        node.push(KdlEntry::new_prop("repeat", KdlValue::Bool(repeat)));
    }
    if let Some(cooldown) = bind.cooldown_ms {
        node.push(KdlEntry::new_prop(
            "cooldown-ms",
            KdlValue::Integer(cooldown as i128),
        ));
    }
    if let Some(allow_locked) = bind.allow_when_locked {
        node.push(KdlEntry::new_prop(
            "allow-when-locked",
            KdlValue::Bool(allow_locked),
        ));
    }
    if let Some(allow_inhibiting) = bind.allow_inhibiting {
        node.push(KdlEntry::new_prop(
            "allow-inhibiting",
            KdlValue::Bool(allow_inhibiting),
        ));
    }

    // hotkey-overlay-title
    match &bind.hotkey_overlay_title {
        Some(Some(title)) => {
            node.push(KdlEntry::new_prop(
                "hotkey-overlay-title",
                KdlValue::String(title.clone()),
            ));
        }
        Some(None) => {
            node.push(KdlEntry::new_prop(
                "hotkey-overlay-title",
                KdlValue::Null,
            ));
        }
        None => {}
    }

    // Action as child node
    if !bind.action.is_empty() {
        let mut action_node = KdlNode::new(bind.action.as_str());
        for arg in &bind.action_args {
            action_node.push(KdlEntry::new(KdlValue::String(arg.clone())));
        }
        let children_doc = node.ensure_children();
        children_doc.nodes_mut().push(action_node);
    }

    node
}

// --- New section change appliers ---

fn apply_cursor_changes(doc: &mut KdlDocument, old: &CursorConfig, new: &CursorConfig) {
    if old == new {
        return;
    }

    let cursor_node = ensure_node(doc, "cursor");

    if old.xcursor_theme != new.xcursor_theme {
        set_optional_string_child(cursor_node, "xcursor-theme", &new.xcursor_theme);
    }
    if old.xcursor_size != new.xcursor_size {
        set_optional_int_child(cursor_node, "xcursor-size", &new.xcursor_size);
    }
    if old.hide_when_typing != new.hide_when_typing {
        set_flag_in_parent(cursor_node, "hide-when-typing", new.hide_when_typing);
    }
    if old.hide_after_inactive_ms != new.hide_after_inactive_ms {
        set_optional_int_child(cursor_node, "hide-after-inactive-ms", &new.hide_after_inactive_ms);
    }
}

fn apply_environment_changes(
    doc: &mut KdlDocument,
    old: &[EnvironmentEntry],
    new: &[EnvironmentEntry],
) {
    if old == new {
        return;
    }

    // Remove all existing "environment" top-level nodes
    doc.nodes_mut()
        .retain(|n| n.name().value() != "environment");

    // Rebuild if there are entries
    if !new.is_empty() {
        let mut env_node = KdlNode::new("environment");
        let children_doc = env_node.ensure_children();

        for entry in new {
            let mut child = KdlNode::new(entry.key.as_str());
            match &entry.value {
                Some(val) => {
                    child.push(KdlEntry::new(KdlValue::String(val.clone())));
                }
                None => {
                    // Key with no value (unset)
                }
            }
            children_doc.nodes_mut().push(child);
        }

        doc.nodes_mut().push(env_node);
    }
}

fn apply_workspace_changes(
    doc: &mut KdlDocument,
    old: &[NamedWorkspace],
    new: &[NamedWorkspace],
) {
    if old == new {
        return;
    }

    // Remove all existing "workspace" top-level nodes
    doc.nodes_mut()
        .retain(|n| n.name().value() != "workspace");

    // Rebuild
    for ws in new {
        let mut node = KdlNode::new("workspace");
        node.push(KdlEntry::new(KdlValue::String(ws.name.clone())));

        if let Some(output) = &ws.open_on_output {
            let children_doc = node.ensure_children();
            let mut oo_node = KdlNode::new("open-on-output");
            set_string_arg(&mut oo_node, output);
            children_doc.nodes_mut().push(oo_node);
        }

        doc.nodes_mut().push(node);
    }
}

fn apply_switch_events_changes(
    doc: &mut KdlDocument,
    old: &SwitchEventsConfig,
    new: &SwitchEventsConfig,
) {
    if old == new {
        return;
    }

    let se_node = ensure_node(doc, "switch-events");

    apply_switch_action(se_node, "lid-close", &new.lid_close);
    apply_switch_action(se_node, "lid-open", &new.lid_open);
    apply_switch_action(se_node, "tablet-mode-on", &new.tablet_mode_on);
    apply_switch_action(se_node, "tablet-mode-off", &new.tablet_mode_off);
}

fn apply_switch_action(parent: &mut KdlNode, name: &str, action: &Option<SwitchAction>) {
    match action {
        Some(a) => {
            let child = ensure_child_node(parent, name);
            // Clear existing children
            if let Some(children) = child.children_mut() {
                children.nodes_mut().clear();
            }
            let children_doc = child.ensure_children();
            for cmd in &a.spawn {
                let mut spawn_node = KdlNode::new("spawn");
                spawn_node.push(KdlEntry::new(KdlValue::String(cmd.clone())));
                children_doc.nodes_mut().push(spawn_node);
            }
        }
        None => remove_child_node(parent, name),
    }
}

fn apply_gestures_changes(
    doc: &mut KdlDocument,
    old: &GesturesConfig,
    new: &GesturesConfig,
) {
    if old == new {
        return;
    }

    let gestures_node = ensure_node(doc, "gestures");

    // dnd-edge-view-scroll
    if old.dnd_edge_view_scroll != new.dnd_edge_view_scroll {
        apply_edge_gesture(gestures_node, "dnd-edge-view-scroll", &new.dnd_edge_view_scroll);
    }

    // dnd-edge-workspace-switch
    if old.dnd_edge_workspace_switch != new.dnd_edge_workspace_switch {
        apply_edge_gesture(gestures_node, "dnd-edge-workspace-switch", &new.dnd_edge_workspace_switch);
    }

    // hot-corners
    if old.hot_corners != new.hot_corners {
        match &new.hot_corners {
            Some(hc) => {
                let hc_node = ensure_child_node(gestures_node, "hot-corners");
                set_flag_in_parent(hc_node, "off", hc.off);
                set_flag_in_parent(hc_node, "top-left", hc.top_left);
                set_flag_in_parent(hc_node, "top-right", hc.top_right);
                set_flag_in_parent(hc_node, "bottom-left", hc.bottom_left);
                set_flag_in_parent(hc_node, "bottom-right", hc.bottom_right);
            }
            None => remove_child_node(gestures_node, "hot-corners"),
        }
    }
}

fn apply_edge_gesture(
    parent: &mut KdlNode,
    name: &str,
    gesture: &Option<EdgeGestureConfig>,
) {
    match gesture {
        Some(g) => {
            let child = ensure_child_node(parent, name);
            set_optional_int_child(child, "trigger-width", &g.trigger_width);
            set_optional_int_child(child, "trigger-height", &g.trigger_height);
            set_optional_int_child(child, "delay-ms", &g.delay_ms);
            set_optional_float_child(child, "max-speed", &g.max_speed);
        }
        None => remove_child_node(parent, name),
    }
}

fn apply_overview_changes(
    doc: &mut KdlDocument,
    old: &OverviewConfig,
    new: &OverviewConfig,
) {
    if old == new {
        return;
    }

    let overview_node = ensure_node(doc, "overview");

    if old.zoom != new.zoom {
        set_optional_float_child(overview_node, "zoom", &new.zoom);
    }
    if old.backdrop_color != new.backdrop_color {
        set_optional_string_child(overview_node, "backdrop-color", &new.backdrop_color);
    }
    if old.workspace_shadow != new.workspace_shadow {
        match &new.workspace_shadow {
            Some(shadow) => {
                write_shadow_to_node(overview_node, "workspace-shadow", shadow);
            }
            None => remove_child_node(overview_node, "workspace-shadow"),
        }
    }
}

fn apply_clipboard_changes(
    doc: &mut KdlDocument,
    old: &ClipboardConfig,
    new: &ClipboardConfig,
) {
    if old == new {
        return;
    }

    let clip_node = ensure_node(doc, "clipboard");
    if old.disable_primary != new.disable_primary {
        set_flag_in_parent(clip_node, "disable-primary", new.disable_primary);
    }
}

fn apply_xwayland_satellite_changes(
    doc: &mut KdlDocument,
    old: &XwaylandSatelliteConfig,
    new: &XwaylandSatelliteConfig,
) {
    if old == new {
        return;
    }

    let xws_node = ensure_node(doc, "xwayland-satellite");
    if old.path != new.path {
        set_optional_string_child(xws_node, "path", &new.path);
    }
}

fn apply_config_notification_changes(
    doc: &mut KdlDocument,
    old: &ConfigNotificationConfig,
    new: &ConfigNotificationConfig,
) {
    if old == new {
        return;
    }

    let cn_node = ensure_node(doc, "config-notification");
    if old.disable_failed != new.disable_failed {
        set_flag_in_parent(cn_node, "disable-failed", new.disable_failed);
    }
}

// PartialEq is derived on all types in types.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_diff_generation() {
        let original = "line 1\nline 2\nline 3\n";
        let modified = "line 1\nline modified\nline 3\n";
        let diff = generate_diff(original, modified);
        assert!(diff.contains("-line 2"));
        assert!(diff.contains("+line modified"));
    }

    #[test]
    fn test_round_trip_basic() {
        let src = "layout {\n    gaps 16\n}\n";
        let mut doc: KdlDocument = src.parse().unwrap();

        let old = LayoutConfig {
            gaps: Some(16),
            ..Default::default()
        };
        let new = LayoutConfig {
            gaps: Some(24),
            ..Default::default()
        };

        let layout_node = ensure_node(&mut doc, "layout");
        set_optional_int_child(layout_node, "gaps", &new.gaps);

        let result = doc.to_string();
        assert!(result.contains("24"), "Expected gaps to be 24, got: {}", result);
    }
}
