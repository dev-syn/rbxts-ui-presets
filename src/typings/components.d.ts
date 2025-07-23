import { BoundCheck } from '../core/ui_components/.comps/BoundCheck/index';
import { ContextMenu } from '../core/ui_components/.comps/ContextMenu/index';
import { SelectableGroup } from '../core/ui_components/.comps/SelectableGroup/index';
import { ToolTip } from '../core/ui_components/.comps/ToolTip/index';

type ComponentConstructors = {
    BoundCheck: typeof BoundCheck,
    ContextMenu: typeof ContextMenu,
    SelectableGroup: typeof SelectableGroup,
    ToolTip: typeof ToolTip
}

type UIComponents = keyof ComponentConstructors;

export { ComponentConstructors, UIComponents }