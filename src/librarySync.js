/*
#--------------------------------------------------------------------------------------------------
Name:        librarySync.js
Author:      d.fathi
Created:     05/09/2026
Copyright:   (c) DSpice 2026
Licence:     free
#---------------------------------------------------------------------------------------------------
Description: Module to scan library files and parse SPICE models/subcircuits with robust regex
*/

const fs = require('fs');
const path = require('path');

class LibrarySync {

    /**
     * Scan the extension lib folder and return all .lib files
     * @param {string} extensionPath - The extension root path
     * @returns {Array<{name: string, fullPath: string}>}
     */
    static getLibraryFiles(extensionPath) {
        const libDir = path.join(extensionPath, 'lib');
        const libFiles = [];

        if (!fs.existsSync(libDir)) {
            console.warn('⚠️ lib directory not found:', libDir);
            return libFiles;
        }

        try {
            const entries = fs.readdirSync(libDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(libDir, entry.name);
                if (entry.isFile() && entry.name.toLowerCase().endsWith('.lib')) {
                    libFiles.push({
                        name: entry.name,
                        fullPath: fullPath
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error scanning lib directory:', err);
        }

        return libFiles;
    }

    /**
     * Parse a SPICE library file and extract models and subcircuits
     * @param {string} filePath - Full path to the .lib file
     * @returns {{rawContent: string, models: string[], subckts: string[], error?: string}}
     */
/**
 * Parse a SPICE library file and extract models and subcircuits
 * @param {string} filePath - Full path to the .lib file
 * @returns {{rawContent: string, models: string[], subckts: string[], error?: string}}
 */
static getSpiceModels(filePath) {
    const result = {
        rawContent: '',
        models: [],
        subckts: []
    };

    if (!filePath || !fs.existsSync(filePath)) {
        result.error = 'File not found: ' + filePath;
        return result;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        result.rawContent = content;

        const lines = content.split(/\r?\n/);
        let insideSubckt = false;  // ✅ تتبع ما إذا كنا داخل SUBCKT

        for (let i = 0; i < lines.length; i++) {
            const trimmedLine = lines[i].trim();
            
            // تخطي الأسطر الفارغة والتعليقات
            if (trimmedLine === '' || trimmedLine.startsWith('*') || trimmedLine.startsWith(';')) {
                continue;
            }

            // الكشف عن بداية .SUBCKT
            const subcktMatch = trimmedLine.match(/^\.SUBCKT\s+([A-Za-z0-9_\-\.]+)/i);
            if (subcktMatch) {
                const subcktName = subcktMatch[1];
                insideSubckt = true;  // ✅ دخلنا داخل SUBCKT
                // منع التكرار
                if (!result.subckts.includes(subcktName)) {
                    result.subckts.push(subcktName);
                }
                continue;
            }

            // الكشف عن نهاية .SUBCKT
            if (trimmedLine.match(/^\.ENDS/i)) {
                insideSubckt = false;  // ✅ خرجنا من SUBCKT
                continue;
            }

            // الكشف عن .MODEL - فقط إذا كنا خارج SUBCKT
            // ✅ تجاهل النماذج الداخلية
            if (!insideSubckt) {
                const modelMatch = trimmedLine.match(/^\.MODEL\s+([A-Za-z0-9_\-\.]+)/i);
                if (modelMatch) {
                    const modelName = modelMatch[1];
                    // منع التكرار
                    if (!result.models.includes(modelName)) {
                        result.models.push(modelName);
                    }
                }
            }
        }
    } catch (err) {
        result.error = 'Error reading file: ' + err.message;
    }

    return result;
}
}

module.exports = LibrarySync;