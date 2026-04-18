import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file = 'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx';
const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);

if (fs.existsSync(filePath)) {
    console.log(`--- Analyzing ${file} ---`);
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Headers:', data[0]);
    console.log('Sample Row:', data[1]);
    console.log('Sample Row 2:', data[2]);
}
