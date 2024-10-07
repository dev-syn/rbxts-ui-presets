import { Presets } from 'types/presets';

/**
 * A base class for all the UIPresets 'presets'.
 */
abstract class Preset<T extends GuiObject = GuiObject> {
    /** The type/name of this Preset. */
    abstract Type: Presets;
    /** The T extended GuiObject that this Preset owns. */
    Owner?: T;

    constructor(owner?: T | undefined) {
        this.Owner = owner;
    }
}

export = Preset;