import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = 'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx';
const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);

if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    
    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        data.forEach(row => {
            const rowStr = JSON.stringify(row).toUpperCase();
            if (rowStr.includes('PRIVE') || rowStr.includes('ETAT')) {
                console.log(`Sheet [${name}]:`, row);
            }
        });
    });
}
