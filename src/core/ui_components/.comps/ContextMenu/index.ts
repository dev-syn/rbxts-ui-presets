import { t } from '@rbxts/t';
import UIComponent from '../../index';
import type { UIComponents } from '../../../../typings/components'
import { Component } from '@flamework/components';
import type UIPresetsService from '../../../..';
import { OnStart } from '@flamework/core';
import { UUID } from '../../../../typings';
import ComponentTag from '../../ComponentTag';

const RunService: RunService = game.GetService("RunService");

type Button = TextButton | ImageButton;

enum AssignableAction {
	NONE = "NONE",
	CUSTOM = "CUSTOM",
	OPEN_UI = "OPEN_UI",
	OPEN_MODULE = "OPEN_MODULE"
}

interface ContextItemStyle {
	BackgroundColor3: Color3;
	TextColor3: Color3;
	AutoButtonColor: Color3;
	BorderMode: Enum.BorderMode;
}

/**
 * ContextItem is the makeup of each item available in the ContextMenu.
 */
class ContextItem {
    
	/** The name of this ContextItem. */
	Name: string;
	/** The Btn that triggers this items _action. */
	Btn: TextButton = new Instance("TextButton");
	/**
	 * This property stores whether the ContextItem should be active,
	 * and whether it shouldlisten for any mouse events.
	 */
	Active: boolean = true;

// #region PRIVATE_MEMBERS
	/**
	 * @private
	 * The Btn connection to trigger the action.
	 */
	private _connection?: RBXScriptConnection;
	/**
	 * @private
	 * The action that this ContextItem will trigger when clicked.
	 */
	private _action?: Callback;
	private _assignableAction: AssignableAction = AssignableAction.NONE;
	private _values: Array<unknown> = [];
// #endregion

	/**
	 * Constructs a new ContextItem object.
	 * @param Name - The Name of this ContextItem
	 * @param action - The action of this ContextItem
	 */
	constructor(name: string,action?: Callback) {
		this.Name = name;
		this._action = action;

		this.Btn.Name = `ContextItem-${this.Name}`;
		this.Btn.BackgroundColor3 = Color3.fromRGB(64,64,64);
		this.Btn.TextColor3 = Color3.fromRGB(255,255,255);
		this.Btn.AutoButtonColor = true;
		this.Btn.Text = this.Name;
		this.Btn.BorderMode = Enum.BorderMode.Middle;

		if (action) this._connection = this.Btn.MouseButton1Click.Connect(() => this._action!());

		this.Btn.Visible = true;
	}

	/**
	 * Sets the active state of this ContextItem.
	 * @param active - Whether to set the ContextItem to active or not
	 */
	SetActive(active: boolean): void {
		if (active) {
			// If there is already a connection then we are already active
			if (this.Active || this._connection) return;

			if (!this._connection)
				this.Btn.MouseButton1Click.Connect(() => {
					switch(this._assignableAction) {
						case AssignableAction.OPEN_UI:
								
						case AssignableAction.OPEN_MODULE:

						case AssignableAction.CUSTOM:
							if (this._action) this._action();
					}
				});

			this.Btn.Visible = true;
			this.Active = true;
		} else {
			if (!this.Active) return;

			if (this._connection) {
				this._connection.Disconnect();
				this._connection = undefined;
			}

			this.Btn.Visible = false;
			this.Active = false;
		}
	}

	/**
	 * 
	 * @param action An action is a callback function hat will be executed when the ContextItem is clicked.
	 */
	AssignAction(actionType: AssignableAction, ...values: unknown[]): void;
	AssignAction(actionType: AssignableAction.CUSTOM, cb: Callback): void;
	AssignAction(actionType: AssignableAction.NONE): void;
	AssignAction(actionType: AssignableAction,actionOrValues?: Callback | unknown[]) {
		switch(actionType) {
			case AssignableAction.NONE:
				this._assignableAction = AssignableAction.NONE;
				this._action = undefined;
				break;
			case AssignableAction.CUSTOM:
				if (type(actionOrValues) !== "function")
						error("The action callback is missing for the custom action type.");
				this._assignableAction = AssignableAction.CUSTOM;
				this._action = actionOrValues as Callback;
				break;
			case AssignableAction.OPEN_UI:
			case AssignableAction.OPEN_MODULE:
			default:
				error("Invalid assignable action type.");
		}
	}

	/** Destroys this ContextItem. */
	Destroy(): void {
		this.Btn.Destroy();
		this._connection = undefined;
	}
}

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

/**
 * @interface
 * These are the options that can be passed to ContextMenu to change default ContextMenu behavior.
 */
interface MenuOptions {
	/** textSizingMode only affects TextButton Owners. */
	textSizingMode: TextSizingMode;
}

@Component({
	tag: ComponentTag.ContextMenu
})
class ContextMenu extends UIComponent<{},Button> implements OnStart {
// #region CLASS_STATIC
	static contextMenuSG: ScreenGui = new Instance("ScreenGui");
	static textFitLabel: TextLabel = new Instance("TextLabel");
	
	/** Whether only one context menu can be showed at a time. */
	static onlySingleContext: boolean = true;

	/** The previous or current ContentMenu that is showed on screen. */
	private static _previousMenu?: ContextMenu = undefined;

// #endregion

	/** {@inheritDoc 	UIComponent} */
	Type = "ContextMenu" as UIComponents;

	/** The ContextMenu background Frame Instance. */
	menuBG: Frame = new Instance("Frame");

	/** A Vector2 which contains the scale modifier of the @see {@link ContextMenu.Owner} */
	itemSize: Vector2 = new Vector2(1,1);

	/** A scaler modifier number that will affect the @see {@link ContextMenu.Owner.TextSize} \* @see {@link textSizeScaler} */
	textSizeScaler: number = 1;

	options: MenuOptions = {
			textSizingMode: TextSizingMode.MinimumCommon
	};

// #region CLASS_PRIVATE
	/**
	 * @private
	 * Stores the common text size of each active context item.
	 */
	private _itemTextSize?: number;
	/**
	 * @private
	 * Stores the absolute ViewSize of the clients screen.
	 */
	private viewSize?: Vector2;
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

		if (!ContextMenu.contextMenuSG.Parent) {
			ContextMenu.contextMenuSG.Name = "UIPresets_ContextMenu";
			ContextMenu.contextMenuSG.DisplayOrder = _uiPresetsService.HighestUIOrder + 1;
			ContextMenu.contextMenuSG.ResetOnSpawn = false;

			ContextMenu.contextMenuSG.Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");
		}

		if (!ContextMenu.textFitLabel.Parent) {
			ContextMenu.textFitLabel.Position = new UDim2(2,0,2,0);
			ContextMenu.textFitLabel.Parent = ContextMenu.contextMenuSG;
		}

		// When the HighestDisplayOrder is changed update the ContextMenuSG DisplayOrder
		_uiPresetsService.OnUIOrderChanged.Connect((newOrder: number) => ContextMenu.contextMenuSG.DisplayOrder = newOrder + 1);
	}
	
	onStart(): void {
		// Updates the text size of these context items that are TextButton elements
			this.updateTextSize();

			this.menuBG.Name = `ContextMenu-${this.instance.Name}`;
			this.menuBG.BackgroundColor3 = Color3.fromRGB(64,64,64);
			this.menuBG.Visible = true;

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

// #region CLASS_OVERRIDE
	/**
	 * Destroys this ContextMenu object.
	 */
	override Destroy(): void {
			// Destroy each ContextItem
			this._contexts.forEach(item => item.Destroy());

			// Disconnect each connection of this ContextMenu
			this._connections.forEach(conn => conn.Disconnect());
			this._connections = [];

			this.menuBG.Destroy();
			this.menuBG.Parent = undefined;
			if (ContextMenu._previousMenu === this) ContextMenu._previousMenu = undefined;
			super.Destroy();
	}
// #endregion

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

// #region ROWS_COLUMNS

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
	GetActiveContexts(): ContextItem[] { return this._contexts.filter(c => c.Active); }

	/**
	 * Adds the given ContextItem to this ContextMenu.
	 * @param context - The ContextItem object to add
	 */
	AddContext(context: ContextItem) {
		this._contexts.push(context);
		this.updateTextSize();
	}

	/**
	 * Removes the given ContextItem from this ContextMenu.
	 * @param context - The ContextItem object to remove
	 */
	RemoveContext(context: ContextItem) {
		const index: number = this._contexts.indexOf(context);
		if (index !== -1) this._contexts.remove(index);
		this.updateTextSize();
	}

	/**
	 * Clears all ContextItems from this ContextMenu internally destroying each ContextItem.
	 */
	Clear() {
		this._contexts.forEach(c => c.Destroy());
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
			// The minimum absolute size of each context item on the y axis
			const itemAbsSizeY: number = math.ceil(this.itemSize.Y * owner.AbsoluteSize.Y);

			// The minimum absolute size of each context item on the x axis
			const itemAbsSizeX: number = math.ceil(this.itemSize.X * owner.AbsoluteSize.X);

			this._itemTextSize = this.GetCommonTextSize(itemAbsSizeX,itemAbsSizeY);
		}
		else if (this.options.textSizingMode === TextSizingMode.Scaled)
			this._itemTextSize = this.textSizeScaler * owner.TextSize;
	}
}

export { ContextMenu, ContextItem, Button, TextSizingMode, MenuOptions };