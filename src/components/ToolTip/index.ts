import { t } from '@rbxts/t';
import { UIPresetsConfig } from '../../UIPresetsConfig';
import { BoundCheck } from '../BoundCheck';
import Component from 'components';
import type { Components } from 'types/components';

const TextService: TextService = game.GetService('TextService');
const UserInputService: UserInputService = game.GetService('UserInputService');

/** The {@link ToolTip} options that change default behavior. */
interface ToolTipOptions {
    /** Whether the ToolTip should follow the mouse when within the UI element. */
    FollowMouse: boolean;
}

/**
 * This is a component that will create a ToolTip near the target element.
 */
class ToolTip extends Component<TextLabel> {

    private static _tooltipSG: ScreenGui = new Instance("ScreenGui");

    static {
        this._tooltipSG.Name = "UIPresets_ToolTip";
        this._tooltipSG.IgnoreGuiInset = true;
        this._tooltipSG.ResetOnSpawn = false;
        this._tooltipSG.DisplayOrder = UIPresetsConfig.HighestDisplayOrder + 1;
        this._tooltipSG.Parent = game.GetService('Players').LocalPlayer.WaitForChild("PlayerGui");

        // When the HighestDisplayOrder is changed update the ContextMenuSG DisplayOrder
        UIPresetsConfig.OnDisplayOrderChanged.Connect((newOrder: number) => this._tooltipSG.DisplayOrder = newOrder + 1);
    }

    /** {@inheritDoc Component} */
    Type = "ToolTip" as Components;
    /**
     * The UI element that this {@link ToolTip} represents.
     */
    declare Owner: TextLabel;

    /**
     * The options that change the behavior of this ToolTip.
     * @see {@link ToolTipOptions}  
     */
    Options: ToolTipOptions = {
        FollowMouse: false
    };

    /** The text that will be displayed within the {@link ToolTip}. */
    Text: string;
    /** The size of the text that will be displayed. */
    TextSize: number = 18;

    /**
     * The absolute size of the {@link ToolTip} TextLabel.
     * @private
     */
    private _absSize!: Vector2;

    /**
     * The bounding check of the {@link ToolTip.Owner}.
     * @private
     */
    private _boundCheck: BoundCheck;

    constructor(name: string,text: string) {
        const tl: TextLabel = new Instance("TextLabel");
        tl.Name = `Tooltip-${name}`;
        super(tl);

        // Get the initial absolute size based on starting text
        this.Text = text;
        this._updateTextBounds();

        tl.Size = new UDim2(0,this._absSize.X,0,this._absSize.Y);
        tl.AnchorPoint = new Vector2(0.5,0.5);
        tl.Text = text;
        
        this._boundCheck = new BoundCheck(tl);
        this._boundCheck.BoundEnter.Connect(() => {
            this.Draw();
        });
        
        this._boundCheck.BoundExit.Connect(() => {
            this.Owner.Parent = undefined
        });
    }

    /** Destroys this {@link ToolTip} object removing references and connections. */
    Destroy() {
        this._boundCheck.Destroy();
        this._boundCheck = undefined!;

        this.Owner.Destroy();
        super.Destroy();
    }

    /** Sets the ToolTip text and updates the ToolTip absolute size. */
    SetText(text: string) {
        this.Text = text;
        this._updateTextBounds();
        this.Owner.Text = text;
    }

    /**
     * Sets the position of the tooltip accounting for screen edge cases.
     * @param pos An optional parameter position of where the ToolTip will go. Defaults to the mouse location
     */
    SetPosition(pos: Vector2 = UserInputService.GetMouseLocation()): void {

        const label: TextLabel = this.Owner;
        
        const halfAbsSize: Vector2 = new Vector2(label.AbsoluteSize.X / 2,label.AbsoluteSize.Y / 2);

        const screenSize: Vector2 = ToolTip._tooltipSG.AbsoluteSize;

        const isOverLeft: boolean = (pos.X - halfAbsSize.X) < 0;
        const isOverRight: boolean = (pos.X + halfAbsSize.X) > screenSize.X;
        const isOverTop: boolean = (pos.Y - halfAbsSize.Y) < 0;
        const isOverBottom: boolean = (pos.Y + halfAbsSize.Y) > screenSize.Y;

        // Adjust the current position by the size to be within screen

        let adjustedPos: UDim2 = UDim2.fromOffset(pos.X,pos.Y);

        if (isOverLeft) adjustedPos = adjustedPos.add(UDim2.fromOffset(halfAbsSize.X,0));
        if (isOverRight) adjustedPos = adjustedPos.sub(UDim2.fromOffset(halfAbsSize.X,0));
        if (isOverTop) adjustedPos = adjustedPos.add(UDim2.fromOffset(halfAbsSize.Y,0));
        if (isOverBottom) adjustedPos = adjustedPos.sub(UDim2.fromOffset(halfAbsSize.Y,0));

        label.Position = adjustedPos;
    }

    Draw() {
        // Size the ToolTip element before positioning
        this.Owner.Size = new UDim2(0,this._absSize.X,0,this._absSize.Y);
        // Update the Position
        this.SetPosition();
        this.Owner.Parent = ToolTip._tooltipSG;
    }

    private _updateTextBounds() {
        this._absSize = TextService.GetTextSize(
            this.Text,
            this.TextSize,
            Enum.Font.Roboto,
            new Vector2(ToolTip._tooltipSG.AbsoluteSize.X * 0.4,ToolTip._tooltipSG.AbsoluteSize.Y * 0.3)
        ).add(new Vector2(1,1));
    }
}

export { ToolTip, ToolTipOptions };