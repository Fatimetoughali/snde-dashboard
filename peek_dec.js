import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = 'ENCAISSEMENT DECEMBRE 2025.xlsx';
const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);

if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`--- Analyzing raw data in ${file} ---`);
    console.log('Columns:', Object.keys(data[0] || {}));
    console.log('First 3 rows:');
    console.log(data.slice(0, 3));
} else {
    console.log("File not found");
}
