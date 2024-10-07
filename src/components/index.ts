import { Components } from 'types/components';

/**
 * A base class for all the UIPresets 'components'.
 */
abstract class Component {
    /** The type/name of this Component. */
    abstract Type: Components;
}

export = Component;