import { Component } from '@flamework/components';
import { t } from '@rbxts/t';
import { OnStart } from '@flamework/core';
import type UIPresetsService from '../../../..';
import { FW_Attributes } from '../../../../typings';
import { ContextItem } from '../../../presets/.pres/ContextItem';
import { ConfigurationComponent } from '@rbxts/syn-utils';
import { UIComponent } from '../..';
import { ComponentTag } from '../../ComponentTag';

// #region Preset_ContextMenu
type Preset_ContextMenu = Frame & {}

function createContextMenu(): Preset_ContextMenu {
	const menuBG = new Instance("Frame") as Preset_ContextMenu;
	menuBG.Name = `ContextMenu-{unknown}`;
	menuBG.BackgroundColor3 = Color3.fromRGB(64,64,64);
	return menuBG;
}
// #endregion

// #region TextSizingMode

/**
 * @enum {number}
 * The TextSizingMode enum contains modes that affect the text sizing of the @see {@link ContextItem} title text.
 */
enum TextSizingMode {
	/** This sizing mode goes through all the context item texts and finds the lowest text size where all items would fit. This mode has a built-in fixed padding on those text sizes.*/
	MinimumCommon,
	/** This mode uses the @see {@link ContextMenu.textSizeScaler} property which is a scale modifier for the Owner text size. */
	Scaled
}

type vTextSizingMode = keyof typeof TextSizingMode
const tTextSizingMode = t.interface({
	MinimumCommon: t.number,
	Scaled: t.number
});

// #endregion

/**
 * @interface
 * These are the options that can be passed to ContextMenu to change default ContextMenu behavior.
 */
interface MenuOptions {
	/** This only affects TextButton {@link ContextItem.instance} instances. */
	textSizingMode: TextSizingMode;
}

// #region Attributes
interface ContextMenuAttributes {
	up_ItemSize: Vector2,
	/** A scaler modifier number that will affect the {@link ContextMenu.TextSize} of each  */
	up_TextSizeScalar: number
}

const DEFAULT_CONTEXT_MENU_ATTRIBUTES: UIPresetAttributes & ContextMenuAttributes = {
	...UIPresetDefaultAttributes,
	up_ItemSize: new Vector2(1,1),
	up_TextSizeScalar: 1
};

// #endregion
@ConfigurationComponent({
	tag: ComponentTag.ContextMenu,
	defaults: DEFAULT_CONTEXT_MENU_ATTRIBUTES as unknown as FW_Attributes,
	configuration: {
		TriggerElement: t.union(t.instanceIsA("TextButton"),t.instanceIsA("ImageButton"))
	}
})
/**
 * This is a component which should 
 */
class ContextMenu extends UIComponent<
	ContextMenuAttributes,
	GuiObject 
> implements OnStart {

// #region STATIC
	static PresetInstance = () => createContextMenu();

	/** The {@link ScreenGui} of this ContextMenu. */
	static ContextMenuUI: ScreenGui = new Instance("ScreenGui");

	/** A {@link TextLabel} for checking if text fits within a label. */
	static TextFitsLabel: TextLabel = new Instance("TextLabel");
	
	/** Whether only one context menu can be showed at a time. */
	static OnlySingleContext: boolean = true;

	/** The previous or current ContentMenu that is showed on screen. */
	private static _lastActiveMenu?: ContextMenu = undefined;
// #endregion

	componentType = ComponentTag.ContextMenu;

	Options: MenuOptions = {
			textSizingMode: TextSizingMode.MinimumCommon
	};

// #region PRIVATE
	/**
	 * @private
	 * Stores the common text size of each active context item.
	 */
	private _itemTextSize?: number;
	/**
	 * @private
	 * Stores the absolute ViewSize of the clients screen.
	 */
	private _viewSize?: Vector2;
	/**
	 * @private
	 * The ContextItems that belong to this ContextMenu.
	 */
	private _contexts: ContextItem[] = [];
	/**
	 * @private
	 * The connections that belong to this ContextMenu.
	 */
	private _connections: RBXScriptConnection[] = [];
// #endregion

	/**
	 * Constructs a new ContextMenu object.
	 * @param Owner - The button element that triggers this ContextMenu.
	 * @param contexts - The ContextItems that belong to this ContextMenu. Note: This is more performant than calling @see {@link ContextMenu.AddContext} on each ContextItem.
	 */
	constructor(
		_uiPresetsService: UIPresetsService
	) {
		super(_uiPresetsService);

		if (!ContextMenu.ContextMenuUI.Parent) {
			ContextMenu.ContextMenuUI.Name = "UIPresets_ContextMenu";
			ContextMenu.ContextMenuUI.DisplayOrder = _uiPresetsService.HighestUIOrder + 1;
			ContextMenu.ContextMenuUI.ResetOnSpawn = false;

			ContextMenu.ContextMenuUI.Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");
		}

		if (!ContextMenu.TextFitsLabel.Parent) {
			ContextMenu.TextFitsLabel.Position = new UDim2(2,0,2,0);
			ContextMenu.TextFitsLabel.Parent = ContextMenu.ContextMenuUI;
		}

		// When the HighestDisplayOrder is changed update the ContextMenuSG DisplayOrder
		_uiPresetsService.OnUIOrderChanged.Connect((newOrder: number) => ContextMenu.ContextMenuUI.DisplayOrder = newOrder + 1);
	}

	onStart(): void {
		// Updates the text size of these context items that are TextButton elements
		this.updateTextSize();

		this.instance.Visible = true;

		// When the trigger element is right clicked draw and display the context menu
		this._connections.push(
			this.instance.MouseButton2Click.Connect(() => {
					if (ContextMenu.onlySingleContext && ContextMenu._previousMenu && ContextMenu._previousMenu !== this)
						ContextMenu._previousMenu.menuBG.Parent = undefined;
					if (!this.menuBG.Parent) {
						this.Draw();
						this.menuBG.Parent = ContextMenu.contextMenuSG;
					} else {
						this.menuBG.Parent = undefined;
						if (ContextMenu._previousMenu === this) ContextMenu._previousMenu = undefined;
					}
			})
		);
		
		// When the trigger element's position is changed, redraw the context menu.
		this._connections.push(
			this.instance.GetPropertyChangedSignal("Position").Connect(() => this.Draw())
		);

		this._connections.push(this.instance.Destroying.Once(() => this.Destroy()));
	}

	/**
	 * Draws the sizing and positioning for both the ContextMenu and ContextItems that are active.
	 */
	Draw(): void {

		if (!this._itemTextSize) this.updateTextSize();

		// Get the updated screen size
		this.viewSize = ContextMenu.contextMenuSG.AbsoluteSize;

		const activeContexts: ContextItem[] = this.GetActiveContexts();
		const contextSize: number = activeContexts.size();

		// If no context; don't draw anything
		if (contextSize === 0) return;

		// If minItemSizeX was set to zero, assign it 1
		if (this.itemSize.X === 0) this.itemSize = this.itemSize.add(new Vector2(1,this.itemSize.Y));

		// If minItemSizeY was set to zero, assign it 1
		if (this.itemSize.Y === 0) this.itemSize = this.itemSize.add(new Vector2(this.itemSize.X,1));

		const owner: Button = this.instance;

		const absSizeY: number = owner.AbsoluteSize.Y;
		const absPosY: number = owner.AbsolutePosition.Y;

		// The minimum absolute size of each context item
		const itemAbsSizeY: number = math.ceil(this.itemSize.Y * absSizeY);
		// Get the used amount of space on the x axis in pixels of each context item
		const itemAbsSizeX: number = math.ceil(this.itemSize.X * owner.AbsoluteSize.X);

		const yAnchor: number = owner.AnchorPoint.Y;
		
		// Calculate the top left absolute y position of the trigger element
		const topAbsPosY: number = math.ceil(absPosY - absSizeY * yAnchor);

		// Calculate the left absolute x position of the trigger element
		const leftAbsPosX: number = owner.AbsolutePosition.X - math.ceil(owner.AbsoluteSize.X * owner.AnchorPoint.X);

// #region Row_Columns
		// Is the trigger element positioned over half the y screen
		const isSizeOverHalfY: boolean = absPosY > this.viewSize.Y / 2;

		let availableYPixels: number;
		if (isSizeOverHalfY) {
			// Prioritize pushing the context menu upwards before more columns
			availableYPixels = topAbsPosY;
		} else {
			// Check how much space is available going down
			availableYPixels = this.viewSize.Y - topAbsPosY;
		}

		// Calculate the rows available from the (minimum size / available pixels)
		let rows: number = math.floor(availableYPixels / itemAbsSizeY);

		// If there are less rows than context lower rows to contextSize
		if (rows > contextSize) rows = contextSize;

		// There is always one column
		let columns: number = 1;

		// If there is more items then rows available then create columns
		if (rows > 0 && rows < contextSize)
				columns = math.ceil(contextSize / rows);

		// Set the size of MenuBG x based on amount of columns and y based on rows
		this.menuBG.Size = new UDim2(0,columns * itemAbsSizeX,0,rows * itemAbsSizeY);

		// Calculate the right absolute position of the trigger element
		const rightAbsPosX: number = leftAbsPosX + itemAbsSizeX;

		const isSizeOverHalfX: boolean = leftAbsPosX > this.viewSize.X / 2;

		this.menuBG.Position = new UDim2(
			0,
			isSizeOverHalfX ? leftAbsPosX - this.menuBG.AbsoluteSize.X
			: rightAbsPosX + (owner.AbsoluteSize.X - itemAbsSizeX),
			0,
			isSizeOverHalfY ?
			(topAbsPosY + -(this.menuBG.AbsoluteSize.Y - math.ceil(( 1 / this.itemSize.Y) * itemAbsSizeY)))
			: topAbsPosY
		);

		let itemIndex: number = 0;

		// Negate the minimum abs size for first element
		let lastPos: UDim2 = new UDim2(0,0,0,-itemAbsSizeY);

		for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
				for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
					const item: ContextItem = activeContexts[itemIndex];
					// If out of items then break
					if (!item) break;
					
					item.Btn.Size = new UDim2(0,itemAbsSizeX,0,itemAbsSizeY);
					item.Btn.Position = lastPos.add(new UDim2(0,0,0,itemAbsSizeY));
					lastPos = item.Btn.Position;
					itemIndex++;
				}
				lastPos = new UDim2(0,itemAbsSizeX * (columnIndex + 1),0,-itemAbsSizeY);
		}
// #endregion
		// Parent each context item button to the MenuBG
		activeContexts.forEach(c => {
				if (c.Btn.IsA("TextButton")) c.Btn.TextSize = this._itemTextSize!;
				
				c.Btn.Parent = this.menuBG;
		});

		ContextMenu._previousMenu = this;
	}

	/** Goes through each active @see {@link ContextItem} and uses it's text to determine a minimum size fit and will return the minimum fit and assign that to all ContextItem's. */
	GetCommonTextSize(absX: number, absY: number): number {
		let commonSize: number = 80;

		const tl: TextLabel = ContextMenu.textFitLabel;
		tl.TextSize = commonSize;
		tl.Size = new UDim2(0,absX,0,absY);

		for (const item of this.GetActiveContexts()) {
			if (!item.Btn.IsA("TextButton")) continue;

			tl.Text = item.Name;

			while(!tl.TextFits) {
					if (commonSize === 2) break;

					tl.TextSize = commonSize -= 2;
					RunService.Heartbeat.Wait();
			}
			commonSize = tl.TextSize;
		}

		return commonSize - commonSize / 4;
	}

	/**
	 * Gets all the active ContextItems belonging to this ContextMenu.
	 * @returns - An array of ContextItem.
	 */
	GetActiveContexts(): ContextItem[] { return this._contexts.filter(c => c.attributes.up_Active); }

	/**
	 * Adds the given {@link ContextItem} to this {@link ContextMenu}.
	 * @param item - The {@link ContextItem} object to add
	 */
	AddContext(item: ContextItem) {
		this._contexts.push(item);
		this.updateTextSize();
	}

	/**
	 * Removes the given {@link ContextItem} from this ContextMenu.
	 * @param item - The {@link ContextItem} object to remove
	 */
	RemoveContext(item: ContextItem) {
		const index: number = this._contexts.indexOf(item);
		if (index !== -1) this._contexts.remove(index);
		this.updateTextSize();
	}

	/**
	 * Clears all ContextItems from this {@link ContextMenu} internally destroying each ContextItem.
	 */
	Clear() {
		this._contexts.forEach(c => c.instance.Destroy());
		this._contexts.clear();
	}

	/**
	 * @private
	 * Internally calculates the CommonTextSize based on the absolute size of the trigger element and your size modifiers.
	 */
	private updateTextSize() {
		const owner = this.instance;
		if (!t.instanceIsA('TextButton')(owner)) return;

		if (this.Options.textSizingMode === TextSizingMode.MinimumCommon) {
			// The minimum absolute size of each context item on the y axis
			const itemAbsSizeY: number = math.ceil(this.ItemSize.Y * owner.AbsoluteSize.Y);

			// The minimum absolute size of each context item on the x axis
			const itemAbsSizeX: number = math.ceil(this.ItemSize.X * owner.AbsoluteSize.X);

			this._itemTextSize = this.GetCommonTextSize(itemAbsSizeX,itemAbsSizeY);
		}
		else if (this.Options.textSizingMode === TextSizingMode.Scaled)
			this._itemTextSize = this.TextSizeScaler * owner.TextSize;
	}

}


export { Preset_ContextMenu, ContextMenu }