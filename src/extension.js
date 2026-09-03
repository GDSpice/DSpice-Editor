const vscode = require('vscode');
const DSpiceEditorProvider = require('./dspiceEditor');

function activate(context) {
    console.log('DSpice Editor is now active!');
    
    // تسجيل Custom Editor لملفات .sym
    context.subscriptions.push(
        DSpiceEditorProvider.register(context, 'dspiceEditor.symEditor', 'sym')
    );
    
    // تسجيل Custom Editor لملفات .dcs
    context.subscriptions.push(
        DSpiceEditorProvider.register(context, 'dspiceEditor.dcsEditor', 'dcs')
    );

    
    context.subscriptions.push(
        vscode.commands.registerCommand('editor.action.clipboardCopyAction', async () => {
            if (DSpiceEditorProvider.activeWebview) {
                DSpiceEditorProvider.activeWebview.postMessage({ type: 'execCopy' });
            } else {
                // إذا لم يكن Custom Editor نشطاً، نفذ الأمر الافتراضي
                await vscode.commands.executeCommand('default:editor.action.clipboardCopyAction');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('editor.action.clipboardCutAction', async () => {
            if (DSpiceEditorProvider.activeWebview) {
                DSpiceEditorProvider.activeWebview.postMessage({ type: 'execCut' });
            } else {
                await vscode.commands.executeCommand('default:editor.action.clipboardCutAction');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('editor.action.clipboardPasteAction', async () => {
            if (DSpiceEditorProvider.activeWebview) {
                const text = await vscode.env.clipboard.readText();
                DSpiceEditorProvider.activeWebview.postMessage({ type: 'execPaste', data: text });
            } else {
                await vscode.commands.executeCommand('default:editor.action.clipboardPasteAction');
            }
        })
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};