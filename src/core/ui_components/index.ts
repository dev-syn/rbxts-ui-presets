import { Components } from 'typings/components';

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
abstract class Component<T extends GuiObject | undefined = undefined> {
    /** The type/name of this Component. */
    abstract Type: Components;

    /** The T extended GuiObject that this Component owns. NOTE: Not every component will have an Owner. */
    Owner?: T;

    /**
     * The unique ID of this Component.
     * @readonly
     */
    readonly UUID: string;

    constructor(uuid: string,owner?: T | undefined) {
			this.UUID = uuid;
      this.Owner = owner;
    }

    /** Destroys the Component cleaning up used references. */
    Destroy() {
        this.Owner = undefined;
    }

}

export = Component