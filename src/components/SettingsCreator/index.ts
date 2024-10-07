import Component from 'components';
import { SettingsTemplate } from './SettingsTemplate';
import type { Components } from 'types/components';

/**
 * This is a class designed to ease the creation of a settings UI panel. It supports default Roblox GuiObject's.
 */
class SettingsCreator extends Component<GuiObject> {
    Type = "SettingsCreator" as Components;
    // DefaultTemplate: SettingsTemplate;
    // Name: string;
    
    constructor(owner: GuiObject) {
        super(owner);
        // Use the defined setting template to create this settings object
        this.Owner = owner
    }
}

export { SettingsCreator };