import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const ENC_DIR = 'c:/Users/hp/Pictures/Encaissement';

function auditMonthFile(filename) {
    const filePath = path.join(ENC_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File ${filename} not found.`);
        return;
    }
    
    console.log(`\n--- Auditing ${filename} ---`);
    const wb = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    let total = 0;
    let missingCentres = 0;
    let validRows = 0;

    data.forEach(row => {
        const centreKey = row['CENTRE'] || row['EXP'] || row['Centre'];
        const expId = parseInt(centreKey);
        
        const montantKey = row['MONTANT'] || row['Montant'] || row['ENCAISSEMENTS'] || row['montant'];
        const montant = parseFloat(montantKey) || 0;
        
        if (expId && !isNaN(expId)) {
            total += montant;
            validRows++;
        } else {
            missingCentres++;
        }
    });

    console.log(`Total valid rows processed: ${validRows}`);
    console.log(`Sum of Montant for valid centres: ${total}`);
    console.log(`Rows skipped (missing or invalid centre): ${missingCentres}`);
    
    if (data.length > 0) {
        console.log(`Sample Row keys:`, Object.keys(data[0]));
    }
}

auditMonthFile('Etat_encaissementsTot (20).xlsx');
auditMonthFile('ENCAISSEMENT DECEMBRE 2025.xlsx');
