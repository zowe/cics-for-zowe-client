import { showAllCommandsInPalette } from "../../../src/commands/showAllCommandsInPalette";
import { commands, workspace } from 'vscode'; 


describe("showAllCommandsInPalette", () => {
  let context: any;

  beforeEach(() => {
    jest.clearAllMocks();
    context = { subscriptions: [] };
  });

  it("should show all the commands if Show All Commands In Palette is true", () => {
    (workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(true),
    });

    showAllCommandsInPalette();

    expect(commands.executeCommand).toHaveBeenCalledWith(
        "setContext",
        "cicsExtensionForZoweshowAllCommandsInPalette",
        true
    );
  });
  it("should hide all the commands if Show All Commands In Palette is false", () => {
    (workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(false),
    });

    showAllCommandsInPalette();

    expect(commands.executeCommand).toHaveBeenCalledWith("setContext","cicsExtensionForZoweshowAllCommandsInPalette",false
    );
  });
  it("should show all the commands if Show All Commands In Palette is not set", () => {
    (workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    showAllCommandsInPalette();

    expect(commands.executeCommand).toHaveBeenCalledWith(
        "setContext",
        "cicsExtensionForZoweshowAllCommandsInPalette",
        false
    );
  });
});