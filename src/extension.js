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
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};