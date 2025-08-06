// Simulate flamework
import { Flamework } from '@flamework/core';
import { resolveInstance } from '@rbxts/syn-utils/out/path.utilities';

const container: Folder | undefined = resolveInstance("ReplicatedStorage/rbxts_include/node_modules","Folder");
if (container) {
	Flamework.addPaths("src/core")
	Flamework.ignite();
} else warn("[ui-presets] -> {testRunner}: Package container could not be found, so nothing was ignited.");