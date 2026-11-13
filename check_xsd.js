const fs = require('fs');
const lines = fs.readFileSync('src/services/e3l-waste.xsd', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('name="DCSOtherResidueDataType"') || l.includes('DCSOtherResidueData'));
console.log('Index:', idx);
for (let i = idx; i < idx + 40; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
