/**
 * This is a type that represents a part of an Instance for serialization and
 * **DOES NOT** contain all the Instance data. This is mostly used to find
 * and identify the instances that existed before but after deserialization.
 */
type SerializedInstance<T extends Instance = Instance> = {
    ClassName: T['ClassName']
    /** The name of this Instance. */
    Name: T['Name']
    /**
     * The parent of this Instance this will only be set if it's another instance that can be serialized.
     * NOTE: If the parent is a Service like Workspace or ServerScriptService, the Parent will be undefined.
     */
    Parent: SerializedInstance<Instance> | undefined;
    /** The path will be in forward slash format to support the JSON structure. */
    Path: string;
}

export = SerializedInstance;