import { t } from '@rbxts/t';

const RunService: RunService = game.GetService("RunService");

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
        this.btn.BorderMode = Enum.BorderMode.Middle;

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

            if (!this._connection) this.btn.MouseButton1Click.Connect(() => this._action());
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
 * @enum {number}
 * The TextSizingMode enum contains modes that affect the text sizing of the @see {@link ContextItem} title text.
 */
enum TextSizingMode {
    /** This sizing mode goes through all the context item texts and finds the lowest text size where all items would fit. This mode has a built-in fixed padding on those text sizes.*/
    MinimumCommon,
    /** This mode uses the @see {@link ContextMenu.textSizeScaler} property which is a scale modifier for the triggerElement text size. */
    Scaled
}

/**
 * @interface
 * These are the options that can be passed to ContextMenu to change default ContextMenu behavior.
 */
interface MenuOptions {
    /** textSizingMode only affects TextButton triggerElements. */
    textSizingMode: TextSizingMode;
}

class ContextMenu {

    static contextMenuSG: ScreenGui = new Instance("ScreenGui");
    static textFitLabel: TextLabel = new Instance("TextLabel");
    static onlySingleContext: boolean = true;

    private static _previousMenu?: ContextMenu = undefined;

    static {
        this.contextMenuSG.Name = "ContextMenuSG";
        this.contextMenuSG.DisplayOrder = 10000;
        this.contextMenuSG.ResetOnSpawn = false;
        this.contextMenuSG.Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");

        this.textFitLabel.Position = new UDim2(2,0,2,0);
        this.textFitLabel.Parent = this.contextMenuSG;
    }
    /** The button element that triggers this ContextMenu */
    triggerElement: Button;

    /** The ContextMenu background Frame Instance. */
    menuBG: Frame = new Instance("Frame");

    /** A Vector2 which contains the scale modifier of the @see {@link ContextMenu.triggerElement} */
    itemSize: Vector2 = new Vector2(1,1);

    /** A scaler modifier number that will affect the @see {@link ContextMenu.triggerElement.TextSize} \* @see {@link textSizeScaler} */
    textSizeScaler: number = 1;

    options: MenuOptions = {
        textSizingMode: TextSizingMode.MinimumCommon
    };

    /**
     * @private
     * Stores the common text size of each active context item.
     */
    private _itemTextSize?: number;

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
     * @param contexts - The ContextItems that belong to this ContextMenu. Note: This is more performant than calling @see {@link ContextMenu.AddContext} on each ContextItem.
     */
    constructor(triggerElement: Button,contexts?: ContextItem[]) {
        if (!(t.instanceIsA("TextButton") || t.instanceIsA("ImageButton"))) error("TriggerElement must be an instance of TextButton | ImageButton.");

        this.menuBG.Name = `ContextMenu-${triggerElement.Name}`;
        this.menuBG.BackgroundColor3 = Color3.fromRGB(64,64,64);
        this.menuBG.Visible = true;

        // When the trigger element is right clicked draw and display the context menu
        this._connections.push(
            triggerElement.MouseButton2Click.Connect(() => {
                if (ContextMenu.onlySingleContext && ContextMenu._previousMenu && ContextMenu._previousMenu !== this)
                    ContextMenu._previousMenu.menuBG.Parent = undefined;

                if (!this.menuBG.Parent) {
                    this.Draw();
                    this.menuBG.Parent = ContextMenu.contextMenuSG;
                } else {
                    this.menuBG.Parent = undefined;
                    if (ContextMenu._previousMenu === this) ContextMenu._previousMenu = undefined;
                }
            })
        );
        
        // When the trigger element's position is changed, redraw the context menu.
        this._connections.push(
            triggerElement.GetPropertyChangedSignal("Position").Connect(() => this.Draw())
        );

        triggerElement.Destroying.Connect(() => this.Destroy());

        this.triggerElement = triggerElement;
        
        if (!contexts) return;

        contexts.forEach(item => this._contexts.push(item));
    }

    /** Initializes the ContextMenu based off changed properties. */
    Init() {
        // Updates the text size of these context items that are TextButton elements
        this.updateTextSize();
    }

    /**
     * Draws the sizing and positioning for both the ContextMenu and ContextItems that are active.
     */
    Draw(): void {

        if (!this._itemTextSize) this.updateTextSize();

        // Get the updated screen size
        this.viewSize = ContextMenu.contextMenuSG.AbsoluteSize;

        const activeContexts: ContextItem[] = this.GetActiveContexts();
        const contextSize: number = activeContexts.size();

        // If no context; don't draw anything
        if (contextSize === 0) return;

        // If minItemSizeX was set to zero, assign it 1
        if (this.itemSize.X === 0) this.itemSize = this.itemSize.add(new Vector2(1,this.itemSize.Y));

        // If minItemSizeY was set to zero, assign it 1
        if (this.itemSize.Y === 0) this.itemSize = this.itemSize.add(new Vector2(this.itemSize.X,1));


        // The absolute size of the trigger element
        const absSizeY: number = this.triggerElement.AbsoluteSize.Y;

        // The absolute position of the trigger element
        const absPosY: number = this.triggerElement.AbsolutePosition.Y;

        // The minimum absolute size of each context item
        const itemAbsSizeY: number = math.ceil(this.itemSize.Y* absSizeY);

        // Get the used amount of space on the x axis in pixels of each context item
        const itemAbsSizeX: number = math.ceil(this.itemSize.X * this.triggerElement.AbsoluteSize.X);

        // Calculate the absolute position of the element from the top
        const yAnchor: number = this.triggerElement.AnchorPoint.Y;
        
        // Calculate the top left absolute y position of the trigger element
        const topAbsPosY: number = math.ceil(absPosY - absSizeY * yAnchor);

        // Calculate the left absolute x position of the trigger element
        const leftAbsPosX: number = this.triggerElement.AbsolutePosition.X - math.ceil(this.triggerElement.AbsoluteSize.X * this.triggerElement.AnchorPoint.X);

// #region ROWS_COLUMNS

        // Is the trigger element positioned over half the y screen
        const isSizeOverHalfY: boolean = absPosY > this.viewSize.Y / 2;

        let availableYPixels: number;
        if (isSizeOverHalfY) {
            // Prioritize pushing the context menu upwards before more columns
            availableYPixels = topAbsPosY;
        } else {
            // Check how much space is available going down
            availableYPixels = this.viewSize.Y - topAbsPosY;
        }

        // Calculate the rows available from the (minimum size / available pixels)
        let rows: number = math.floor(availableYPixels / itemAbsSizeY);

        // If there are less rows than context lower rows to contextSize
        if (rows > contextSize) rows = contextSize;

        // There is always one column
        let columns: number = 1;

        // If there is more items then rows available then create columns
        if (rows > 0 && rows < contextSize)
            columns = math.ceil(contextSize / rows);

        // Set the size of MenuBG x based on amount of columns and y based on rows
        this.menuBG.Size = new UDim2(0,columns * itemAbsSizeX,0,rows * itemAbsSizeY);

        // Calculate the right absolute position of the trigger element
        const rightAbsPosX: number = leftAbsPosX + itemAbsSizeX;

        const isSizeOverHalfX: boolean = leftAbsPosX > this.viewSize.X / 2;

        this.menuBG.Position = new UDim2(
            0,
            isSizeOverHalfX ? leftAbsPosX - this.menuBG.AbsoluteSize.X
            : rightAbsPosX + (this.triggerElement.AbsoluteSize.X - itemAbsSizeX),
            0,
            isSizeOverHalfY ?
            (topAbsPosY + -(this.menuBG.AbsoluteSize.Y - math.ceil(( 1 / this.itemSize.Y) * itemAbsSizeY)))
            : topAbsPosY
        );

        let itemIndex: number = 0;

        // Negate the minimum abs size for first element
        let lastPos: UDim2 = new UDim2(0,0,0,-itemAbsSizeY);

        for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
            for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
                const item: ContextItem = activeContexts[itemIndex];
                // If out of items then break
                if (!item) break;
                
                item.btn.Size = new UDim2(0,itemAbsSizeX,0,itemAbsSizeY);
                item.btn.Position = lastPos.add(new UDim2(0,0,0,itemAbsSizeY));
                lastPos = item.btn.Position;
                itemIndex++;
            }
            lastPos = new UDim2(0,itemAbsSizeX * (columnIndex + 1),0,-itemAbsSizeY);
        }
// #endregion

        // Parent each context item button to the MenuBG
        activeContexts.forEach(c => {
            if (c.btn.IsA("TextButton")) c.btn.TextSize = this._itemTextSize!;
            
            c.btn.Parent = this.menuBG;
        });

        ContextMenu._previousMenu = this;
    }

    /** Goes through each active @see {@link ContextItem} and uses it's text to determine a minimum size fit and will return the minimum fit and assign that to all ContextItem's. */
    GetCommonTextSize(absX: number, absY: number): number {
        let commonSize: number = 80;

        const tl: TextLabel = ContextMenu.textFitLabel;
        tl.TextSize = commonSize;
        tl.Size = new UDim2(0,absX,0,absY);

        for (const item of this.GetActiveContexts()) {
            if (!item.btn.IsA("TextButton")) continue;

            tl.Text = item.name;
    
            while(!tl.TextFits) {
                if (commonSize === 2) break;

                tl.TextSize = commonSize -= 2;
                RunService.Heartbeat.Wait();
            }
            commonSize = tl.TextSize;
        }

        return commonSize - commonSize / 4;
    }

    /**
     * Gets all the active ContextItems belonging to this ContextMenu.
     * @returns - An array of ContextItem.
     */
    GetActiveContexts(): ContextItem[] { return this._contexts.filter(c => c.isActive); }

    /**
     * Adds the given ContextItem to this ContextMenu.
     * @param context - The ContextItem object to add
     */
    AddContext(context: ContextItem) {
        this._contexts.push(context);
        this.updateTextSize();
    }

    /**
     * Removes the given ContextItem from this ContextMenu.
     * @param context - The ContextItem object to remove
     */
    RemoveContext(context: ContextItem) {
        const index: number = this._contexts.indexOf(context);
        if (index !== -1) this._contexts.remove(index);
        this.updateTextSize();
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

        // Destroy each ContextItem
        this._contexts.forEach(item => item.Destroy());

        // Disconnect each connection of this ContextMenu
        this._connections.forEach(conn => conn.Disconnect());
        this._connections = [];

        this.menuBG.Parent = undefined;
        this.triggerElement = undefined!;
        if (ContextMenu._previousMenu === this) ContextMenu._previousMenu = undefined;
    }

    /**
     * @private
     * Internally calculates the CommonTextSize based on the absolute size of the trigger element and your size modifiers.
     */
    private updateTextSize() {
        if (!this.triggerElement.IsA("TextButton")) return;

        if (this.options.textSizingMode === TextSizingMode.MinimumCommon) {
            // The minimum absolute size of each context item on the y axis
            const itemAbsSizeY: number = math.ceil(this.itemSize.Y * this.triggerElement.AbsoluteSize.Y);

            // The minimum absolute size of each context item on the x axis
            const itemAbsSizeX: number = math.ceil(this.itemSize.X * this.triggerElement.AbsoluteSize.X);

            this._itemTextSize = this.GetCommonTextSize(itemAbsSizeX,itemAbsSizeY);
        }
        else if (this.options.textSizingMode === TextSizingMode.Scaled)
            this._itemTextSize = this.textSizeScaler * this.triggerElement.TextSize;
    }
}

export { ContextMenu, ContextItem, Button, Callback, TextSizingMode, MenuOptions };