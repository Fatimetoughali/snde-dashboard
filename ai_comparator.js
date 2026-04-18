import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const ENC_DIR = 'c:/Users/hp/Pictures/Encaissement';

function buildComparativeAnalysis() {
    const prevFile = path.join(ENC_DIR, 'ENCAISSEMENT DECEMBRE 2025.xlsx'); // Fichier mois passé
    const currFile = path.join(ENC_DIR, 'Etat_encaissementsTot (20).xlsx'); // Fichier mois en cours
    const goalsFile = path.join(ENC_DIR, 'SUIVI OBJECTIFS ENCAISSEMENTS GLOBAUX - Copie.xlsx');

    const centers = {};

    // 1. Charger les objectifs
    if (fs.existsSync(goalsFile)) {
        const wb = XLSX.read(fs.readFileSync(goalsFile), { type: 'buffer' });
        ['NKTT', 'SNDE'].forEach(sheetName => {
            const sheet = wb.Sheets[sheetName];
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
            
            for (let i = headerIdx + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length < 3) continue;
                
                let obj = {}; 
                headers.forEach((h, idx) => { if (h && typeof h === 'string') obj[h.trim()] = row[idx]; });
                
                const expId = parseInt(obj['EXP']);
                const name = obj['CENTRE'] || '';
                if (!expId || isNaN(expId) || name.includes('TOTAL') || name.includes('CENTRE')) continue;
                
                const objectifDC = parseFloat(obj['OBJECTIF DC'] || obj['OBJECTIFS DC'] || obj['OBJECTIFS DU MOIS'] || obj['OBJECTIF JDC']) || 0;
                
                if (!centers[expId]) {
                    centers[expId] = {
                        id: expId,
                        name: name,
                        zone: obj['ZONE'] || 'INCONNUE',
                        objectif: objectifDC,
                        current_total: 0,
                        prev_total: 0,
                        current_daily: {},
                        prev_daily: {}
                    };
                } else if (objectifDC > 0) {
                    // Update if we found a better objective
                    centers[expId].objectif = objectifDC;
                    if (obj['ZONE']) centers[expId].zone = obj['ZONE'];
                }
            }
        });
    }

    // 2. Traiter le mois précédent (mois passé)
    if (fs.existsSync(prevFile)) {
        const wb = XLSX.read(fs.readFileSync(prevFile), { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        data.forEach(row => {
            const expId = parseInt(row['CENTRE']);
            const montant = parseFloat(row['MONTANT']) || 0;
            const dateStr = row['DATE'];
            
            if (expId && !isNaN(expId) && montant > 0) {
                if (!centers[expId]) {
                    centers[expId] = { id: expId, name: `Centre #${expId}`, zone: 'INCONNUE', objectif: 0, current_total: 0, prev_total: 0, current_daily: {}, prev_daily: {} };
                }
                centers[expId].prev_total += montant;
                if (dateStr) {
                    centers[expId].prev_daily[dateStr] = (centers[expId].prev_daily[dateStr] || 0) + montant;
                }
            }
        });
    }

    // 3. Traiter le mois en cours
    if (fs.existsSync(currFile)) {
        const wb = XLSX.read(fs.readFileSync(currFile), { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        data.forEach(row => {
            const expId = parseInt(row['CENTRE']);
            const montant = parseFloat(row['MONTANT']) || 0;
            const dateStr = row['DATE'];
            
            if (expId && !isNaN(expId) && montant > 0) {
                if (!centers[expId]) {
                    centers[expId] = { id: expId, name: `Centre #${expId}`, zone: 'INCONNUE', objectif: 0, current_total: 0, prev_total: 0, current_daily: {}, prev_daily: {} };
                }
                centers[expId].current_total += montant;
                if (dateStr) {
                    centers[expId].current_daily[dateStr] = (centers[expId].current_daily[dateStr] || 0) + montant;
                }
            }
        });
    }

    // 4. Calculs d'écarts et Pourcentages IA (toujours positifs comme demandé)
    const analysisResults = Object.values(centers).map(c => {
        // Ecart = Réalisé mois en cours - Objectif
        const ecart = c.current_total - c.objectif;
        
        // Taux de Réalisation par rapport à l'objectif (pourcentage toujours positif)
        let taux = 0;
        if (c.objectif > 0) {
            taux = Math.abs((c.current_total / c.objectif) * 100);
        }

        // Taux d'évolution entre mois en cours et mois passé (positif)
        let evolution = 0;
        if (c.prev_total > 0) {
            evolution = Math.abs(((c.current_total - c.prev_total) / c.prev_total) * 100);
        }

        // Statut d'objectif
        const objectifAtteint = c.current_total >= c.objectif;

        return {
            ...c,
            ecart_vs_objectif: ecart,
            taux_realisation: parseFloat(taux.toFixed(2)), // Toujours > 0
            taux_evolution: parseFloat(evolution.toFixed(2)), // Toujours > 0
            objectif_atteint: objectifAtteint,
            status_ia: objectifAtteint ? "Objectif Dépassé" : "En Retard",
            is_increasing: c.current_total >= c.prev_total
        };
    });

    const report = {
        meta: {
            title: "Comparaison des Mois (Actuel vs Passé) & Analyse des Objectifs IA",
            generated: new Date().toISOString()
        },
        data: analysisResults.sort((a, b) => b.current_total - a.current_total)
    };

    fs.writeFileSync(path.join(ENC_DIR, 'src/comparaison_ia.json'), JSON.stringify(report, null, 2));
    console.log("Fichier JSON de comparaison IA généré avec succès dans src/comparaison_ia.json");
}

buildComparativeAnalysis();
