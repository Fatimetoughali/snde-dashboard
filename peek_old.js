import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = 'ENCAISSEMENTS.xls';
const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);

if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`--- Analyzing ${file} ---`);
    for (let i = 0; i < 15; i++) {
        console.log(`Row ${i}:`, data[i]);
    }
}
