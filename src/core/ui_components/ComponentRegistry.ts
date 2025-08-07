import { BoundCheck } from './.comps/BoundCheck'
import { SelectableGroup } from './.comps/SelectableGroup'
import { ToolTip } from './.comps/ToolTip'
import { ComponentTag } from './ComponentTag'

type TComponentRegistry = {
	[ComponentTag.BoundCheck]: typeof BoundCheck,
	[ComponentTag.SelectableGroup]: typeof SelectableGroup,
	[ComponentTag.ToolTip]: typeof ToolTip;
}

const ComponentRegistry: TComponentRegistry = {
	[ComponentTag.BoundCheck]: BoundCheck,
	[ComponentTag.SelectableGroup]: SelectableGroup,
	[ComponentTag.ToolTip]: ToolTip
} as const;

export { ComponentRegistry, TComponentRegistry }