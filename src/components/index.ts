import { Components } from 'types/components';

/**
 * A base class for all the UIPresets 'components'.
 */
abstract class Component<T extends GuiObject = GuiObject> {
    /** The type/name of this Component. */
    abstract Type: Components;
    /** The T extended GuiObject that this Component owns. NOTE: Not every component will have an Owner. */
    Owner?: T;

    constructor(owner?: T | undefined) {
        this.Owner = owner;
    }
}

export = Component;