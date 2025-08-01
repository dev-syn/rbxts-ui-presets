import { Controller, OnStart } from '@flamework/core';
import Component from './core/ui_components';
import { RunService } from '@rbxts/services';
import { UUID } from './typings';
import { Signal } from '@rbxts/beacon';
import ComponentType from './core/ui_components/ComponentType';

interface SharedDefaultAttributes {
	UUID: UUID;
}

const HttpService: HttpService = game.GetService('HttpService');

function getSharedDefaultAttributes(): SharedDefaultAttributes {
	return {
		UUID: "{N/A}"
	}
}

@Controller()
class UIPresetsService implements OnStart {

	Components: Map<string,Component> = new Map();

	/** Configurable options of UIPresetsService. */
	Options = {
		/**
		 * Whether UIPresets should optimize itself and use parallel lua benefits.
		 * WARNING: The calling thread script must be within a Actor Instance. 
		 */
		ParallelEnabled: false
	}

	/**
	 * The highest display order of all the ScreenGui instances within the PlayerGui.
	 */
	HighestUIOrder: number = 0;
	OnUIOrderChanged: Signal<[newOrder: number]> = new Signal();

	private _playerGui!: PlayerGui;
	private _excludedConnections = new Map<ScreenGui,RBXScriptConnection>()

	onStart(): void {
		this._playerGui = game.GetService('Players').LocalPlayer.WaitForChild('PlayerGui') as PlayerGui;
		this._playerGui.ChildAdded.Connect(() => {
			const newOrder: number = this.fetchHighestUIOrder();
			this.HighestUIOrder = newOrder;
			this.OnUIOrderChanged.Fire(newOrder);
		});

		this.HighestUIOrder = this.fetchHighestUIOrder();
	}

	attachComponent(instance: GuiObject,component: ComponentType): void
	{ instance.AddTag(component); }

	/** Fetches a truly unique identifier. */
	fetchNewUUID(): string {
		let uuid: string;
		while (true) {
			uuid = HttpService.GenerateGUID(false);
			if (!this.Components.has(uuid)) break;
			RunService.Heartbeat.Wait();
		}
		return uuid;
	}

	/** Fetches the highest ScreenGui(UI).DisplayOrder ignoring the excluded ui elements. */
	fetchHighestUIOrder(): number {
		const excludedOrders: Map<ScreenGui,RBXScriptConnection> = this._excludedConnections;

		const children: ScreenGui[] = this._playerGui.GetChildren()
		.filter<ScreenGui>(
			(child): child is ScreenGui => child.IsA("ScreenGui") && !excludedOrders.has(child)
		);

		if (children.size() === 0) return 0;

		table.sort(children,(a,b) => a.DisplayOrder > b.DisplayOrder);
		return children[0].DisplayOrder;
	}

	/**
	 * Updates the highest display order assigning the highest and firing the {@link UIPresetsConfig.OnDisplayOrderChanged} Signal.
	 * @private
	 */
	private updateDisplayOrder() {
		const newOrder: number = this.fetchHighestUIOrder();
		this.HighestUIOrder = newOrder;
		this.OnUIOrderChanged.Fire(newOrder);
	}

	/**
	 * Excludes a ScreenGui display from the ordering calculations
	 * @param ui The ScreenGui to be excluded
	 */
	excludeDisplay(
		ui: ScreenGui
	): void {
		if (this._excludedConnections.has(ui)) return;

		const conn: RBXScriptConnection =
		ui.GetPropertyChangedSignal('DisplayOrder').Connect(() => this.updateDisplayOrder());
		this._excludedConnections.set(ui,conn);
	}

	/**
	 * Deletes the excluded display order ScreenGui
	 * @param ui The ScreenGui to delete from the excluded display orders.
	 */
	deleteDisplay(ui: ScreenGui) {
		const conn: RBXScriptConnection | undefined = this._excludedConnections.get(ui);
		if (conn) {
			conn.Disconnect();
			this._excludedConnections.delete(ui);
		}
	}

}

export = UIPresetsService;