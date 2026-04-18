import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = path.join('c:/Users/hp/Pictures/Encaissement', 'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx');

if (fs.existsSync(file)) {
    const wb = XLSX.read(fs.readFileSync(file), { type: 'buffer' });
    wb.SheetNames.forEach(sheetName => {
        console.log(`\n\n=== SHEET: ${sheetName} ===`);
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        for (let i = 0; i < Math.min(10, data.length); i++) {
            console.log(`Row ${i}:`, data[i]);
        }
    });
}
