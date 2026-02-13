import { invoke } from "@tauri-apps/api/core";
import type { NiriConfig } from "./types";

export async function readConfig(): Promise<NiriConfig> {
  return invoke<NiriConfig>("read_config");
}

export async function writeConfig(config: NiriConfig): Promise<void> {
  return invoke("write_config", { config });
}

export async function getConfigDiff(config: NiriConfig): Promise<string> {
  return invoke<string>("get_config_diff", { config });
}

export async function getOutputs(): Promise<unknown> {
  return invoke("get_outputs");
}

export async function getWorkspaces(): Promise<unknown> {
  return invoke("get_workspaces");
}

export async function reloadNiri(): Promise<void> {
  return invoke("reload_niri");
}
