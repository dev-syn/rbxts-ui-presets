import { Component } from '@flamework/components';
import { Button, FW_Attributes } from '../../../typings';
import { PresetTag } from '../PresetTag';
import { UIPreset, UIPresetAttributes, UIPresetDefaultAttributes } from '..';
import { t } from '@rbxts/t';
import UIPresetsService from '../../..';
import { enumKey } from '@rbxts/flamework-meta-utils';
import { $error, $warn } from 'rbxts-transform-debug';
import { ContextMenu } from '../../ui_components/.comps/ContextMenu';
import Object from '@rbxts/object-utils';

// #region TYPES
interface ContextItemStyle {
	BackgroundColor3: Color3;
	TextColor3: Color3;
	AutoButtonColor: Color3;
	BorderMode: Enum.BorderMode;
}

type OpenableUI = ScreenGui | Frame | ScrollingFrame
type ContextItemActionable = Callback | ModuleScript | OpenableUI;
// #endregion

enum ContextItemBtnType {
	TextBtn,
	ImageBtn
}
type vContextItemBtn = keyof typeof ContextItemBtnType;

const DEFAULT_BTN_TYPE: ContextItemBtnType = ContextItemBtnType.TextBtn;

// #region Preset_ContextItem

type Preset_ContextItem = Button;

const tPreset_ContextItem = t.union(t.instanceIsA("TextButton"),t.instanceIsA("ImageButton"));

function createContextItem(
	btnType: ContextItemBtnType = DEFAULT_BTN_TYPE,
	content: string = "N/A"): Preset_ContextItem {
	
	const btn: Button = new Instance(
		btnType === ContextItemBtnType.TextBtn
		? "TextButton" : "ImageButton"
	);

	btn.BackgroundColor3 = Color3.fromRGB(64,64,64);
	btn.AutoButtonColor = true;
	btn.BorderMode = Enum.BorderMode.Middle;

	if (btnType === ContextItemBtnType.TextBtn) {
		const tb = btn as TextButton;
		tb.TextColor3 = Color3.fromRGB(255,255,255);
		tb.Text = content;
	} else {
		const tl = btn as ImageButton;
		tl.Image = content;
	}
	return btn;
}

// #endregion

// #region LOGGING
function LOGGING_assignAction(expectedT: string,gotT: string,assignedAction: AssignableAction) {
	return `Failed to assignAction expected '${expectedT}', got '${gotT}' for ${assignedAction}`
}
// #endregion

// #region Attributes
enum AssignableAction {
	/** Nothing will happen when the {@link ContextItem} is clicked(a default type). */
	NONE = "None",
	/** The assigned function will be called when the {@link ContextItem} is clicked. */
	FUNCTION = "Function",
	/** Toggles the visibility(including Enabled) state to 'true' for either a {@link ScreenGui}, {@link Frame} or a {@link ScrollingFrame} Instance. */
	OPEN_UI = "Open_UI",
	/** Requires the ModuleScript when the {@link ContextItem} is clicked, if it is a function returned it will be called.  */
	RUN_MODULE = "Run_Module"
};
type kAssignableAction = keyof typeof AssignableAction;
const tAssignableAction = t.union(...Object.values(AssignableAction).map(v => t.literal(v)));

interface ContextItemAttributes {
	/**
	 * This property stores whether the {@link ContextItem} should be active,
	 * and whether it should listen for any mouse events.
	 */
	up_Active: boolean;
	/** The text content or an rbxassetid image for this {@link ContextItem}. */
	up_Content: string;
	/** This will be the assigned action of the {@link ContextItem}. */
	upE_AssignableAction: AssignableAction
}

const DEFAULT_CONTEXT_ITEM_ATTRIBUTES: UIPresetAttributes & ContextItemAttributes = {
	...UIPresetDefaultAttributes,
	up_Active: true,
	up_Content: "N/A",
	upE_AssignableAction: AssignableAction.NONE
};

// #endregion
/**
 * ContextItem is the makeup of each item available in the ContextMenu.
 */
@Component({
	tag: PresetTag.ContextItem,
	defaults: DEFAULT_CONTEXT_ITEM_ATTRIBUTES as unknown as FW_Attributes,
	attributes: {
		upE_AssignableAction: tAssignableAction
	}
})
class ContextItem extends UIPreset<
	ContextItemAttributes,
	Preset_ContextItem
> {

	static PresetInstance = () => createContextItem();

	presetType = PresetTag.ContextItem;

// #region PRIVATE_PROP
	/**
	 * @private
	 * The action that this ContextItem will trigger when clicked.
	 */
	private _action?: ContextItemActionable;

	private _assignableAction: AssignableAction = AssignableAction.RUN_MODULE;
	private _values?: Array<unknown>;

	private _buttonType: ContextItemBtnType = DEFAULT_BTN_TYPE;
	private _btnConnection?: RBXScriptConnection;

	/** The {@link ContextMenu} that owns this item. */
	private _owner?: ContextMenu;
// #endregion

	constructor(_uiPresetsService: UIPresetsService) { super(_uiPresetsService); }

	onStart() {
		this.setActive(this.attributes.up_Active);
	}

	override destroy(): void {
		super.destroy();
		if (this._btnConnection?.Connected) this._btnConnection.Disconnect();
	}

	/**
	 * Sets the active state of this ContextItem.
	 * @param active - Whether to set the ContextItem to active or not
	 */
	setActive(_setActive: boolean): void {
		if (_setActive) {
			// Is the item already active?
			if (this.attributes.up_Active) return;
			this.attributes.up_Active = true;

			this._btnConnection = this.instance.MouseButton1Click.Connect(() => this._onClick());
			this.instance.Visible = true;
		} else {
			if (!this.attributes.up_Active) return;
			this.attributes.up_Active = false;

			if (this._btnConnection?.Connected) this._btnConnection.Disconnect();
			this.instance.Visible = false;
		}
	}

	setOwner(menu: ContextMenu): void {
		if (!(menu instanceof ContextMenu)) {
			return $warn(`Invalid type provided for the ContextItem owner. Got ${typeOf(menu)}, expected: 'ContextMenu'`);
		}
		this._owner = menu;
	}

	/**
	 * 
	 * @param action An action is a callback function that will be executed when the {@link ContextItem} is clicked.
	 */
	assignAction(actionType: AssignableAction.FUNCTION, cb: Callback,...values: unknown[]): void;
	assignAction(actionType: AssignableAction.RUN_MODULE,module: ModuleScript): void;
	assignAction(actionType: AssignableAction.OPEN_UI,ui: OpenableUI): void;
	assignAction(actionType: AssignableAction,itemActionable: ContextItemActionable,...values: unknown[]) {
		switch(actionType) {
			case AssignableAction.FUNCTION:
				if (!typeIs(itemActionable,"function")) {
					$warn(LOGGING_assignAction("function",typeof itemActionable,AssignableAction.FUNCTION));
					return;
				}
				this._assignableAction = AssignableAction.FUNCTION;
				this._action = itemActionable;

				// Is there any values to assign to this ContextItem?
				if (values && values.size() > 0) this._values = values;
				break;
			case AssignableAction.RUN_MODULE:
				// Is it not a ModuleScript?
				if (!t.instanceIsA("ModuleScript")(itemActionable)) {
					// Is it not an Instance at all?
					if (!t.Instance(itemActionable)) {
						$warn(LOGGING_assignAction("Instance=ModuleScript",typeof itemActionable,AssignableAction.RUN_MODULE));
					} else {
						// Is it still an Instance but not a ModuleScript?
						$warn(
							`The given action is not a ModuleScript but ${enumKey<typeof AssignableAction,AssignableAction.RUN_MODULE>} is assigned, so the action MUST be a ModuleScript. Got '${itemActionable.ClassName}'`
						);
					}
					return;
				}

				// Safely require the ModuleScript
				try {
					const moduleReturn: unknown = require(itemActionable);
					if (!typeIs(moduleReturn,'function')) {
						warn(`'${enumKey<typeof AssignableAction,AssignableAction.RUN_MODULE>}' only accepts a function as it's return type.`);
						return;
					}
					this._assignableAction = AssignableAction.RUN_MODULE;
					this._action = moduleReturn;
				} catch(err: unknown) {
					$warn(`Something unexpected happened while running ModuleScript at:\n${ {name: itemActionable.Name, path: itemActionable.GetFullName()} }`);
				}
				break;
			case AssignableAction.OPEN_UI:
				if (t.instanceIsA("ScreenGui")(itemActionable)) {
					itemActionable.Enabled = true;
				} else if (t.instanceIsA("Frame")(itemActionable) || t.instanceIsA("ScrollingFrame")(itemActionable)) {
					itemActionable.Visible = true;
				} else {
					// Is it an Instance but not the correct one?
					if (t.Instance(itemActionable)) {
						$warn(LOGGING_assignAction("ScreenGui | Frame | ScrollingFrame",itemActionable.ClassName,AssignableAction.OPEN_UI));
					} else $warn(LOGGING_assignAction("Instance={ScreenGui | Frame | ScrollingFrame}",typeof itemActionable,AssignableAction.OPEN_UI));
					this._assignableAction = AssignableAction.OPEN_UI;
					this._action = itemActionable;
				}
				break;
			default:
				error(`Unknown AssignableAction actionType?`);
		}
	}

// #region PRIVATE_METH
	private _onClick() {
		switch(this._assignableAction) {
			case AssignableAction.FUNCTION:
				if (!this._action) return;

				const action = this._action as Callback;
				if (this._values) action(...this._values);
				else action();
			case AssignableAction.RUN_MODULE:
				if (!this._action) return;
				// Safely require the ModuleScript
				try {
					const moduleReturn: unknown = require(this._action as ModuleScript);
					if (!typeIs(moduleReturn,'function')) {
						warn(`'${enumKey<typeof AssignableAction,AssignableAction.RUN_MODULE>}' only accepts a function as it's return type.`);
						return;
					}
					this._assignableAction = AssignableAction.RUN_MODULE;
					this._action = moduleReturn;
				} catch(err: unknown) {
					$warn(`Something unexpected happened while running ModuleScript at:\n${ {name: itemActionable.Name, path: itemActionable.GetFullName()} }`);
				}
			case AssignableAction.OPEN_UI:
				
		}
	}
// #endregion

}

export { ContextItem, ContextItemStyle, Preset_ContextItem, ContextItemBtnType }