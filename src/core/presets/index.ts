import Object from '@rbxts/object-utils';
import { HttpService, RunService } from '@rbxts/services';
import PartialPreset from 'plugin/PartialPreset';
import SerializedInstance from 'plugin/serialization/instanceSerializer';
import { Serializer, ConditionalReturn } from 'plugin/serialization/Serializer';
import { Presets } from 'types/presets';

type UUID = string;
type PresetsSerialized<T extends Instance | undefined = undefined> = {
    Type: string;
    PresetUUID: UUID;
    Owner: T extends Instance ? SerializedInstance<T> : undefined;
};

/**
 * The attribute enum items for the data attributes, this is simply for simpler usage.
 * @enum
 */
const enum EPresetDataAttributes {
    UUID = "UUID"
}

/** This is the base data attributes that are attached to the preset Instance. */
interface PresetsDataAttributes {
    /** Any key of 'string' and each value is an 'AttributeValue'. */
    [key: string]: AttributeValue;
    /** The unique ID of this preset. */
    UUID: string;
}

/**
 * The structure of the attribute handler function.
 * @param value - The value for the attribute that this handler is attached to or
 * undefined if the attribute is removed.
 */
type AttributeHandler<T extends AttributeValue = AttributeValue> = (value: T | undefined) => void;

function generateDefaultAttributes(): PresetsDataAttributes {
    return {
        UUID: ""
    }
}


/**
 * A base class for all the UIPresets 'presets'.
 * @typeParam S - The serializable object of the consuming class
 * @typeParam D - The deserialized object for the consuming class
 * @typeParam T - The Owner GuiObject type
 * @typeParam A - The UIPresets 'preset' data attributes
 * 
 * @remarks
 * Each Preset should have a static method called 'ReconstructFromPartial'
 * this static method should follow these parameters
 * (partial: PartialPreset<GuiObject | undefined,(Derived PresetClass)>) -> Derived PresetClass
 * This is a method that takes a partial preset and will reconstruct the preset class with the data inside the Partial class.
 */
abstract class Preset<
    S extends PresetsSerialized<Instance | undefined>,
    D extends object,
    T extends GuiObject | undefined = undefined,
    A extends PresetsDataAttributes = PresetsDataAttributes> extends Serializer<S,D> 
{
    protected static _storedData: Map<UUID,Preset<PresetsSerialized<Instance | undefined>,object,GuiObject | undefined,PresetsDataAttributes>> = new Map();
    
    /**
     * The base type of the derived classes, this will always be Preset and should never be changed.
     * @readonly 
     */
    readonly BaseType: "Preset" = "Preset";

    /** The type/name of this Preset. */
    abstract Type: Presets;
    /** The T extended GuiObject that this Preset owns. */
    declare Owner?: T;

    /**
     * The unique ID of this Component.
     * @readonly
     */
    readonly UUID: UUID;

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

    constructor(owner?: T | undefined) {
        super();
        this.Owner = owner;
        let uuid: string = HttpService.GenerateGUID(false);
        if (Preset._storedData.has(uuid))
            uuid = HttpService.GenerateGUID(false);
        this.UUID = HttpService.GenerateGUID(false);
        this.Attributes = generateDefaultAttributes() as A;
        this.Attributes.UUID = uuid;

        if (this.Owner) {
            // When the attributes are changed update the internal attributes
            this.Owner.AttributeChanged.Connect((attr) => {
                if (!this.Owner) return;

                const currentValue: AttributeValue | undefined = this.Owner.GetAttribute(attr);
                if (this.Attributes[attr] !== undefined)
                    (this.Attributes as any)[attr] = currentValue;

                // Call the attribute handler for this attribute to relay changes
                const changedHandler: AttributeHandler | undefined = this._attachedHandlers.get(attr);
                if (changedHandler) changedHandler(currentValue);
            });
        }
        Preset._storedData.set(uuid,this);
    }

    abstract CreatePartial<TClass extends Preset<any,any,any,any> = Preset<S,D,T,A>>(): PartialPreset<TClass>;

    /** Destroys the Preset cleaning up used references. */
    Destroy() {
        this.Owner = undefined;
        this._attachedHandlers.clear();
        Preset._storedData.delete(this.UUID);
    }

    Serialize(): S {
        if (!RunService.IsStudio()) error("[UIPresets]: Serialize() can only be called within Studio.");
        if (!this._isSerializable) error(`[UIPresets]: Component '${this.Type}' is not serializable.`);
        return {
            Type: this.Type,
            Owner: this.Owner ? Serializer.SerializeInstance(this.Owner) : undefined
        } as S;
    }

    /**
     * Sets an attribute on the PresetsData object. This method must be called when changing the internal
     * attributes of this object. **If failed to do so**, the attribute will **not** be changed on the owning
     * Instance and a data mismatch will occur, with unexpected behaviour.
     * @param key The key/name to access for this attribute
     * @param value The value to set for it's attribute
     */
    SetAttribute(key: string, value: AttributeValue | undefined): void {
        if (!this.Owner) return;

        if (this.Attributes[key]) {
            const attr: AttributeValue | undefined = this.Owner.GetAttribute(key);

            // If the attribute doesn't exist and the value is undefined or null, don't create the attribute.
            if (!attr) return;

            this.Owner.SetAttribute(key,value);
        }
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
        if (!this.Owner) return;

        for (const [key,value] of Object.entries(this.Attributes) as [keyof A, AttributeValue][]) {
            const attr: AttributeValue | undefined = this.Owner.GetAttribute(key as string);
            if (attr === undefined) this.Owner.SetAttribute(key as string,value);
            // Update the internal attribute value from the attribute
            else (this.Attributes[key] as any) = attr;
        }
    }


}

export { Preset, PresetsDataAttributes, PresetsSerialized, EPresetDataAttributes, AttributeHandler }