import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = 'ENCAISSEMENTS.xls';
const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);

if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`--- Analyzing ${file} ---`);
    for (let i = 0; i < Math.min(10, data.length); i++) {
        console.log(`Row ${i}:`, data[i]);
    }
}
