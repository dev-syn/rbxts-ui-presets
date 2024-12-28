import { HttpService, RunService } from '@rbxts/services';
import PartialComponent from 'plugin/PartialComponent';
import SerializedInstance from 'plugin/serialization/instanceSerializer';
import { BaseSerializable, ConditionalReturn, Serializer } from 'plugin/serialization/Serializer';
import { Components } from 'types/components';

type UUID = string;
interface ComponentsSerialized<
    T extends Instance | undefined = undefined,
    sType extends string = "ComponentsSerialized"> extends BaseSerializable<sType>
{
    Type: string;
    Owner: T extends Instance ? SerializedInstance<T> : undefined;
    UUID: UUID;
    _serializableType: sType;
};

type GenericComponent = Component<ComponentsSerialized<Instance | undefined,any>,object,GuiObject | undefined>;

/**
 * A base class for all the UIPresets components.
 * @typeParam S - The serializable object of the consuming class
 * @typeParam D - The deserialized object for the consuming class
 * @typeParam T - The Owner GuiObject type
 * 
 * @remarks
 * Each Component should have a static method called 'ReconstructFromPartial'
 * this static method should follow these parameters
 * (partial: PartialComponent<GuiObject | undefined,(Derived ComponentClass)>) -> Derived Component Class
 * This is a method that takes a partial component and will reconstruct the Component class with the data inside the Partial class.
 */
abstract class Component<
    S extends ComponentsSerialized<Instance | undefined,any>,
    D extends object,
    T extends GuiObject | undefined = undefined> extends Serializer<S,D>
{
    protected static _storedData: Map<UUID,GenericComponent> = new Map();

    /**
     * The base type of the derived classes, this will always be Component and should never be changed.
     * @readonly 
     */
    readonly BaseType: "Component" = "Component";

    /** The type/name of this Component. */
    abstract Type: Components;

    /** The T extended GuiObject that this Component owns. NOTE: Not every component will have an Owner. */
    Owner?: T;

    /**
     * The unique ID of this Component.
     * @readonly
     */
    readonly UUID: UUID;

    constructor(owner?: T | undefined) {
        super();
        this.Owner = owner;
        let uuid: string = HttpService.GenerateGUID(false);
        if (Component._storedData.has(uuid))
            uuid = HttpService.GenerateGUID(false);

        this.UUID = uuid;
        Component._storedData.set(uuid,this);
    }

    abstract CreatePartial<TClass extends Component<S,D,T>>(): PartialComponent<TClass>;

    /** Destroys the Component cleaning up used references. */
    Destroy() {
        this.Owner = undefined;
        Component._storedData.delete(this.UUID);
    }

    Serialize(): S {
        if (!RunService.IsStudio()) error("[UIPresets]: Serialize() can only be called within Studio.");
        if (!this._isSerializable) error(`[UIPresets]: Component '${this.Type}' is not serializable.`);
        return {
            Type: this.Type,
            Owner: this.Owner ? Serializer.SerializeInstance(this.Owner) : undefined
        } as S;
    }
}

export { Component, ComponentsSerialized }