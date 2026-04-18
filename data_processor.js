import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const ENC_DIR = 'c:/Users/hp/Pictures/Encaissement';

function processEncaissements() {
    const goalsFile = 'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx';
    const filePath = path.join(ENC_DIR, goalsFile);
    
    if (!fs.existsSync(filePath)) {
        console.error('Goals file not found');
        return;
    }

    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    
    let centersData = [];
    const targetSheets = ['NKTT', 'SNDE']; 

    targetSheets.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let headerIdx = -1;
        for (let i = 0; i < 15; i++) {
            if (data[i] && (data[i].includes('ZONE') || data[i].includes('CENTRE') || data[i].includes('EXP'))) {
                headerIdx = i;
                break;
            }
        }
        if (headerIdx === -1) return;
        const headers = data[headerIdx];
        const rows = data.slice(headerIdx + 1);
        rows.forEach(row => {
            if (!row || row.length < 3) return;
            let obj = {}; headers.forEach((h, idx) => { if (h) obj[h.trim()] = row[idx]; });
            const centreName = obj['CENTRE'] || '';
            const expId = obj['EXP'];
            const objectif = parseFloat(obj['OBJECTIF DC'] || obj['OBJECTIFS DC'] || obj['OBJECTIFS DU MOIS'] || obj['OBJECTIF JDC'] || 0);
            const cumul = parseFloat(obj['Encaissement Cumulé'] || obj['ENCAISSEMENTS AU 12/04/2026'] || 0);
            if (typeof expId === 'number' && centreName && !centreName.includes('TOTAL') && !centreName.includes('CENTRE')) {
                centersData.push({
                    zone: obj['ZONE'] || 'AUTRES', id: expId, name: centreName,
                    objectif: objectif, cumul: cumul, ecart: parseFloat(obj['ECART DU MOIS'] || 0),
                    taux: (objectif > 0) ? (cumul / objectif) * 100 : 0
                });
            }
        });
    });

    // Sector Analysis & Daily Trend from Raw Data
    const rawFile = 'Etat_encaissementsTot (20).xlsx';
    let sectors = {};
    let dailyTrend = {};
    const rawFilePath = path.join(ENC_DIR, rawFile);

    if (fs.existsSync(rawFilePath)) {
        const b = fs.readFileSync(rawFilePath);
        const wb = XLSX.read(b, { type: 'buffer' });
        const s = wb.Sheets[wb.SheetNames[0]];
        const j = XLSX.utils.sheet_to_json(s);
        
        j.forEach(r => {
            const date = r.DATE;
            const amount = parseFloat(r.MONTANT) || 0;
            const sectorName = r.ETAT || 'Divers'; // ETAT used as SECTEUR

            // Trend
            if (date && typeof date === 'string' && date.startsWith('2026-04')) {
                dailyTrend[date] = (dailyTrend[date] || 0) + amount;
                
                // Sector stats
                if (!sectors[sectorName]) {
                    sectors[sectorName] = { name: sectorName, total: 0, daily: {} };
                }
                sectors[sectorName].total += amount;
                sectors[sectorName].daily[date] = (sectors[sectorName].daily[date] || 0) + amount;
            }
        });
    }

    const report = {
        metadata: {
            generatedAt: new Date().toISOString(),
            period: 'Avril 2026'
        },
        centers: centersData,
        sectors: Object.values(sectors).map(s => ({
            name: s.name,
            total: s.total,
            avg: s.total / Object.keys(s.daily).length,
            trend: Object.entries(s.daily).map(([d, val]) => ({ date: d, amount: val })).sort((a,b) => a.date.localeCompare(b.date))
        })),
        dailyTrend: Object.entries(dailyTrend).map(([date, amount]) => ({ date, amount })).sort((a,b) => a.date.localeCompare(b.date))
    };

    fs.writeFileSync(path.join(ENC_DIR, 'src/data_report.json'), JSON.stringify(report, null, 2));
    console.log('Report with Sector Analysis generated.');
}

processEncaissements();
