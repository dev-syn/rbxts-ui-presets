/**
 * The TickSetting type that this setting will contain either a Check for a checkmark or a cross as a mark.
 * @enum
 */
enum TickSettingType {
    /** This TickSetting will be a cross image. (X) */
    Cross,
    /** This TickSetting will be a checkmark image. (✔️)*/
    Check
}

const IMAGE_CROSS = "6031094678";
const IMAGE_CHECK = "6031094667";

const ContentProvider: ContentProvider = game.GetService("ContentProvider");

class TickSetting {

    static {
        // Preload these image ids
        Promise.defer(() => ContentProvider.PreloadAsync([IMAGE_CROSS,IMAGE_CHECK]));
    }

    /** The name of this setting. */
    Name: string;

    /** The back Frame that contains the setting elements. */
    Frame: Frame;

    /** The TextLabel of this setting AKA {@link TickSetting.Name}. */
    Label: TextLabel;

    /** The Button of this setting. */
    TickBtn: ImageButton;

    /** A condition property that checks if this TickSetting is ticked otherwise false. */
    IsTicked: boolean;

    /**
     * The type of this TickSetting
     * @private
     * @see {@link TickSettingType}
     */
    private _type: TickSettingType;

    /**
     * The TickBtn MouseButton1Click connection of this TickSetting.
     * @private
     */
    private _tickBtnConnection: RBXScriptConnection;

    /**
     * 
     * @param type The {@link TickSettingType} of this TickSetting
     * @param name The name of this TickSetting, it does not need to be unique
     * @param tickedByDefault Whether this setting is ticked by default or not
     */
    constructor(_type: TickSettingType,name: string,tickedByDefault: boolean = false) {
        this._type = _type;
        this.IsTicked = tickedByDefault;

        this.Name = name;

        const frame: Frame = new Instance("Frame");
        frame.Name = `TickSetting-${name}`;
        frame.Size = new UDim2(1,0,0.1,0);

        const label: TextLabel = new Instance("TextLabel");
        label.Name = `Label-${name}`;
        label.Text = name;
        label.Size = new UDim2(0.4,0,1,0);
        label.TextScaled = true;
        label.Parent = frame;

        const textConstraint: UITextSizeConstraint = new Instance("UITextSizeConstraint");
        textConstraint.MaxTextSize = 20;
        textConstraint.MinTextSize = 10;
        textConstraint.Parent = label;

        const btn: ImageButton = new Instance("ImageButton");
        btn.ImageTransparency = tickedByDefault ? 0 : 1;
        btn.Name = `Button-${name}`;
        btn.Size = new UDim2(0.6,0,1,0);
        btn.Position = new UDim2(0.4,0,0,0);
        btn.Image = this._type === TickSettingType.Cross ? IMAGE_CROSS : IMAGE_CHECK;
        btn.Parent = frame;

        const aspectRatio: UIAspectRatioConstraint = new Instance("UIAspectRatioConstraint");
        aspectRatio.DominantAxis = Enum.DominantAxis.Height;
        aspectRatio.AspectRatio = 1;
        aspectRatio.Parent = btn;

        this.Label = label;
        this.TickBtn = btn;
        this.Frame = frame;

        this._tickBtnConnection = btn.MouseButton1Click.Connect(() => {
            const isTicked: boolean = !this.IsTicked;
            this.TickBtn.ImageTransparency = isTicked ? 0 : 1;
            this.IsTicked = isTicked;
        });
    }

    Destroy() {
        this.Label = undefined!;
        this.TickBtn = undefined!;
        this.Frame = undefined!;

        if (this._tickBtnConnection) {
            this._tickBtnConnection.Disconnect();
            this._tickBtnConnection = undefined!;
        }
    }

}

export { TickSetting, TickSettingType };