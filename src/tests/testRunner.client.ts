// Simulate flamework
import { Flamework } from '@flamework/core';
import { discoverFlameworkPackages } from '@rbxts/syn-utils/out/flamework.utilities';
import { resolveInstance } from '@rbxts/syn-utils/out/path.utilities';

const container: Folder | undefined = resolveInstance("ReplicatedStorage/rbxts_include/node_modules","Folder");
if (container) {
	// Load all other packages into flamework
	const discoveredPkgs: string[] = discoverFlameworkPackages(container);
	discoveredPkgs.forEach(path => Flamework.addPaths(path));
	// Load ui-presets into flamework
	Flamework.addPaths("ReplicatedStorage/ui-presets");
	Flamework.ignite();
} else warn("[ui-presets] -> {testRunner}: Package container could not be found, so nothing was ignited.");