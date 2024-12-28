/** A table of configurable options that change the default behavior of {@link BoundCheck}. */
interface BoundCheckOptions {
    /** Whether this BoundCheck should only trigger as in bounds if it's the topmost element in bounds, Otherwise the bound check will still be within bounds even if another UI is on top of it. Default(false) */
    TopMostOnly: boolean;
    /** Whether this BoundCheck should ignore the gui inset of '36' pixels. Default(false) */
    IgnoreGuiInset: boolean;
    /** Whether this {@link BoundCheck} will skip querying on elements that are not visible, Otherwise the element will still bound check when element is invisible. Default(true) */
    ConsiderVisibility: boolean;
}

/** A bound coordinate contains a X and Y absolute position. */
interface BoundCoord {
    X: number;
    Y: number;
}

export { BoundCheckOptions, BoundCoord }