//--------------------------------Class  of drawing-------------------------------------------//
function fdrawing(div) {
var self = this;
 self.div = div;
 self.pageType='sym';
 self.pins=[];
 self.vars=[];
 self.showPolarity=false;
 self.itProject=false;
 self.pendingSave = false;
 self.selectPart= false;
 self.selectAnalysis= false;
 self.dataSyms = {}; 
 window.console.log('fdrawing initialized with div:', div);
 self.symbol = {
        name: "New Symbol",
        reference: "X",
        model: { type: "SPICE", name: "None" },
        destination: "local",
        description: {webPage:'',info:''}
    };

// Display the extension and workspace paths in the console for debugging
 self.extensionPath = window.extensionPath || '';
 self.libraryPath = window.libraryPath || '';
 self.workspacePath = window.workspacePath || ''; 

 //*************Creat body of drawing************************************************************//
 createBody(self);
 this.grid = new fgrid("svg", 1800, 1800);
 this.changPositionRuler = function () {
     self.grid.getRuler();
 };
 //**************Creat for adding shapes and resizing ******************//
this.shapes = new fshapes("svg", self, 1800, 1800);
this.resize = new fresize("svg", self, 1800, 1800);
this.grid.resize = self.resize;
this.shapes.resize = self.resize;
this.resize.grid=this.grid;

 //***********Grid with  tools*******************//
 this.showGrid=function(show){
 	self.grid.showGrid=show;
 	self.grid.getGrid();
 }
 this.zoomIn = function () {
     self.grid.zoomIn();
 }
 this.zoomOut = function () {
     self.grid.zoomOut();
 }
 document.getElementById("areaGlobal").addEventListener("scroll", self.changPositionRuler);
 self.setSize = function (w, h) {
     var r = (h) + 'px'
     document.getElementById("areaGlobal").style.height = r;
 }

 //*******file action**** **********************//
	self.active=function()
	{
		clearSelectElms(self.shapes);
        self.resize.deletEllipse();
		refNetWithPart();
	}

        self.setSymbolDescription = function () {
        var sym = document.getElementById("sym").firstChild;
        var width = sym.getAttribute("width");
        var height = sym.getAttribute("height");
        var zoom = parseFloat(sym.getAttribute("zoom"));
        var scrollLeft = parseInt(sym.getAttribute("left"));
        var scrollTop = parseInt(sym.getAttribute("top"));

        self.grid.zoom = zoom;
        self.grid.pageSize(width, height);
        self.grid.area.areaGlobal.scrollTo({
            top: scrollTop,
            left: scrollLeft,
            behavior: 'smooth'
        });
        self.symbol.name = sym.getAttribute("symbolname");
        self.symbol.reference = sym.getAttribute("reference");
        self.symbol.description = sym.getAttribute("description");
        self.symbol.type = sym.getAttribute("type");
        self.symbol.model.name = sym.getAttribute("modelname");
        if(sym.getAttribute("destination"))
           self.symbol.destination= sym.getAttribute("destination");
        if(!sym.getAttribute("modelname"))
        {
          self.symbol.model={ type: "SPICE", name: "None"};
        }
        else        {
          self.symbol.model={ type: sym.getAttribute("modeltype"), name: sym.getAttribute("modelname")};
        }
		self.active();
		if((self.pageType!='sym')&&sym.getAttribute("optionsimulation"))
		  self.optionsimulation=self.optionsimulation=JSON.parse(sym.getAttribute("optionsimulation"));
        
        if(self.pageType!='sym')
          self.itProject=sym.getAttribute("itproject")=='true';
       

    try {  self.symbol.description  = JSON.parse(self.symbol.description);}
    catch(err) { self.symbol.description={webPage:'',info:''}; }

    }

    self.getSymbolDescription = function () {

        sym = document.getElementById("sym").firstChild;
        sym.setAttribute("width", self.grid.width);
        sym.setAttribute("height", self.grid.height);
        sym.setAttribute("zoom", self.grid.zoom);
        sym.setAttribute("left", self.grid.area.areaGlobal.scrollLeft);
        sym.setAttribute("top", self.grid.area.areaGlobal.scrollTop);
        sym.setAttribute("symbolname", self.symbol.name);
        sym.setAttribute("reference", self.symbol.reference);
        sym.setAttribute("description",JSON.stringify(self.symbol.description));
        sym.setAttribute("type", self.symbol.type);
        sym.setAttribute("modelname", self.symbol.model.name);
        sym.setAttribute("modeltype", self.symbol.model.type);
        sym.setAttribute("destination", self.symbol.destination);
		if(self.pageType!='sym'){
		sym.setAttribute("optionsimulation",JSON.stringify(self.optionsimulation));
        sym.setAttribute("itproject", self.itProject);
        }
    }

 self.getSymbol = function () {
     self.getSymbolDescription();
     return document.getElementById("sym").innerHTML;
 }
 self.setSymbol = function (data) {

     document.getElementById("sym").innerHTML = data;
     const sym = document.getElementById("sym");

     if (sym && !sym.querySelector(":scope > g")) {
        sym.innerHTML =
        '<g width="1550"  height="1550" top="0" left="0"   zoom="3" reference="X" description=" "></g>' +sym.innerHTML;

        

        if (self.pageType == 'sym') {
            self.grid.zoom = 6;
            self.grid.pageSize(350, 350);
        } else {
            self.grid.zoom = 3;
            self.grid.pageSize(1500, 1500);
        }
         
    }  else { 
        self.setSymbolDescription();
        self.getSymbolDescription();
	    plotsOpenDataLayoutInDiv();
        modifiedClassText();
        updateHtmlCode();
        modifiedModelNameParts();
    }
        


 }

//*************Creat copy and paste function******************//
    self.copy = function () {
    var copyList = [];

        if (self.shapes.lsg.elms.length > 0) {
            copyList = [];
            for (var i = 0; i < self.shapes.lsg.elms.length; i++) {
                copyList.push({
                    node: self.shapes.lsg.elms[i].outerHTML
                });
            }
        } else if (self.resize.setElement) {
            copyList = [];
            copyList.push({
                node: self.resize.setElement.outerHTML
            });
        }
    
    var data_ = { pageType: self.pageType, copyList: copyList };
    var clipboardData = JSON.stringify(data_);

    if (typeof vscode !== 'undefined') {
        vscode.postMessage({ type: 'copyData', data: clipboardData });
    }


    
};


self.paste = function (clipboardText) {
    try {
        
        let data = JSON.parse(clipboardText);

        if (!data.copyList?.length) {
            // "لا توجد عناصر للصق";
            return;
        }

        if (data.pageType !== self.pageType) {
           // the data is from a different page type, ignore the paste operation;
            return;
        }

        const svgContainer = document.getElementById("sym");
        self.copyList = [];
        self.copyLength = data.copyList.length;

        for (const item of data.copyList) {
            if (!item.node) continue;

            // إنشاء حاوية مؤقتة في نفس مساحة اسم SVG
            const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            tempSvg.innerHTML = item.node;
            
            // نقل جميع العناصر
            while (tempSvg.firstChild) {
                const node = tempSvg.firstChild;
                svgContainer.appendChild(node);
                self.copyData=true;
            }
        }

        deletMultiRef();
        selectPast(self);
        self.saveData('Paste ');
        
    } catch (err) {
        console.error(err);
       
    }
};

    self.cut = function () {
        self.copy();
        if (self.shapes.lsg.elms.length > 0) {
            for (var i = 0; i < self.shapes.lsg.elms.length; i++)
                self.shapes.lsg.elms[i].remove();
            clearSelectElms(self.shapes);
            self.saveData('Cut ');
        } else if (self.resize.setElement) {
            self.resize.setElement.remove();
            self.resize.deletEllipse();
            self.saveData('Cut ');
        }



    };

//*****update data symbols from extension.js to drawing.js*********//
//***** */
 self.updateDataSymbols = function () {
    console.log(' Requesting symbols data update...');
    if (typeof vscode !== 'undefined') {
        vscode.postMessage({ type: 'updateDataSymbols' });
    } else {
        console.warn('vscode API not available');
    }
};

self.getDataSym = function(data) {
    if (data && typeof data === 'object' && data.dirs) {
        self.dataSyms = data;
        console.log('✅ dataSyms updated:', self.dataSyms);
        
        // refresh the symbols panel if it's already open 
        if (typeof symbolsPanel !== 'undefined') {
            updateSymbolsPanel();
        }
        return self.dataSyms;
    }
    
    console.warn('⚠️ Invalid or missing data in getDataSym');
    return null;
};

 self.setFileType = function (type) {
     self.pageType = type;
     console.log('File type set to:', type);
     if (self.updateToolbar) self.updateToolbar();
 }
 

 self.redSymFiles = function(index) {
    return new Promise((resolve, reject) => {
        if (!self.dataSyms || !self.dataSyms.dirs || index < 0 || index >= self.dataSyms.dirs.length) {
            reject('Invalid index or dataSyms not loaded');
            return;
        }
        
        var dir = self.dataSyms.dirs[index];
        var files = self.dataSyms[dir];
        
        if (!files || !Array.isArray(files) || files.length === 0) {
            resolve([]);
            return;
        }
        
        // تخزين الـ resolve لاستخدامه عند وصول الرد
        self._symFilesResolve = resolve;
        self._symFilesDir = dir;
        
        vscode.postMessage({
            type: 'readSymFiles',
            dir: dir,
            files: files
        });
    });
};

self.redSymFilesFromWorkSpace = function() {
    return new Promise((resolve, reject) => {
        self._workspaceSymResolve = resolve;
        
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                type: 'readSymFilesFromWorkSpace'
            });
        } else {
            reject('vscode API not available');
        }
    });
};
        
// 
self.saveData=function(data){

             var content = self.getSymbol();
             // ✅ إرسال المحتوى المحدّث لـ VS Code
             self.pendingSave =true;
             if (typeof vscode !== 'undefined') {
                 vscode.postMessage({
                     type: 'contentChanged',
                     content: content
                 });
            }
}

self.execOp = function(spiceCode) {
    return new Promise((resolve, reject) => {
        self._execOpResolve = resolve;
        self._execOpReject = reject;
        
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                type: 'execOp',
                code: spiceCode
            });
        } else {
            reject('vscode API not available');
        }
    });
};


         // Get List Models Dialog
         self.getListModel = function(previousResult, onSubmit, onCancel) {
             if (typeof listModelsDialog === 'undefined' || !listModelsDialog) {
                 listModelsDialog = new fListModelsDialog(self);
             }
             listModelsDialog.setCallbacks(onSubmit, onCancel);
             listModelsDialog.initData(previousResult);
             listModelsDialog.show();
         };

         // Create properties panel
         propertiesPanel = new fpropertiesPanel(self);

         
         
         self.grid.zoom = 3;
         self.grid.pageSize(1500, 1500);
         self.grid.includeGridChange();

         symbolsPanel = new fsymbolsPanel(self);
}
//-------------------------------------------------creat page of drawing circuit or symbol-----------------------------------//
let drawing;
function creatPage(div) {
var d;
function resizeCanvas() {
var w = document.getElementById(div).offsetWidth - 20;
var h = document.getElementById(div).offsetHeight - 20;
d.setSize(w,h);
}
d = new fdrawing(div);
window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();
return d;
}
drawing=creatPage("content")




