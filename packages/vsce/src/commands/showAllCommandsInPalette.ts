import { commands } from "vscode";

export function showAllCommandsInPalette() {
    const envValue = process.env.SHOW_ALL_COMMANDS_IN_PALETTE;
    const show = envValue === "true";
    // Set the context key used in package.json "when" clauses for commands
    commands.executeCommand(
        "setContext",
        "cicsExtensionForZoweshowAllCommandsInPalette",
        show
    );
}