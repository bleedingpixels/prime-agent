import { Box, Container, Markdown, visibleWidth } from "@earendil-works/pi-tui";
import { parseSlashCommand } from "../../../core/slash-commands.js";
import { getMarkdownTheme, theme } from "../theme/theme.js";
import { isLeadingSlashCommand } from "./slash-command-message.js";
const OSC133_ZONE_START = "\x1b]133;A\x07";
const OSC133_ZONE_END = "\x1b]133;B\x07";
const OSC133_ZONE_FINAL = "\x1b]133;C\x07";
const COMMAND_MASK_BASE = "\uE000";
const COMMAND_MASK_EXTRA_WIDTH = "\uFF9E";
const COMMAND_MASK_ZERO_WIDTH = "\u2060";
const COMMAND_MASK_PATTERN = /\u2060|\uE000\uFF9E*/gu;
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
class SlashCommandMarkdown {
    markdown;
    commandGraphemes;
    constructor(text, markdownTheme) {
        const parsed = parseSlashCommand(text);
        const commandEnd = parsed ? parsed.name.length + 1 : text.length;
        this.commandGraphemes = [...graphemeSegmenter.segment(text.slice(0, commandEnd))].map(({ segment }) => segment);
        const placeholder = this.commandGraphemes
            .map((grapheme) => {
            const width = visibleWidth(grapheme);
            return width === 0
                ? COMMAND_MASK_ZERO_WIDTH
                : COMMAND_MASK_BASE + COMMAND_MASK_EXTRA_WIDTH.repeat(width - 1);
        })
            .join("");
        this.markdown = new Markdown(`${placeholder}${text.slice(commandEnd)}`, 0, 0, markdownTheme, {
            color: (content) => theme.fg("userMessageText", content),
        });
    }
    render(width) {
        let commandOffset = 0;
        return this.markdown.render(width).map((line) => {
            const chunks = [];
            const replaced = line.replace(COMMAND_MASK_PATTERN, (placeholder) => {
                const grapheme = this.commandGraphemes[commandOffset];
                if (grapheme === undefined)
                    return placeholder;
                commandOffset++;
                chunks.push(grapheme);
                return "";
            });
            return chunks.length === 0 ? replaced : `${theme.fg("accent", chunks.join(""))}${replaced}`;
        });
    }
    invalidate() {
        this.markdown.invalidate();
    }
}
/**
 * Component that renders a user message
 */
export class UserMessageComponent extends Container {
    contentBox;
    constructor(text, markdownTheme = getMarkdownTheme(), isRecognizedSlashCommand = () => false) {
        super();
        this.contentBox = new Box(2, 1, (content) => theme.getUserMessageBackgroundColor()(content));
        this.contentBox.addChild(isLeadingSlashCommand(text, isRecognizedSlashCommand)
            ? new SlashCommandMarkdown(text, markdownTheme)
            : new Markdown(text, 0, 0, markdownTheme, {
                color: (content) => theme.fg("userMessageText", content),
            }));
        this.addChild(this.contentBox);
    }
    render(width) {
        const lines = super.render(width);
        if (lines.length === 0) {
            return lines;
        }
        lines[0] = OSC133_ZONE_START + lines[0];
        lines[lines.length - 1] = OSC133_ZONE_END + OSC133_ZONE_FINAL + lines[lines.length - 1];
        return lines;
    }
}
//# sourceMappingURL=user-message.js.map