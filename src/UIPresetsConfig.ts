import { Signal } from '@rbxts/beacon';

enum ComponentRecord {
    ContextMenu = "ContextMenu",
    Navbar = "Navbar",
    SelectableGroup = "SelectableGroup",
    ToolTip = "ToolTip"
}

/** This is a configuration module for UIPresets that will change behaviour across components. */
class UIPresetsConfig {

    /**
     * Whether UIPresets should optimize itself and use parallel lua benefits.
     * WARNING: The calling thread script must be within a Actor Instance. 
     */
    static ParallelEnabled: boolean = false;

    /** The highest display order of all the ScreenGui instances within the PlayerGui. */
    static HighestDisplayOrder: number;
    /** A beacon signal that fires when the highest display order is changed, passing the new highest display order. */
    static OnDisplayOrderChanged: Signal<[newOrder: number]> = new Signal();
    
    private static _excludedDisplayOrders: Map<ScreenGui,true> = new Map();
    private static _excludedConnections: Map<ScreenGui,RBXScriptConnection[]> = new Map();
    private static _displayOrderConn: RBXScriptConnection;
    private static _playerGui: PlayerGui = game.GetService('Players').LocalPlayer.WaitForChild('PlayerGui') as PlayerGui;

    static {
        this._displayOrderConn = this._playerGui.ChildAdded.Connect(() => {
            const newOrder: number = this.FetchHighestDisplayOrder();
            this.HighestDisplayOrder = newOrder;
            this.OnDisplayOrderChanged.Fire(newOrder);
        });
        this.HighestDisplayOrder = this.FetchHighestDisplayOrder();
    }

    /**
     * Fetches the highest display order of all ScreenGui instances within PlayerGui.
     * @returns The highest display order
     */
    static FetchHighestDisplayOrder(): number {
        const excludedOrders: Map<ScreenGui,true> = this._excludedDisplayOrders;
        const children: ScreenGui[] = this._playerGui.GetChildren().filter<ScreenGui>((child): child is ScreenGui => child.IsA("ScreenGui") && !excludedOrders.has(child));
        if (children.size() === 0) return 0;

        table.sort(children,(a,b) => a.DisplayOrder > b.DisplayOrder);
        return children[0].DisplayOrder;
    }

    /** Excludes a ScreenGui from highest display order allowing multiple ScreenGui instances to be drawn on top of all components. */
    static ExcludeDisplay(ui: ScreenGui) {
        this.excludeDisplay(ui);

        // Update the highest display order when the display order is changed
        this.updateDisplayOrder();
    }

    /**
     * Excludes multiple ScreenGui instances same behavior as ExcludeDisplay except
     * that the display order is arranged after adding all displays rather then per one. The DisplayOrder changed connection is deferred until the end of the resumption cycle.
     */
    static ExcludeDisplays(uis: ScreenGui[]) {
        for (const ui of uis) { this.excludeDisplay(ui,true); }

        // Update the highest display order when the display order is changed
        this.updateDisplayOrder();
    }

    /**
     * Updates the highest display order assigning the highest and firing the {@link UIPresetsConfig.OnDisplayOrderChanged} Signal.
     * @private
     */
    private static updateDisplayOrder() {
        const newOrder: number = this.FetchHighestDisplayOrder();
        this.HighestDisplayOrder = newOrder;
        this.OnDisplayOrderChanged.Fire(newOrder);
    }

    /**
     * This method is the internal excludeDisplay and is not meant to be called externally.
     * @param ui The ScreenGui to exclude
     * @param deferOrderChanged Whether the DisplayOrder property changed signal should be deferred till the end of the resumption cycle. Default(false)
     * @private
     */
    private static excludeDisplay(ui: ScreenGui,deferOrderChanged: boolean = false) {
        const uiConnections: RBXScriptConnection[] = [];
        
        ui.Destroying.Once(() => this.deleteDisplay(ui));
        if (deferOrderChanged) task.defer((ui,uiConnections) => uiConnections.push(ui.GetPropertyChangedSignal('DisplayOrder').Connect(() => this.updateDisplayOrder())),ui,uiConnections);
        else uiConnections.push(ui.GetPropertyChangedSignal('DisplayOrder').Connect(() => this.updateDisplayOrder()));
        this._excludedConnections.set(ui,uiConnections);
    }

    /**
     * Deletes the excluded display order ScreenGui reference and connections.
     * @param ui The ScreenGui to delete from the excluded display orders.
     * @private
     */
    private static deleteDisplay(ui: ScreenGui) {
        const uiConnections: RBXScriptConnection[] | undefined = this._excludedConnections.get(ui);
        if (uiConnections) {
            uiConnections.forEach(conn => conn.Disconnect());
            this._excludedConnections.delete(ui);
        }
        this._excludedDisplayOrders.delete(ui);
    }

}

export { ComponentRecord, UIPresetsConfig };