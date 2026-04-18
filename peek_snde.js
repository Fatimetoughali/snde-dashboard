import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = 'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx';
const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);

if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = 'SNDE'; 
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`--- Analyzing ${sheetName} ---`);
    for (let i = 0; i < 40; i++) {
        console.log(`Row ${i}:`, data[i]);
    }
}
