import Object from '@rbxts/object-utils';
import { EPresetDataAttributes, PresetsData, PresetsDataAttributes } from 'PresetsData';
import type { Presets } from 'types/presets';

type Inst_CloseBtn = ImageButton & {
    UIAspectRatioConstraint: UIAspectRatioConstraint;
    Tint: Frame;
}

enum ECloseBtnAttributes {
    TintEnabled = "TintEnabled",
    TintColor = "TintColor"
}

/**
 * The attributes that belong to preset
 */
interface CloseBtnAttributes extends PresetsDataAttributes {
    /** Whether this button will show a tint when hovered. */
    TintEnabled: boolean;
    /** The color of the tint which is a Color3 */
    TintColor: Color3;
}

const DEFAULT_TINT: Color3 = Color3.fromRGB(255,0,0);

function createCloseButton(): Inst_CloseBtn {
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

    return CloseBtn as Inst_CloseBtn;
}

/**
 * This is the close button preset, it it a ImageButton that defaults to an 'X' cross image with a default
 * 'Red' tint, this can be overridden inside {@link PresetsData.Attributes}, see {@link CloseBtnAttributes}
 * for this presets attributes.
 */
class CloseBtn extends PresetsData<CloseBtnAttributes> {

    /** {@inheritDoc Preset} */
    Type = "CloseBtn" as Presets;
    /** {@inheritDoc Preset} */
    declare Owner: Inst_CloseBtn;
    
    /**
     * {@inheritDoc PresetsData._owner}
     * @readonly
     * @protected
     */
    protected declare _owner: Inst_CloseBtn;
    declare Attributes: CloseBtnAttributes;

    private _tintFrame: Frame;

    /**
     * Constructs a new close button preset.
     */
    constructor() {
        const closeBtn: Inst_CloseBtn = createCloseButton();
        super(closeBtn);

        this._tintFrame = closeBtn.WaitForChild("Tint") as Frame;

        this.Attributes = {
            PresetUUID: this.Attributes.PresetUUID,
            TintEnabled: true,
            TintColor: DEFAULT_TINT
        };

        this.InitAttributes();

        // Assign attribute handlers after everything is finalized
        this.AttachAttributeHandler<boolean>(ECloseBtnAttributes.TintEnabled,(enabled: boolean | undefined) => {
            this._tintFrame.Visible = enabled ? true : false;
        });

        this.AttachAttributeHandler<Color3>(ECloseBtnAttributes.TintColor,(color: Color3 | undefined) => {
            this._tintFrame.BackgroundColor3 = color ? color : DEFAULT_TINT;
        });
    }

    /** {@inheritDoc Destroy} */
    Destroy() {
        super.Destroy();
    }
}

export { CloseBtn };