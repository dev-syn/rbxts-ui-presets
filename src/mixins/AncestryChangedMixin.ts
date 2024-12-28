import type { Component } from 'components';
import type { Preset } from 'presets';

type Constructor<T = {}> = new (...args: any[]) => T;

function AncestryChangedMixin<
    TBase extends Constructor<Component<any,any,GuiObject> | Preset<any,any,GuiObject,any>>
>() {
    
}

export = AncestryChangedMixin;