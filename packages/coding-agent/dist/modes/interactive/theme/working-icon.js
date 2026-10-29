// Shared "still working" indicator used across the agents view, the chat
// subagent tray, and in-progress tool markers so motion reads consistently.
export const WORKING_ICON_FRAMES = ["◇", "◈", "◆", "◈"];
export const WORKING_ICON_INTERVAL_MS = 250;
export function workingIconFrame(frame) {
    const frames = WORKING_ICON_FRAMES;
    return frames[((frame % frames.length) + frames.length) % frames.length] ?? frames[0];
}
// Process-wide frame counter for in-place chat tool markers, advanced by the
// interactive mode's single ticker and read during render.
let pulseFrame = 0;
export function getWorkingPulseFrame() {
    return pulseFrame;
}
export function setWorkingPulseFrame(frame) {
    pulseFrame = frame;
}
//# sourceMappingURL=working-icon.js.map