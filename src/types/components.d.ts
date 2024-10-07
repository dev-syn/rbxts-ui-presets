import { BoundCheck } from 'components/BoundCheck';
import { ContextMenu } from 'components/ContextMenu';
import Navbar from 'components/Navbar';
import { SelectableGroup } from 'components/SelectableGroup';
import { SettingsCreator } from 'components/SettingsCreator';
import { ToolTip } from 'components/ToolTip';

type ComponentsMap = {
    SettingsCreator: SettingsCreator,
    BoundCheck: BoundCheck,
    ContextMenu: ContextMenu,
    Navbar: Navbar<any,any>,
    SelectableGroup: SelectableGroup,
    ToolTip: ToolTip
}

type Components = keyof ComponentsMap;

export { ComponentsMap, Components }