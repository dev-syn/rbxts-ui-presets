import UIPresetsService from '../..';
import { PresetType } from '../../typings';
import { UIPresetsBaseAttributes, UIPresetsBaseDefaultAttributes, UIPresetsBase } from '../UIPresetsBase';

interface UIPresetAttributes {
	up_BaseType: 'Preset'
}

type UIPresetJoinedAttributes =
	UIPresetsBaseAttributes & UIPresetAttributes;

const UIPresetDefaultAttributes: UIPresetJoinedAttributes = {
	...UIPresetsBaseDefaultAttributes,
	up_BaseType: "Preset"
};

/**
 * A base class for all the UIPresets 'presets'.
 * A 'preset' differs since it's instance is specific and will be
 * created by UIPresets.
 * @typeParam A - The attributes with their name and value being the type guards
 * @typeParam I - The Instance type that this preset will use
 */
abstract class UIPreset<
	A extends {} = {},
	I extends GuiObject = GuiObject
> extends UIPresetsBase<A & UIPresetAttributes,I> {

	readonly baseType: 'Preset' = "Preset";
	/** The type/name of this {@link UIPreset}. */
	abstract presetType: PresetType;

	constructor(
		_uiPresetsService: UIPresetsService
	) {
		super(_uiPresetsService);
	}

	override assignAttributes(): void {
		super.assignAttributes();
		this.attributes.up_BaseType = 'Preset';
	}

}

export { UIPreset, UIPresetAttributes, UIPresetDefaultAttributes }