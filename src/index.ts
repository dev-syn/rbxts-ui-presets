import { OnStart, Service } from '@flamework/core';
import { UIPresetsConfig } from './UIPresetsConfig';
import Component from './core/ui_components';
import { RunService } from '@rbxts/services';

const HttpService: HttpService = game.GetService('HttpService');

@Service()
class UIPresetsService implements OnStart {
	readonly Config: typeof UIPresetsConfig = UIPresetsConfig;
	Components: Map<string,Component> = new Map();

	onStart(): void {
		
	}

	notifyComponent(comp: Component) {
		this.Components.set(comp.UUID,comp);
	}

	getUUID(): string {

		let uuid: string;
		while (true) {
			uuid = HttpService.GenerateGUID(false);
			RunService.Heartbeat.Wait();
			if (!this.Components.has(uuid)) break;
		}
	
		return uuid;
	}
}

export = UIPresetsService;