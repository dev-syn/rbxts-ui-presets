import type { Presets } from 'typings/presets';
import { Component } from '@flamework/components';
import { t } from '@rbxts/t';
import { OnStart } from '@flamework/core';
import { Preset } from '..';
import { UUID } from '../../../typings';
import type UIPresetsService from '../../..';
import PresetTag from '../PresetTag';

// #region Preset_CloseBtn
	type Preset_CloseBtn = ImageButton & {
		UIAspectRatioConstraint: UIAspectRatioConstraint;
		Tint: Frame;
	}
	const t_Preset_CloseBtn = t.intersection(t.instanceIsA("ImageButton"),t.children({
		UIAspectRatioConstraint: t.instanceIsA("UIAspectRatioConstraint"),
		Tint: t.instanceIsA("Frame")
	}));
// #endregion

enum ECloseBtnAttributes {
	TintEnabled = "TintEnabled",
	TintColor = "TintColor"
}

/**
 * The attributes that belong to preset
 */
interface CloseBtnAttributes {
	/** Whether this button will show a tint when hovered. */
	TintEnabled: boolean;
	/** The color of the tint which is a Color3 */
	TintColor: Color3;
}

const DEFAULT_TINT: Color3 = Color3.fromRGB(255,0,0);

function createCloseButton(): Preset_CloseBtn {
    const CloseBtn = new Instance("ImageButton");
    CloseBtn.AnchorPoint = new Vector2(1, 0.5);
    CloseBtn.AutoButtonColor = false;
    CloseBtn.BackgroundColor3 = Color3.fromRGB(66, 66, 66);
    CloseBtn.BorderSizePixel = 0;
    CloseBtn.Image = "http://www.roblox.com/asset/?id=6031094678";
    CloseBtn.LayoutOrder = -1;
    CloseBtn.Name = "CloseBtn";
    CloseBtn.Position = new UDim2(1, 0, 0.5, 0);
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

/**
 * This is the close button preset, it it a ImageButton that defaults to an 'X' cross image with a default
 * 'Red' tint, this can be overridden inside {@link PresetsData.Attributes}, see {@link CloseBtnAttributes}
 * for this presets attributes.
 */
@Component({
	tag: PresetTag.CloseBtn,
	// Only allow attaching instances that match the same structure of the CloseBtn preset.
	predicate: (inst: Instance) => t_Preset_CloseBtn(inst)
})
class CloseBtn extends Preset implements OnStart {

	/** {@inheritDoc Preset} */
	Type = "CloseBtn" as Presets;

	/** The attributes that belong to CloseBtn. */
	declare Attributes: CloseBtnAttributes;

	/** A reference to the Frame that is for the CloseBtn tint. */
	private _tintFrame: Frame;

	/**
	 * Constructs a new close button preset.
	 */
	constructor(_uiPresetsService: UIPresetsService) {
		super(_uiPresetsService);
		const closeBtn: Preset_CloseBtn = createCloseButton();

		this._tintFrame = closeBtn.WaitForChild("Tint") as Frame;

		
	}
	onStart(): void {
		
	}

	/** {@inheritDoc Destroy} */
	Destroy() {
		super.Destroy();
	}
}

export { CloseBtn };