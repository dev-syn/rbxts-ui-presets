import { t } from '@rbxts/t';

type Button = TextButton | ImageButton;

type Callback = () => void;

/**
 * ContextItem is the makeup of each item available in the ContextMenu.
 */
class ContextItem {
    /** The name of this ContextItem. */
    name: string;
    /** The btn that triggers this items _action. */
    btn: TextButton = new Instance("TextButton");
    /** Tracks whether this ContextItem is active or not. */
    isActive: boolean = true;

    /**
     * @private
     * The btn connection to trigger the action.
     */
    private _connection?: RBXScriptConnection;
    /**
     * @private
     * The action that this ContextItem will trigger when clicked.
     */
    private _action: Callback;

    /**
     * Constructs a new ContextItem object.
     * @param name - The name of this ContextItem
     * @param action - The action of this ContextItem
     */
    constructor(name: string,action: Callback) {
        this.name = name;
        this._action = action;

        this.btn.Name = `ContextItem-${this.name}`;
        this.btn.BackgroundColor3 = Color3.fromRGB(64,64,64);
        this.btn.TextColor3 = Color3.fromRGB(255,255,255);
        this.btn.AutoButtonColor = true;
        this.btn.Text = this.name;

        this._connection = this.btn.MouseButton1Click.Connect(() => this._action());
        this.btn.Visible = true;
    }

    /**
     * Sets the active state of this ContextItem.
     * @param active - Whether to set the ContextItem to active or not
     */
    SetActive(active: boolean): void {
        if (active) {
            // If there is already a connection then we are already active
            if (this.isActive || this._connection) return;

            this._connection = this.btn.MouseButton1Click.Connect(() => this._action());
            this.btn.Visible = true;
            this.isActive = true;
        } else {
            if (!this.isActive) return;

            if (this._connection) {
                this._connection.Disconnect();
                this._connection = undefined;
            }
            this.btn.Visible = false;
            this.isActive = false;
        }
    }

    /** Destroys this ContextItem. */
    Destroy(): void {
        this.btn.Destroy();
        this._connection = undefined;
    }
}

/**
 * ContextMenu adds a context menu to any "Button"(TextButton|ImageButton) which is activated when the triggerElement is right clicked.
 * This is still experimental and will likely receive many changes in the future.
 */
class ContextMenu {
    /** The button element that triggers this ContextMenu */
    triggerElement: Button;

    /** The ContextMenu background Frame Instance. */
    MenuBG: Frame = new Instance("Frame");
    /** The UIListLayout that maintains the ContextItem positions. */
    UIListLayout: UIListLayout = new Instance("UIListLayout");

    /** A number between 0 and 1 representing a percent of the parent triggerElement x size. */
    minMenuSizeX: number = 0.4;
    /** A number between 0 and 1 representing the minimum ContextItem size on the y axis. */
    minItemSizeY: number = 0.33;

    /**
     * @private
     * Stores the absolute ViewSize of the clients screen.
     */
    private viewSize?: Vector2;
    /**
     * @private
     * The ContextItems that belong to this ContextMenu.
     */
    private _contexts: ContextItem[] = [];
    /**
     * @private
     * The connections that belong to this ContextMenu.
     */
    private _connections: RBXScriptConnection[] = [];

    /**
     * Constructs a new ContextMenu object.
     * @param triggerElement - The button element that triggers this ContextMenu.
     */
    constructor(triggerElement: Button) {
        if (!(t.instanceIsA("TextButton") || t.instanceIsA("ImageButton"))) error("TriggerElement must be an instance of TextButton | ImageButton.");

        const ancestorSG: ScreenGui | undefined = triggerElement.FindFirstAncestorWhichIsA("ScreenGui");
        if (ancestorSG) this.viewSize = ancestorSG.AbsoluteSize;

        this.MenuBG.Name = `ContextMenu-${triggerElement.Name}`;
        this.MenuBG.BackgroundColor3 = Color3.fromRGB(64,64,64);
        this.MenuBG.Visible = true;
        this.MenuBG.AnchorPoint = new Vector2(0,0.5);

        this.UIListLayout.FillDirection = Enum.FillDirection.Vertical;
        this.UIListLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center;
        this.UIListLayout.Parent = this.MenuBG;

        this._connections.push(
            triggerElement.MouseButton2Click.Connect(() => {
                if (!this.MenuBG.Parent) {
                    this.Draw();
                    this.MenuBG.Parent = this.triggerElement;
                } else {
                    this.MenuBG.Parent = undefined;
                }
            })
        );

        triggerElement.Destroying.Connect(() => this.Destroy());

        this.triggerElement = triggerElement;
    }

    /**
     * Gets all the active ContextItems belonging to this ContextMenu.
     * @returns - An array of ContextItem.
     */
    GetActiveContexts(): ContextItem[] { return this._contexts.filter(c => c.isActive); }

    /**
     * Draws the sizing and positioning for both the ContextMenu and ContextItems that are active.
     */
    Draw(): void {
        const activeContexts: ContextItem[] = this.GetActiveContexts();
        const contextSize: number = activeContexts.size();

        if (contextSize === 0) return;

        // The absolute size of the trigger element
        const absSizeY: number = this.triggerElement.AbsoluteSize.Y;

        // How much size should each context get evenly
        const unitSize = absSizeY / contextSize;
        // If any overflow size is needed; by how much
        const overflowSize = math.max(absSizeY * this.minItemSizeY - unitSize,0);
        // How much size should each context get accounting for overflow
        const overflow = overflowSize * contextSize;

        const absSizeX = this.triggerElement.AbsoluteSize.X;

        this.MenuBG.Size = new UDim2(0,absSizeX * this.minMenuSizeX,0,absSizeY + overflow);
        this.MenuBG.Position = new UDim2(0,this.triggerElement.AbsolutePosition.X + (absSizeX * 0.25),0,this.MenuBG.AbsoluteSize.Y / 2 - overflow / 2);

        const centerTopPos = this.MenuBG.AbsolutePosition.Y - this.MenuBG.AbsoluteSize.Y / 2;
        const centerBottomPos = this.MenuBG.AbsolutePosition.Y + this.MenuBG.AbsoluteSize.Y / 2;
        if (this.viewSize) {
            
            if (centerTopPos < 0)
                this.MenuBG.Position = this.MenuBG.Position.add(new UDim2(0,0,0,math.abs(centerTopPos)));
            if (centerBottomPos > this.viewSize.Y)
                this.MenuBG.Position = this.MenuBG.Position.sub(new UDim2(0,0,0,centerBottomPos));

        }

        const minSizeUnit: number = absSizeY * this.minItemSizeY;
        activeContexts.forEach(c => {
            c.btn.Size = new UDim2(1,0,0,minSizeUnit);
            c.btn.Parent = this.MenuBG;
        });
    }

    /**
     * Adds the given ContextItem to this ContextMenu.
     * @param context - The ContextItem object to add
     */
    AddContext(context: ContextItem) {
        this._contexts.push(context);
    }

    /**
     * Removes the given ContextItem from this ContextMenu.
     * @param context - The ContextItem object to remove
     */
    RemoveContext(context: ContextItem) {
        const index: number = this._contexts.indexOf(context);
        if (index !== -1) this._contexts.remove(index);
    }

    /**
     * Clears all ContextItems from this ContextMenu internally destroying each ContextItem.
     */
    Clear() {
        this._contexts.forEach(c => c.Destroy());
        this._contexts.clear();
    }

    /**
     * Destroys this ContextMenu object.
     */
    Destroy() {
        // Remove UIListLayout for unnecessary work
        this.UIListLayout.Parent = undefined;

        // Destroy each ContextItem
        this._contexts.forEach(item => item.Destroy());

        // Disconnect each connection of this ContextMenu
        this._connections.forEach(conn => conn.Disconnect());
        this._connections = [];

        this.MenuBG.Parent = undefined;
        this.triggerElement = undefined!;
    }
}

export { ContextMenu, ContextItem };