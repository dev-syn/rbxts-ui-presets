import { BaseComponent } from '@flamework/components';
import { UIComponents } from 'typings/components';

function generateDefaultAttributes() {

}
/**
 * A base class for all the UIPresets components.
 * @typeParam A - The attributes with their name and value being the type guards
 * @typeParam T - The Instance type that this component will use
 */
abstract class UIComponent<A = {},T extends GuiObject = GuiObject> extends BaseComponent<A,T> {

	/**
	 * The base type of the derived classes, this will always be Preset and should never be changed.
	 * @readonly 
	 */
	readonly BaseType: "Component" = "Component";

	/** The type/name of this Component. */
	abstract Type: UIComponents;

	/**
	 * The unique ID of this Component.
	 * @readonly
	 */
	abstract UUID: string;

	constructor() {
		super();
	}

	override destroy() {
		this.Destroy(true);
		super.destroy();
	}

	/** 
	 * Destroys the Component cleaning up used references.
	 * When the attached Instance is destroyed
	 * this is then called followed by flamework's processing.
	*/
	Destroy(_internal = false) {
		print(`${this.instance?.Name || "N/A"} component was triggered to be Destroyed.`);
		// Release the component from the instance
		if (!_internal) super.destroy();
		print(`${this.instance?.Name || "N/A"} component has finished being destroyed.`);
	}
}

export = UIComponent