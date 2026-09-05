const vscode = require('vscode');
const SymbolsSync = require('./symbolsSync');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class DSpiceEditorProvider {
    constructor(context, viewType, fileType) {
        this.context = context;
        this.viewType = viewType;
        this.fileType = fileType;
    }

    static register(context, viewType, fileType) {
        const provider = new DSpiceEditorProvider(context, viewType, fileType);
        return vscode.window.registerCustomEditorProvider(
            viewType,
            provider,
            {
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: false
            }
        );
    }

    async resolveCustomTextEditor(document, webviewPanel, token) {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media')
            ]
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        DSpiceEditorProvider.activeWebview = webviewPanel.webview;

        webviewPanel.onDidChangeViewState(e => {
    if (e.webviewPanel.active) {
        DSpiceEditorProvider.activeWebview = webviewPanel.webview;
    }
});

        // Send the current content (on initial load or Undo/Redo)
        const sendContent = (text) => {
            webviewPanel.webview.postMessage({
                type: 'update',
                content: text,
                fileType: this.fileType
            });
        };

        // Function to extract the filename without its path or extension
        function getFileName() {
            return path.basename(document.fileName, path.extname(document.fileName));
        }

        // Function to send the filename to the Webview
        const sendFileName = () => {
            webviewPanel.webview.postMessage({
                type: 'setFileName',
                fileName: getFileName()
            });
        };



        // When "ready" is received from the Webview
        const msgDisposable = webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
                case 'contentChanged':
                case 'save':
                    this.applyContentChange(document, message.content);
                    break;
case 'ready':
    sendContent(document.getText());
    sendFileName(); //Send the filename when the Webview is ready
    break;

                case 'copyData':
                    console.log('Copy data received from webview:', message.data);
                    await vscode.env.clipboard.writeText(message.data);
                    break;

case 'execOp':
    try {
        const spiceCode = message.code;
        const tempDir = os.tmpdir();
        const circuitFile = path.join(tempDir, `circuit_${Date.now()}.cir`);
        
        // كتابة ملف الدائرة
        fs.writeFileSync(circuitFile, spiceCode, 'utf-8');
        
        let ngspicePath = path.join(this.context.extensionPath, 'ngspice', 'bin', 'ngspice_con.exe');
        
        const ngspiceProcess = spawn(ngspicePath, ['-b', circuitFile], {
            cwd: tempDir,
            env: { ...process.env, PATH: path.dirname(ngspicePath) + path.delimiter + process.env.PATH }
        });
        
        let stdout = '';
        let stderr = '';
        
        ngspiceProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        ngspiceProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        ngspiceProcess.on('close', (code) => {
            // تنظيف الملف المؤقت
            try { fs.unlinkSync(circuitFile); } catch (err) {}
            
            const results = parseSpiceResults(stdout, stderr);
            
            webviewPanel.webview.postMessage({
                type: 'execOpResult',
                success: true,
                data: {
                    success: code === 0,
                    exitCode: code,
                    stdout: stdout,
                    stderr: stderr,
                    results: results,
                    rawOutput: stdout + '\n' + stderr
                }
            });
        });
        
        ngspiceProcess.on('error', (error) => {
            try { fs.unlinkSync(circuitFile); } catch (err) {}
            
            webviewPanel.webview.postMessage({
                type: 'execOpResult',
                success: false,
                error: 'Failed to start ngspice: ' + error.message
            });
        });
        
    } catch (error) {
        webviewPanel.webview.postMessage({
            type: 'execOpResult',
            success: false,
            error: error.message
        });
    }
    break;
                case 'updateDataSymbols':
                   const result =  await SymbolsSync.sync(document, this.context);
                if (result && DSpiceEditorProvider.activeWebview) {
                   DSpiceEditorProvider.activeWebview.postMessage({
                      type: 'symbolsDataUpdated',
                     data: result
                    }); }
                    break;

                    case 'readSymFiles':
  
    const extPath = this.context.extensionPath;
    const symbolsDir = path.join(extPath, 'symbols');
    const targetDir = path.join(symbolsDir, message.dir);
    
    const contents = [];
    if (message.files && Array.isArray(message.files)) {
        for (const file of message.files) {
            const filePath = path.join(targetDir, file);
            console.log(filePath);
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                contents.push(data);
            } catch (e) {
                console.error('❌ Error reading', filePath, e);
                contents.push(null);
            }
        }
    }
    console.log(contents);
    webviewPanel.webview.postMessage({
        type: 'symFilesContent',
        contents: contents
    });
    break;

    case 'readSymFilesFromWorkSpace':
    const allContents = [];
    
    if (vscode.workspace.workspaceFolders) {
        for (const folder of vscode.workspace.workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            
            // دالة بحث متكررة
            function scanDir(dirPath) {
                if (!fs.existsSync(dirPath)) return;
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    if (entry.isDirectory()) {
                        scanDir(fullPath); // نزول للمجلد الفرعي
                    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.sym')) {
                        try {
                            const data = fs.readFileSync(fullPath, 'utf8');
                            allContents.push(data);
                        } catch (e) {
                            console.error('❌ Error reading', fullPath, e);
                            allContents.push(null);
                        }
                    }
                }
            }
            
            scanDir(folderPath);
        }
    }
    
    webviewPanel.webview.postMessage({
        type: 'symFilesFromWorkSpaceContent',
        contents: allContents
    });
    break;
            }
        });

        // ✅ الاستماع على Undo/Redo وتغييرات VS Code
        const docDisposable = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                sendContent(e.document.getText());
            }
        });

webviewPanel.onDidDispose(() => {
    msgDisposable.dispose();
    docDisposable.dispose();
    
    // ✅ إزالة المرجع عند الإغلاق
    if (DSpiceEditorProvider.activeWebview === webviewPanel.webview) {
        DSpiceEditorProvider.activeWebview = null;
    }
});
    }

    async applyContentChange(document, content) {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        edit.replace(document.uri, fullRange, content);
        await vscode.workspace.applyEdit(edit);
    }

    getHtmlForWebview(webview) {
        const nonce = getNonce();

        const mediaPath = vscode.Uri.joinPath(this.context.extensionUri, 'media');
        const cadPath = vscode.Uri.joinPath(mediaPath,'cad');
        const dialogPath = vscode.Uri.joinPath(mediaPath,'dialog');

        // ✅ تعريف جميع المتغيرات بشكل صحيح
        const rulerJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'ruler.js'));
        const gridJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'grid.js'));
        const bodyJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'body.js'));
        const shapesJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'shapes.js'));
        const resizeJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'resize.js'));
        const designeJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'designe.js'));
        const listSymbolJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'listSymbol.js'));
        const sh01Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'information.js'));
        const sh02Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'polyline.js'));
        const sh03Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'arc.js'));
        const sh04Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'pin.js'));
        const sh05Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'ioparam.js'));
        const sh06Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'part.js'));
        const sh07Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'net.js'));
        const sh08Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'text.js'));
        const sh09Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'body.js'));
        const sh10Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'toolButton.js'));
        const sh11Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'cursor.js'));
        const sh12Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'controle.js'));
        const sh13Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'cnode.js'));
        const sh14Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'utility.js'));
        const sh15Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'measurement.js'));
        const sh16Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'svg.js'));
        const sh17Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'analysis.js'));
        const sh18Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'plots.js'));
        const sh19Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'codePy.js'));
        const sh20Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'codeHtml.js'));
        const sh21Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'codeSpice.js'));
        const sh22Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'port.js'));
        const sh23Js= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'shapes', 'vbar.js'));
        const selectElementsJs= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'selectElements.js'));
        const simulationJs= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'simulation.js'));
        const propertiesPanelJs = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath,'properties', 'propertiesDialog.js'));
        const propertiesBuilderJs = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath,'properties', 'propertiesBuilder.js'));
        const propertiesRouterJs = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath,'properties', 'propertiesRouter.js'));
        const symbolsPanelJs = webview.asWebviewUri(vscode.Uri.joinPath(dialogPath, 'symbolsPanel.js'));
        const signalDialogJs = webview.asWebviewUri(vscode.Uri.joinPath(dialogPath, 'signalDialog.js'));
        const drawingJs = webview.asWebviewUri(vscode.Uri.joinPath(cadPath, 'drawing.js'));
        const stdJs= webview.asWebviewUri(vscode.Uri.joinPath(cadPath,'std.js'));
        const plotlyJs =webview.asWebviewUri(vscode.Uri.joinPath(mediaPath,'pack','plotly-latest.min.js'));
        const htmlCodeCss = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'css', 'HTMLcode.css'));


        // Define the library path for ngspice
        const libraryPath = path.join(this.context.extensionPath, 'lib', 'library.lib');
        const extensionPath = this.context.extensionPath;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const workspacePath = workspaceFolder ? workspaceFolder.uri.fsPath : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DSpice Editor</title>
    <link href="${htmlCodeCss}" rel="stylesheet">
    <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: verdana; }
        #content { width: 100%; height: 100%; position: relative; }
    </style>

    <script nonce="${nonce}">
       //define global variables for extension and workspace paths
        window.extensionPath = ${JSON.stringify(extensionPath)};
        window.libraryPath = ${JSON.stringify(libraryPath)};
        window.workspacePath = ${JSON.stringify(workspacePath)}; 
    </script>
</head>
<body>
    <div id="content"></div>


    <script nonce="${nonce}" src="${sh01Js}"></script>
    <script nonce="${nonce}" src="${sh02Js}"></script>
    <script nonce="${nonce}" src="${sh03Js}"></script>
    <script nonce="${nonce}" src="${sh04Js}"></script>
    <script nonce="${nonce}" src="${sh05Js}"></script>
    <script nonce="${nonce}" src="${sh06Js}"></script>
    <script nonce="${nonce}" src="${sh07Js}"></script>
    <script nonce="${nonce}" src="${sh08Js}"></script>
    <script nonce="${nonce}" src="${sh09Js}"></script>
    <script nonce="${nonce}" src="${sh10Js}"></script>
    <script nonce="${nonce}" src="${sh11Js}"></script>
    <script nonce="${nonce}" src="${sh12Js}"></script>
    <script nonce="${nonce}" src="${sh13Js}"></script>
    <script nonce="${nonce}" src="${sh14Js}"></script>
    <script nonce="${nonce}" src="${sh15Js}"></script>
    <script nonce="${nonce}" src="${sh16Js}"></script>
    <script nonce="${nonce}" src="${sh17Js}"></script>
    <script nonce="${nonce}" src="${sh18Js}"></script>
    <script nonce="${nonce}" src="${sh19Js}"></script>
    <script nonce="${nonce}" src="${sh20Js}"></script>
    <script nonce="${nonce}" src="${sh21Js}"></script>
    <script nonce="${nonce}" src="${sh22Js}"></script>
    <script nonce="${nonce}" src="${sh23Js}"></script>
    <script nonce="${nonce}" src="${propertiesPanelJs}"></script>
    <script nonce="${nonce}" src="${selectElementsJs}"></script>
    <script nonce="${nonce}" src="${propertiesBuilderJs}"></script>
    <script nonce="${nonce}" src="${propertiesRouterJs}"></script>
    <script nonce="${nonce}" src="${symbolsPanelJs}"></script>
    <script nonce="${nonce}" src="${signalDialogJs}"></script>
    <script nonce="${nonce}" src="${rulerJs}"></script>
    <script nonce="${nonce}" src="${gridJs}"></script>
    <script nonce="${nonce}" src="${bodyJs}"></script>
    <script nonce="${nonce}" src="${designeJs}"></script>
    <script nonce="${nonce}" src="${shapesJs}"></script>
    <script nonce="${nonce}" src="${resizeJs}"></script>
    <script nonce="${nonce}" src="${listSymbolJs}"></script>
    <script nonce="${nonce}" src="${simulationJs}"></script>
    <script nonce="${nonce}" src="${drawingJs}"></script>
    <script nonce="${nonce}" src="${stdJs}"></script>
    <script nonce="${nonce}" src="${plotlyJs}"></script>
    


    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        // ✅ استقبال التحديثات من VS Code (بما فيها Undo/Redo)
        window.addEventListener('message', event => {
            const msg = event.data;
            console.log('Message from VS Code:', msg.type);

            if (msg.type === 'load' || msg.type === 'update') {

                window.fileContent = msg.content;
                window.fileType = msg.fileType;


               if (typeof drawing !== 'undefined' && drawing.pendingSave) {
                    console.log('Ignoring update (pending save)');
                    drawing.pendingSave = false;
                    return;
                }
                
                if (typeof drawing !== 'undefined') {
                    drawing.setFileType(window.fileType);
                    drawing.setSymbol(window.fileContent);
                    
                }
            }
            else if (msg.type === 'symbolsDataUpdated') {
                  if (typeof drawing !== 'undefined' && drawing.getDataSym) {
                     drawing.getDataSym(msg.data);
                     }
             }
           else if (msg.type === 'symFilesContent') {
                if (typeof drawing !== 'undefined' && drawing._symFilesResolve) {
                    drawing._symFilesResolve(msg.contents);
                    drawing._symFilesResolve = null;
                    }
             }
          else if (msg.type === 'symFilesFromWorkSpaceContent') {
    if (typeof drawing !== 'undefined' && drawing._workspaceSymResolve) {
        drawing._workspaceSymResolve(msg.contents);
        drawing._workspaceSymResolve = null;
    }
} else if (msg.type === 'execOpResult') {
    if (typeof drawing !== 'undefined' && drawing._execOpResolve) {
        if (msg.success) {
            drawing._execOpResolve(msg.data);
        } else {
            drawing._execOpReject(msg.error);
        }
        drawing._execOpResolve = null;
        drawing._execOpReject = null;
    }
}
// Execute copy, cut, and paste commands
            if (msg.type === 'execCopy') {
                 drawing.copy();
            }
            if (msg.type === 'execCut') {
                 drawing.cut();
            }
            if (msg.type === 'execPaste') {
                 drawing.paste(msg.data);
            }
// Receive the file name from VS Code and update drawing.fileName
    if (msg.type === 'setFileName') {
        drawing.fileName = msg.fileName;
        console.log('File name updated to:', drawing.fileName);
    }
           
        });

        // إشعار VS Code بأن الـ Webview جاهز
        vscode.postMessage({ type: 'ready' });
    </script>
    
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function parseSpiceResults(stdout, stderr) {
    const results = {
        results: [],
        errors: [],
        warnings: []
    };

    const combinedOutput = stdout + '\n' + stderr;
    const lines = combinedOutput.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('fatal')) {
            results.errors.push(trimmed);
        }
        if (trimmed.toLowerCase().includes('warning')) {
            results.warnings.push(trimmed);
        }
    }

    const allText = combinedOutput;

    // v(node) = value  أو  i(component) = value
    const viPattern = /([vi])\(([a-z0-9_]+)\)\s*=\s*([+-]?\d+\.?\d*[eE]?[+-]?\d*)/gi;
    let match;
    while ((match = viPattern.exec(allText)) !== null) {
        const type = match[1].toLowerCase();
        const name = match[2].trim();
        const value = parseFloat(match[3]);
        results.results.push({
            name: `${type}(${name})`,
            value: value,
            formatted: formatValue(value)
        });
    }

    // جدول: node_name   value
    const tablePattern = /^\s*([a-z][a-z0-9_]*)\s+([+-]?\d+\.\d+[eE][+-]?\d+)\s*$/gim;
    while ((match = tablePattern.exec(allText)) !== null) {
        const name = match[1].trim();
        const value = parseFloat(match[2]);
        if (!results.results.find(r => r.name === name)) {
            results.results.push({ name, value, formatted: formatValue(value) });
        }
    }

    // print output
    const printPattern = /^\s*([a-z][a-z0-9_]*)\s*=\s*([+-]?\d+\.?\d*[eE]?[+-]?\d*)\s*$/gim;
    while ((match = printPattern.exec(allText)) !== null) {
        const name = match[1].trim();
        const value = parseFloat(match[2]);
        if (!results.results.find(r => r.name === name)) {
            results.results.push({ name, value, formatted: formatValue(value) });
        }
    }

    return results;
}

function formatValue(value) {
    const absVal = Math.abs(value);
    if (absVal === 0) return '0';
    if (absVal >= 1e9) return (value / 1e9).toFixed(3) + ' G';
    if (absVal >= 1e6) return (value / 1e6).toFixed(3) + ' M';
    if (absVal >= 1e3) return (value / 1e3).toFixed(3) + ' k';
    if (absVal >= 1) return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    if (absVal >= 1e-3) return (value * 1e3).toFixed(3) + ' m';
    if (absVal >= 1e-6) return (value * 1e6).toFixed(3) + ' µ';
    if (absVal >= 1e-9) return (value * 1e9).toFixed(3) + ' n';
    if (absVal >= 1e-12) return (value * 1e12).toFixed(3) + ' p';
    return value.toExponential(3);
}

module.exports = DSpiceEditorProvider;


