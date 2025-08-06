import { Signal } from '@rbxts/beacon';
import UIComponent from '../../';
import { UIComponents } from '../../../../typings/components';
import UIPresetsService from '../../../..';
import { Component } from '@flamework/components';
import { OnStart } from '@flamework/core';
import { UUID } from '../../../../typings';
import ComponentType from '../../ComponentTag';

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
@Component({
	tag: ComponentType.SelectableGroup
})
class SelectableGroup extends UIComponent implements OnStart {

	/** {@inheritDoc Component} */
	Type = "SelectableGroup" as UIComponents;
	
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
	 * A map of this buttons connections of this SelectableGroup.
	 */
	private selectableConnections: Map<Button,RBXScriptConnection[]> = new Map();

	/**
	 * Constructs a SelectableGroup object.
	 * @param group - An optional parameter to assign this SelectableGroup buttons
	 */
	constructor(
		_uiPresetsService: UIPresetsService
	) {
		super(_uiPresetsService);
		this.SelectionGroup = [];
	}

	onStart(): void {
		if (this.DefaultSelection) {
			if (!this.SelectionGroup.includes(this.DefaultSelection)) this.SelectionGroup.push(this.DefaultSelection);

			// Make the default button selected
			this.CurrentSelection.push(this.DefaultSelection);
			this.DefaultSelection.BorderSizePixel = this.Config.borderSize;
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
			const prevSelection: Button = this.CurrentSelection[0];
			if (config.isSingleOnly && prevSelection) {
				prevSelection.BorderSizePixel = 0;
				this.CurrentSelection.pop();
			}
			this.CurrentSelection.push(newSelection);
			newSelection.BorderSizePixel = this.Config.borderSize;
			this.SelectionChanged.Fire(prevSelection,newSelection);
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

			const prevSelection: Button = this.CurrentSelection[0];
			prevSelection.BorderSizePixel = 0;
			this.CurrentSelection.pop();
			this.SelectionChanged.Fire(prevSelection,undefined);
		}
	}

	/** Adds a button to the {@link SelectableGroup}. */
	Add(button: Button) {
		// Check if this button is already in this SelectableGroup
		if (this.SelectionGroup.includes(button)) return;
		this.SelectionGroup.push(button);

		button.BorderColor3 = this.Config.borderColor;

		let selectableConnections: RBXScriptConnection[] | undefined = this.selectableConnections.get(button);
		if (!selectableConnections) {
			selectableConnections = [];
			this.selectableConnections.set(button,selectableConnections);
		}

		// When the button is destroyed remove any references to that button
		selectableConnections.push(
			button.Destroying.Connect(() => {
				const btnSelectionIndex: number = this.CurrentSelection.indexOf(button);
				if (btnSelectionIndex !== -1) this.CurrentSelection.remove(btnSelectionIndex);

				const btnGroupIndex: number = this.SelectionGroup.indexOf(button);
				if (btnGroupIndex !== -1) this.SelectionGroup.remove(btnGroupIndex);
			})
		);

		const borderSize: number = this.Config.borderSize;
		
		selectableConnections.push(
			button.MouseButton1Click.Connect(() => {
				// If only one button can be selected at a time
				if (this.Config.isSingleOnly) {
					// If this is the only selection that is being toggled; remove this selection
					if (this.CurrentSelection[0] === button) {
						// If a selection is required and this is the only selection; return
						if (this.Config.requireSelection) return;

						const prevSelection: Button = this.CurrentSelection[0];

						// Unselect the current button
						prevSelection.BorderSizePixel = 0;
						this.CurrentSelection.remove(0);

						this.SelectionChanged.Fire(prevSelection,undefined);
					}
					// Otherwise remove the previous selection and select this button
					else {
						const prevSelection: Button = this.CurrentSelection[0];
						if (prevSelection) {
							// Unselect the current button and select this button
							prevSelection.BorderSizePixel = 0;
							this.CurrentSelection.remove(0);
						}
						this.CurrentSelection.push(button);
						button.BorderSizePixel = borderSize;
						this.SelectionChanged.Fire(prevSelection,button);
					}
				} else { // Otherwise multiple buttons can be selected at a time
					const btnIndex: number = this.CurrentSelection.indexOf(button);
					// Check if this btn is already selected
					if (btnIndex !== -1) {
						// If a selection is required and this is the last button selected; return
						if (this.Config.requireSelection && this.CurrentSelection.size() === 1) return;

						const prevSelection: Button = this.CurrentSelection[0];
						prevSelection.BorderSizePixel = 0;
						this.CurrentSelection.remove(btnIndex);
						this.SelectionChanged.Fire(prevSelection,undefined);
					} else {
						this.CurrentSelection.push(button);
						button.BorderSizePixel = borderSize;
						this.SelectionChanged.Fire(undefined,button);
					}
				}
			})
		);
	}

	/** Removes a button from the {@link SelectableGroup}. */
	Remove(button: Button,force: boolean = false) {
		const btnGroupIndex: number = this.SelectionGroup.indexOf(button);
		// Check if this button is not in this SelectableGroup
		if (btnGroupIndex === -1) return;

		const btnSelectionIndex: number = this.CurrentSelection.indexOf(button);
		if (btnSelectionIndex !== -1) {
			// This button is currently selected

			// If this SelectableGroup requires a selection and there is only one without force specified; return
			if (this.Config.requireSelection && this.CurrentSelection.size() === 1 && !force) return;

			this.CurrentSelection.remove(btnSelectionIndex);
		}

		// Remove connections for this button
		this.removeButtonConnections(button);
		this.SelectionGroup.remove(btnGroupIndex);
		button.BorderSizePixel = 0;
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

	/** Unselects all the buttons unless Config.requireSelection is true in which case the default or a random button will be selected.
	 * WARNING: A heads up is that this method does not fire the {@link SelectableGroup.SelectionChanged} event.
	 */
	UnselectAll(): void {
		const groupSize: number = this.SelectionGroup.size();
		if (groupSize === 0) return;

		if (this.Config.requireSelection) {
			const reservedButton: Button = this.DefaultSelection || this.SelectionGroup[rand.NextInteger(1,groupSize)];

			for (let btnIndex = 0; btnIndex < groupSize; btnIndex++) {
				const button: Button = this.SelectionGroup[btnIndex];

				// If this is the reserved button do not unselect it
				if (button === reservedButton) continue;

				const btnSelectionIndex: number = this.CurrentSelection.indexOf(button);
				this.CurrentSelection.unorderedRemove(btnSelectionIndex);
			}
		} else {
			for (let btnIndex = 0; btnIndex < groupSize; btnIndex++) {
				const button: Button = this.SelectionGroup[btnIndex];

				const btnSelectionIndex: number = this.CurrentSelection.indexOf(button);
				this.CurrentSelection.unorderedRemove(btnSelectionIndex);
			}
		}
	}

	/**
	 * Checks if a button is selected or not.
	 * @param btn - The button to check if it's selected
	 * @returns - A boolean which is true if it is selected otherwise false
	 */
	IsSelected(btn: Button): boolean { return this.CurrentSelection.includes(btn); }

	/** Removes the RBXScriptConnection connections from the given button. */
	private removeButtonConnections(button: Button) {
		const selectableConnections: RBXScriptConnection[] | undefined = this.selectableConnections.get(button);
		if (!selectableConnections) return;

		selectableConnections.forEach(conn => conn.Disconnect());
		this.selectableConnections.delete(button);
	}
}

export { SelectableGroup, SelectableGroupConfig };