import Object from '@rbxts/object-utils';
import Preset from 'presets';
import { Presets } from 'types/presets';

const HttpService: HttpService = game.GetService("HttpService");

/**
 * The attribute enum items for the data attributes, this is simply for simpler usage.
 * @enum
 */
const enum EPresetDataAttributes {
    PresetUUID = "PresetUUID"
}

/** This is the base data attributes that are attached to the preset Instance. */
interface PresetsDataAttributes {
    /** Any key of 'string' and each value is an 'AttributeValue'. */
    [key: string]: AttributeValue;
    /** The unique ID of this preset. */
    PresetUUID: string;
}

/**
 * The structure of the attribute handler function.
 * @param value - The value for the attribute that this handler is attached to or
 * undefined if the attribute is removed.
 */
type AttributeHandler<T extends AttributeValue = AttributeValue> = (value: T | undefined) => void;

function generateDefaultAttributes(): PresetsDataAttributes {
    return {
        PresetUUID: ""
    }
}

/**
 * This class represents the core base data for all UIPresets 'presets'.
 * **NOTE:** Remember to call {@link InitAttributes} before attaching the handlers in the derived class.
 * @typeParam A - The attributes structure that extends from PresetsDataAsstributes.
 */
abstract class PresetsData<A extends PresetsDataAttributes = PresetsDataAttributes> extends Preset {

    abstract Type: Presets;
    /**
     * The Map of all the 'PresetsData' or class derivations.
     * This structure follows [uuid: string] -> PresetsData
     * @private
     */
    private static _storedPresetsData: Map<string,PresetsData> = new Map();

    /** The owning GuiObject of this object. */
    declare Owner: GuiObject;

    /**
     * The PresetsData's internal representation of the Instance attributes.
     * Note: The owning Instance is the authoritarian of the attributes and ANY attributes on the Instance
     * that is known within these entries, when changed on the Instance, will be reflected to this objects entry. 
     */
    Attributes: A;

    /**
     * The map of attributes that when changed the handler functions will be called
     * This map structure follows [attribute_name: string] -> {@link AttributeHandler}
     * @private
     */
    private _attachedHandlers: Map<string,AttributeHandler> = new Map();

    /**
     * Constructs a new PresetsData object.
     * @param owner - The Instance that will own this PresetsData
     */
    constructor(owner: GuiObject) {
        super(owner);
        let uuid: string = HttpService.GenerateGUID(false);

        if (PresetsData._storedPresetsData.has(uuid))
            uuid = HttpService.GenerateGUID(false);
        this.Attributes = generateDefaultAttributes() as A;
        this.Attributes.PresetUUID = uuid;

        this.Owner = owner;

        // When the attributes are changed update the internal attributes
        this.Owner.AttributeChanged.Connect((attr) => {
            const currentValue: AttributeValue | undefined = this.Owner.GetAttribute(attr);
            if (this.Attributes[attr] !== undefined)
                (this.Attributes as any)[attr] = currentValue;

            // Call the attribute handler for this attribute to relay changes
            const changedHandler: AttributeHandler | undefined = this._attachedHandlers.get(attr);
            if (changedHandler) changedHandler(currentValue);
        });

        PresetsData._storedPresetsData.set(uuid,this);
    }

    /**
     * Sets an attribute on the PresetsData object. This method must be called when changing the internal
     * attributes of this object. **If failed to do so**, the attribute will **not** be changed on the owning
     * Instance and a data mismatch will occur, with unexpected behaviour.
     * @param key The key/name to access for this attribute
     * @param value The value to set for it's attribute
     */
    SetAttribute(key: string, value: AttributeValue | undefined): void {
        if (this.Attributes[key]) {
            const attr: AttributeValue | undefined = this.Owner.GetAttribute(key);

            // If the attribute doesn't exist and the value is undefined or null, don't create the attribute.
            if (!attr) return;

            this.Owner.SetAttribute(key,value);
        }
    }

    /** Destroys this object and removes static references. This will destroy the owning Instance. */
    Destroy() {
        PresetsData._storedPresetsData.delete(this.Attributes.PresetUUID);
        this._attachedHandlers.clear();
        this._attachedHandlers = undefined!;
        this.Owner.Destroy();
        super.Destroy();
    }

    /**
     * Attaches a handler function to an attributes key to this object, so that when the attribute
     * is changed, the handler function will be called with the new value. A value of undefined/nil means the
     * attribute was removed. When the handler function is attached, the handler will be immediately called to initialize them. 
     * @param key - The key of the attribute
     * @param handler - The handling function
     * @protected
     */
    protected AttachAttributeHandler<T extends AttributeValue>(key: keyof A,handler: AttributeHandler<T>) {
        if (typeOf(key) !== 'string') return;

        // If it's not a recognized attribute, return
        if (!this.Attributes[key]) return;

        this._attachedHandlers.set(key as string,handler as AttributeHandler);
        handler(this.Attributes[key as string] as T);
    }
    
    /**
     * Detaches a handling function from this object.
     * @param key - The key of the attribute
     * @protected
     */
    protected DeattachAttributeHandler(key: keyof A) {
        if (typeOf(key) !== 'string') return;
        this._attachedHandlers.delete(key as string);
    }

    /**
     * Initializes the attributes that are not yet attached to the owner Instance.
     * **WARNING**: This **must be** called from the **derived class** usually after attaching your attribute handlers.
     */
    protected InitAttributes() {
        for (const [key,value] of Object.entries(this.Attributes) as [keyof A, AttributeValue][]) {
            const attr: AttributeValue | undefined = this.Owner.GetAttribute(key as string);
            if (attr === undefined) this.Owner.SetAttribute(key as string,value);
            // Update the internal attribute value from the attribute
            else (this.Attributes[key] as any) = attr;
        }
    }
}

export { PresetsData, PresetsDataAttributes, EPresetDataAttributes, AttributeHandler };