import { CloseBtn } from 'presets/buttons/CloseBtn'
import { TickSetting } from 'presets/settings/TickSetting'

type PresetsMap = {
    CloseBtn: CloseBtn,
    TickSetting: TickSetting
}

type PresetConstructors = {
    CloseBtn: typeof CloseBtn,
    TickSetting: typeof TickSetting
}

type Presets = keyof PresetsMap

export { PresetsMap, PresetConstructors, Presets }