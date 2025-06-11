// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let descriptions: Record<string, string> = {};

function loadDescriptions() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceFolder) {return;};

  const descPath = path.join(workspaceFolder, '.fileDescriptions.json');
  if (fs.existsSync(descPath)) {
    const raw = fs.readFileSync(descPath, 'utf-8');
    descriptions = JSON.parse(raw);
  }
}

function saveDescriptions() {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
	if (!workspaceFolder) {return;};

	const descPath = path.join(workspaceFolder, '.fileDescriptions.json');
	fs.writeFileSync(descPath, JSON.stringify(descriptions, null, 2));
}


class DescriptionDecorator implements vscode.FileDecorationProvider {
  onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[]>;

  provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {return;};

    const relativePath = path.relative(workspaceFolder, uri.fsPath).replace(/\\/g, '/');
    const desc = descriptions[relativePath];

    if (desc) {
      return {
        tooltip: desc,
        badge: 'ℹ️', // Optional icon badge
        propagate: false
      };
    }
  }
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	  loadDescriptions();

	   const provider = new DescriptionDecorator();
  		vscode.window.registerFileDecorationProvider(provider);

		vscode.workspace.onDidChangeTextDocument(event => {
  if (event.document.fileName.endsWith('.fileDescriptions.json')) {
    loadDescriptions();
    // force refresh by firing event if needed later
  }
});

// 1. Watch all files/folders in workspace
const watcher = vscode.workspace.createFileSystemWatcher('**/*');

// 2. On file/folder created
watcher.onDidCreate(uri => {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
	if (!workspaceFolder) {return;};

	const relative = path.relative(workspaceFolder, uri.fsPath).replace(/\\/g, '/');

	// Avoid editing .fileDescriptions.json itself
	if (relative === '.fileDescriptions.json') {return;};

	// Add placeholder only if it doesn't already exist
	if (!descriptions[relative]) {
		descriptions[relative] = 'TODO: Add description';
		saveDescriptions();
	}
});

// 3. On file/folder deleted
watcher.onDidDelete(uri => {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
	if (!workspaceFolder) {return;};

	const relative = path.relative(workspaceFolder, uri.fsPath).replace(/\\/g, '/');

	if (descriptions[relative]) {
		delete descriptions[relative];
		saveDescriptions();
	}
});

// 4. On file/folder renamed
vscode.workspace.onDidRenameFiles(event => {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
	if (!workspaceFolder) {return;};

	for (const file of event.files) {
		const oldPath = path.relative(workspaceFolder, file.oldUri.fsPath).replace(/\\/g, '/');
		const newPath = path.relative(workspaceFolder, file.newUri.fsPath).replace(/\\/g, '/');

		if (descriptions[oldPath]) {
			descriptions[newPath] = descriptions[oldPath];
			delete descriptions[oldPath];
			saveDescriptions();
		}
	}
});

context.subscriptions.push(watcher);



	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "hover-docs" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('hover-docs.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from hover-docs!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
