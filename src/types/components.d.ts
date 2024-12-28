import { BoundCheck } from 'components/BoundCheck';
import { ContextMenu } from 'components/ContentMenu';
import Navbar from 'components/Navbar';
import { SelectableGroup } from 'components/SelectableGroup';
import { ToolTip } from 'components/ToolTip';

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