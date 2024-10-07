import { CloseBtn } from 'presets/buttons/CloseBtn'
import { TickSetting } from 'presets/settings/TickSetting'

type PresetsMap = {
    CloseBtn: CloseBtn,
    TickSetting: TickSetting
}

type Presets = keyof PresetsMap;

export { PresetsMap, Presets }