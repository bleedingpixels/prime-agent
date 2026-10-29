/** SGR mouse event parsing (CSI < button ; x ; y M/m). */
export interface MouseEvent {
    /** Base button code with modifier/motion bits stripped (wheel: 64 up, 65 down). */
    button: number;
    /** 1-based column. */
    x: number;
    /** 1-based row. */
    y: number;
    /** True for press/wheel/drag ("M"), false for release ("m"). */
    press: boolean;
    /** True for drag/motion reports (bit 32). */
    motion: boolean;
    shift: boolean;
    alt: boolean;
    ctrl: boolean;
}
export declare const MOUSE_WHEEL_UP = 64;
export declare const MOUSE_WHEEL_DOWN = 65;
export declare const MOUSE_BUTTON_LEFT = 0;
/** True for any mouse report (SGR or legacy), parseable or not. */
export declare function isMouseSequence(sequence: string): boolean;
export declare function parseSgrMouseEvent(sequence: string): MouseEvent | null;
export declare function isWheelUp(event: MouseEvent): boolean;
export declare function isWheelDown(event: MouseEvent): boolean;
//# sourceMappingURL=mouse.d.ts.map