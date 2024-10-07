import Component from 'components';
import { SettingsTemplate } from './SettingsTemplate';
import type { Components } from 'types/components';

/**
 * This is a class designed to ease the creation of a settings UI panel. It supports default Roblox GuiObject's.
 */
class SettingsCreator extends Component {
    Type = "SettingsCreator" as Components;
    // DefaultTemplate: SettingsTemplate;
    // Name: string;
    
    constructor() {
        super();
        // Use the defined setting template to create this settings object
    }
}

export { SettingsCreator };