const fs = require('fs');
const path = require('path');

// 🛡️ Carpetas y archivos a ignorar (Anti-Basura)
const IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    '.vscode',
    '.idx',
    'dist',
    'build',
    'coverage',
    'package-lock.json',
    '.DS_Store'
];

const OUTPUT_FILE = 'mapa_proyecto.txt';

function scanDirectory(dir, prefix = '') {
    let output = '';
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        // Filtrar ignorados
        const filteredItems = items.filter(item => !IGNORE_PATTERNS.includes(item.name));

        // Ordenar: Carpetas primero, luego archivos
        filteredItems.sort((a, b) => {
            if (a.isDirectory() === b.isDirectory()) return a.name.localeCompare(b.name);
            return a.isDirectory() ? -1 : 1;
        });

        filteredItems.forEach((item, index) => {
            const isLast = index === filteredItems.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const childPrefix = isLast ? '    ' : '│   ';

            // Añadir al mapa
            output += `${prefix}${connector}${item.name}${item.isDirectory() ? '/' : ''}\n`;

            // Si es carpeta, profundizar (Recursividad)
            if (item.isDirectory()) {
                output += scanDirectory(path.join(dir, item.name), prefix + childPrefix);
            }
        });
    } catch (err) {
        console.error(`Error leyendo ${dir}: ${err.message}`);
    }
    return output;
}

console.log("🗺️ Generando mapa del proyecto...");
const projectMap = scanDirectory('.');
fs.writeFileSync(OUTPUT_FILE, projectMap);
console.log(`✅ ¡Listo! Mapa guardado en: ${OUTPUT_FILE}`);