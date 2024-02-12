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

                            // Unselect the current button
                            this.CurrentSelection[0].BorderSizePixel = 0;
                            this.CurrentSelection.remove(0);
                        } else {
                            // Unselect the current button and select this button
                            this.CurrentSelection[0].BorderSizePixel = 0;
                            this.CurrentSelection.remove(0);

                            this.CurrentSelection.push(btn);
                            btn.BorderSizePixel = borderSize;
                        }
                    } else {
                        // Check if this btn is already selected
                        const btnIndex: number = this.CurrentSelection.indexOf(btn);
                        if (btnIndex !== -1) {
                            // If this is the last button selected and a selection is required return
                            if (this.CurrentSelection.size() === 1 && this.Config.requireSelection) return;

                            this.CurrentSelection[0].BorderSizePixel = 0;
                            this.CurrentSelection.remove(btnIndex);
                        } else {
                            this.CurrentSelection.push(btn);
                            btn.BorderSizePixel = borderSize;
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