import { OnStart, Service } from '@flamework/core';
import { UIPresetsConfig } from './UIPresetsConfig';

@Service()
class UIPresetsService implements OnStart {
	readonly Config: typeof UIPresetsConfig = UIPresetsConfig;

	onStart(): void {
		
	}
}

export = UIPresetsService;