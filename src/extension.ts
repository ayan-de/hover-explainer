// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

let descriptions: Record<string, string> = {};

//get the workspace folder path */
function getWorkspaceFolder(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
}

/**************************/
/**
 * Returns the file path to the JSON file containing file descriptions, or undefined
 * if the workspace folder path could not be determined.
 */
/******* *******/
function getDescriptionFilePath(): string | undefined {
  const workspaceFolder = getWorkspaceFolder();
  if (!workspaceFolder) {
    return;
  }
  return path.join(workspaceFolder, ".fileDescriptions.json");
}

/****************/
/**
 * Loads the file descriptions from the .fileDescriptions.json file
 * in the current workspace folder, if it exists.
 * If the file does not exist, does nothing.
 * If the file exists but cannot be parsed as JSON, shows an error
 * message in the VS Code window.
 */
/**************/
function loadDescriptions() {
  const descPath = getDescriptionFilePath();
  if (!descPath) {
    return;
  }
  if (fs.existsSync(descPath)) {
    try {
      const raw = fs.readFileSync(descPath, "utf-8");
      descriptions = JSON.parse(raw);
    } catch (err) {
      vscode.window.showErrorMessage("Failed to parse .fileDescriptions.json");
    }
  }
}

/**************/
/**
 * Writes the current file descriptions back to the .fileDescriptions.json file
 * in the current workspace folder, if it exists.
 * Does nothing if the workspace folder path could not be determined.
 * @returns {void}
 */
/************/
function saveDescriptions() {
  const descPath = getDescriptionFilePath();
  if (!descPath) {
    return;
  }
  fs.writeFileSync(descPath, JSON.stringify(descriptions, null, 2));
}

class DescriptionDecorator implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[]
  >();
  onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  refresh(uri?: vscode.Uri | vscode.Uri[]) {
    this._onDidChangeFileDecorations.fire(uri || []);
  }

  provideFileDecoration(
    uri: vscode.Uri
  ): vscode.ProviderResult<vscode.FileDecoration> {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
      return;
    }

    const relativePath = path
      .relative(workspaceFolder, uri.fsPath)
      .replace(/\\/g, "/");
    const desc = descriptions[relativePath];

    if (desc) {
      return {
        tooltip: desc,
        badge: "ℹ️",
        propagate: false,
      };
    }
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("hover-docs extension activated");

  loadDescriptions();

  const provider = new DescriptionDecorator();
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(provider)
  );

  // 1. Watch all files/folders in workspace
  const watcher = vscode.workspace.createFileSystemWatcher("**/*");

  // 2. On file/folder created
  watcher.onDidCreate((uri) => {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
      return;
    }

    const relative = path
      .relative(workspaceFolder, uri.fsPath)
      .replace(/\\/g, "/");
    if (relative === ".fileDescriptions.json") {
      return;
    } // Ignore the description file itself

    if (!descriptions[relative]) {
      descriptions[relative] = "TODO: Add description";
      saveDescriptions();
      if (uri) {
        provider.refresh(uri);
      }
    }
  });

  watcher.onDidDelete((uri) => {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
      return;
    }

    const relative = path
      .relative(workspaceFolder, uri.fsPath)
      .replace(/\\/g, "/");
    if (descriptions[relative]) {
      delete descriptions[relative];
      saveDescriptions();
      if (uri) {
        provider.refresh(uri);
      }
    }
  });

  vscode.workspace.onDidRenameFiles((event) => {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
      return;
    }

    let didChange = false;
    for (const file of event.files) {
      const oldPath = path
        .relative(workspaceFolder, file.oldUri.fsPath)
        .replace(/\\/g, "/");
      const newPath = path
        .relative(workspaceFolder, file.newUri.fsPath)
        .replace(/\\/g, "/");

      if (descriptions[oldPath]) {
        descriptions[newPath] = descriptions[oldPath];
        delete descriptions[oldPath];
        didChange = true;
        provider.refresh([file.oldUri, file.newUri]);
      }
    }
    if (didChange) {
      saveDescriptions();
    }
  });

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.fileName.endsWith(".fileDescriptions.json")) {
      loadDescriptions();
      provider.refresh(); // Refresh all decorations
    }
  });

  context.subscriptions.push(watcher);

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "hover-docs" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "hover-docs.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from hover-docs!");
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
