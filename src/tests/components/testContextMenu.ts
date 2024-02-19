import { ContextItem, ContextMenu } from '../../components/ContextMenu';

const player: Player = game.GetService('Players').LocalPlayer;
print(player);

const sg: ScreenGui = new Instance("ScreenGui");
sg.ResetOnSpawn = false;
sg.Parent = player.WaitForChild("PlayerGui");

const btn: TextButton = new Instance("TextButton");
btn.Size = new UDim2(0.4,0,0.4,0);
btn.Position = new UDim2(0.5,0,0.85,0);
btn.AnchorPoint = new Vector2(0.5,0.5);
btn.Parent = sg;

const menu: ContextMenu = new ContextMenu(btn);
menu.minItemSizeY = 0.5;
menu.AddContext(new ContextItem("Say Hello",() => print("Hello!")));
menu.AddContext(new ContextItem("Say Cheese",() => print("Cheese!")));
menu.AddContext(new ContextItem("Say Smile",() => print("Smile!")));
menu.AddContext(new ContextItem("Say Goodbye",() => print("Goodbye!")));