import { ExtensionContext, commands, workspace, window } from "vscode";

export function showAllCommandsInPalette(context: ExtensionContext) {
    // activation
    const config = workspace.getConfiguration("cics-extension-for-zowe");
    const hide = config.get<boolean>("Show All Commands In Palette");
    commands.executeCommand("setContext", "cicsExtensionForZoweshowAllCommandsInPalette", !!hide);

    context.subscriptions.push(
        workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration("cics-extension-for-zowe.showAllCommandsInPalette")) {
                const updated = workspace.getConfiguration("cics-extension-for-zowe").get<boolean>("showAllCommandsInPalette");
                commands.executeCommand("setContext", "cicsExtensionForZoweshowAllCommandsInPalette", !!updated);
                // window.showInformationMessage(
                //     updated
                //         ? "CICS for Zowe Explorer commands are now hidden from the Command Palette."
                //         : "CICS for Zowe Explorer commands are now visible in the Command Palette."
                // );
            }
        })
    );
}