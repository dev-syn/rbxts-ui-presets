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

class ContextMenu {

    static ContextMenuSG: ScreenGui = new Instance("ScreenGui");

    static {
        this.ContextMenuSG.Name = "ContextMenuSG";
        this.ContextMenuSG.DisplayOrder = 10000;
        this.ContextMenuSG.ResetOnSpawn = false;
        this.ContextMenuSG.Parent = game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui");
    }
    /** The button element that triggers this ContextMenu */
    triggerElement: Button;

    /** The ContextMenu background Frame Instance. */
    MenuBG: Frame = new Instance("Frame");

    /** A number above zero representing the minimum ContextItem size on the y axis. */
    minItemSizeY: number = 1;

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

        this.MenuBG.Name = `ContextMenu-${triggerElement.Name}`;
        this.MenuBG.BackgroundColor3 = Color3.fromRGB(64,64,64);
        this.MenuBG.Visible = true;

        // Position the MenuBG to the right of the trigger element
        this.MenuBG.Position = new UDim2(1,0,0,0);

        // When the trigger element is right clicked draw and display the context menu
        this._connections.push(
            triggerElement.MouseButton2Click.Connect(() => {
                if (!this.MenuBG.Parent) {
                    this.Draw();
                    this.MenuBG.Parent = ContextMenu.ContextMenuSG;
                } else {
                    this.MenuBG.Parent = undefined;
                }
            })
        );
        
        // When the trigger element's position is changed, redraw the context menu.
        this._connections.push(
            triggerElement.GetPropertyChangedSignal("Position").Connect(() => this.Draw())
        );

        triggerElement.Destroying.Connect(() => this.Destroy());

        this.triggerElement = triggerElement;
    }

    /**
     * Draws the sizing and positioning for both the ContextMenu and ContextItems that are active.
     */
    Draw(): void {

        // Get the updated screen size
        this.viewSize = ContextMenu.ContextMenuSG.AbsoluteSize;

        const activeContexts: ContextItem[] = this.GetActiveContexts();
        const contextSize: number = activeContexts.size();

        // If no context; don't draw anything
        if (contextSize === 0) return;
        // If minItemSizeY was set to zero, assign it 1.
        if (this.minItemSizeY === 0) this.minItemSizeY = 1;


        // The absolute size of the trigger element
        const absSizeY: number = this.triggerElement.AbsoluteSize.Y;

        // The absolute position of the trigger element
        const absPosY: number = this.triggerElement.AbsolutePosition.Y;

        // The minimum absolute size of each context item
        const minItemAbsSizeY: number = this.minItemSizeY * absSizeY;

        // Get the used amount of space on the x axis in pixels of each context item
        const usedXPixels: number = this.triggerElement.AbsoluteSize.X;

        // Calculate the absolute position of the element from the top
        const yAnchor: number = this.triggerElement.AnchorPoint.Y;
        
        // Calculate the top left absolute y position of the trigger element
        const topAbsPosY: number = absPosY - absSizeY * yAnchor;

        // Calculate the left absolute x position of the trigger element
        const leftAbsPosX: number = this.triggerElement.AbsolutePosition.X - this.triggerElement.AbsoluteSize.X * this.triggerElement.AnchorPoint.X;

// #region ROWS_COLUMNS

        // Is the trigger element positioned over half the y screen
        const isSizeOverHalfY: boolean = absPosY > this.viewSize.Y / 2;

        let availableYPixels: number;
        if (isSizeOverHalfY) {
            // Prioritize pushing the context menu upwards before more columns
            availableYPixels = topAbsPosY + minItemAbsSizeY;
        } else {
            // Check how much space is available going down
            availableYPixels = this.viewSize.Y - topAbsPosY;
        }

        // Calculate the rows available from the (minimum size / available pixels)
        let rows: number = math.floor(availableYPixels / minItemAbsSizeY);

        // If there are less rows than context lower rows to contextSize
        if (rows > contextSize) rows = contextSize;

        // There is always one column
        let columns: number = 1;

        // If there is more items then rows available then create columns
        if (rows > 0 && rows < contextSize)
            columns = math.ceil(contextSize / rows);

        // Set the size of MenuBG x based on amount of columns and y based on rows
        this.MenuBG.Size = new UDim2(0,columns * usedXPixels,0,rows * minItemAbsSizeY);

        // Calculate the right absolute position of the trigger element
        const rightAbsPosX: number = leftAbsPosX + usedXPixels;

        if (isSizeOverHalfY) this.MenuBG.Position = new UDim2(0,rightAbsPosX,0,topAbsPosY + -(this.MenuBG.AbsoluteSize.Y - ( 1 / this.minItemSizeY) * minItemAbsSizeY));
        else this.MenuBG.Position = new UDim2(0,rightAbsPosX,0,topAbsPosY);

        // Is the trigger element positioned over half the y screen
        const isSizeOverHalfX: boolean = leftAbsPosX > this.viewSize.X / 2;
        if (isSizeOverHalfX) this.MenuBG.Position = this.MenuBG.Position.sub(new UDim2(0,usedXPixels + usedXPixels * columns,0,0));

        let itemIndex: number = 0;

        // Negate the minimum abs size for first element
        let lastPos: UDim2 = new UDim2(0,0,0,-minItemAbsSizeY);

        for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
            for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
                const item: ContextItem = activeContexts[itemIndex];
                // If out of items then break
                if (!item) break;
                
                item.btn.Size = new UDim2(0,usedXPixels,0,minItemAbsSizeY);
                item.btn.Position = lastPos.add(new UDim2(0,0,0,minItemAbsSizeY));
                lastPos = item.btn.Position;
                itemIndex++;
            }
            lastPos = new UDim2(0,usedXPixels * (columnIndex + 1),0,-minItemAbsSizeY);
        }
// #endregion

        // Parent each context item button to the MenuBG
        activeContexts.forEach(c => c.btn.Parent = this.MenuBG);
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

        // Destroy each ContextItem
        this._contexts.forEach(item => item.Destroy());

        // Disconnect each connection of this ContextMenu
        this._connections.forEach(conn => conn.Disconnect());
        this._connections = [];

        this.MenuBG.Parent = undefined;
        this.triggerElement = undefined!;
    }
}

export { ContextMenu, ContextItem, Button, Callback };