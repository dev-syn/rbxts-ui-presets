import { TPresetRegistry } from '../core/presets/PresetRegistry'
import { TComponentRegistry } from '../core/ui_components/ComponentRegistry'

export type UUID = string

export type UIPresetsPresetType = keyof TPresetRegistry
export type UIPresetsComponentType = keyof TComponentRegistry

export type FW_Attributes = { [key: string]: unknown }

export type Button = TextButton | ImageButton;