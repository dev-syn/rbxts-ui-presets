import { BaseComponent } from '@flamework/components';
import { Presets } from 'typings/presets';

type UUID = string;

function generateDefaultAttributes(): {} {
	return {
			UUID: ""
	}
}

/**
 * A base class for all the UIPresets 'presets'
 * @typeParam A - The attributes with their name and value being the type guards
 * @typeParam T - The Instance type that this preset will use
 */
abstract class Preset<A extends {} = {},T extends Instance = Instance> extends BaseComponent<A,T> {
    
	/**
	 * The base type of the derived classes, this will always be Preset and should never be changed.
	 * @readonly 
	 */
	readonly BaseType: "Preset" = "Preset";

	/** The type/name of this Preset. */
	abstract Type: Presets;

	/**
	 * The unique ID of this Component.
	 * @readonly
	 */
	abstract UUID: UUID;

	constructor() {
		super();
	}

	override destroy() {
		this.Destroy(true);
		super.destroy();
	}

	/** Destroys the Preset cleaning up used references. */
	Destroy(_internal = false): void {
		if (!_internal) super.destroy();
	}

}

export { Preset }