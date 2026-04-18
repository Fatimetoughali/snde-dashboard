import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const files = [
    'ENCAISSEMENT DECEMBRE 2025.xlsx',
    'ENCAISSEMENTS.xls',
    'Etat_encaissementsTot (20).xlsx'
];

files.forEach(file => {
    const filePath = path.join('c:/Users/hp/Pictures/Encaissement', file);
    if (fs.existsSync(filePath)) {
        console.log(`--- Analyzing ${file} ---`);
        try {
            const buf = fs.readFileSync(filePath);
            const workbook = XLSX.read(buf, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log('Headers:', data[0]);
            if (data.length > 1) {
                console.log('Sample Row:', data[1]);
            }
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
        console.log('\n');
    } else {
        console.log(`File not found: ${file}`);
    }
});
