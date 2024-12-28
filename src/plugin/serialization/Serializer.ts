import { RunService } from '@rbxts/services';
import SerializedInstance from './instanceSerializer';

type ConditionalReturn<ShouldReturnObject extends boolean,D extends object>
= ShouldReturnObject extends true ? D : undefined;

type BaseSerializable<sType extends string = "BaseSerializable"> = { _serializableType: sType };

/**
 * Builds a path from a string array to a final forward slash path string.
 * @param path An array of string each element represents an Instance
 * @returns - The final forward slash path
 */
function buildPath(path: string[]): string {
    let _path: string = "";

    for (let i = path.size() - 1; i >= 0; i--) {
        if (i !== 0) _path += path[i] + "/";
        else _path += path[i];
    }

    return _path;
}
/**
 * Gets an Instance's path using forward slash seperators.
 * @param inst - The Instance to get the path from
 */
function getPathOfInst(inst: Instance): string {
    if (inst.Parent === undefined) return "";

    let pathArr: string[] = [];
    let currentInst: Instance | undefined = inst;
    while (currentInst.Parent !== undefined) {
        if (currentInst.Parent === game) return buildPath(pathArr);

        pathArr.push(currentInst.Name);
        currentInst = currentInst.Parent;
    }
    // If the path is incomplete, it's invalid so we will return.
    if (currentInst === undefined) return "";

    return buildPath(pathArr);
}

abstract class Serializer<S extends object,D extends object> {

    /** Whether this class can be serialized or not.
     * This functionality is only intended for Plugins that use UIPresets.
     * @protected
     */
    protected _isSerializable: boolean = false;

    static FindInstanceWithPath<T extends Instance>(path: string): T | undefined {
        if (path === "") return;

        const parts: string[] = path.split('/');

        let currentInstance: Instance | undefined = game.GetService(parts[0] as keyof Services);
        if (!currentInstance) return;

        for (let i = 1; i < parts.size(); i++) {
            const nextInst: Instance | undefined = currentInstance.FindFirstChild(parts[i]);
            if (!nextInst) return undefined;
            currentInstance = nextInst;
        }

        return currentInstance as T;
    }

    static HasSerializedType(obj: object): obj is { _serializableType: string } & object {
        return type(obj) === 'table' && '_serializableType' in obj ? true : false;
    }

    static SerializeInstance<T extends Instance>(inst: T): SerializedInstance<T> {
        let parent: Instance | undefined;
        if (typeOf(inst.Parent) === 'Instance') parent = inst.Parent;

        const sInst: SerializedInstance<T> = {
            ClassName: inst.ClassName,
            Name: inst.Name,
            Parent: undefined,
            Path: getPathOfInst(inst)
        };

        if (parent) {
            // If this Instance's parent is the DataModel, assign no parent.
            if (parent === game) return sInst;
            // If this Instance's parent is a class of ServiceProvider, assign no parent.
            if (parent.IsA("ServiceProvider")) return sInst;

            sInst.Parent = this.SerializeInstance<Instance>(parent);
        }

        return sInst;
    }

    abstract Serialize(): S;
}

export { Serializer, ConditionalReturn, BaseSerializable }