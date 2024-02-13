import { Signal } from '@rbxts/beacon';

type Button = TextButton | ImageButton;

/** The SelectableGroupConfig is a configurable set of options that changes the default behavior. */
interface SelectableGroupConfig {
    /** Whether only a single selection can be made or multiple. */
    isSingleOnly: boolean;
    /** Whether a selection is required or no selection can be present. */
    requireSelection: boolean;
    /** The button border color that is assigned during SelectableGroup.Init(). */
    borderColor: Color3;
    /** The button border size when the button is selected. */
    borderSize: number;
}

const rand: Random = new Random();

/**
 * This class allows you to group TextButton/ImageButton buttons together and allow single or multiple selections between those buttons.
 */
class SelectableGroup {

    /** The buttons that belong to this SelectableGroup. */
    SelectionGroup: Button[];
    /** The button('s) that are currently selected. */
    CurrentSelection: Button[] = [];
    /** The default selected button that is assigned so that when DeselectAll() is called this button will remain selected if Config.requiredSelection */
    DefaultSelection?: Button;

    /**
     * A Beacon Signal that when fired will give the previous selection and the new current selection.
     * 
     * Note:
     * The previous selection can be undefined in cases where there was no selection.
     * The current selection can be undefined in cases where requireSelection is false and nothing is selected.
     * @event
     */
    SelectionChanged: Signal<[prev: Button | undefined,current: Button | undefined]> = new Signal();
	
	// Configurable Options

    /**The Group Config that contains configurable options that will change the default behavior of this SelectableGroup. */
	Config: SelectableGroupConfig = {
        isSingleOnly: false,
        requireSelection: false,
        borderColor: Color3.fromRGB(255,255,255),
        borderSize: 2
    }

    /**
     * @private
     * The button connections of this SelectableGroup.
     */
    private selectableConnections: RBXScriptConnection[] = [];

    /**
     * Constructs a SelectableGroup object.
     * @param group - An optional parameter to assign this SelectableGroup buttons
     */
	constructor(group?: Button[]) {
        if (!group) this.SelectionGroup = [];
        else this.SelectionGroup = group;
	}

    /** Initializes the SelectionGroup. \*Remember to call this for intended behavior* */
    Init() {

        for (const btn of this.SelectionGroup) {

            btn.BorderColor3 = this.Config.borderColor;

            this.selectableConnections.push(
                btn.Destroying.Connect(() => {
                    const btnIndex: number = this.CurrentSelection.indexOf(btn);
                    if (btnIndex === -1) return;

                    this.CurrentSelection.remove(btnIndex);
                })
            );

            const borderSize: number = this.Config.borderSize;
            
            this.selectableConnections.push(
                btn.MouseButton1Click.Connect(() => {
                    if (this.Config.isSingleOnly) {
                        // If the current selected button is already selected ignore.
                        if (this.CurrentSelection[0] === btn) {
                            if (this.Config.requireSelection) return;

                            const prevSelection: Button = this.CurrentSelection[0];
                            // Unselect the current button
                            prevSelection.BorderSizePixel = 0;
                            this.CurrentSelection.remove(0);
                            this.SelectionChanged.Fire(prevSelection,undefined);
                        } else {
                            const prevSelection: Button = this.CurrentSelection[0];
                            // Unselect the current button and select this button
                            prevSelection.BorderSizePixel = 0;
                            this.CurrentSelection.remove(0);

                            this.CurrentSelection.push(btn);
                            btn.BorderSizePixel = borderSize;
                            this.SelectionChanged.Fire(prevSelection,btn);
                        }
                    } else {
                        // Check if this btn is already selected
                        const btnIndex: number = this.CurrentSelection.indexOf(btn);
                        if (btnIndex !== -1) {
                            // If this is the last button selected and a selection is required return
                            if (this.CurrentSelection.size() === 1 && this.Config.requireSelection) return;

                            const prevSelection: Button = this.CurrentSelection[0];
                            prevSelection.BorderSizePixel = 0;
                            this.CurrentSelection.remove(btnIndex);
                            this.SelectionChanged.Fire(prevSelection,undefined);
                        } else {
                            this.CurrentSelection.push(btn);
                            btn.BorderSizePixel = borderSize;
                            this.SelectionChanged.Fire(undefined,btn);
                        }
                    }
                })
            );
        }

        if (this.DefaultSelection) {
            // Make the default button selected
            this.CurrentSelection.push(this.DefaultSelection);
            this.DefaultSelection.BorderSizePixel = 2;
        }
    }

    /**
     * This method triggers the selection of the new selected button. This is intended for external use only
     * @param newSelection - The button that will represent the new selection or undefined for no selection.
     */
    Select(newSelection: Button | undefined): void {
        const config: SelectableGroupConfig = this.Config;

        if (newSelection) {
            if (!this.SelectionGroup.includes(newSelection)) {
                warn(`Could not select new selection since it doesn't exist in the selection group with button name: ${newSelection.Name}`);
                return;
            }

            if (this.IsSelected(newSelection)) {
                warn("Could not select new selection since it already is selected.");
                return;
            }

            if (config.isSingleOnly && this.CurrentSelection[0]) {
                this.CurrentSelection[0].BorderSizePixel = 0;
                this.CurrentSelection.pop();
            }

            this.CurrentSelection.push(newSelection);
            newSelection.BorderSizePixel = this.Config.borderSize;
        } else {

            if (!config.isSingleOnly) {
                warn("Could not select a non existent selection with multi-selections, use UnselectAll() instead.");
                return;
            }
            
            const selectionsSize: number = this.CurrentSelection.size();
            if (selectionsSize === 0) {
                warn("Could not remove selection from selection group no selection is present.");
                return;
            }
            if (config.requireSelection && selectionsSize === 1) {
                warn("Could not remove selection from selection group; since a selection is required.");
                return;
            }

            this.CurrentSelection[0].BorderSizePixel = 0;
            this.CurrentSelection.pop();
        }
    }

    /**
     * Selects all the buttons when Config.isSingleOnly is false.
     * @returns void
     */
    SelectAll(): void {
        if (this.SelectionGroup.size() === 0) return;

        // Only allow selecting all on multi' selections
        if (this.Config.isSingleOnly) return;

        const borderSize: number = this.Config.borderSize;
        for (const btn of this.SelectionGroup) {
            const btnIndex: number = this.CurrentSelection.indexOf(btn);
            if (btnIndex !== -1) continue;

            this.CurrentSelection.push(btn);
            btn.BorderSizePixel = borderSize;
        }
    }

    /** Unselects all the buttons unless Config.requireSelection is true in which case the default or a random button will be selected. */
    UnselectAll(): void {
        const groupSize: number = this.SelectionGroup.size();
        if (groupSize === 0) return;

        this.CurrentSelection.clear();

        // If a selection is required then restore the default or random selection.
        if (this.Config.requireSelection) {
            const reservedButton: Button = this.DefaultSelection || this.SelectionGroup[rand.NextInteger(1,groupSize)];
            this.CurrentSelection.push(reservedButton);
        }
    }

    /**
     * Checks if a button is selected or not.
     * @param btn - The button to check if it's selected
     * @returns - A boolean which is true if it is selected otherwise false
     */
    IsSelected(btn: Button): boolean { return this.CurrentSelection.includes(btn); }

    /**
     * Destroys this SelectableGroup clearing all references to the buttons.
     */
    Destroy() {
        // Clear the related btn connections
        for (const conn of this.selectableConnections) {
            conn.Disconnect();
        }
        this.selectableConnections.clear();

        // Clear all table references
        this.CurrentSelection.clear();
        this.SelectionGroup.clear();
    }
}

export { SelectableGroup, SelectableGroupConfig };