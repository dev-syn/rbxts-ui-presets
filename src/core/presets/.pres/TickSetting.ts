import type UIPresetsService from '../../..';
import { Component } from '@flamework/components';
import { OnStart } from '@flamework/core';
import { PresetTag } from '../PresetTag';
import { t } from '@rbxts/t';
import { UIPreset, UIPresetAttributes, UIPresetDefaultAttributes } from '..';
import { FW_Attributes } from '../../../typings';

/**
 * The TickSetting type that this setting will contain either a Check for a checkmark or a cross as a mark.
 * @enum
 */
enum TickSettingType {
	/** This TickSetting will be a cross image. (X) */
	Cross = "Cross",
	/** This TickSetting will be a checkmark image. (✔️)*/
	Check = "Check"
}
type vTickSettingType = keyof typeof TickSettingType;
const tTickSettingType = t.intersection(t.string,t.union(t.match("Cross"),t.match("Check")));

// #region Preset_TickSetting
type Preset_TickSetting = Frame & {
	/** The TextLabel of this setting AKA {@link TickSetting.Name}. */
	Label: TextLabel,
	/** The Button of this setting. */
	TickBtn: ImageButton
}
const tPreset_TickSetting = t.intersection(t.instanceIsA("Frame"),t.children({
	Label: t.instanceIsA("TextLabel"),
	TickBtn: t.instanceIsA("ImageButton")
}));
// #endregion

const DEFAULT_TEXT = "Unnamed setting.";
const DEFAULT_TICKED = false;

/** The default enum option {@link TickSettingType.Cross}. */
const DEFAULT_IMAGE_TYPE: TickSettingType = TickSettingType.Cross;

const IMAGE_CROSS = "rbxassetid://6031094678";
const IMAGE_CHECK = "rbxassetid://6031094667";

const ContentProvider: ContentProvider = game.GetService("ContentProvider");
function createTickSetting(
	text: string = DEFAULT_TEXT,
	defaultTicked: boolean = DEFAULT_TICKED
): Preset_TickSetting {
	const frame: Frame = new Instance("Frame");
	frame.Name = `TickSetting-${text}`;
	frame.Size = new UDim2(1,0,0.1,0);

	const label: TextLabel = new Instance("TextLabel");
	label.Name = `Label`;
	label.Text = text;
	label.Size = new UDim2(0.4,0,1,0);
	label.TextScaled = true;
	label.Parent = frame;

	const textConstraint: UITextSizeConstraint = new Instance("UITextSizeConstraint");
	textConstraint.MaxTextSize = 20;
	textConstraint.MinTextSize = 10;
	textConstraint.Parent = label;

	const btn: ImageButton = new Instance("ImageButton");
	btn.Name = `TickBtn`;
	btn.ImageTransparency = defaultTicked ? 0 : 1;
	btn.Size = new UDim2(0.6,0,1,0);
	btn.Position = new UDim2(0.4,0,0,0);
	btn.Image = (DEFAULT_IMAGE_TYPE === TickSettingType.Cross ? IMAGE_CROSS : IMAGE_CHECK);
	btn.Parent = frame;

	const aspectRatio: UIAspectRatioConstraint = new Instance("UIAspectRatioConstraint");
	aspectRatio.DominantAxis = Enum.DominantAxis.Height;
	aspectRatio.AspectRatio = 1;
	aspectRatio.Parent = btn;

	return frame as Preset_TickSetting;
}

// #region ATTRIBUTES
interface TickSettingAttributes {
	up_isTicked: boolean,
	up_text: string,
	up_tickType: vTickSettingType
}

const DEFAULT_TICK_SETTING_ATTRIBUTES: UIPresetAttributes & TickSettingAttributes
= {
	...UIPresetDefaultAttributes,
	up_isTicked: DEFAULT_TICKED,
	up_text: DEFAULT_TEXT,
	up_tickType: DEFAULT_IMAGE_TYPE
};

// #endregion

@Component({
	tag: PresetTag.TickSetting,
	attributes: {
		// Ensures a string which is a 'Cross' or 'Check'
		up_tickType: tTickSettingType
	},
	defaults: DEFAULT_TICK_SETTING_ATTRIBUTES as unknown as FW_Attributes,
	predicate: (inst: Instance) => tPreset_TickSetting(inst)
})
/**
 * This is a Setting preset that creates a label and a button which as of now can be a croos or a check image.
 */
class TickSetting extends UIPreset<
TickSettingAttributes,
Preset_TickSetting
> implements OnStart {

	static PresetInstance = () => createTickSetting();

	static {
			// Preload these image ids
			Promise.defer(() => ContentProvider.PreloadAsync([IMAGE_CROSS,IMAGE_CHECK]));
	}

	Type = PresetTag.TickSetting;

	/** The text of this setting. */
	Text: string = DEFAULT_TEXT;

	/** A condition property that checks if this TickSetting is ticked otherwise false. */
	IsTicked: boolean = DEFAULT_TICKED;

	/**
	 * The type of this TickSetting
	 * @private
	 * @see {@link TickSettingType}
	 */
	private _tickType: TickSettingType = DEFAULT_IMAGE_TYPE;

	constructor(_uiPresetsService: UIPresetsService) {
		super(_uiPresetsService);
	}

	onStart(): void {
	
		this.maid.GiveTask(
			this.instance.TickBtn.MouseButton1Click.Connect(() => {
				const isTicked: boolean = !this.IsTicked;
				this.instance.TickBtn.ImageTransparency = isTicked ? 0 : 1;
				this.IsTicked = isTicked;
			})
		);

		this.assignAttributes();
	}

	override assignAttributes(): void {
		super.assignAttributes();
		this.attributes.up_isTicked = this.IsTicked;
		
		// Listen for attribute changes

		this.maid.GiveTask(
			this.onAttributeChanged("up_isTicked",(_isTicked: boolean) => this._setRawTicked(_isTicked))
		);

		this.maid.GiveTask(
			this.onAttributeChanged("up_text",(text) => this._setRawText(text))
		);

		this.maid.GiveTask(
			this.onAttributeChanged("up_tickType",(_tickType) => this._setRawTickType(TickSettingType[_tickType]))
		);
	}

// #region setText
	setText(text: string) {
		if (!t.type("string")(text)) {
			warn(`Unexpected value of 'text', expected 'string' in {TickSetting.setText} with: ${text}`);
			return;
		}
		this._setRawText(text);
		this.attributes.up_text = text;
	}

	private _setRawText(text: string) {
		if (text === "") return;

		this.Text = text;
		this.instance.Label.Text = text;
	}
// #endregion

// #region setTicked
	setTicked(v: boolean): void {
		if (!t.type("boolean")(v)) {
			warn(`Unexpected value of 'v', expected 'boolean' in {TickSetting.setTicked} with: ${v}`);
			return;
		}
		this._setRawTicked(v);
		this.attributes.up_isTicked = v;
	}

	private _setRawTicked(v: boolean): void {
		this.IsTicked = v;
		this.instance.TickBtn.ImageTransparency = v ? 0 : 1;
	}
// #endregion

// #region setTickType
	setTickType(_type: TickSettingType) {
		switch (_type) {
			case TickSettingType.Cross:
				this._tickType = _type;
				this.attributes.up_tickType = _type;
				this.instance.TickBtn.Image = IMAGE_CROSS;
				break;
			case TickSettingType.Check:
				this._tickType = _type;
				this.attributes.up_tickType = _type;
				this.instance.TickBtn.Image = IMAGE_CHECK;
				break;
			default:
				warn(`Unknown tick type '${_type}', no changes were made.`);
				break;
		}
	}

	private _setRawTickType(_type: TickSettingType) {
		switch (_type) {
			case TickSettingType.Cross:
				this._tickType = _type;
				this.instance.TickBtn.Image = IMAGE_CROSS;
				break;
			case TickSettingType.Check:
				this._tickType = _type;
				this.instance.TickBtn.Image = IMAGE_CHECK;
				break;
			default:
				warn(`Unknown tick type '${_type}', no changes were made.`);
				break;
		}
	}
// #endregion

}

export { TickSetting, TickSettingType, Preset_TickSetting };