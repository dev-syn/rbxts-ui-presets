import type UIPresetsService from '../..';
import { ComponentType } from '../../typings';
import { UIPresetsBaseAttributes, UIPresetsBaseDefaultAttributes, UIPresetsBase } from '../UIPresetsBase';

interface UIComponentAttributes {
	up_BaseType: 'Component'
}

type UIComponentJoinedAttributes =
	UIPresetsBaseAttributes & UIComponentAttributes;

const UIComponentDefaultAttributes: UIComponentJoinedAttributes = {
	...UIPresetsBaseDefaultAttributes,
	up_BaseType: 'Component'
};

/**
 * A base class for all the UIPresets components.
 * Remember to call {@link UIPresetsBase.assignDefaultAttributes}
 * inside your {FlameworkComponent.onStart} method.
 * 
 * @typeParam A : The attributes with their name and value being the type guards
 * @typeParam I : The Instance type that this component will use
 */
abstract class UIComponent<
A extends {} = {},
I extends GuiObject = GuiObject
> extends UIPresetsBase<A & UIComponentAttributes,I> {

	/**
	 * The base type of the derived classes, this will always be 'Component' and should never be changed.
	 * @readonly 
	 */
	readonly baseType: "Component" = "Component";
	/** The type/name of this {@link UIComponent}. */
	abstract componentType: ComponentType;

	constructor(_uiPresetsService: UIPresetsService) {
		super(_uiPresetsService);
	}

	override assignAttributes(): void {
		super.assignAttributes();
		this.attributes.up_BaseType = 'Component';
	}
}

export { UIComponent, UIComponentAttributes, UIComponentDefaultAttributes }