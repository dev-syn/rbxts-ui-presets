import { BaseComponent } from '@flamework/components';
import type UIPresetsService from '..';
import Maid from '@rbxts/maid';

interface UIPresetsBaseAttributes {
	up_UUID: string;
	up_Type: string;
}

const UIPresetsBaseDefaultAttributes: UIPresetsBaseAttributes = {
	up_UUID: "N/A",
	up_Type: "{invalid}"
};

/**
 * The base class used for UIComponent and UIPreset.
 * Remember to call {@link UIPresetsBase.assignDefaultAttributes}
 * inside your {FlameworkComponent.onStart} method.
 */
abstract class UIPresetsBase<
	A extends {} = {},
	I extends Instance = Instance> extends BaseComponent<
	A & UIPresetsBaseAttributes,I
	> {
	
	/**
	 * The base type of the derived component classes,
	 * this will always be 'Component' or 'Preset'
	 * and should never be changed.
	 * @readonly 
	 */
	abstract readonly BaseType: "Component" | "Preset";

	readonly UUID: string;
	
	protected readonly maid: Maid;
	/** This is designed like this so that I can pass UIPresetsService to the base, while receiving my DI classes from the constructor. */
	protected readonly UIPresetsService: UIPresetsService;

	constructor(
		_uiPresetsService: UIPresetsService
	) {
		super()
		this.UIPresetsService = _uiPresetsService;
		this.UUID = _uiPresetsService.fetchNewUUID();
		this.maid = new Maid();
	}

	/** {CRITICAL: Do not override} Flamework calls this when the component.instance is destroyed or the instance loses it component tag. */
	override destroy() {
		// Call the base destroy() to preserve flamework component.destroy
		super.destroy();

		this.maid.DoCleaning();
	}

	/** {CRITICAL}: Remember to call this method in your
	 * {FW.BaseComponent}.onStart to assign the
	 * attributes(the live values from the {FW.BaseComponent} classes) like {@link UIPresetsBase.UUID}.
	 */
	protected assignAttributes() {
		this.attributes.up_UUID = this.UUID;
	}

}

export { UIPresetsBase, UIPresetsBaseAttributes, UIPresetsBaseDefaultAttributes }