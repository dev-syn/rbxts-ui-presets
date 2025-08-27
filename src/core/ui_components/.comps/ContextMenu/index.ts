import { t } from '@rbxts/t';
import { OnStart } from '@flamework/core';
import type UIPresetsService from '../../../..';
import { Button, FW_Attributes } from '../../../../typings';
import { ContextItem, ContextItemBtnType } from '../../../presets/.pres/ContextItem';
import { Configurable, SchemaToType } from '@rbxts/syn-utils';
import { UIComponent, UIComponentAttributes, UIComponentDefaultAttributes } from '../..';
import { ComponentTag } from '../../ComponentTag';
import { ContentProvider, RunService, TextService } from '@rbxts/services';
import Object from '@rbxts/object-utils';
import { Component } from '@flamework/components';

// #region Preset_ContextMenu
type Preset_ContextMenu = Frame & {}
const tPreset_ContextMenu = t.intersection(t.instanceIsA("Frame"),t.children({}));

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
 * The TextSizingMode enum contains modes that influence text sizing of the {@link ContextItem} instances.
 */
enum TextSizingMode {
	/**
	 * This sizing mode goes through all the ContextItem text properties and
	 * finds the lowest text size where all items would fit.
	 * This mode has a built-in fixed padding on those text sizes.
	 */
	MinimumCommon = "MinimumCommon",
	/**
	 * This mode uses the {@link ContextMenu.textSizeScaler} property which is a scale modifier
	 * that will be influenced on this components owning {@link Instance}.
	 * This mode will only work with {@link TextButton} owners though.
	 */
	Scaled = "Scaled"
}
const tTextSizingMode = t.union(...Object.values(TextSizingMode).map(v => t.literal(v)));

// #endregion

interface MenuStyle {
	/** The Font that will be used for each {@link ContextItem} that belongs to this menu. */
	font: Font
}

/** The static shared options of the {@link ContextMenu} */
interface SharedMenuOptions {
	/** Whether only one or many context menu objects can be shown at a time. */
	onlySingleContext: boolean;
	/** The default style for all {@link ContextMenu} objects. */
	style: MenuStyle;
}

/**
 * These are the options that can be configured to {@link ContextMenu} changing the default behavior.
 */
interface MenuOptions {
	/** This only affects {@link ContextItem} components attached to {@link TextButton} instances. */
	textSizingMode: TextSizingMode;
	/** The style that belongs to this {@link ContextMenu} */
	style: MenuStyle
}

// #region INIT_COMPONENT
const ContextMenuSchema = {
	menuBG: tPreset_ContextMenu
};

interface ContextMenuAttributes {
	/** A Vector2 which contains the scale modifier of the {@link ContextMenu.} */
	up_ItemSize: Vector2,
	/** A scaler modifier number that will affect the {@link ContextMenu.TextSize} of each  */
	up_TextSizeScalar: number
}

const DEFAULT_CONTEXT_MENU_ATTRIBUTES: UIComponentAttributes & ContextMenuAttributes = {
	...UIComponentDefaultAttributes,
	up_ItemSize: new Vector2(1,1),
	up_TextSizeScalar: 1
};

// #endregion
@Component({
	tag: ComponentTag.ContextMenu,
	defaults: DEFAULT_CONTEXT_MENU_ATTRIBUTES as unknown as FW_Attributes
})
@Configurable({
	schema: ContextMenuSchema
})
/**
 * This is a component which should 
 */
class ContextMenu extends UIComponent<
	ContextMenuAttributes,
	Button 
> implements OnStart {

// #region STATIC
	/** The {@link ScreenGui} Instance that will hold all the ContextMenu objects. */
	static ContextMenuUI: ScreenGui = new Instance("ScreenGui");

	static SharedOptions: SharedMenuOptions = {
		onlySingleContext: true,
		style: {
			font: new Font("rbxasset://fonts/families/Roboto.json")
		}
	}

	/** The previous or current ContentMenu that is showed on screen. */
	private static _LastActiveMenu?: ContextMenu = undefined;

	static {
		ContentProvider.PreloadAsync([ContextMenu.SharedOptions.style.font as unknown as Instance])
	}
// #endregion

	/** A decorator assigned property storing this components configuration. */
	configuration!: SchemaToType<typeof ContextMenuSchema>;
	componentType = ComponentTag.ContextMenu;
	options: MenuOptions = {
			textSizingMode: TextSizingMode.MinimumCommon,
			style: {
				font: new Font("rbxasset://fonts/families/Roboto.json")
			}
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
// #endregion

	/**
	 * Constructs a new ContextMenu
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

		// When the HighestDisplayOrder is changed update the ContextMenuSG DisplayOrder
		_uiPresetsService.OnUIOrderChanged.Connect((newOrder: number) => ContextMenu.ContextMenuUI.DisplayOrder = newOrder + 1);
	}

	onStart(): void {
		// Updates the text size of these context items that are TextButton elements
		this.updateTextSize();

		this.instance.Visible = true;

		// When the trigger element is right clicked draw and display the context menu
		this.instance.MouseButton2Click.Connect(() => {
			if (ContextMenu.OnlySingleContext && ContextMenu._LastActiveMenu && ContextMenu._LastActiveMenu !== this)
				
				ContextMenu._LastActiveMenu.configuration.menuBG.Parent = undefined;
			if (!this.configuration.menuBG.Parent) {
				this.Draw();
				this.configuration.menuBG.Parent = ContextMenu.ContextMenuUI;
			} else {
				this.configuration.menuBG.Parent = undefined;
				if (ContextMenu._LastActiveMenu === this) ContextMenu._LastActiveMenu = undefined;
			}
		});
		
		// When the trigger element's position is changed, redraw the context menu.
		this.maid.GiveTask(
			this.instance.GetPropertyChangedSignal("Position").Connect(() => this.Draw())
		);
	}

	/**
	 * Draws the sizing and positioning for both the ContextMenu and ContextItems that are active.
	 */
	Draw(): void {

		if (!this._itemTextSize) this.updateTextSize();

		// Get the updated screen size
		this._viewSize = ContextMenu.ContextMenuUI.AbsoluteSize;

		const activeContexts: ContextItem[] = this.GetActiveContexts();
		const contextSize: number = activeContexts.size();

		// If no context; don't draw anything
		if (contextSize === 0) return;

		const itemSize: Vector2 = this.attributes.up_ItemSize;
		// If minItemSizeX was set to zero, assign it 1
		if (itemSize.X === 0) this.attributes.up_ItemSize = itemSize.add(new Vector2(1,itemSize.Y));
		// If minItemSizeY was set to zero, assign it 1
		if (itemSize.Y === 0) this.attributes.up_ItemSize = itemSize.add(new Vector2(itemSize.X,1));

		const menuBG = this.configuration.menuBG;
		const owner: Button = this.instance;

		const absSizeY: number = owner.AbsoluteSize.Y;
		const absPosY: number = owner.AbsolutePosition.Y;

		// The minimum absolute size of each context item
		const itemAbsSizeY: number = math.ceil(itemSize.Y * absSizeY);
		// Get the used amount of space on the x axis in pixels of each context item
		const itemAbsSizeX: number = math.ceil(itemSize.X * owner.AbsoluteSize.X);

		const yAnchor: number = owner.AnchorPoint.Y;
		
		// Calculate the top left absolute y position of the trigger element
		const topAbsPosY: number = math.ceil(absPosY - absSizeY * yAnchor);

		// Calculate the left absolute x position of the trigger element
		const leftAbsPosX: number = owner.AbsolutePosition.X - math.ceil(owner.AbsoluteSize.X * owner.AnchorPoint.X);

// #region Row_Columns
		// Is the trigger element positioned over half the y screen
		const isSizeOverHalfY: boolean = absPosY > this._viewSize.Y / 2;

		let availableYPixels: number;
		if (isSizeOverHalfY) {
			// Prioritize pushing the context menu upwards before more columns
			availableYPixels = topAbsPosY;
		} else {
			// Check how much space is available going down
			availableYPixels = this._viewSize.Y - topAbsPosY;
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
		menuBG.Size = new UDim2(0,columns * itemAbsSizeX,0,rows * itemAbsSizeY);

		// Calculate the right absolute position of the trigger element
		const rightAbsPosX: number = leftAbsPosX + itemAbsSizeX;

		const isSizeOverHalfX: boolean = leftAbsPosX > this._viewSize.X / 2;

		menuBG.Position = new UDim2(
			0,
			isSizeOverHalfX ? leftAbsPosX - menuBG.AbsoluteSize.X
			: rightAbsPosX + (owner.AbsoluteSize.X - itemAbsSizeX),
			0,
			isSizeOverHalfY ?
			(topAbsPosY + -(menuBG.AbsoluteSize.Y - math.ceil(( 1 / this._viewSize.Y) * itemAbsSizeY)))
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
					
					item.instance.Size = new UDim2(0,itemAbsSizeX,0,itemAbsSizeY);
					item.instance.Position = lastPos.add(new UDim2(0,0,0,itemAbsSizeY));
					lastPos = item.instance.Position;
					itemIndex++;
				}
				lastPos = new UDim2(0,itemAbsSizeX * (columnIndex + 1),0,-itemAbsSizeY);
		}
// #endregion
		// Parent each context item button to the MenuBG
		activeContexts.forEach(c => {
				if (c.getButtonType() === ContextItemBtnType.TextBtn) (c.instance as TextButton).TextSize = this._itemTextSize!;
				
				c.instance.Parent = this.configuration.menuBG;
		});

		ContextMenu._LastActiveMenu = this;
	}

	/**
	 * Goes through each active {@link ContextItem} and uses it's text to determine
	 * a minimum size fit and will return the minimum fit and assign that to all {@link ContextItem}
	 */
	GetCommonTextSize(absX: number, absY: number): number {
		let commonSize: number = 80;

		const tl: TextLabel;
		tl.TextSize = commonSize;
		tl.Size = new UDim2(0,absX,0,absY);

		for (const item of this.GetActiveContexts()) {
			if (item.getButtonType() !== ContextItemBtnType.TextBtn) continue;

			const font = new Font(Enum.Font.Gotham.Name);

			const textParams = new Instance("GetTextBoundsParams");
			textParams.Text = item.attributes.up_Content;
			textParams.Font = 
			TextService.GetTextBoundsAsync()

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

		if (this.options.textSizingMode === TextSizingMode.MinimumCommon) {
			const itemSize = this.attributes.up_ItemSize;

			// The minimum absolute size of each context item on the y axis
			const itemAbsSizeY: number = math.ceil(itemSize.Y * owner.AbsoluteSize.Y);

			// The minimum absolute size of each context item on the x axis
			const itemAbsSizeX: number = math.ceil(itemSize.X * owner.AbsoluteSize.X);

			this._itemTextSize = this.GetCommonTextSize(itemAbsSizeX,itemAbsSizeY);
		}
		else if (this.options.textSizingMode === TextSizingMode.Scaled)
			this._itemTextSize = this.attributes.up_TextSizeScalar * owner.TextSize;
	}

}


export { Preset_ContextMenu, ContextMenu }