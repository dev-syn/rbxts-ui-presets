import { UIPreset } from '.';
import { IPresetStatic } from '../../typings/IPresetStatic';
import { CloseBtn, Preset_CloseBtn } from './.pres/CloseBtn'
import { Preset_TickSetting, TickSetting } from './.pres/TickSetting'
import { Preset_ContextMenu, ContextMenu } from './.pres/ContextMenu'
import { Preset_ContextItem, ContextItem } from './.pres/ContextMenu/ContextItem'
import { PresetTag } from './PresetTag';

type TPresetRegistry = {
	[PresetTag.CloseBtn]: IPresetStatic<Preset_CloseBtn,CloseBtn>,
	[PresetTag.TickSetting]: IPresetStatic<Preset_TickSetting,TickSetting>,
	[PresetTag.ContextMenu]: IPresetStatic<Preset_ContextMenu,ContextMenu>,
	[PresetTag.ContextItem]: IPresetStatic<Preset_ContextItem,ContextItem>
}

const PresetRegistry: TPresetRegistry = {
	[PresetTag.CloseBtn]: CloseBtn,
	[PresetTag.TickSetting]: TickSetting,
	[PresetTag.ContextMenu]: ContextMenu,
	[PresetTag.ContextItem]: ContextItem
} as const;

export { PresetRegistry, TPresetRegistry }