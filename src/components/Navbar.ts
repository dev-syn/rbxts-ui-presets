import Component from 'components';
import type { Components } from 'types/components';

type Button = TextButton | ImageButton;

/**
 * This is a UI component that was designed to ease the flow of a navigation UI. Allowing you to assign buttons to a frame and when they are clicked will show that frame and hide the previous.
 */
class Navbar<
    /** The Frame or ScrollingFrame that is the Navbar. */
    T extends Frame | ScrollingFrame,
    /** A map that stores the Navigation button to a Navigation Frame. */
    NavigationFrames extends Map<Button,Frame | ScrollingFrame>> extends Component
{
    /** {@inheritDoc Component} */
    Type = "Navbar" as Components;    
    
    /**
     * The NavBar Instance that contains the navigation buttons normally with a UIListLayout but not required.
     * @typeParam T - The Frame | ScrollingFrame that contains the nav buttons
     */
    NavBarUI: T

    /**
     * The current frame that was navigated to.
     */
    CurrentFrame?: Frame | ScrollingFrame;
    
    /**
     * This is a dictionary structure that contains the navigation buttons to their respective Frame Instances.
     */
    NavigationableFrames: NavigationFrames;

    /**
     * This property is responsible for maintaining a consistent button count of 1 as the MainBtn
     * will not be affected by {@link Navbar.HideButtons}. Warning: By assigning this property you will not be able to Hide that specific button.
     */
    MainBtn?: TextButton;
    
    /** Creates a new NavbarController. */
    constructor(navBar: T,navigationableFrames: NavigationFrames,mainBtn?: TextButton) {
        super();
        this.NavBarUI = navBar;
        this.NavigationableFrames = navigationableFrames;
        this.MainBtn = mainBtn;
    }

    /**
     * Shows the given buttons inside the Navbar and hides all the others, excluding the MainBtn if assigned.
     * @param uiObjects - An array of GuiObjects to be shown. Any GuiObject in the Navbar that is not included will be hidden.
     */
    ShowButtons(uiObjects: Button[]) {
        for (const child of this.NavBarUI.GetChildren()) {
            if (child.IsA("TextButton") || child.IsA("ImageButton")) {
                const uiObject = child as Button;
                uiObject.Visible = uiObject !== this.MainBtn ? uiObjects.includes(uiObject) : true;
            }
        }
    }

    /**
     * Hides the given buttons inside the Navbar.
     * 
     * NOTICE: If the Navbar has a MainBtn, the MainBtn cannot be hidden.
     * @param uiObjects - An array of GuiObjects to be hidden.
     */
    HideButtons(uiObjects: Button[]) {
        for (const child of this.NavBarUI.GetChildren()) {
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
        for (const child of this.NavBarUI.GetChildren()) {
            if (child.IsA("GuiObject")) {
                const uiObject = child as GuiObject;
                if (this.MainBtn && this.MainBtn === uiObject) continue;
                uiObject.Visible = false;
            }
        }
    }

    /**
     * Assigns a navBtn to a Frame | ScrollingFrame instance that when you press the navBtn it will show it's associated frame.
     * @param navBtn The nav button to assign
     * @param frame The frame instance that belongs to the navBtn
     */
    AssignFrame(navBtn: Button,frame: Frame | ScrollingFrame) {
        this.NavigationableFrames.set(navBtn,frame);
        navBtn.MouseButton1Click.Connect(() => {
            if (this.CurrentFrame && this.CurrentFrame !== frame) {
                this.CurrentFrame.Visible = false;
            }
            frame.Visible = true;
            this.CurrentFrame = frame;
        });
    }

    /**
     * Shows a navigation frame using the given navBtn.
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