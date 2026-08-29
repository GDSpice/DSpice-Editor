/*
#--------------------------------------------------------------------------------------------------
Name:        propertiesPanel.js
Author:      d.fathi
Created:     23/08/2026
Update:      24/08/2026
Copyright:   (c) DSpice 2026
Licence:     free
#---------------------------------------------------------------------------------------------------
*/
//------------------Class for Properties Panel-----------------------------------------------------//

// Default data for Circle properties
var defaultData = {
    header: { title: "Circle", subtitle: "Selected Objects 1" },
    sections: [
        {
            title: "Basic Properties",
            collapsed: false,
            showReset: true,
            rows: [
                { label: "X Location", type: "number", value: "7" },
                { label: "Y Location", type: "button", value: "4.15inch" },
                { label: "Radius", type: "text", value: "1.56inch" },
                { label: "Line Width", type: "dropdown", value: "1(Default)", options: ["1(Default)", "2", "3", "4", "5"] },
                { label: "Line Style", type: "dropdownedit", value: "solid(Default)", options: ["solid(Default)", "dashed", "dotted", "double"] },
                { label: "Stroke Color", type: "color", value: "#000000(Default)", color: "#000000" },
                { label: "Fill Color", type: "color", value: "none(Default)", color: "#ffffff" },
                { label: "Fill", type: "dropdown", value: "Solid(Default)", options: ["Solid(Default)", "Gradient", "Pattern", "None"] }
            ]
        },
        {
            title: "Group",
            collapsed: false,
            showReset: false,
            rows: [
                { label: "Group", type: "dropdown", value: "", options: ["", "Group 1", "Group 2", "Group 3"] }
            ]
        }
    ]
};

function fpropertiesPanel(self) {
    var selfPanel = this;
    selfPanel.drawing = self;
    selfPanel.currentData = null;
    selfPanel.onApply = null;
    
    // Drag state
    var isDragging = false;
    var dragStartX = 0;
    var dragStartY = 0;
    var panelStartX = 0;
    var panelStartY = 0;
    
    // ✅ متغير لتتبع ما إذا كان الـ Panel قد تم تموضعه مسبقاً
    var isPositionSet = false;
    
    // Inject CSS
    this.injectCSS = function() {
var css = `
#propertiesPanel {
    position: absolute;
    top: 50px;
    right: 20px;
    width: 320px;
    /* ✅ ألوان تتكيف مع الثيم */
    background: var(--vscode-editorWidget-background, white);
    border: 1px solid var(--vscode-editorWidget-border, #ccc);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    z-index: 2000;
    display: none;
    font-family: var(--vscode-font-family, verdana);
    font-size: var(--vscode-font-size, 12px);
    color: var(--vscode-editor-foreground, #333);
    max-height: 90vh;
    overflow-y: auto;
}

#propertiesPanel.visible { display: block; }

#propertiesPanelHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid var(--vscode-panel-border, #eee);
    background: var(--vscode-titleBar-activeBackground, #fafafa);
    border-radius: 6px 6px 0 0;
    cursor: move;
    user-select: none;
}

#propertiesPanelHeader:hover {
    background: var(--vscode-list-hoverBackground, #f0f0f0);
}

#propertiesPanelTitle {
    font-size: 14px;
    font-weight: bold;
    color: var(--vscode-editor-foreground, #333);
}

#propertiesPanelSubtitle {
    font-size: 11px;
    color: var(--vscode-descriptionForeground, #666);
    margin-left: 8px;
}

#propertiesPanelClose {
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--vscode-icon-foreground, #666);
    padding: 0 4px;
    line-height: 1;
    border-radius: 3px;
}

#propertiesPanelClose:hover {
    background: var(--vscode-list-hoverBackground, #e0e0e0);
    color: var(--vscode-editor-foreground, #333);
}

.prop-section { border-bottom: 1px solid var(--vscode-panel-border, #eee); }

.prop-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--vscode-sideBarSectionHeader-background, #f5f5f5);
    cursor: pointer;
    user-select: none;
    font-weight: bold;
    font-size: 12px;
    color: var(--vscode-editor-foreground, #333);
}

.prop-section-header:hover {
    background: var(--vscode-list-hoverBackground, #ebebeb);
}

.prop-section-content { padding: 8px 12px; }
.prop-section-content.hidden { display: none; }

.prop-row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    min-height: 28px;
}

.prop-row-label {
    flex: 1;
    color: var(--vscode-foreground, #555);
    font-size: 11px;
    padding-right: 8px;
}

.prop-row-control {
    flex: 1.5;
    display: flex;
    align-items: center;
    gap: 4px;
}

.prop-input, .prop-select, .prop-button, .prop-color-text {
    width: 100%;
    padding: 4px 6px;
    border: 1px solid var(--vscode-input-border, #ccc);
    border-radius: 3px;
    font-size: 11px;
    font-family: var(--vscode-font-family, verdana);
    box-sizing: border-box;
    background: var(--vscode-input-background, white);
    color: var(--vscode-input-foreground, #333);
}

.prop-input:focus, .prop-select:focus {
    outline: none;
    border-color: var(--vscode-focusBorder, #4a90e2);
}

.prop-input[type="number"] { text-align: right; }

.prop-button {
    cursor: pointer;
    text-align: right;
}
.prop-button:hover { background: var(--vscode-list-hoverBackground, #f0f0f0); }

.prop-color-picker {
    width: 24px;
    height: 24px;
    border: 1px solid var(--vscode-input-border, #ccc);
    border-radius: 3px;
    cursor: pointer;
    padding: 0;
}

.prop-color-reset {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--vscode-icon-foreground, #666);
    padding: 2px 4px;
}
.prop-color-reset:hover { color: var(--vscode-editor-foreground, #333); }

.prop-reset-btn {
    width: 100%;
    padding: 6px;
    background: var(--vscode-button-secondaryBackground, white);
    border: 1px solid var(--vscode-button-border, #4a90e2);
    border-radius: 3px;
    color: var(--vscode-button-foreground, #4a90e2);
    cursor: pointer;
    font-size: 11px;
    font-family: var(--vscode-font-family, verdana);
    margin-top: 8px;
}
.prop-reset-btn:hover { background: var(--vscode-button-secondaryHoverBackground, #f0f7ff); }
`;;
        var head = document.head || document.getElementsByTagName('head')[0];
        var style = document.createElement('style');
        head.appendChild(style);
        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
    };
    
    // Inject HTML
    this.injectHTML = function() {
        var panelHTML = `
<div id="propertiesPanel">
    <div id="propertiesPanelHeader">
        <div>
            <span id="propertiesPanelTitle">Properties</span>
            <span id="propertiesPanelSubtitle"></span>
        </div>
        <button id="propertiesPanelClose" title="Close">×</button>
    </div>
    <div id="propertiesPanelBody">
        <!-- Dynamic content -->
    </div>
</div>
`;
        document.body.insertAdjacentHTML('beforeend', panelHTML);
    };
    
    // Build panel content from data
    this.buildContent = function(data) {
        var body = document.getElementById('propertiesPanelBody');
        var title = document.getElementById('propertiesPanelTitle');
        var subtitle = document.getElementById('propertiesPanelSubtitle');
        
        if (!body) return;
        
        title.textContent = data.header.title;
        subtitle.textContent = data.header.subtitle;
        
        body.innerHTML = '';
        
        data.sections.forEach(function(section, sectionIndex) {
            var sectionDiv = document.createElement('div');
            sectionDiv.className = 'prop-section';
            
            var header = document.createElement('div');
            header.className = 'prop-section-header' + (section.collapsed ? ' collapsed' : '');
            header.innerHTML = '<span>' + section.title + '</span><span class="toggle-icon">▼</span>';
            header.addEventListener('click', function() {
                header.classList.toggle('collapsed');
                content.classList.toggle('hidden');
            });
            sectionDiv.appendChild(header);
            
            var content = document.createElement('div');
            content.className = 'prop-section-content' + (section.collapsed ? ' hidden' : '');
            
            section.rows.forEach(function(row, rowIndex) {
                var rowDiv = document.createElement('div');
                rowDiv.className = 'prop-row';
                
                var label = document.createElement('div');
                label.className = 'prop-row-label';
                label.textContent = row.label;
                rowDiv.appendChild(label);
                
                var control = document.createElement('div');
                control.className = 'prop-row-control';
                
                switch(row.type) {
                    case 'number':
                        var input = document.createElement('input');
                        input.type = 'number';
                        input.className = 'prop-input';
                        input.value = row.value;
                        input.dataset.section = sectionIndex;
                        input.dataset.row = rowIndex;
                        control.appendChild(input);
                        break;
                        
                    case 'text':
                        var input = document.createElement('input');
                        input.type = 'text';
                        input.className = 'prop-input';
                        input.value = row.value;
                        input.dataset.section = sectionIndex;
                        input.dataset.row = rowIndex;
                        control.appendChild(input);
                        break;
                        
                    case 'button':
                        var btn = document.createElement('button');
                        btn.className = 'prop-button';
                        btn.textContent = row.value;
                        btn.dataset.section = sectionIndex;
                        btn.dataset.row = rowIndex;
                        control.appendChild(btn);
                        break;
                        
                    case 'dropdown':
                    case 'dropdownedit':
                        var select = document.createElement('select');
                        select.className = 'prop-select';
                        select.dataset.section = sectionIndex;
                        select.dataset.row = rowIndex;
                        (row.options || []).forEach(function(opt) {
                            var option = document.createElement('option');
                            option.value = opt;
                            option.textContent = opt;
                            if (opt === row.value) option.selected = true;
                            select.appendChild(option);
                        });
                        control.appendChild(select);
                        break;
                        
                    case 'color':
                        var wrapper = document.createElement('div');
                        wrapper.className = 'prop-color-wrapper';
                        
                        var colorPicker = document.createElement('input');
                        colorPicker.type = 'color';
                        colorPicker.className = 'prop-color-picker';
                        colorPicker.value = row.color || '#000000';
                        colorPicker.dataset.section = sectionIndex;
                        colorPicker.dataset.row = rowIndex;
                        
                        var colorText = document.createElement('input');
                        colorText.type = 'text';
                        colorText.className = 'prop-color-text';
                        colorText.value = row.value;
                        colorText.dataset.section = sectionIndex;
                        colorText.dataset.row = rowIndex;
                        
                        var resetBtn = document.createElement('button');
                        resetBtn.className = 'prop-color-reset';
                        resetBtn.innerHTML = '↺';
                        resetBtn.title = 'Reset to default';
                        resetBtn.addEventListener('click', function() {
                            colorPicker.value = row.color || '#000000';
                            colorText.value = row.value;
                        });
                        
                        colorPicker.addEventListener('input', function() {
                            colorText.value = colorPicker.value;
                        });
                        colorText.addEventListener('change', function() {
                            if (/^#[0-9A-F]{6}$/i.test(colorText.value)) {
                                colorPicker.value = colorText.value;
                            }
                        });
                        
                        wrapper.appendChild(colorPicker);
                        wrapper.appendChild(colorText);
                        wrapper.appendChild(resetBtn);
                        control.appendChild(wrapper);
                        break;
                }
                
                rowDiv.appendChild(control);
                content.appendChild(rowDiv);
            });
            
            if (section.showReset) {
                var resetBtn = document.createElement('button');
                resetBtn.className = 'prop-reset-btn';
                resetBtn.textContent = 'Reset Default Style';
                resetBtn.addEventListener('click', function() {
                    section.rows.forEach(function(row, rowIndex) {
                        var inputs = content.querySelectorAll('[data-row="' + rowIndex + '"]');
                        inputs.forEach(function(input) {
                            if (input.type === 'color') {
                                input.value = row.color || '#000000';
                            } else if (input.tagName === 'SELECT') {
                                input.value = row.value;
                            } else {
                                input.value = row.value;
                            }
                        });
                    });
                });
                content.appendChild(resetBtn);
            }
            
            sectionDiv.appendChild(content);
            body.appendChild(sectionDiv);
        });
    };
    
    // Show panel with data
    this.show = function(data) {
        selfPanel.currentData = data;
        selfPanel.buildContent(data);
        var panel = document.getElementById('propertiesPanel');
        if (panel) {
            panel.classList.add('visible');
            
            // ✅ فقط تعيين الموقع الافتراضي عند أول ظهور
            if (!isPositionSet) {
                panel.style.left = '';
                panel.style.top = '50px';
                panel.style.right = '20px';
                isPositionSet = true;
            }
            // ✅ لا نعيد تعيين الموقع في المرات التالية
        }
    };
    
    // Hide panel
    this.hide = function() {
        var panel = document.getElementById('propertiesPanel');
        if (panel) panel.classList.remove('visible');
    };
    
    // Reset position to default
    this.resetPosition = function() {
        var panel = document.getElementById('propertiesPanel');
        if (panel) {
            panel.style.left = '';
            panel.style.top = '50px';
            panel.style.right = '20px';
            isPositionSet = true;
        }
    };
    
    // Get current values from panel
    this.getValues = function() {
        var result = {};
        var inputs = document.querySelectorAll('#propertiesPanelBody input, #propertiesPanelBody select');
        inputs.forEach(function(input) {
            var section = input.dataset.section;
            var row = input.dataset.row;
            if (!result[section]) result[section] = {};
            result[section][row] = input.value;
        });
        return result;
    };
    
    // Initialize events
    this.init = function() {
        var panel = document.getElementById('propertiesPanel');
        var header = document.getElementById('propertiesPanelHeader');
        var closeBtn = document.getElementById('propertiesPanelClose');
        var areaGlobal = document.getElementById('areaGlobal');
        
        if (!panel || !header) return;
        
        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                selfPanel.hide();
            });
        }
        
        // Drag functionality from header
        header.addEventListener('mousedown', function(e) {
            if (e.target === closeBtn || closeBtn.contains(e.target)) return;
            
            isDragging = true;
            
            var rect = panel.getBoundingClientRect();
            panelStartX = rect.left;
            panelStartY = rect.top;
            
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            panel.style.right = 'auto';
            panel.style.left = panelStartX + 'px';
            panel.style.top = panelStartY + 'px';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            var deltaX = e.clientX - dragStartX;
            var deltaY = e.clientY - dragStartY;
            
            var newX = panelStartX + deltaX;
            var newY = panelStartY + deltaY;
            
            var panelWidth = panel.offsetWidth;
            var panelHeight = panel.offsetHeight;
            var viewportWidth = window.innerWidth;
            var viewportHeight = window.innerHeight;
            
            if (newX < 0) newX = 0;
            if (newX + panelWidth > viewportWidth) newX = viewportWidth - panelWidth;
            if (newY < 0) newY = 0;
            if (newY + panelHeight > viewportHeight) newY = viewportHeight - panelHeight;
            
            panel.style.left = newX + 'px';
            panel.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
            }
        });
        
        // Double-click on drawing area to show properties
        if (areaGlobal) {
            areaGlobal.addEventListener('dblclick', function(e) {
                selfPanel.show(defaultData);
            });
        }
    };
    
    // Constructor
    this.injectCSS();
    this.injectHTML();
    this.init();
}

// Global instance
var propertiesPanel;