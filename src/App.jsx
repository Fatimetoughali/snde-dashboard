import React, { useState, useMemo } from 'react'
import * as XLSX from 'xlsx-js-style'
import { 
  BarChart3, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  LayoutDashboard,
  Search,
  Activity,
  Upload,
  FileSpreadsheet,
  PieChart as PieIcon,
  Droplets,
  Download
} from 'lucide-react'
import { 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

import comparisonData from './comparaison_ia.json'
import './index.css'

const SNDE_MAPPING = {
  // NOUAKCHOTT
  "NKTT NORD": [41, 44, 47, 48, 52, 86, 96, 98, 99],
  "NKTT OUEST": [43, 55, 91, 92, 93, 97],
  "NKTT SUD": [42, 45, 46, 49, 50, 51, 53, 89, 90, 94, 95],
  // NOUADHIBOU
  "NDB": [15, 40, 60, 80],
  // INTÉRIEUR
  "INT NORD": [14, 16, 17, 18, 21, 62, 66],
  "INT CENTRE": [19, 20, 30, 31, 39, 73, 74, 78, 82],
  "INT EST": [32, 33, 34, 35, 37, 38, 70, 71, 72, 81, 83, 84, 85, 88, 101, 102],
  "INT SUD": [25, 26, 27, 28, 29, 36, 61, 65, 67, 75, 76, 77, 87, 103, 104, 105, 106, 107],
  "INT TRARZA": [23, 24, 64, 68, 69, 108]
};

const getZoneById = (id) => {
  for (const [zone, ids] of Object.entries(SNDE_MAPPING)) {
    if (ids.includes(parseInt(id))) return zone;
  }
  return "AUTRES";
};

const SNDELogo = () => (
  <div style={{ position: 'relative', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', border: '3px solid #0055A4' }}>
    <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Robinet */}
      <path d="M15 48H55C55 48 55 35 70 35C85 35 85 48 85 48V55" stroke="#014182" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 44H26V52H15V44Z" fill="#014182"/>
      <path d="M50 32H60V38H50V32Z" fill="#014182"/>
      
      {/* Goutte d'eau */}
      <path d="M72 72C72 76.5 75.5817 80 80 80C84.4183 80 88 76.5 88 72C88 66 80 56 80 56C80 56 72 66 72 72Z" fill="#00AEEF"/>
      
      {/* Vagues */}
      <path d="M15 75C25 72 35 78 45 75C55 72 65 78 75 75" stroke="#0055A4" strokeWidth="5" strokeLinecap="round"/>
      <path d="M15 85C25 82 35 88 45 85C55 82 65 88 75 85" stroke="#0055A4" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  </div>
)

const getDayFromDate = (dateVal) => {
  if (!dateVal) return 31;
  const str = String(dateVal);
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts[0].length === 4) return parseInt(parts[2].substring(0, 2), 10);
  }
  if (!isNaN(dateVal) && typeof dateVal === 'number') {
    const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
    return date.getDate();
  }
  return 31;
}

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const [rawCurrent, setRawCurrent] = useState([])
  const [rawPrev, setRawPrev] = useState([])
  
  const [currentMonthName, setCurrentMonthName] = useState('En Attente')
  const [prevMonthName, setPrevMonthName] = useState('En Attente')

  const handleImport = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    
    const fileName = file.name.replace('.xlsx', '').replace('.xls', '')
    if (type === 'current') setCurrentMonthName(fileName.substring(0,25))
    if (type === 'prev') setPrevMonthName(fileName.substring(0,25))

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target.result
      try {
        const wb = XLSX.read(bstr, { type: 'binary' })
        const sheetName = wb.SheetNames[0]
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: false })
        
        const normalizeKey = (key) => key ? key.toString().toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
        
        let cleanedData = []
        data.forEach(row => {
          let expId = null;
          let montant = 0;
          let dateVal = null;
          
          for (let key in row) {
             const normKey = normalizeKey(key);
             // Detection ID Centre
             if (normKey.includes('CENTRE') || normKey.includes('EXP') || normKey.includes('CODE') || normKey === 'ID' || normKey === 'N') {
                const val = String(row[key]);
                const match = val.match(/\d+/);
                if (match) expId = parseInt(match[0]);
             }
             // Detection Montant
             if (normKey.includes('MONT') || normKey.includes('ENCAISS') || normKey.includes('VOLUME') || normKey.includes('NET') || normKey.includes('TOTAL') || normKey.includes('CUMUL') || normKey.includes('PERCU') || normKey.includes('VALEUR')) {
                let val = row[key];
                if (typeof val === 'string') val = val.replace(/,/g, '').replace(/ /g, '');
                montant = parseFloat(val) || 0;
             }
             // Detection Date
             if (normKey.includes('DATE') || normKey.includes('JOUR')) {
                dateVal = row[key];
             }
          }

          if (expId && !isNaN(expId) && montant > 0) {
            cleanedData.push({ id: expId, montant: montant, date: dateVal, day: getDayFromDate(dateVal) })
          }
        })
        
        if (cleanedData.length === 0) {
           alert("Attention: Aucune donnée valide trouvée dans ce fichier. Vérifiez les noms des colonnes (EX: 'CENTRE', 'MONTANT').")
        }
        
        if (type === 'current') setRawCurrent(cleanedData)
        else setRawPrev(cleanedData)

      } catch(err) {
        alert("Erreur lors de la lecture du fichier Excel.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const ALL_EXP_IDS = useMemo(() => Object.values(SNDE_MAPPING).flat(), []);

    const analyzedData = useMemo(() => {
    if (!rawCurrent.length && !rawPrev.length) return [];
    
    let maxDayCurrent = 31;
    if (rawCurrent.length > 0) {
       maxDayCurrent = rawCurrent.reduce((max, r) => (typeof r.day === 'number' && r.day > max) ? r.day : max, 1);
       if (maxDayCurrent > 31) maxDayCurrent = 31;
    }

    const mCurAgg = {};
    const mPrevAgg = {};

    rawCurrent.forEach(r => { 
      if (r.id) mCurAgg[r.id] = (mCurAgg[r.id] || 0) + (r.montant || 0); 
    });
    rawPrev.forEach(r => {
       if (r.id && (typeof r.day !== 'number' || r.day <= maxDayCurrent)) {
          mPrevAgg[r.id] = (mPrevAgg[r.id] || 0) + (r.montant || 0);
       }
    });

    const allInImport = [...Object.keys(mCurAgg), ...Object.keys(mPrevAgg)].map(Number);
    const allUniqueIds = Array.from(new Set([...ALL_EXP_IDS, ...allInImport]));

    return allUniqueIds.map(id => {
      const centerInfo = (comparisonData && comparisonData.data) ? comparisonData.data.find(c => Number(c.id) === Number(id)) : null;
      
      const mCur = mCurAgg[id] || 0;
      const mPrev = mPrevAgg[id] || 0;
      const obj = (centerInfo && centerInfo.objectif) ? centerInfo.objectif : 0;
      const name = (centerInfo && centerInfo.name) ? centerInfo.name : 'Centre #' + id;
      const zone = getZoneById(id);
      
      const tauxAtteinte = obj > 0 ? (mCur / obj) * 100 : 0;
      
      return {
        id,
        name,
        zone,
        current_total: Math.round(mCur),
        prev_total: Math.round(mPrev),
        objectif: Math.round(obj),
        ecart_mois: Math.round(mCur) - Math.round(mPrev),
        taux_atteinte: Math.round(tauxAtteinte)
      };
    }).filter(c => c.zone !== 'AUTRES' && (c.current_total > 0 || c.prev_total > 0 || ALL_EXP_IDS.includes(c.id)))
      .sort((a,b) => b.current_total - a.current_total);
  }, [rawCurrent, rawPrev, ALL_EXP_IDS]);

  const zoneAggregates = useMemo(() => {
    const zones = {};
    analyzedData.forEach(c => {
      const z = c.zone || 'INCONNU';
      if (!zones[z]) {
         zones[z] = { name: z, current_total: 0, prev_total: 0, objectif: 0 };
      }
      zones[z].current_total += c.current_total;
      zones[z].prev_total += c.prev_total;
      zones[z].objectif += c.objectif;
    });
    
    return Object.values(zones).map(z => ({
      ...z,
      ecart_mois: z.current_total - z.prev_total,
      taux_atteinte: z.objectif > 0 ? Math.round(Math.abs((z.current_total / z.objectif) * 100)) : 0
    })).sort((a,b) => b.current_total - a.current_total);
  }, [analyzedData])

  const totalCurrent = analyzedData.reduce((acc, c) => acc + c.current_total, 0)
  const totalPrev = analyzedData.reduce((acc, c) => acc + c.prev_total, 0)
  const totalObj = analyzedData.reduce((acc, c) => acc + c.objectif, 0)
  const ecartGlobalMois = totalCurrent - totalPrev
  const tauxAtteinteGlobal = totalObj > 0 ? Math.round(Math.abs((totalCurrent / totalObj) * 100)) : 0

  const filteredData = analyzedData.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id?.toString().includes(searchTerm)
  )

  const topCentersData = analyzedData.slice(0, 10).map(c => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    'Mois Actuel': c.current_total,
    'Mois Passé': c.prev_total,
    'Objectif': c.objectif
  }))

  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(center => {
      const z = center.zone || 'AUTRES';
      if (!groups[z]) groups[z] = [];
      groups[z].push(center);
    });
    return groups;
  }, [filteredData])

  // Total Global SNDE (TOUTES les zones mappées, ignore le filtre de recherche)
  const grandTotalSNDE = useMemo(() => {
    let current = 0;
    let prev = 0;
    let obj = 0;
    analyzedData.forEach(c => {
       if (c.zone !== 'AUTRES') {
         current += (c.current_total || 0);
         prev += (c.prev_total || 0);
         obj += (c.objectif || 0);
       }
    });
    const gap = current - obj;
    const rate = obj > 0 ? Math.round(Math.abs((current / obj) * 100)) : 0;
    const ecart = current - prev;
    return { current, prev, obj, gap, rate, ecart };
  }, [analyzedData]);

  const exportToExcel = () => {
    const H_STYLE = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "014182" } }, alignment: { horizontal: "center", vertical: "center" } };
    const ZONE_STYLE = { font: { bold: true, color: { rgb: "0284C7" }, sz: 11 }, fill: { fgColor: { rgb: "E0F2FE" } } };
    const T_ZONE_STYLE = { font: { bold: true, color: { rgb: "333333" } }, fill: { fgColor: { rgb: "E2E8F0" } } };
    const SNDE_STYLE = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 }, fill: { fgColor: { rgb: "0EA5E9" } } };
    
    const getGapStyle = (gap) => {
       const abs = Math.abs(gap);
       if (gap >= 0) return { font: { bold: true, color: { rgb: abs > 100000 ? "FFFFFF" : "000000" } }, fill: { fgColor: { rgb: abs > 100000 ? "10B981" : "BBF7D0" } } };
       return { font: { bold: true, color: { rgb: abs < 50000 ? "000000" : "FFFFFF" } }, fill: { fgColor: { rgb: abs < 50000 ? "FECACA" : "EF4444" } } };
    };
    
    const getBadgeStyle = () => ({
      font: { bold: true, color: { rgb: "10B981" } }, 
      fill: { fgColor: { rgb: "D1FAE5" } },
      alignment: { horizontal: "center" }
    });

    // --- FEUILLE 1 : COMPARAISON DES ENCAISSEMENTS GLOBAUX ---
    const dataFeuille1 = [];
    dataFeuille1.push([
      {v: "NOUALKCHOTT / ZONE", s: H_STYLE}, 
      {v: "EXP", s: H_STYLE}, 
      {v: "CENTRE", s: H_STYLE}, 
      {v: "ENCAISSEMENTS (ACTUEL)", s: H_STYLE}, 
      {v: "ENCAISSEMENTS (PASSÉ)", s: H_STYLE}, 
      {v: "ECART", s: H_STYLE}
    ]);
    
    Object.entries(groupedData).forEach(([zone, centers]) => {
       const sortedCenters = [...centers].sort((a,b) => b.ecart_mois - a.ecart_mois);
       sortedCenters.forEach(c => {
         dataFeuille1.push([
            {v: zone}, 
            {v: "SNDE"}, 
            {v: c.name}, 
            {v: c.current_total}, 
            {v: c.prev_total}, 
            {v: c.ecart_mois, s: getGapStyle(c.ecart_mois)}
         ]);
       });
       const totalZCurrent = centers.reduce((s, c) => s + c.current_total, 0);
       const totalZPrev = centers.reduce((s, c) => s + c.prev_total, 0);
       dataFeuille1.push([
          {v: `TOTAL ZONE ${zone}`, s: T_ZONE_STYLE}, 
          {v: "", s: T_ZONE_STYLE}, 
          {v: "", s: T_ZONE_STYLE}, 
          {v: totalZCurrent, s: T_ZONE_STYLE}, 
          {v: totalZPrev, s: T_ZONE_STYLE}, 
          {v: totalZCurrent - totalZPrev, s: getGapStyle(totalZCurrent - totalZPrev)}
       ]);
       dataFeuille1.push([]); 
    });
    
    dataFeuille1.push([
      {v: "TOTAL GLOBAL SNDE", s: SNDE_STYLE}, 
      {v: "", s: SNDE_STYLE}, 
      {v: "", s: SNDE_STYLE}, 
      {v: grandTotalSNDE.current, s: SNDE_STYLE}, 
      {v: grandTotalSNDE.prev, s: SNDE_STYLE}, 
      {v: grandTotalSNDE.ecart, s: getGapStyle(grandTotalSNDE.ecart)}
    ]);
    
    // --- FEUILLE 2 : BASE DE DONNÉES COMPARATIVE ---
    const dataFeuille2 = [];
    dataFeuille2.push([
      {v:"Zone", s:H_STYLE}, 
      {v:"Centre d'Activité", s:H_STYLE}, 
      {v:"Mois Actuel", s:H_STYLE}, 
      {v:"Objectif", s:H_STYLE}, 
      {v:"ECART DU MOIS", s:H_STYLE}, 
      {v:"Taux d'Atteinte (%)", s:H_STYLE}
    ]);
    
    Object.entries(groupedData).forEach(([zone, centers]) => {
       dataFeuille2.push([
         {v: `ZONE ${zone} (${centers.length} centres)`, s: ZONE_STYLE}, 
         {v:"", s:ZONE_STYLE}, 
         {v:"", s:ZONE_STYLE}, 
         {v:"", s:ZONE_STYLE}, 
         {v:"", s:ZONE_STYLE}, 
         {v:"", s:ZONE_STYLE}
       ]);
       centers.forEach(c => {
         const gap = c.current_total - c.objectif;
         dataFeuille2.push([
            {v: zone}, 
            {v: c.name}, 
            {v: c.current_total, s: {font: {bold:true}}}, 
            {v: c.objectif}, 
            {v: gap, s: gap < 0 ? { font: { bold: true, color: { rgb: "EF4444" } } } : {font: {bold:true}}}, 
            {v: `${c.taux_atteinte}%`, s: getBadgeStyle()}
         ]);
       });
       const totalZCurrent = centers.reduce((s, c) => s + c.current_total, 0);
       const totalZObj = centers.reduce((s, c) => s + c.objectif, 0);
       const gap = totalZCurrent - totalZObj;
       const rate = totalZObj > 0 ? Math.round(Math.abs((totalZCurrent / totalZObj) * 100)) : 0;
       
       dataFeuille2.push([
          {v:`TOTAL ZONE ${zone}`, s:T_ZONE_STYLE}, 
          {v:"", s:T_ZONE_STYLE}, 
          {v:totalZCurrent, s:T_ZONE_STYLE}, 
          {v:totalZObj, s:T_ZONE_STYLE}, 
          {v:gap, s: gap < 0 ? { font: { bold: true, color: { rgb: "EF4444" } }, fill: { fgColor: { rgb: "E2E8F0" } } } : {fill: {fgColor:{rgb:"E2E8F0"}}, font:{bold:true}}}, 
          {v:`${rate}%`, s: Object.assign({}, getBadgeStyle(), T_ZONE_STYLE)}
       ]);
       dataFeuille2.push([]); 
    });
    
    dataFeuille2.push([
       {v:"TOTAL GLOBAL SNDE", s:SNDE_STYLE}, 
       {v:"", s:SNDE_STYLE}, 
       {v:grandTotalSNDE.current, s:SNDE_STYLE}, 
       {v:grandTotalSNDE.obj, s:SNDE_STYLE}, 
       {v:grandTotalSNDE.gap, s: grandTotalSNDE.gap < 0 ? { font: { bold: true, color: { rgb: "EF4444" } }, fill: { fgColor: { rgb: "0EA5E9" } } } : SNDE_STYLE}, 
       {v:`${grandTotalSNDE.rate}%`, s: Object.assign({}, getBadgeStyle(), SNDE_STYLE)}
    ]);

    const ws1 = XLSX.utils.aoa_to_sheet(dataFeuille1);
    const ws2 = XLSX.utils.aoa_to_sheet(dataFeuille2);

    ws1['!cols'] = [{wch:25}, {wch:8}, {wch:25}, {wch:25}, {wch:25}, {wch:18}];
    ws2['!cols'] = [{wch:25}, {wch:25}, {wch:18}, {wch:18}, {wch:18}, {wch:20}];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws1, "Comparaison Globale");
    XLSX.utils.book_append_sheet(workbook, ws2, "Base de Données");
    
    XLSX.writeFile(workbook, "Rapport_Encaissements_SNDE.xlsx");
  };

  const hasDataLoaded = rawCurrent.length > 0 || rawPrev.length > 0;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand-minimal" style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
          {/* Logo Circulaire Officiel */}
          <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', border: '6px solid #00539c', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateY(-2px)' }}>
               {/* Robinet */}
               <path d="M 2 40 H 25 V 55 H 2 Z" fill="#1b85c3" />
               <path d="M 25 43 H 30 V 52 H 25 Z" fill="#1b85c3" />
               <path d="M 30 43 C 58 43 50 32 65 32 C 78 32 78 43 78 43 V 55 H 66 V 46 C 66 40 55 40 55 46 C 55 53 45 52 30 52 Z" fill="#1b85c3" />
               
               {/* Poignée (Croix) */}
               <path d="M 54 20 H 60 V 34 H 54 Z" fill="#1b85c3" />
               <path d="M 48 24 H 66 V 28 H 48 Z" fill="#1b85c3" />
               <circle cx="48" cy="26" r="2.5" fill="#1b85c3" />
               <circle cx="66" cy="26" r="2.5" fill="#1b85c3" />
               <circle cx="57" cy="20" r="2.5" fill="#1b85c3" />

               {/* Goutte d'eau */}
               <path d="M 72 58 C 72 58 84 76 72 86 C 60 76 60 58 72 58 Z" fill="url(#dropGrad)" />
               <path d="M 70 70 C 66 76 66 80 70 82 C 68 80 68 76 70 70 Z" fill="#ffffff" opacity="0.8" />
               <defs>
                  <linearGradient id="dropGrad" x1="60" y1="58" x2="84" y2="86" gradientUnits="userSpaceOnUse">
                     <stop offset="0%" stopColor="#4fc3f7" />
                     <stop offset="100%" stopColor="#01579b" />
                  </linearGradient>
               </defs>

               {/* Trois Vagues */}
               <path d="M 5 70 Q 25 60 50 70 T 95 70" stroke="#4fc3f7" strokeWidth="4" strokeLinecap="round" fill="none" />
               <path d="M 5 80 Q 25 70 50 80 T 95 80" stroke="#0288d1" strokeWidth="4" strokeLinecap="round" fill="none" />
               <path d="M 5 90 Q 25 80 50 90 T 95 90" stroke="#01579b" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Nom SNDE Brute */}
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#00539c', letterSpacing: '2px', margin: 0 }}>SNDE</h2>
        </div>

        <div className="nav-section" style={{marginBottom: '3rem'}}>
          <NavItem icon={<LayoutDashboard size={20}/>} label="Tableau de bord" active={true} />
        </div>

        <div className="nav-section" style={{ marginTop: 'auto' }}>
           <div className="upload-container">
              <span className="upload-label">1. Fichier Mois Actuel</span>
              <label className="import-btn">
                 <Upload size={18} /> {currentMonthName}
                 <input type="file" accept=".xls,.xlsx" onChange={e => handleImport(e, 'current')} style={{display: 'none'}} />
              </label>
           </div>
           <div className="upload-container">
              <span className="upload-label">2. Fichier Mois Passé</span>
              <label className="import-btn prev-btn">
                 <Upload size={18} /> {prevMonthName}
                 <input type="file" accept=".xls,.xlsx" onChange={e => handleImport(e, 'prev')} style={{display: 'none'}} />
              </label>
           </div>
           

        </div>
      </aside>

      <main className="main-stage">
        <header style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <motion.h1 initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '0.5rem' }}>
              Vision Analytique Active
            </motion.h1>

          </div>
        </header>

        {!hasDataLoaded ? (
          <div className="empty-state-wrapper">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="empty-glass">
                 <div className="empty-content">
                    <FileSpreadsheet size={72} color="var(--primary)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px rgba(79, 70, 229, 0.6))' }} />
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-1px' }}>Prêt à l'analyse</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3rem' }}>
                       Importez vos relevés du mois actuel et du mois passé.<br/> Notre algorithme s'occupe de l'alignement temporel et du calcul des écarts.
                    </p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                       <label className="action-btn-lg">
                          <Upload size={20} /> Mois Actuel
                          <input type="file" accept=".xls,.xlsx" onChange={e => handleImport(e, 'current')} style={{display: 'none'}} />
                       </label>
                       <label className="action-btn-lg outline">
                          <Upload size={20} /> Mois Passé
                          <input type="file" accept=".xls,.xlsx" onChange={e => handleImport(e, 'prev')} style={{display: 'none'}} />
                       </label>
                    </div>
                 </div>
             </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key="dash" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              


              {/* SYNTHÈSE RÉGIONALE DÉTAILLÉE (FORME EXCEL) */}
              <div className="glass-card" style={{ marginBottom: '3rem', padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>COMPARAISON DES ENCAISSEMENTS GLOBAUX </h3>
                     <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button onClick={exportToExcel} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                           <Download size={18} /> EXPORTER EXCEL
                        </button>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>SYNTHÈSE SNDE</div>
                     </div>
                  </div>
                  <div style={{ maxHeight: '800px', overflowY: 'auto', padding: '1rem' }}>
                     <table className="excel-table">
                        <thead>
                           <tr>
                              <th>NOUALKCHOTT / ZONE</th>
                              <th>EXP</th>
                              <th>CENTRE</th>
                              <th>ENCAISSEMENTS (ACTUEL)</th>
                              <th>ENCAISSEMENTS (PASSÉ)</th>
                              <th>ECART</th>
                           </tr>
                        </thead>
                        <tbody>
                           {Object.entries(groupedData).map(([zone, centers]) => {
                             const totalZCurrent = centers.reduce((s, c) => s + c.current_total, 0);
                             const totalZPrev = centers.reduce((s, c) => s + c.prev_total, 0);
                             const totalZEcart = totalZCurrent - totalZPrev;

                               return (
                                 <React.Fragment key={zone}>
                                   {[...centers].sort((a,b) => b.ecart_mois - a.ecart_mois).map((c) => {
                                     const isPos = c.ecart_mois >= 0;
                                   const absEcart = Math.abs(c.ecart_mois);
                                   let ecartBg = 'rgba(239, 68, 68, 0.8)';
                                   if (isPos) {
                                      ecartBg = absEcart > 100000 ? '#10b981' : '#bbf7d0';
                                   } else if (absEcart < 50000) {
                                      ecartBg = '#ffedd5';
                                   }

                                   return (
                                     <tr key={c.id}>
                                       <td style={{ fontWeight: 600 }}>{zone}</td>
                                       <td>{c.id}</td>
                                       <td>{c.name}</td>
                                       <td style={{ textAlign: 'right' }}>{c.current_total.toLocaleString()}</td>
                                       <td style={{ textAlign: 'right' }}>{c.prev_total.toLocaleString()}</td>
                                       <td style={{ 
                                          textAlign: 'right', 
                                          background: ecartBg, 
                                          color: !isPos && absEcart > 5000 ? '#fff' : '#000',
                                          fontWeight: 700,
                                          border: '1px solid rgba(0,0,0,0.1)'
                                       }}>
                                          {c.ecart_mois.toLocaleString()}
                                       </td>
                                     </tr>
                                   );
                                 })}
                                 <tr style={{ background: '#e2e8f0', fontWeight: 800 }}>
                                    <td colSpan={3}>TOTAL ZONE {zone}</td>
                                    <td style={{ textAlign: 'right' }}>{totalZCurrent.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right' }}>{totalZPrev.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', background: totalZEcart >= 0 ? '#bbf7d0' : '#fecaca' }}>
                                       {totalZEcart.toLocaleString()}
                                    </td>
                                 </tr>
                               </React.Fragment>
                             );
                           })}
                           {/* LIGNE FINALE SNDE */}
                           <tr style={{ background: '#002060', color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>
                              <td colSpan={3} style={{ padding: '15px 20px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>SNDE</td>
                              <td style={{ textAlign: 'right', padding: '15px 10px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{grandTotalSNDE.current.toLocaleString()}</td>
                              <td style={{ textAlign: 'right', padding: '15px 10px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{grandTotalSNDE.prev.toLocaleString()}</td>
                              <td style={{ textAlign: 'right', padding: '15px 10px' }}>{grandTotalSNDE.ecart.toLocaleString()}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
              </div>


              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Base de Données Comparative</h3>
                     <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input type="text" placeholder="Recherche Rapide..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', width: '200px' }} />
                     </div>
                  </div>
                  <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '1rem' }}>
                     <table className="modern-table">
                         <thead style={{ background: '#014182', color: '#fff', fontSize: '1rem' }}>
                            <tr>
                               <th style={{ padding: '15px 12px', color: '#fff' }}>Zone</th>
                               <th style={{ padding: '15px 12px', color: '#fff' }}>Centre d'Activité</th>
                               <th style={{ padding: '15px 12px', color: '#fff' }}>Mois Actuel</th>
                               <th style={{ padding: '15px 12px', color: '#fff' }}>Objectif</th>
                               <th style={{ padding: '15px 12px', color: '#fff' }}>ECART DU MOIS</th>
                               <th style={{ padding: '15px 12px', color: '#fff' }}>Taux d'Atteinte (%)</th>
                            </tr>
                         </thead>
                        <tbody>
                           {Object.entries(groupedData).map(([zone, centers]) => {
                              const totalZCurrent = centers.reduce((s, c) => s + c.current_total, 0);
                              const totalZObj = centers.reduce((s, c) => s + c.objectif, 0);
                              const totalZGap = totalZCurrent - totalZObj;
                              const totalZRate = totalZObj > 0 ? Math.round(Math.abs((totalZCurrent / totalZObj) * 100)) : 0;
                              
                              let zBg = '#f1f5f9', zText = '#334155', zBorder = '#64748b';
                              if (zone.includes('NKTT')) { zBg = '#e0e7ff'; zText = '#3730a3'; zBorder = '#4f46e5'; }
                              else if (zone.includes('NDB')) { zBg = '#cffafe'; zText = '#164e63'; zBorder = '#0891b2'; }
                              else if (zone.includes('EST')) { zBg = '#ffedd5'; zText = '#9a3412'; zBorder = '#ea580c'; }
                              else if (zone.includes('SUD')) { zBg = '#dcfce7'; zText = '#166534'; zBorder = '#16a34a'; }
                              else if (zone.includes('NORD')) { zBg = '#f3e8ff'; zText = '#6b21a8'; zBorder = '#9333ea'; }
                              else if (zone.includes('CENTRE')) { zBg = '#fee2e2'; zText = '#991b1b'; zBorder = '#dc2626'; }
                              else if (zone.includes('TRARZA')) { zBg = '#fef3c7'; zText = '#92400e'; zBorder = '#d97706'; }

                              return (
                                 <React.Fragment key={zone}>
                                    <tr style={{ background: zBg, borderLeft: `6px solid ${zBorder}`, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                       <td colSpan={6} style={{ fontWeight: 900, color: zText, padding: '18px 24px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.2rem' }}>
                                          ZONE {zone} <span style={{ fontSize: '0.85rem', opacity: 0.8, marginLeft: '8px', fontWeight: 700 }}>({centers.length} centres)</span>
                                       </td>
                                    </tr>
                                    {centers.map((c, i) => {
                                       const gapToGoal = c.current_total - c.objectif;
                                       return (
                                          <motion.tr key={`${zone}-${c.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                             <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{zone}</td>
                                             <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                   <span style={{ fontWeight: 700 }}>{c.name}</span>
                                                   <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: #{c.id}</span>
                                                </div>
                                             </td>
                                             <td style={{ fontWeight: 800 }}>{c.current_total?.toLocaleString()}</td>
                                             <td style={{ color: 'var(--text-secondary)' }}>{c.objectif?.toLocaleString()}</td>
                                             <td style={{ fontWeight: 800, color: gapToGoal < 0 ? 'var(--danger)' : 'inherit' }}>
                                                {gapToGoal?.toLocaleString()}
                                             </td>
                                             <td>
                                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', fontSize: '0.85rem' }}>
                                                   {c.taux_atteinte}%
                                                </span>
                                             </td>
                                          </motion.tr>
                                       );
                                    })}
                                    <tr style={{ background: '#e2e8f0', fontWeight: 800 }}>
                                       <td colSpan={2} style={{ textAlign: 'right', paddingRight: '20px' }}>TOTAL ZONE {zone}</td>
                                       <td style={{ textAlign: 'left' }}>{totalZCurrent.toLocaleString()}</td>
                                       <td style={{ textAlign: 'left' }}>{totalZObj.toLocaleString()}</td>
                                       <td style={{ textAlign: 'left', color: totalZGap < 0 ? 'var(--danger)' : 'inherit' }}>{totalZGap.toLocaleString()}</td>
                                       <td>
                                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', fontSize: '0.85rem' }}>
                                             {totalZRate}%
                                          </span>
                                       </td>
                                    </tr>
                                 </React.Fragment>
                              );
                           })}
                           <tr style={{ position: 'sticky', bottom: 0, zIndex: 20, background: 'linear-gradient(90deg, #0ea5e9, #0284c7)', color: '#ffffff', fontWeight: 900, fontSize: '1.15rem', boxShadow: '0 -4px 12px rgba(0,0,0,0.15)' }}>
                              <td colSpan={2} style={{ textAlign: 'center', padding: '15px 20px', borderRight: '1px solid rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>TOTAL GLOBAL SNDE</td>
                              <td style={{ textAlign: 'left', padding: '15px 10px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>{grandTotalSNDE.current.toLocaleString()}</td>
                              <td style={{ textAlign: 'left', padding: '15px 10px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>{grandTotalSNDE.obj.toLocaleString()}</td>
                              <td style={{ textAlign: 'left', padding: '15px 10px', color: grandTotalSNDE.gap < 0 ? '#ffe4e6' : '#d1fae5', background: 'rgba(0,0,0,0.1)' }}>{grandTotalSNDE.gap.toLocaleString()}</td>
                              <td style={{ padding: '15px 10px' }}>
                                 <span className="badge" style={{ background: '#fff', color: '#0284c7', padding: '8px 16px', fontSize: '1.1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                    {grandTotalSNDE.rate}%
                                 </span>
                              </td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

    </div>
  )
}

function NavItem({ icon, label, active }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function StatCard({ label, value, sub, pos, icon }) {
  return (
    <div className="glass-card stat-card">
      <div className="stat-header">
         <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
         {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
         {pos ? <ArrowUpRight size={16} color="var(--accent)" /> : <ArrowDownRight size={16} color="var(--danger)" />}
         <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pos ? 'var(--accent)' : 'var(--danger)' }}>{sub}</span>
      </div>
    </div>
  )
}

export default App
