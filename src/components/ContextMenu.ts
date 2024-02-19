import { t } from '@rbxts/t';

type Button = TextButton | ImageButton;

type Callback = () => void;

class ContextItem {
    name: string;
    btn: TextButton = new Instance("TextButton");
    isActive: boolean = true;

    private _connection?: RBXScriptConnection;
    private _action: Callback;

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

    SetActive(active: boolean) {
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

    Destroy() {
        this.btn.Destroy();
        this._connection = undefined;
    }
}

class ContextMenu {
    triggerElement: Button;

    MenuBG: Frame = new Instance("Frame");
    UIListLayout: UIListLayout = new Instance("UIListLayout");

    /** A number between 0 and 1 representing a percent of the parent triggerElement x size. */
    minMenuSizeX: number = 0.4;
    minItemSizeY: number = 0.33;

    viewSize?: Vector2;

    private _contexts: ContextItem[] = [];
    private _connections: RBXScriptConnection[] = [];

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

    GetActiveContexts(): ContextItem[] { return this._contexts.filter(c => c.isActive); }

    Draw() {
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
                this.MenuBG.Position = this.MenuBG.Position.sub(new UDim2(0,0,0,math.abs(this.viewSize.Y - centerBottomPos)));

        }

        const minSizeUnit: number = absSizeY * this.minItemSizeY;
        activeContexts.forEach(c => {
            c.btn.Size = new UDim2(1,0,0,minSizeUnit);
            c.btn.Parent = this.MenuBG;
        });
    }

    AddContext(context: ContextItem) {
        this._contexts.push(context);
    }

    RemoveContext(context: ContextItem) {
        const index: number = this._contexts.indexOf(context);
        if (index !== -1) this._contexts.remove(index);
    }

    Clear() {
        this._contexts.clear();
    }

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