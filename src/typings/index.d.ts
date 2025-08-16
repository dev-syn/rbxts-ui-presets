import { TPresetRegistry } from '../core/presets/PresetRegistry'
import { PresetTag } from '../core/presets/PresetTag'
import { TComponentRegistry } from '../core/ui_components/ComponentRegistry'
import { ComponentTag } from '../core/ui_components/ComponentTag'

export type UUID = string
export type PresetType = keyof TPresetRegistry
export type ComponentType = keyof TComponentRegistry

export type UIPresetComponents = keyof typeof PresetTag & keyof typeof ComponentTag

export type FW_Attributes = { [key: string]: unknown }

export type Button = TextButton | ImageButton