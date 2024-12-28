import { Signal } from '@rbxts/beacon';
import { Players, RunService, UserInputService } from '@rbxts/services';
import { Component } from 'components';
import type { Components } from 'types/components';
import { BoundCheckOptions, BoundCoord } from './shared';
import { BoundCheckSerializable, BoundsLayoutSerializable } from './serializable';
import { ConditionalReturn, Serializer } from 'plugin/serialization/Serializer';
import PartialComponent from 'plugin/PartialComponent';
import { Constructor } from 'utils';

const PlayerGui: PlayerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

function newBoundCoord(x: number = 0,y: number = 0): BoundCoord { return { X: x, Y: y }; } 

/**
 * This stores the bounds layout of a {@link BoundCheck} object.
 */
class BoundsLayout extends Serializer<BoundsLayoutSerializable,BoundsLayout> {

    static __tostring = (lay: BoundsLayout) => {
        return `{
            C1(X: ${lay.C1.X}, Y: ${lay.C1.Y}),
            C2(X: ${lay.C2.X}, Y: ${lay.C2.Y}),
            C3(X: ${lay.C3.X}, Y: ${lay.C3.Y}),
            C4(X: ${lay.C4.X}, Y: ${lay.C4.Y}),

            Size(X: ${lay.Size.X}, Y: ${lay.Size.Y})
        }`
    }

    static Deserialize(data: BoundsLayoutSerializable): BoundsLayout | undefined {
        if (!RunService.IsStudio()) error("[UIPresets]: Deserialize() can only be called within Studio.");
        return new BoundsLayout(data);
    }

    /** The ClassName which is 'BoundsLayout'. */
    ClassName: "BoundsLayout" = "BoundsLayout";

    /** The absolute top left position coords of this bounds. */
    C1: BoundCoord = { X: 0, Y: 0 };
    /** The absolute top right position coords of this bounds. */
    C2: BoundCoord = { X: 0, Y: 0 };
    /** The absolute bottom left position coords of this bounds. */
    C3: BoundCoord = { X: 0, Y: 0 };
    /** The absolute bottom right position coords of this bounds. */
    C4: BoundCoord = { X: 0, Y: 0 };

    /** The size of this bounds. */
    Size: BoundCoord = { X: 0, Y: 0 };

    protected _isSerializable: boolean = true;

    constructor(serialized: BoundsLayoutSerializable)
    constructor(c1: BoundCoord,c2: BoundCoord,c3: BoundCoord,c4: BoundCoord,size: BoundCoord)
    constructor(
        c1OrSerialized: BoundCoord | BoundsLayoutSerializable,
        c2?: BoundCoord,
        c3?: BoundCoord,
        c4?: BoundCoord,
        size?: BoundCoord
    ) {
        super();

        if (Serializer.HasSerializedType(c1OrSerialized)) {
            const data: BoundsLayoutSerializable = c1OrSerialized;
            this.C1 = data.C1;
            this.C2 = data.C2;
            this.C3 = data.C3;
            this.C4 = data.C4;
            size = data.Size;
        } else if (c2 && c3 && c4 && size) {
            this.C1 = c1OrSerialized;
            this.C2 = c2;
            this.C3 = c3;
            this.C4 = c4;
            this.Size = size;
        }
    }

    Serialize(): BoundsLayoutSerializable {
        return {
            C1: this.C1,
            C2: this.C2,
            C3: this.C3,
            C4: this.C4,
            Size: this.Size,
            _serializableType: "BoundsLayoutSerializable"
        };
    }

}

/**
 * This is a UIPresets component that checks if the mouse is within a UI element bounds.
 */
class BoundCheck extends Component<BoundCheckSerializable,BoundCheck,GuiObject> {
    private static _boundChecks: Map<BoundCheck,true | undefined> = new Map();
    
    static {
        RunService.BindToRenderStep("UIPresets_BoundCheck",Enum.RenderPriority.Input.Value + 5,() => {

            for (const [boundCheck,_] of this._boundChecks) {
                if (!boundCheck.Active) continue;

                boundCheck.Query();
            }

        });
    }

    static Deserialize(data: BoundCheckSerializable): BoundCheck | undefined {
        const owner: GuiObject | undefined = Serializer.FindInstanceWithPath(data.Owner.Path);
        if (!owner) return undefined;

        const boundCheck: BoundCheck = new BoundCheck(owner,data.ActiveOnStart);
        boundCheck.Options = data.Options;
    }

    /** {@inheritDoc components/index} */
    Type = "BoundCheck" as Components;
    /** {@inheritDoc Component} */
    declare Owner: GuiObject;

    Options: BoundCheckOptions = {
        TopMostOnly: false,
        IgnoreGuiInset: false,
        ConsiderVisibility: true
    };

    /** Whether this BoundCheck is actively checking for bound interactions. */
    Active: boolean;

    /** This stores the data of the bounds you can access the corner coord abs' positions and the size of the bounds. */
    Bounds!: BoundsLayout;

    /** A signal that is called when the bounds is entered. */
    BoundEnter: Signal<void> = new Signal();

    /** A signal that is called when the bounds is exited. */
    BoundExit: Signal<void> = new Signal();

    /** {@inheritDoc Component} */
    protected _isSerializable: boolean = true;

    /**
     * This property stores whether the BoundCheck is within bounds.
     * @private
     */
    private _withinBounds: boolean = false;

    /** The ancestor ScreenGui which is used for internal positioning and sizing checks. */
    private _ancestorSG: ScreenGui | undefined;

    private _destroyingConnection?: RBXScriptConnection;

    /**
     * Constructs a new BoundCheck object.
     * @param owner The element whos bounds will be queried
     * @param activeOnStart Whether this BoundCheck should be active when this BoundCheck is created. Default(true)
     */
    constructor(owner: GuiObject,activeOnStart: boolean = true) {
        super(owner);
        this.Active = activeOnStart;

        this._destroyingConnection = this.Owner.Destroying.Once(() => this.Destroy());
        BoundCheck._boundChecks.set(this,true);
    }

    /** Destroys this {@link BoundCheck} removing references. You only really need to call this method when you want to delete the {@link BoundCheck} without destroying the {@link BoundCheck.Owner}. */
    Destroy() {
        super.Destroy();
        this.Active = false;
        BoundCheck._boundChecks.delete(this);

        if (this._destroyingConnection) {
            this._destroyingConnection.Disconnect();
            this._destroyingConnection = undefined;
        }

        // Clean up signal events
        if (this.BoundEnter) {
            this.BoundEnter.Destroy();
            this.BoundEnter = undefined!;
        }
        if (this.BoundExit) {
            this.BoundExit.Destroy();
            this.BoundExit = undefined!;
        }
    }

    Serialize(): BoundCheckSerializable {
        return {
            _serializableType: "BoundCheckSerializable",
            Type: "BoundCheck",
            UUID: this.UUID,
            Owner: Serializer.SerializeInstance<GuiObject>(this.Owner),
            Options: this.Options,
            BoundsLayout: this.Bounds.Serialize(),
            ActiveOnStart: this.Active
        }
    }

    /** Returns true if within bounds; otherwise false. */
    InBounds(): boolean { return this._withinBounds; }

    /**
     * Queries this BoundCheck to see if the mouse is within bounds of the element.
     * NOTE: This is marked as internal as this will internally get queried.
     * @internal
     */
    Query(): boolean {
        if (!this.Owner) return false;
        if (this.Options.ConsiderVisibility && !this.Owner.Visible) {
            print("Not visible")
            return false;
        }
        if (!this._ancestorSG) this._ancestorSG = this.Owner.FindFirstAncestorWhichIsA("ScreenGui");

        const mousePos: Vector2 | undefined = UserInputService.GetMouseLocation();
        if (!mousePos) return false;

        if (this.Options.TopMostOnly) {
            const uis: GuiObject[] = PlayerGui.GetGuiObjectsAtPosition(mousePos.X,mousePos.Y);
            if (uis.size() === 0) return false;

            if (uis[0] !== this.Owner) return false;
        }

        const tElem: GuiObject = this.Owner;

        const absXSize: number = tElem.AbsoluteSize.X;
        const absYSize: number = tElem.AbsoluteSize.Y;

        // The left absolute position of the bound box
        const leftAbsX: number = tElem.AbsolutePosition.X;
        // The right absolute position of the bound box
        const rightAbsX: number = leftAbsX + absXSize;

        // The top absolute position of the bound box
        const topAbsY: number = !this.Options.IgnoreGuiInset && this._ancestorSG ? tElem.AbsolutePosition.Y - this._ancestorSG.AbsolutePosition.Y : tElem.AbsolutePosition.Y;

        // The bottom absolute position of the bound box
        const bottomAbsY: number = topAbsY + absYSize;

        const withinX: boolean = mousePos.X >= leftAbsX && mousePos.X <= rightAbsX;
        const withinY: boolean = mousePos.Y >= topAbsY && mousePos.Y <= bottomAbsY;

        const withinBounds: boolean = withinX && withinY;

        this.Bounds = new BoundsLayout(
            newBoundCoord(leftAbsX,topAbsY),
            newBoundCoord(rightAbsX,topAbsY),
            newBoundCoord(leftAbsX,bottomAbsY),
            newBoundCoord(rightAbsX,bottomAbsY),
            newBoundCoord(absXSize,absYSize)
        );

        // If not within bounds mark as leaving bounds
        if (!withinBounds) {
            if (this._withinBounds) {
                this._withinBounds = false;
                this.BoundExit.Fire();
            }
            return false;
        } else {
            // Mark if not already marked as in bounds
            if (!this._withinBounds) {
                this._withinBounds = true;
                this.BoundEnter.Fire();
            }
            return true;
        }
        
    }

    CreatePartial<TClass extends Component<BoundCheckSerializable, BoundCheck, GuiObject> = BoundCheck>(): PartialComponent<TClass> {
        return new PartialComponent<TClass>(new Map<string,any>([
            ["Active",this.Active],
            ["Options",this.Options],
            ["Bounds",this.Bounds],
            ["Owner",this.Owner]
        ]),BoundCheck as unknown as Constructor<TClass>,["Owner","Active"]);
    }

}

export { BoundCheck, BoundsLayout };