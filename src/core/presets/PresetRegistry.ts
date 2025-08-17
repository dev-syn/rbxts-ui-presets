import { IPresetStatic } from '../../typings/IPresetStatic'
import { CloseBtn, Preset_CloseBtn } from './.pres/CloseBtn'
import { Preset_TickSetting, TickSetting } from './.pres/TickSetting'
import { PresetTag } from './PresetTag'

type TPresetRegistry = {
	[PresetTag.CloseBtn]: IPresetStatic<Preset_CloseBtn,CloseBtn>,
	[PresetTag.TickSetting]: IPresetStatic<Preset_TickSetting,TickSetting>
}

const PresetRegistry: TPresetRegistry = {
	[PresetTag.CloseBtn]: CloseBtn,
	[PresetTag.TickSetting]: TickSetting
} as const;

export { PresetRegistry, TPresetRegistry }