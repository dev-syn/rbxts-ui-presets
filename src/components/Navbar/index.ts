import Object from '@rbxts/object-utils';
import { Component } from 'components';
import type { Components } from 'types/components';

type Button = TextButton | ImageButton;

/**
 * This is a UI component that was designed to ease the flow of a navigation UI. Allowing you to assign buttons to a frame and when they are clicked will show that frame and hide the previous.
 */
class Navbar<
    /** The Frame or ScrollingFrame that is the Navbar. */
    T extends Frame | ScrollingFrame> extends Component<T>
{
    /** {@inheritDoc Component} */
    Type = "Navbar" as Components;    
    
    /**
     * The NavBar Instance that contains the navigation buttons normally with a UIListLayout but not required.
     * @typeParam T - The Frame | ScrollingFrame that contains the nav buttons
     */
    declare Owner: T

    /**
     * The current frame that is navigated to.
     */
    CurrentFrame?: Frame | ScrollingFrame;
    
    /**
     * This is a dictionary structure that contains the navigation buttons to their respective Frame/ScrollingFrame Instances.
     */
    NavigationableFrames: Map<Button,Frame | ScrollingFrame>;

    /**
     * This property is responsible for maintaining a consistent button count of 1 as the MainBtn
     * will not be affected by {@link Navbar.HideButtons}. Warning: By assigning this property you will not be able to Hide that specific button.
     */
    MainBtn?: TextButton;

    private _buttonConnections: Map<Button,Map<string,RBXScriptConnection>> = new Map();
    
    /** Creates a new Navbar controller component. */
    constructor(owner: T,navigationableFrames: Map<Button,Frame | ScrollingFrame>,mainBtn?: TextButton) {
        super(owner);
        this.NavigationableFrames = navigationableFrames;
        this.MainBtn = mainBtn;
    }

    /**
     * Destroys this Navbar object, this will remove all references. 
     * NOTE: This **will not** Destroy the buttons or the frames that were given to this component unless you pass 'destroyInstances' as true.
     * @param [destroyInstances=false] - If true, the instances that were used in the component will also be destroyed
     */
    Destroy(destroyInstances: boolean = false) {
        super.Destroy();
        this.CurrentFrame = undefined;

        if (!destroyInstances) {
            // Remove connections that belong to the instances
            for (const [btn,connMap] of Object.entries(this._buttonConnections)) {
                for (const conn of Object.values(connMap)) { conn.Disconnect(); }
            }
        } else {
            // Destroy each button and frame in the navigationable frames.
            for (const [btn,frame] of Object.entries(this.NavigationableFrames)) {
                btn.Destroy();
                frame.Destroy();
            }
        }
        this._buttonConnections.clear();
        this.NavigationableFrames.clear();
        // Remove lingering references
        this.CurrentFrame = undefined;
        this.MainBtn = undefined;
    }

    /**
     * Shows the given buttons inside the Navbar and hides all the others, excluding the MainBtn if assigned.
     * @param uiObjects - An array of GuiObjects to be shown. Any GuiObject in the Navbar that is not included will be hidden.
     */
    ShowButtons(uiObjects: Button[]) {
        for (const child of this.Owner.GetChildren()) {
            if (child.IsA("TextButton") || child.IsA("ImageButton")) {
                const uiObject = child as Button;
                uiObject.Visible = uiObject !== this.MainBtn ? uiObjects.includes(uiObject) : true;
            }
        }
    }

    /** Shows **ALL** of the buttons that belong to this Navbar. */
    ShowAllButtons() {
        for (const btn of Object.keys(this.NavigationableFrames)) { btn.Visible = true; }
    }

    /**
     * Hides the given buttons inside the Navbar.
     * 
     * NOTICE: If the Navbar has a MainBtn, the MainBtn cannot be hidden.
     * @param uiObjects - An array of GuiObjects to be hidden.
     */
    HideButtons(uiObjects: Button[]) {
        for (const child of this.Owner.GetChildren()) {
            if (child.IsA("TextButton") || child.IsA("ImageButton")) {
                const uiObject = child as Button;
                if (uiObjects.includes(uiObject)) {
                    // If a MainBtn exist, check if the ui is the main button and prevent visibility change
                    if (this.MainBtn && uiObject === this.MainBtn) continue;
                    uiObject.Visible = false;
                }
            }
        }
    }

    /**
     * Hides all the buttons inside the Navbar
     * 
     * NOTICE: If the Navbar has a MainBtn, the MainBtn cannot be hidden.
     */
    HideAllButtons() {
        for (const child of this.Owner.GetChildren()) {
            if (child.IsA("GuiObject")) {
                const uiObject = child as GuiObject;
                if (this.MainBtn && this.MainBtn === uiObject) continue;
                uiObject.Visible = false;
            }
        }
    }

    /**
     * Assigns a navigation {@link Button} to a frame type {@link Frame} | {@link ScrollingFrame}.
     * This means that when the navigation button is clicked, it will show the assigned frame type.
     * @param navBtn The nav button to assign
     * @param frame The frame instance that belongs to the navBtn
     */
    AssignFrame(navBtn: Button,frame: Frame | ScrollingFrame) {
        this.NavigationableFrames.set(navBtn,frame);
        let btnConnections: Map<string,RBXScriptConnection> | undefined = this._buttonConnections.get(navBtn);
        if (!btnConnections) {
            btnConnections = new Map();
            this._buttonConnections.set(navBtn,btnConnections);
        }

        // If no connections exist, create the Destroy connection
        if (!btnConnections.has('Destroying'))
            btnConnections.set('Destroying',navBtn.Destroying.Connect(() => this._buttonConnections.delete(navBtn)));

        let clickEvent: RBXScriptConnection | undefined = btnConnections.get('MouseButton1Click');

        // If a click connection does not exist for this navBtn, create a connection to the click event
        if (!clickEvent) 
            btnConnections.set('MouseButton1Click',navBtn.MouseButton1Click.Connect(() => {
                if (this.CurrentFrame && this.CurrentFrame !== frame) {
                    this.CurrentFrame.Visible = false;
                }
                frame.Visible = true;
                this.CurrentFrame = frame;
            }));
        
    }

    /**
     * Shows the navigation frame related to the given navigation button.
     * @param navBtn The navBtn that is associated to a nav frame.
     */
    ShowFrame(navBtn: Button) {
        const navFrame: Frame | ScrollingFrame | undefined = this.NavigationableFrames.get(navBtn);
        if (!navFrame) return;

        if (this.CurrentFrame) this.CurrentFrame.Visible = false;

        this.CurrentFrame = navFrame;
        navFrame.Visible = true;
    }

};

export = Navbar;