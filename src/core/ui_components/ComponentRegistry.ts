import { BoundCheck } from './.comps/BoundCheck'
import { ContextMenu } from './.comps/ContextMenu'
import { ContextItem } from './.comps/ContextMenu/ContextItem'
import { SelectableGroup } from './.comps/SelectableGroup'
import { ToolTip } from './.comps/ToolTip'
import { ComponentTag } from './ComponentTag'

type TComponentRegistry = {
	[ComponentTag.BoundCheck]: typeof BoundCheck,
	[ComponentTag.ContextMenu]: typeof ContextMenu,
	[ComponentTag.ContextItem]: typeof ContextItem,
	[ComponentTag.SelectableGroup]: typeof SelectableGroup,
	[ComponentTag.ToolTip]: typeof ToolTip;
}

const ComponentRegistry: TComponentRegistry = {
	[ComponentTag.BoundCheck]: BoundCheck,
	[ComponentTag.ContextMenu]: ContextMenu,
	[ComponentTag.ContextItem]: ContextItem,
	[ComponentTag.SelectableGroup]: SelectableGroup,
	[ComponentTag.ToolTip]: ToolTip
} as const;

export { ComponentRegistry, TComponentRegistry }