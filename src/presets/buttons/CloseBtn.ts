import Object from '@rbxts/object-utils';
import { Preset, PresetsDataAttributes, PresetsSerialized } from 'presets';
import { ConditionalReturn } from 'plugin/serialization/Serializer';
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
class CloseBtn extends Preset<PresetsSerialized<Inst_CloseBtn>,CloseBtn,Inst_CloseBtn,CloseBtnAttributes> {

    /** {@inheritDoc Preset} */
    Type = "CloseBtn" as Presets;
    /** The owner which is the CloseBtn roblox Instance. */
    declare Owner: Inst_CloseBtn;
    /** The attributes that belong to CloseBtn. */
    declare Attributes: CloseBtnAttributes;

    /** A reference to the Frame that is for the CloseBtn tint. */
    private _tintFrame: Frame;

    /**
     * Constructs a new close button preset.
     */
    constructor() {
        const closeBtn: Inst_CloseBtn = createCloseButton();
        super(closeBtn);

        this._tintFrame = closeBtn.WaitForChild("Tint") as Frame;

        this.Attributes = {
            UUID: this.Attributes.UUID,
            TintEnabled: true,
            TintColor: DEFAULT_TINT
        };

        super.InitAttributes();

        // Assign attribute handlers after everything is finalized
        super.AttachAttributeHandler<boolean>(ECloseBtnAttributes.TintEnabled,(enabled: boolean | undefined) => {
            this._tintFrame.Visible = enabled ? true : false;
        });

        super.AttachAttributeHandler<Color3>(ECloseBtnAttributes.TintColor,(color: Color3 | undefined) => {
            this._tintFrame.BackgroundColor3 = color ? color : DEFAULT_TINT;
        });
    }

    /** {@inheritDoc Destroy} */
    Destroy() {
        super.Destroy();
    }

    Deserialize<ShouldReturnObject extends boolean = true>(data: PresetsSerialized<Inst_CloseBtn>): ConditionalReturn<ShouldReturnObject,CloseBtn> {

        return this as unknown as ConditionalReturn<ShouldReturnObject,CloseBtn>;
    }
}

export { CloseBtn };