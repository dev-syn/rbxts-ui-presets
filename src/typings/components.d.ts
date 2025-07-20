import { BoundCheck } from '../core/ui_components/.comps/BoundCheck';
import { ContextMenu } from '../core/ui_components/.comps/ContentMenu/index';
import { SelectableGroup } from '../core/ui_components/.comps/SelectableGroup';
import { ToolTip } from '../core/ui_components/.comps/ToolTip';

type ComponentsMap = {
    BoundCheck: BoundCheck,
    ContextMenu: ContextMenu,
    Navbar: Navbar<Frame | ScrollingFrame>,
    SelectableGroup: SelectableGroup,
    ToolTip: ToolTip
}

type ComponentConstructors = {
    BoundCheck: typeof BoundCheck,
    ContextMenu: typeof ContextMenu,
    Navbar: typeof Navbar<Frame | ScrollingFrame>,
    SelectableGroup: typeof SelectableGroup,
    ToolTip: typeof ToolTip
}

type Components = keyof ComponentsMap;

export { ComponentsMap, ComponentConstructors, Components }