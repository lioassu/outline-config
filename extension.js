const vscode = require('vscode');
const path = require('path');

class MethodsProvider {
    constructor(methods) {
        this._methods = methods;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    getTreeItem(element) {
        return element;
    }

    getChildren() {
		return this._methods.map((method) => {
			const treeItem = new vscode.TreeItem(method);
			treeItem.command = {
				command: 'outline-config.navigateMethod',
				title: 'Navigate to Method',
				arguments: [method]
			};
			return treeItem;
		});
	}
	

    refresh(methods) {
        this._methods = methods;
        this._onDidChangeTreeData.fire();
    }
}



/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
	const methodsProvider = new MethodsProvider([]);
	// const treeView = vscode.window.createTreeView('methodsView', { treeDataProvider: methodsProvider });
	vscode.window.registerTreeDataProvider('methodsView', methodsProvider);
	// 注册一个命令，用于在配置更改时刷新方法
	context.subscriptions.push(vscode.commands.registerCommand('outline-config.refreshMethods', function () {
		const configuredMethods = vscode.workspace.getConfiguration('outlineConfig').get('methods');
		methodsProvider.refresh(configuredMethods);
	}));

	// 注册一个命令，用于从 TreeView 导航
	context.subscriptions.push(vscode.commands.registerCommand('outline-config.navigateMethod', (method) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}
		
		// 按方法名称查找并导航
		navigateToMethod(editor, method);
	}));

	//初始化
	let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
       //延时一下,内容加载了再读取
		setTimeout(()=>{
			 updateMethods(activeEditor, methodsProvider);
		},3000)
    }
	// 当活动文本编辑器变化时，更新方法列表
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (!editor) {
			return; // No open text editor
		}
		updateMethods(editor, methodsProvider);
	}, null, context.subscriptions);



	// let disposable = vscode.commands.registerCommand('outline-config.helloWorld', async function () {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if (!editor) {
	// 		return; // No open text editor
	// 	}
	
	// 	const symbolsTree = await vscode.commands.executeCommand(
	// 		'vscode.executeDocumentSymbolProvider',
	// 		editor.document.uri
	// 	);
	
	// 	if (symbolsTree) {
    //         const configuredMethods = vscode.workspace.getConfiguration('outlineConfig').get('methods');
    //         let  methods = configuredMethods.map(method => {
	// 			const symbol=findSymbolInTree(symbolsTree, method)
	// 			if(!symbol)return null;
	// 			return { label: method, symbol }});
	// 		methods = methods.filter(method => !!method);
    //         const selectedMethod = await vscode.window.showQuickPick(methods, { placeHolder: 'Select a method to navigate to' });
    //         if (selectedMethod && selectedMethod.symbol) {
    //             editor.revealRange(selectedMethod.symbol.range);
    //             editor.selection = new vscode.Selection(selectedMethod.symbol.range.start, selectedMethod.symbol.range.start);
    //         } else {
    //             vscode.window.showInformationMessage('Method not found.');
    //         }
    //     }
	// });
	
	function findSymbolInTree(symbols, name) {
		for (const symbol of symbols) {
			if (symbol.name === name) {
				return symbol;
			}
			if (symbol.children) {
				const found = findSymbolInTree(symbol.children, name);
				if (found) {
					return found;
				}
			}
		}
		return null;
	}
	async function navigateToMethod(editor, methodName) {
		const symbolsTree = await vscode.commands.executeCommand(
			'vscode.executeDocumentSymbolProvider',
			editor.document.uri
		);
	
		if (symbolsTree) {
			const symbol = findSymbolInTree(symbolsTree, methodName);
			if (symbol) {
				editor.revealRange(symbol.range);
				editor.selection = new vscode.Selection(symbol.range.start, symbol.range.start);
			} else {
				vscode.window.showInformationMessage(`Method "${methodName}" not found.`);
			}
		}
	}

	async function updateMethods(editor, methodsProvider) {
		// 获取文档中的符号，并更新 TreeView
		const symbolsTree = await vscode.commands.executeCommand(
			'vscode.executeDocumentSymbolProvider',
			editor.document.uri
		);
	
		if (symbolsTree) {
			const configuredMethods = vscode.workspace.getConfiguration('outlineConfig').get('methods');
			const methods = configuredMethods.filter(method => findSymbolInTree(symbolsTree, method) != null);
			methodsProvider.refresh(methods);
		}
	}
	
	// context.subscriptions.push(disposable);
	

	
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
