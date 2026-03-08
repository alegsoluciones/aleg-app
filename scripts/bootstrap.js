const fs = require('fs');
const path = require('path');

console.log("🛠️  ALEG APP BOOTSTRAPPER");

const itemsToProcess = [
    { name: 'backend/.env', template: 'backend/.env.example' },
    { name: 'frontend/.env.local', template: 'frontend/.env.example' }
];

const ROOT_DIR = path.resolve(__dirname, '..');

itemsToProcess.forEach(item => {
    const targetPath = path.join(ROOT_DIR, item.name);
    const templatePath = path.join(ROOT_DIR, item.template);

    if (fs.existsSync(targetPath)) {
        console.log(`✅ Skip: ${item.name} already exists.`);
    } else if (fs.existsSync(templatePath)) {
        console.log(`📥 Creating: ${item.name} from template...`);
        fs.copyFileSync(templatePath, targetPath);
    } else {
        console.warn(`⚠️  Warning: Template ${item.template} not found.`);
        // Create an empty one or default logic if needed
    }
});

console.log("✅ Bootstrap complete.");
