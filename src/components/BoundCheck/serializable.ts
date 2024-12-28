import { ComponentsSerialized } from 'components';
import { BoundCheckOptions, BoundCoord } from './shared';
import { BaseSerializable } from 'plugin/serialization/Serializer';

interface BoundsLayoutSerializable extends BaseSerializable<"BoundsLayoutSerializable"> {
    C1: BoundCoord,
    C2: BoundCoord,
    C3: BoundCoord,
    C4: BoundCoord,
    Size: BoundCoord,
}

interface BoundCheckSerializable extends ComponentsSerialized<GuiObject,"BoundCheckSerializable"> {
    Options: BoundCheckOptions,
    BoundsLayout: BoundsLayoutSerializable,
    ActiveOnStart: boolean
}

export { BoundCheckSerializable, BoundsLayoutSerializable }