import { Box, Container, Text } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
/** Renders a durable session-command outcome with user-message spacing. */
export class SlashCommandResultMessageComponent extends Container {
    constructor(message) {
        super();
        const contentBox = new Box(2, 1, (text) => theme.getUserMessageBackgroundColor()(text));
        contentBox.addChild(new Text(message.content, 0, 0));
        this.addChild(contentBox);
    }
    setExpanded(_expanded) { }
}
//# sourceMappingURL=slash-command-result-message.js.map