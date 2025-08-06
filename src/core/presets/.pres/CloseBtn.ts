import { Component } from '@flamework/components';
import { t } from '@rbxts/t';
import { OnStart } from '@flamework/core';
import type UIPresetsService from '../../..';
import { PresetTag } from '../PresetTag';
import { UIPreset, UIPresetAttributes, UIPresetDefaultAttributes } from '..';
import { FW_Attributes } from '../../../typings';

// #region Preset_CloseBtn

/**
 * The type of the instance hierarchy and what the PresetInstance is. 
 */
type Preset_CloseBtn = ImageButton & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Tint: Frame;
}

const tPreset_CloseBtn = t.intersection(t.instanceIsA("ImageButton"),t.children({
	UIAspectRatioConstraint: t.instanceIsA("UIAspectRatioConstraint"),
	Tint: t.instanceIsA("Frame")
}));

const DEFAULT_TINT: Color3 = Color3.fromRGB(255,0,0);
function createCloseButton(): Preset_CloseBtn {
	const CloseBtn = new Instance("ImageButton");
	CloseBtn.AnchorPoint = new Vector2(1, 0);
	CloseBtn.AutoButtonColor = false;
	CloseBtn.BackgroundColor3 = Color3.fromRGB(66, 66, 66);
	CloseBtn.BorderSizePixel = 0;
	CloseBtn.Image = "http://www.roblox.com/asset/?id=6031094678";
	CloseBtn.LayoutOrder = -1;
	CloseBtn.Name = "CloseBtn";
	CloseBtn.Position = new UDim2(1 ,0, 0, 0);
	CloseBtn.ScaleType = Enum.ScaleType.Fit;
	CloseBtn.Size = new UDim2(0, 0, 0.6, 0);
	CloseBtn.ZIndex = -1;

	const UIAspectRatioConstraint = new Instance("UIAspectRatioConstraint");
	UIAspectRatioConstraint.AspectType = Enum.AspectType.ScaleWithParentSize;
	UIAspectRatioConstraint.DominantAxis = Enum.DominantAxis.Height;
	UIAspectRatioConstraint.Parent = CloseBtn;

	const Tint = new Instance("Frame");
	Tint.BackgroundColor3 = DEFAULT_TINT;
	Tint.BackgroundTransparency = 0.8;
	Tint.BorderSizePixel = 0;
	Tint.Name = "Tint";
	Tint.Size = new UDim2(1, 0, 1, 0);
	Tint.Visible = false;
	Tint.Parent = CloseBtn;

	return CloseBtn as Preset_CloseBtn;
}

// #endregion

// #region ATTRIBUTES
/**
 * The attributes for the CloseBtn preset
 */
interface CloseBtnAttributes {
	/** Whether this button will show a tint when hovered. */
	TintEnabled: boolean;
	/** The color of the tint which is a Color3 */
	TintColor: Color3;
}

const DEFAULT_CLOSE_BTN_ATTRIBUTES: UIPresetAttributes & CloseBtnAttributes
= {
	...UIPresetDefaultAttributes,
	TintEnabled: true,
	TintColor: DEFAULT_TINT
};
// #endregion

/**
 * This is the close button preset, it it a ImageButton that defaults to an 'X' cross image with a default
 * 'Red' tint, this can be overridden inside {@link PresetsData.Attributes}, see {@link CloseBtnAttributes}
 * for this presets attributes.
 */
@Component({
	tag: PresetTag.CloseBtn,
	defaults: DEFAULT_CLOSE_BTN_ATTRIBUTES as unknown as FW_Attributes,
	// Only allow attaching instances that match the same structure of the CloseBtn preset.
	predicate: (inst: Instance) => tPreset_CloseBtn(inst)
})
class CloseBtn extends UIPreset<
	CloseBtnAttributes,
	Preset_CloseBtn
> implements OnStart {

	static PresetInstance = () => createCloseButton();
	/** @inheritDoc */
	Type = PresetTag.CloseBtn;

	/** A reference to the Frame that is for the CloseBtn tint. */
	private _tintFrame!: Frame;

	/**
	 * Constructs a new close button preset.
	 */
	constructor(_uiPresetsService: UIPresetsService) {
		super(_uiPresetsService);
	}

	onStart(): void {
		this._tintFrame = this.instance.WaitForChild("Tint") as Frame;
		this.assignAttributes();
	}

}

export { CloseBtn, Preset_CloseBtn };