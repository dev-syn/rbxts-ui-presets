import { Signal } from '@rbxts/beacon';
import { Players, RunService, UserInputService } from '@rbxts/services';
import { Component } from '@flamework/components';
import type UIPresetsService from '../../../../';
import { OnStart } from '@flamework/core';
import Object from '@rbxts/object-utils';
import { ComponentTag } from '../../ComponentTag';
import { UIComponent, UIComponentAttributes, UIComponentDefaultAttributes } from '../..';

/** A table of configurable options that change the default behavior of {@link BoundCheck}. */
interface BoundCheckOptions {
    /** Whether this BoundCheck should only trigger as in bounds if it's the topmost element in bounds, Otherwise the bound check will still be within bounds even if another UI is on top of it. Default(false) */
    TopMostOnly: boolean;
    /** Whether this BoundCheck should ignore the gui inset of '36' pixels. Default(false) */
    IgnoreGuiInset: boolean;
    /** Whether this {@link BoundCheck} will skip querying on elements that are not visible, Otherwise the element will still bound check when element is invisible. Default(true) */
    ConsiderVisibility: boolean;
}

/** A bound coordinate contains a X and Y absolute position. */
interface BoundCoord {
    X: number;
    Y: number;
}

const PlayerGui: PlayerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

function newCoord(x: number = 0,y: number = 0): BoundCoord { return { X: x, Y: y }; } 

/**
 * A class for storing the bounds data for the BoundCheck object.
 */
class BoundsLayout {

	/** An object that would be an empty BoundsLayout. Remember to copy this object and shouldn't be mutated. */
	static readonly empty: BoundsLayout = new BoundsLayout(newCoord(0,0),newCoord(0,0),newCoord(0,0),newCoord(0,0),newCoord(0,0));

	static __tostring = (lay: BoundsLayout) => {
		return `{
				C1(X: ${lay.C1.X}, Y: ${lay.C1.Y}),
				C2(X: ${lay.C2.X}, Y: ${lay.C2.Y}),
				C3(X: ${lay.C3.X}, Y: ${lay.C3.Y}),
				C4(X: ${lay.C4.X}, Y: ${lay.C4.Y}),

				Size(X: ${lay.Size.X}, Y: ${lay.Size.Y})
		}`
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

	constructor(c1: BoundCoord,c2: BoundCoord,c3: BoundCoord,c4: BoundCoord,size: BoundCoord) {
		assert(!c1 || !c2 || !c3 || !c4 || !size,"Invalid parameters for BoundsLayout constructor");
		this.C1 = c1;
		this.C2 = c2;
		this.C3 = c3;
		this.C4 = c4;
		this.Size = size;
	}
}

// #region ATTRIBUTES

interface BoundCheckAttributes {
	up_Active: boolean,
	up_TopMostOnly: boolean,
	up_IgnoreGuiInset: boolean,
	up_ConsiderVisibility: boolean
}

const DEFAULT_BOUND_CHECK_ATTRIBUTES: UIComponentAttributes & BoundCheckAttributes = {
	...UIComponentDefaultAttributes,
	up_Active: false,
	// BoundCheck.Options
	up_TopMostOnly: false,
	up_IgnoreGuiInset: false,
	up_ConsiderVisibility: true
}

// #endregion
/**
 * This is a UIPresets component that checks if the mouse is within a UI element bounds.
 */
@Component({
	tag: ComponentTag.BoundCheck
})
class BoundCheck extends UIComponent<BoundCheckAttributes,GuiObject> implements OnStart {
	private static _boundChecks: Map<BoundCheck,true | undefined> = new Map();
	
	static {
		RunService.BindToRenderStep("UIPresets_BoundCheck",Enum.RenderPriority.Input.Value + 5,() => {

			for (const [boundCheck,_] of this._boundChecks) {
					if (!boundCheck.Active) continue;

					boundCheck.Query();
			}

		});
	}

	/** @inheritDoc */
	Type = ComponentTag.BoundCheck;
	
	Options: BoundCheckOptions = {
			TopMostOnly: DEFAULT_BOUND_CHECK_ATTRIBUTES.up_TopMostOnly,
			IgnoreGuiInset: DEFAULT_BOUND_CHECK_ATTRIBUTES.up_IgnoreGuiInset,
			ConsiderVisibility: DEFAULT_BOUND_CHECK_ATTRIBUTES.up_ConsiderVisibility
	};
	/** Whether this BoundCheck is actively checking for bound interactions. */
	Active: boolean = DEFAULT_BOUND_CHECK_ATTRIBUTES.up_Active;
	/** This stores the data of the bounds you can access the corner coord abs' positions and the size of the bounds. */
	readonly Bounds: BoundsLayout;
	/** A signal that is called when the bounds is entered. */
	BoundEnter: Signal<void> = new Signal();
	/** A signal that is called when the bounds is exited. */
	BoundExit: Signal<void> = new Signal();

	/**
	 * This property stores whether the BoundCheck is within bounds.
	 * @private
	 */
	private _withinBounds: boolean = false;
	/** The ancestor ScreenGui which is used for internal positioning and sizing checks. */
	private _ancestorSG: ScreenGui | undefined;
	
// #region ESSENTIALS
	constructor(
		_uiPresetsService: UIPresetsService
	) {
		super(_uiPresetsService);
		this.Bounds = Object.assign({},BoundsLayout.empty);
	}

	onStart(): void {
		this.assignAttributes();
		// Query the instance for it's bounds
		this.Query();
		BoundCheck._boundChecks.set(this,true);

		// Give the maid it's task for this class
		this.maid.GiveTask(() => BoundCheck._boundChecks.delete(this));
		this.maid.GiveTask(this.BoundEnter);
		this.maid.GiveTask(this.BoundExit);
	}

// #endregion

	/** Returns true if within bounds; otherwise false. */
	InBounds(): boolean { return this._withinBounds; }

	/**
	 * Queries this BoundCheck to see if the mouse is within bounds of the element.
	 * NOTE: This is marked as internal as this will internally get queried.
	 * @internal
	 */
	Query(): boolean {
		if (!this.instance) return false;
		const owner = this.instance;

		if (this.Options.ConsiderVisibility && !owner.Visible) return false;

		if (!this._ancestorSG) {
			this._ancestorSG = owner.FindFirstAncestorWhichIsA("ScreenGui");
			// We need to verify that it exists, after our search.
			if (!this._ancestorSG) {
				warn("A ScreenGui ancestor must exist for BoundChecks position checks, so no bounds will be queried.");
				return false;
			}
		} 

		const mousePos: Vector2 | undefined = UserInputService.GetMouseLocation();
		if (!mousePos) return false;

		if (this.Options.TopMostOnly) {
			const uis: GuiObject[] = PlayerGui.GetGuiObjectsAtPosition(mousePos.X,mousePos.Y);
			if (uis.size() === 0) return false;
			if (uis[0] !== owner) return false;
		}

		const absXSize: number = owner.AbsoluteSize.X;
		const absYSize: number = owner.AbsoluteSize.Y;

		// The left absolute position of the bound box
		const leftAbsX: number = owner.AbsolutePosition.X;
		// The right absolute position of the bound box
		const rightAbsX: number = leftAbsX + absXSize;

		// The top absolute position of the bound box
		const topAbsY: number = !this.Options.IgnoreGuiInset
		&& this._ancestorSG
		? owner.AbsolutePosition.Y - this._ancestorSG.AbsolutePosition.Y
		: owner.AbsolutePosition.Y;

		// The bottom absolute position of the bound box
		const bottomAbsY: number = topAbsY + absYSize;

		const withinX: boolean = mousePos.X >= leftAbsX && mousePos.X <= rightAbsX;
		const withinY: boolean = mousePos.Y >= topAbsY && mousePos.Y <= bottomAbsY;

		const withinBounds: boolean = withinX && withinY;

		// Corner 1 point
		this.Bounds.C1.X = leftAbsX;
		this.Bounds.C1.Y = topAbsY;
		// Corner 2 point
		this.Bounds.C2.X = rightAbsX;
		this.Bounds.C2.Y = topAbsY;
		// Corner 3 point
		this.Bounds.C3.X = leftAbsX;
		this.Bounds.C3.Y = bottomAbsY;
		// Corner 4 point
		this.Bounds.C4.X = rightAbsX;
		this.Bounds.C4.Y = bottomAbsY;
		// BoundCheck size
		this.Bounds.Size.X = absXSize;
		this.Bounds.Size.Y = absYSize;

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

	override assignAttributes(): void {
		super.assignAttributes();
		this.maid.GiveTask(
			this.onAttributeChanged("up_Active",(setActive: boolean) => this.Active = setActive)
		);
		this.maid.GiveTask(
			this.onAttributeChanged("up_TopMostOnly",(val: boolean) => this.Options.TopMostOnly = val)
		);
		this.maid.GiveTask(
			this.onAttributeChanged("up_IgnoreGuiInset",(val: boolean) => this.Options.IgnoreGuiInset = val)
		);
		this.maid.GiveTask(
			this.onAttributeChanged("up_ConsiderVisibility",(val: boolean) => this.Options.ConsiderVisibility = val)
		);
	}
}

export { BoundCheck, BoundsLayout, BoundCheckOptions, BoundCoord };