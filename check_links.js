const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walkDir(path.join(__dirname, 'resources', 'js'));
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('<Link') && !content.includes('import') && !content.includes('Link')) {
        // basic check
    }
    
    // Better check:
    const hasLinkTag = content.match(/<Link\b/);
    if (hasLinkTag) {
        // check if imported
        const hasImport = content.match(/import\s+{([^}]*)}?\s+from\s+['"]@inertiajs\/react['"]/);
        let linkImported = false;
        if (hasImport && hasImport[1].includes('Link')) {
            linkImported = true;
        }
        
        // it could also be imported from react-router-dom
        const hasImport2 = content.match(/import\s+.*Link.*\s+from/);
        if (hasImport2) linkImported = true;

        if (!linkImported) {
            console.log("Missing Link import in:", file);
        }
    }
});
