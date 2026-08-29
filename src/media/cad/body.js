/*
#----------------------------------------------------------------------------------------------------
Name:        body.js
Author:      d.fathi
Created:     05/07/2021
Update:      23/08/2026
Copyright:   (c) DSpice 2026
Licence:     free
#---------------------------------------------------------------------------------------------------
*/
function createBody(self) {
var css = `
#toolbar {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(to bottom, #f8f8f8, #e0e0e0);
    border: 1px solid #999;
    border-top: none;
    border-radius: 0 0 6px 6px;
    padding: 0;
    display: flex;
    gap: 0;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    font-family: verdana;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    height: 32px;
    width: fit-content;
}
#toolbar.visible { opacity: 1; pointer-events: all; }
.toolbar-group { display: flex; gap: 2px; padding: 0 4px; border-right: 1px solid #bbb; height: 100%; align-items: center; }
.toolbar-group:last-child { border-right: none; }
.toolbar-btn { width: 28px; height: 28px; border: 1px solid #aaa; background: white; border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #333; transition: all 0.15s; padding: 0; margin: 2px 0; }
.toolbar-btn:hover { background: #e8e8ff; border-color: #6666cc; }
.toolbar-btn.active { background: #c0c0ff; border-color: #4444aa; }
.toolbar-btn svg { width: 16px; height: 16px; pointer-events: none; }

#setgrid { display: grid; width: 100%; height: 100%; grid-template-columns: 20px 1fr; grid-template-rows: 20px 1fr; }
#areaA { background-color: Silver; }
#areaB { background-color: Silver; }
#areaC { background-color: Silver; }
#areaGlobal { align: center; outline: none; position: relative; width: 100%; height: 100%; overflow-y: scroll; user-select: none; scrollbar-width: thin; }
.setFont { font-family: verdana; font-size: 12px; }
`;

var head = document.head || document.getElementsByTagName('head')[0],
style = document.createElement('style');
head.appendChild(style);
style.type = 'text/css';
if (style.styleSheet) {
    style.styleSheet.cssText = css;
} else {
    style.appendChild(document.createTextNode(css));
}

const body = document.getElementById(self.div);
body.innerHTML = `
<div id="toolbar">
    <div class="toolbar-group">
        <button class="toolbar-btn active" id="btnSelect" title="Select (V)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
        </button>
        <button class="toolbar-btn" id="btnPan" title="Pan (H)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
        </button>
    </div>
    <div class="toolbar-group">
        <button class="toolbar-btn" id="btnWire" title="Wire (W)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h6l4-8 4 16 4-8h2"/></svg>
        </button>
        <button class="toolbar-btn" id="btnBus" title="Bus (B)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M2 8h20M2 16h20"/></svg>
        </button>
    </div>
    <div class="toolbar-group">
        <button class="toolbar-btn" id="btnPlaceComponent" title="Place Component (P)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
        </button>
        <button class="toolbar-btn" id="btnText" title="Text (T)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
        </button>
    </div>
    <div class="toolbar-group">
        <button class="toolbar-btn" id="btnZoomIn" title="Zoom In (+)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>
        </button>
        <button class="toolbar-btn" id="btnZoomOut" title="Zoom Out (-)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/></svg>
        </button>
    </div>
    <div class="toolbar-group">
        <button class="toolbar-btn" id="btnGrid" title="Toggle Grid (G)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        </button>
        <button class="toolbar-btn" id="btnSnap" title="Snap to Grid (S)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
        </button>
    </div>
</div>

<div id="setgrid">
    <div id="areaA"></div>
    <div id="areaB">
        <svg style="width:100%;height:100%;">
            <text x="200" y="12">100</text>
            <text x="400" y="12">200</text>
        </svg>
    </div>
    <div id="areaC">
        <svg style="width:100%;height:100%;">
            <text x="12" y="200">100</text>
            <text x="12" y="400">200</text>
        </svg>
    </div>
    <div id="areaGlobal" contenteditable="false">
        <svg id="svg" width="800" height="800" viewBox="0 0 800 800">
            <path id="smallGrid" d="M 10 0 H 800" fill="none" stroke="gray" stroke-width="0.1" vector-effect="non-scaling-stroke"/>
            <path id="grid" d="M 100 0 V 200" fill="none" stroke="gray" stroke-width="0.3" vector-effect="non-scaling-stroke"/>
            <path id="select" d="" fill="none" stroke="blue" stroke-width="1" vector-effect="non-scaling-stroke"/>
            <g id="sym" name="sym"></g>
            <g id="selElms" fill="none" stroke="red"></g>
            <g id="nodes"></g>
        </svg>
    </div>
</div>
`;

initToolbar(self);
}

function initToolbar(self) {
    const toolbar = document.getElementById('toolbar');
    const areaGlobal = document.getElementById('areaGlobal');
    if (!toolbar || !areaGlobal) return;

    let hideTimeout;
    areaGlobal.addEventListener('mouseenter', () => { clearTimeout(hideTimeout); toolbar.classList.add('visible'); });
    areaGlobal.addEventListener('mouseleave', () => { hideTimeout = setTimeout(() => toolbar.classList.remove('visible'), 300); });
    toolbar.addEventListener('mouseenter', () => { clearTimeout(hideTimeout); toolbar.classList.add('visible'); });
    toolbar.addEventListener('mouseleave', () => { hideTimeout = setTimeout(() => toolbar.classList.remove('visible'), 300); });

    document.getElementById('btnZoomIn').addEventListener('click', () => { if (self.drawing && self.drawing.zoomIn) self.drawing.zoomIn(); });
    document.getElementById('btnZoomOut').addEventListener('click', () => { if (self.drawing && self.drawing.zoomOut) self.drawing.zoomOut(); });
    document.getElementById('btnGrid').addEventListener('click', (e) => { if (self.drawing && self.drawing.showGrid) { self.drawing.showGrid(!self.drawing.grid.showGrid); e.currentTarget.classList.toggle('active'); } });
    document.getElementById('btnSnap').addEventListener('click', (e) => { e.currentTarget.classList.toggle('active'); });

    const toolButtons = ['btnSelect', 'btnPan', 'btnWire', 'btnBus', 'btnPlaceComponent', 'btnText'];
    const toolNames = ['select', 'pan', 'wire', 'bus', 'component', 'text'];
    toolButtons.forEach((id, index) => {
        document.getElementById(id).addEventListener('click', () => {
            toolButtons.forEach(b => document.getElementById(b).classList.remove('active'));
            document.getElementById(id).classList.add('active');
            if (self.drawing && self.drawing.setTool) self.drawing.setTool(toolNames[index]);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const key = e.key.toLowerCase();
        const keyMap = { 'v': 0, 'h': 1, 'w': 2, 'b': 3, 'p': 4, 't': 5 };
        if (keyMap[key] !== undefined) {
            toolButtons.forEach(b => document.getElementById(b).classList.remove('active'));
            document.getElementById(toolButtons[keyMap[key]]).classList.add('active');
            if (self.drawing && self.drawing.setTool) self.drawing.setTool(toolNames[keyMap[key]]);
        }
        if (key === '+' || key === '=') { if (self.drawing && self.drawing.zoomIn) self.drawing.zoomIn(); }
        if (key === '-') { if (self.drawing && self.drawing.zoomOut) self.drawing.zoomOut(); }
        if (key === 'g') { if (self.drawing && self.drawing.showGrid) self.drawing.showGrid(!self.drawing.grid.showGrid); }
    });
}