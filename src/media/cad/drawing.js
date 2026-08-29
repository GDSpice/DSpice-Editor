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
 self.dataSyms = {}; 
 
 self.symbol = {
        name: "New Symbol",
        reference: "X",
        model: { type: "SPICE", name: "None" },
        destination: "local",
        description: {webPage:'',info:''}
    };
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
	    plotsOpenDataLayoutInDiv();
        modifiedClassText();
        updateHtmlCode();
        modifiedModelNameParts();
    }
        


 }
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
        
        // إعادة تحميل لوحة الرموز إذا كانت موجودة
        if (typeof symbolsPanel !== 'undefined' && symbolsPanel.refresh) {
            symbolsPanel.refresh();
        }
        return self.dataSyms;
    }
    console.warn('⚠️ Invalid or missing data in getDataSym');
    return null;
};

 self.setFileType = function (type) {
     self.pageType = type;
     console.log('File type set to:', type);
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

