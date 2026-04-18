import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = 'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx';
const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);

if (fs.existsSync(filePath)) {
    console.log(`--- Searching for "OBJECTIF" in ${file} ---`);
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    
    workbook.SheetNames.forEach(name => {
        console.log(`Sheet: ${name}`);
        const worksheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        data.slice(0, 50).forEach((row, idx) => {
            const rowStr = JSON.stringify(row);
            if (rowStr.toUpperCase().includes('OBJECTIF')) {
                console.log(`Found in Row ${idx}:`, row);
            }
        });
    });
}
