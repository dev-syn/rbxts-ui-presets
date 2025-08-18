import { IPresetStatic } from '../../typings/IPresetStatic'
import { CloseBtn, Preset_CloseBtn } from './.pres/CloseBtn'
import { ContextItem, Preset_ContextItem } from './.pres/ContextItem'
import { Preset_TickSetting, TickSetting } from './.pres/TickSetting'
import { PresetTag } from './PresetTag'

type TPresetRegistry = {
	[PresetTag.CloseBtn]: IPresetStatic<Preset_CloseBtn,CloseBtn>,
	[PresetTag.ContextItem]: IPresetStatic<Preset_ContextItem,ContextItem>
	[PresetTag.TickSetting]: IPresetStatic<Preset_TickSetting,TickSetting>
}

const PresetRegistry: TPresetRegistry = {
	[PresetTag.CloseBtn]: CloseBtn,
	[PresetTag.ContextItem]: ContextItem,
	[PresetTag.TickSetting]: TickSetting
} as const;

export { PresetRegistry, TPresetRegistry }