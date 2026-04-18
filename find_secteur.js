import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const ENC_DIR = 'c:/Users/hp/Pictures/Encaissement';

function searchSecteur() {
    const files = [
        'ENCAISSEMENT DECEMBRE 2025.xlsx',
        'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx',
        'Etat_encaissementsTot (20).xlsx'
    ];

    files.forEach(file => {
        const filePath = path.join(ENC_DIR, file);
        if (fs.existsSync(filePath)) {
            console.log(`--- Searching "SECTEUR" in ${file} ---`);
            const buf = fs.readFileSync(filePath);
            const workbook = XLSX.read(buf, { type: 'buffer' });
            
            workbook.SheetNames.forEach(name => {
                const sheet = workbook.Sheets[name];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                data.slice(0, 20).forEach(row => {
                    const rowStr = JSON.stringify(row).toUpperCase();
                    if (rowStr.includes('SECTEUR')) {
                        console.log(`Found in Sheet [${name}]:`, row);
                    }
                });
            });
        }
    });
}

searchSecteur();
