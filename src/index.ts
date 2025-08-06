import { Controller, Dependency, OnStart } from '@flamework/core';
import { RunService } from '@rbxts/services';
import { Signal } from '@rbxts/beacon';
import { ComponentTag } from './core/ui_components/ComponentTag';
import { PresetTag } from './core/presets/PresetTag';
import { Components } from '@flamework/components';
import { ConstructorRef } from '@flamework/components/out/utility';
import { UIPreset } from './core/presets';
import { UIComponent } from './core/ui_components';
import { ComponentRegistry } from './core/ui_components/ComponentRegistry';
import { PresetRegistry } from './core/presets/PresetRegistry';
import { t } from '@rbxts/t';

const HttpService: HttpService = game.GetService('HttpService');

@Controller()
class UIPresetsService implements OnStart {

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

	private _components: Map<string,UIPreset | UIComponent> = new Map();
	private _playerGui!: PlayerGui;
	private _excludedFromOrdering = new Map<ScreenGui,true>;
	private _orderChangedConnections = new Map<ScreenGui,RBXScriptConnection>;

	onStart(): void {
		this._playerGui = game.GetService('Players').LocalPlayer.WaitForChild('PlayerGui') as PlayerGui;

		this._playerGui.ChildAdded.Connect((child: Instance) => {
			if (!t.instanceIsA("ScreenGui")(child)) return;

			this._orderChangedConnections.set(
				child,
				child.GetPropertyChangedSignal('DisplayOrder').Connect(() => this.updateDisplayOrder())
			);

			child.Destroying.Once(() => this.deleteDisplay(child));

		});


		this.HighestUIOrder = this.fetchHighestUIOrder();
	}

	async attachComponent<T extends UIComponent = UIComponent>
	(instance: GuiObject,tag: typeof ComponentTag[keyof typeof ComponentTag]): Promise<T> {
		if (!ComponentRegistry[tag]) throw error(`Component with tag ${tag} not found.`);
		
		instance.AddTag(tag);
		const components = Dependency<Components>();
		const component = await components.waitForComponent<T>(
			instance,
			ComponentRegistry[tag] as unknown as ConstructorRef<T>
		);
		this._components.set(component.UUID,component);
		return component;
	}

	async attachPreset<T extends UIPreset = UIPreset>
	(tag: typeof PresetTag[keyof typeof PresetTag]): Promise<T> {
		if (!PresetRegistry[tag]) throw `Preset component with tag ${tag} not found.`;

		const presetClass = PresetRegistry[tag];

		let instance = presetClass.PresetInstance();
		if (!typeIs(instance,"function")) throw `Invalid UIPreset.PresetInstance from preset: ${tag}`;

		instance.AddTag(tag);
		const components = Dependency<Components>();
		const component = await components.waitForComponent<T>(
			instance,
			presetClass as unknown as ConstructorRef<T>
		);
		this._components.set(component.UUID,component);
		return component;
	}

	/** Fetches a truly unique identifier. */
	fetchNewUUID(): string {
		let uuid: string;
		while (true) {
			uuid = HttpService.GenerateGUID(false);
			if (!this._components.has(uuid)) break;
			RunService.Heartbeat.Wait();
		}
		return uuid;
	}

	/** Fetches the highest {@link ScreenGui.DisplayOrder} ignoring the excluded {@link ScreenGui} objects. */
	fetchHighestUIOrder(): number {
		const excludedOrdering = this._excludedFromOrdering;

		const children: ScreenGui[] = this._playerGui.GetChildren()
		.filter<ScreenGui>(
			(child): child is ScreenGui => child.IsA("ScreenGui") && !excludedOrdering.has(child)
		);

		if (children.size() === 0) return 0;

		table.sort(children,(a,b) => a.DisplayOrder > b.DisplayOrder);
		return children[0].DisplayOrder;
	}

	/**
	 * Excludes a ScreenGui display from the ordering calculations.
	 * @param ui The ScreenGui to be excluded
	 */
	excludeDisplay(
		ui: ScreenGui
	): void {
		if (this._excludedFromOrdering.has(ui)) return;
		this._excludedFromOrdering.set(ui,true);
	}

	/**
	 * Deletes the excluded display order ScreenGui
	 * @param ui The ScreenGui to delete from the excluded display orders.
	 */
	deleteDisplay(ui: ScreenGui): boolean { return this._excludedFromOrdering.delete(ui); }

// #region PRIVATE
	/**
	 * Updates the highest display order assigning the highest and firing the {@link UIPresetsConfig.OnDisplayOrderChanged} Signal.
	 * @private
	 */
	private updateDisplayOrder() {
		const newOrder: number = this.fetchHighestUIOrder();
		this.HighestUIOrder = newOrder;
		this.OnUIOrderChanged.Fire(newOrder);
	}
// #endregion

}

export = UIPresetsService;