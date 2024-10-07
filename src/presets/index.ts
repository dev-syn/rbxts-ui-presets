import { Presets } from 'types/presets';

/**
 * A base class for all the UIPresets 'presets'.
 */
abstract class Preset {
    /** The type/name of this Preset. */
    abstract Type: Presets;
}

export = Preset;