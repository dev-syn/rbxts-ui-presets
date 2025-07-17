import { OnStart, Service } from '@flamework/core';
import { UIPresetsConfig } from './UIPresetsConfig';

@Service()
class UIPresetsService implements OnStart {
	Config: typeof UIPresetsConfig = UIPresetsConfig;

	onStart(): void {
		throw new Error('Method not implemented.');
	}


}

export = UIPresetsConfig;