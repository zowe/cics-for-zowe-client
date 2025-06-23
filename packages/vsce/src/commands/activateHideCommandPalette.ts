import { ExtensionContext, commands, workspace, window } from "vscode";

export function activateHideCommandPalette(context: ExtensionContext) {
    // activation
    const config = workspace.getConfiguration("cics-extension-for-zowe");
    const hide = config.get<boolean>("hideCommandPalette");
    commands.executeCommand("setContext", "cicsExtensionForZoweHideCommandPalette", !!hide);

    context.subscriptions.push(
        workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration("cics-extension-for-zowe.hideCommandPalette")) {
                const updated = workspace.getConfiguration("cics-extension-for-zowe").get<boolean>("hideCommandPalette");
                commands.executeCommand("setContext", "cicsExtensionForZoweHideCommandPalette", !!updated);
                // window.showInformationMessage(
                //     updated
                //         ? "CICS for Zowe Explorer commands are now hidden from the Command Palette."
                //         : "CICS for Zowe Explorer commands are now visible in the Command Palette."
                // );
            }
        })
    );
}