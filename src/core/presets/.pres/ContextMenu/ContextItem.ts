import { Component } from '@flamework/components';
import { Button, FW_Attributes } from '../../../../typings';
import { PresetTag } from '../../PresetTag';
import { UIPreset, UIPresetAttributes, UIPresetDefaultAttributes } from '../..';
import { t } from '@rbxts/t';
import UIPresetsService from '../../../..';
import { enumKey } from '@rbxts/flamework-meta-utils';

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

const tPreset_ContextItem = t.intersection(t.union(t.instanceIsA("TextButton"),t.instanceIsA("ImageButton")));

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

enum AssignableAction {
	/** The assigned function will be called when the {@link ContextItem} is clicked. */
	FUNCTION,
	/** Toggles the visibility state to 'true' for either a {@link ScreenGui}, {@link Frame} or a {@link ScrollingFrame} Instance.*/
	OPEN_UI,
	/** Requires the ModuleScript when the {@link ContextItem}  */
	OPEN_MODULE
};

// #region Attributes
interface ContextItemAttributes {
	/**
	 * This property stores whether the ContextItem should be active,
	 * and whether it shouldlisten for any mouse events.
	 */
	up_Active: boolean;
	/** The text content or an rbxassetid image for this {@link ContextItem}. */
	up_Content: string;
}

const DEFAULT_CONTEXT_ITEM_ATTRIBUTES: UIPresetAttributes & ContextItemAttributes = {
	...UIPresetDefaultAttributes,
	/** {@see ContextItemAttributes.up_Active} */
	up_Active: true,
	/** {@see ContextItemAttributes.up_Content} */
	up_Content: "N/A"
};

// #endregion

// #region LOGGING
function LOGGING_assignAction(expectedT: string,gotT: string,assignedAction: AssignableAction) {
	return `Failed to assignAction expected '${expectedT}', got '${gotT}' for ${AssignableAction[assignedAction]}`
}
// #endregion

/**
 * ContextItem is the makeup of each item available in the ContextMenu.
 */
@Component({
	tag: PresetTag.ContextItem,
	defaults: DEFAULT_CONTEXT_ITEM_ATTRIBUTES as unknown as FW_Attributes
})
class ContextItem extends UIPreset<
	ContextItemAttributes,
	Preset_ContextItem
> {

	static PresetInstance = () => createContextItem();

	Type = PresetTag.ContextItem;

// #region PRIVATE_PROP
	/**
	 * @private
	 * The action that this ContextItem will trigger when clicked.
	 */
	private _action?: Callback;

	private _assignableAction: AssignableAction = AssignableAction.NONE;
	private _values?: Array<unknown>;

	private _buttonType: ContextItemBtnType = DEFAULT_BTN_TYPE;
	private _btnConnection?: RBXScriptConnection;
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

	/**
	 * 
	 * @param action An action is a callback function hat will be executed when the ContextItem is clicked.
	 */
	assignAction(actionType: AssignableAction.FUNCTION, cb: Callback,...values: unknown[]): void;
	assignAction(actionType: AssignableAction.OPEN_MODULE,module: ModuleScript): void;
	assignAction(actionType: AssignableAction.OPEN_UI,ui: OpenableUI): void;
	assignAction(actionType: AssignableAction,action: ContextItemActionable,...values: unknown[]) {
		switch(actionType) {
			case AssignableAction.FUNCTION:
				if (!typeIs(action,"function")) {
					warn(`Failed to assignAction expected '${"function"}', got '${action}' for AssignableAction.FUNCTION`)
				}
				this._assignableAction = AssignableAction.FUNCTION;
				this._action = undefined;
				break;
			case AssignableAction.OPEN_MODULE:

			case AssignableAction.OPEN_UI:

			default:
				error("Invalid assignable action type.");
		}
	}

// #region PRIVATE_METH
	private _onClick() {
		switch(this._assignableAction) {
			case AssignableAction.OPEN_UI:
					
			case AssignableAction.OPEN_MODULE:

			case AssignableAction.CUSTOM:
				if (this._action) this._action();
		}
	}
// #endregion

}

export { ContextItem, ContextItemStyle, Preset_ContextItem, ContextItemBtnType }