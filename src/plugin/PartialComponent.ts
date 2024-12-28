import type { Component } from 'components';
import { Constructor } from 'utils';

class PartialComponent<TClass extends Component<any,any,any>> {

    Properties: Map<string,any>;
    Component: Constructor<TClass>;
    ParamsInOrder: string[];

    constructor(
        properties: Map<string,any>,
        componentClass: Constructor<TClass>,
        paramsInOrder: string[]
    ) {
        this.Properties = properties;
        this.Component = componentClass;
        this.ParamsInOrder = paramsInOrder;
    }
}

export = PartialComponent;