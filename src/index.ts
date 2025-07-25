import { OnStart, Service } from '@flamework/core';
import { UIPresetsConfig } from './UIPresetsConfig';
import Component from './core/ui_components';
import { RunService } from '@rbxts/services';
import { UIComponents } from './typings/components';
import { UUID } from './typings';

const HttpService: HttpService = game.GetService('HttpService');

interface SharedDefaultAttributes {
	UUID: UUID;
}
function getSharedDefaultAttributes(): SharedDefaultAttributes {
	return {
		UUID: "{N/A}"
	}
}

@Service()
class UIPresetsService implements OnStart {
	readonly Config: typeof UIPresetsConfig = UIPresetsConfig;
	Components: Map<string,Component> = new Map();

	onStart(): void {
		
	}

	attachComponent(instance: GuiObject,component: UIComponents) {
		// instance.AddTag()
	}

	/** Fetches a truly unique identifier. */
	fetchNewUUID(): string {
		let uuid: string;
		while (true) {
			uuid = HttpService.GenerateGUID(false);
			if (!this.Components.has(uuid)) break;
			RunService.Heartbeat.Wait();
		}
		return uuid;
	}
}

export = UIPresetsService;