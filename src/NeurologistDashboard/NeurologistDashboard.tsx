import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, Legend } from "recharts";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Page =
    | "login"
    | "forgot"
    | "dashboard"
    | "patients"
    | "patient-detail"
    | "patient-new"
    | "patient-edit"
    | "session-live"
    | "session-history"
    | "analytics";

interface Patient {
    id: string;
    name: string;
    age: number;
    dni: string;
    diagnosis: string;
    mocaScore: number;
    stage: "Leve" | "Moderado" | "Severo";
    registeredAt: string;
    lastSession: string;
    status: "Activo" | "En sesión" | "Inactivo";
    sessions: Session[];
}

interface Session {
    id: string;
    date: string;
    level: 1 | 2;
    variation: "A" | "B" | "C";
    difficulty: "Bajo" | "Medio" | "Alto";
    aciertos: number;
    errores: number;
    objetosIdentificados: number;
    eventosReconocidos: number;
    tiempoReaccion: number;
    memoriaEpisodica: number;
    atencionSostenida: number;
    clasificacion: "Bajo" | "Medio" | "Alto";
    recomendacion: "Subir" | "Mantener" | "Bajar";
    duracion: number;
}

interface Notification {
    id: string;
    patientName: string;
    message: string;
    time: string;
    type: "session-end" | "level-end";
    read: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_SESSIONS: Session[] = [
    { id: "s1", date: "2026-04-20", level: 1, variation: "A", difficulty: "Bajo", aciertos: 6, errores: 4, objetosIdentificados: 6, eventosReconocidos: 4, tiempoReaccion: 3.2, memoriaEpisodica: 62, atencionSostenida: 58, clasificacion: "Bajo", recomendacion: "Subir", duracion: 18 },
    { id: "s2", date: "2026-04-22", level: 1, variation: "B", difficulty: "Medio", aciertos: 8, errores: 2, objetosIdentificados: 8, eventosReconocidos: 7, tiempoReaccion: 2.8, memoriaEpisodica: 74, atencionSostenida: 71, clasificacion: "Medio", recomendacion: "Mantener", duracion: 20 },
    { id: "s3", date: "2026-04-24", level: 2, variation: "A", difficulty: "Medio", aciertos: 9, errores: 1, objetosIdentificados: 9, eventosReconocidos: 8, tiempoReaccion: 2.4, memoriaEpisodica: 81, atencionSostenida: 78, clasificacion: "Alto", recomendacion: "Subir", duracion: 22 },
    { id: "s4", date: "2026-04-26", level: 2, variation: "C", difficulty: "Alto", aciertos: 10, errores: 0, objetosIdentificados: 10, eventosReconocidos: 9, tiempoReaccion: 2.1, memoriaEpisodica: 88, atencionSostenida: 85, clasificacion: "Alto", recomendacion: "Mantener", duracion: 25 },
];

const MOCK_PATIENTS: Patient[] = [
    { id: "p1", name: "Rosa Elena Vargas Mendoza", age: 72, dni: "10234567", diagnosis: "Alzheimer leve (GDS-3)", mocaScore: 22, stage: "Leve", registeredAt: "2026-02-10", lastSession: "2026-04-26", status: "Activo", sessions: MOCK_SESSIONS },
    { id: "p2", name: "Jorge Luis Quispe Chávez", age: 68, dni: "20345678", diagnosis: "Alzheimer moderado (GDS-4)", mocaScore: 16, stage: "Moderado", registeredAt: "2026-01-15", lastSession: "2026-04-25", status: "En sesión", sessions: MOCK_SESSIONS.slice(0, 2) },
    { id: "p3", name: "Lucía Fernández Torres", age: 75, dni: "30456789", diagnosis: "Alzheimer leve (GDS-3)", mocaScore: 20, stage: "Leve", registeredAt: "2026-03-05", lastSession: "2026-04-20", status: "Activo", sessions: MOCK_SESSIONS.slice(0, 3) },
    { id: "p4", name: "Carlos Mamani Huanca", age: 80, dni: "40567890", diagnosis: "Alzheimer severo (GDS-5)", mocaScore: 10, stage: "Severo", registeredAt: "2025-11-20", lastSession: "2026-04-18", status: "Inactivo", sessions: MOCK_SESSIONS.slice(0, 1) },
];

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: "n1", patientName: "Jorge Luis Quispe Chávez", message: "Finalizó el Nivel 1 · Variación B", time: "hace 2 min", type: "level-end", read: false },
    { id: "n2", patientName: "Rosa Elena Vargas Mendoza", message: "Sesión completa finalizada", time: "hace 15 min", type: "session-end", read: false },
    { id: "n3", patientName: "Lucía Fernández Torres", message: "Finalizó el Nivel 2 · Variación A", time: "hace 1 h", type: "level-end", read: true },
];

// ─── STYLES (CSS-in-JS via injected <style>) ─────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Fira+Code:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #F5F5F5;
    --surface:   #F5F5F5;
    --surface2:  #F4F5FF;
    --surface3:  #F4F5FF;
    --surface4:  #FFFFFF;
    --surface5:  #F5F5F5;
    --border:    #1f2d44;
    --accent:    #00e5a0;
    --accent2:   #0099ff;
    --accent3:   #ff6b6b;
    --warn:      #ffb830;
    --text:      #000000;
    --text2:     #000000;
    --text3:     #000000;
    --radius:    12px;
    --font:      'Syne', sans-serif;
    --mono:      'Fira Code', monospace;
    --shadow:    0 8px 32px rgba(0,0,0,0.5);
  }

  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font); }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* ── LAYOUT ── */
  .app-shell { display: flex; height: 100vh; overflow: hidden; }
  .sidebar {
    width: 240px; min-width: 240px; background: var(--surface);
    border-right: 1px solid var(--border); display: flex; flex-direction: column;
    padding: 0; overflow: hidden; position: relative;
  }
  .sidebar::after {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

  /* ── LOGO ── */
  .sidebar-logo {
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border);
  }
  .logo-title {
    font-size: 22px; font-weight: 800; letter-spacing: 3px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .logo-sub { font-size: 9px; color: var(--text3); letter-spacing: 2px; font-family: var(--mono); margin-top: 2px; }

  /* ── NAV ── */
  .nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .nav-label { font-size: 9px; letter-spacing: 2px; color: var(--text3); padding: 12px 12px 4px; font-family: var(--mono); }
  .nav-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px;
    cursor: pointer; transition: all .2s; font-size: 13px; color: var(--text2); font-weight: 500;
    border: 1px solid transparent; position: relative;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: var(--surface3); color: var(--accent); border-color: var(--border); }
  .nav-item.active::before {
    content:''; position:absolute; left:-12px; top:50%; transform:translateY(-50%);
    width:3px; height:60%; background: var(--accent); border-radius:0 2px 2px 0;
  }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .nav-badge {
    margin-left: auto; background: var(--accent3); color: white;
    font-size: 10px; border-radius: 10px; padding: 1px 6px; font-family: var(--mono);
  }

  /* ── SIDEBAR USER ── */
  .sidebar-user {
    padding: 16px; border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px; cursor: pointer;
  }
  .avatar {
    width: 36px; height: 36px; border-radius: 50%; background: var(--surface3);
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    font-weight: 700; color: var(--accent); border: 1.5px solid var(--border); flex-shrink:0;
  }
  .user-name { font-size: 12px; font-weight: 600; color: var(--text); }
  .user-role { font-size: 10px; color: var(--text3); font-family: var(--mono); }

  /* ── TOPBAR ── */
  .topbar {
    padding: 16px 32px; background: var(--surface); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .page-title { font-size: 20px; font-weight: 700; }
  .page-sub { font-size: 12px; color: var(--text2); margin-top: 2px; font-family: var(--mono); }
  .topbar-actions { display: flex; gap: 10px; align-items: center; }

  /* ── PAGE CONTENT ── */
  .page { padding: 28px 32px; flex: 1; }

  /* ── CARDS ── */
  .card {
    background: var(--surface4); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px;
  }
  .card-label { font-size: 10px; letter-spacing: 2px; color: var(--text3); font-family: var(--mono); margin-bottom: 6px; }
  .card-value { font-size: 28px; font-weight: 800; color: var(--text); }
  .card-sub { font-size: 11px; color: var(--text2); margin-top: 4px; }

  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
  .stat-accent { border-top: 2px solid var(--accent); }
  .stat-blue   { border-top: 2px solid var(--accent2); }
  .stat-warn   { border-top: 2px solid var(--warn); }
  .stat-red    { border-top: 2px solid var(--accent3); }

  /* ── BUTTONS ── */
  .btn {
    padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer;
    font-family: var(--font); font-size: 13px; font-weight: 600; transition: all .2s; display:inline-flex; align-items:center; gap:6px;
  }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: #00ffc0; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,229,160,.3); }
  .btn-secondary { background: var(--surface3); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
  .btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border); }
  .btn-ghost:hover { color: var(--text); background: var(--surface2); }
  .btn-danger { background: var(--accent3); color: white; }
  .btn-danger:hover { background: #ff4040; }
  .btn-sm { padding: 6px 12px; font-size: 11px; }
  .btn-icon { width:36px; height:36px; padding:0; justify-content:center; border-radius:8px; }

  /* ── INPUT ── */
  .input-group { display: flex; flex-direction: column; gap: 6px; }
  .input-label { font-size: 11px; color: var(--text2); font-family: var(--mono); letter-spacing:1px; }
  .input, select.input, textarea.input {
    background: var(--surface5); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); padding: 10px 14px; font-family: var(--font); font-size: 13px;
    outline: none; transition: border-color .2s; width:100%;
  }
  .input:focus, select.input:focus, textarea.input:focus { border-color: var(--accent); }
  select.input option { background: var(--surface2); }

  /* ── TABLE ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead tr { border-bottom: 1px solid var(--border); }
  th { text-align: left; padding: 10px 14px; color: var(--text3); font-size: 10px; letter-spacing: 2px; font-family: var(--mono); font-weight: 500; white-space:nowrap; }
  td { padding: 12px 14px; border-bottom: 1px solid rgba(31,45,68,.5); vertical-align: middle; }
  tbody tr { transition: background .15s; cursor:pointer; }
  tbody tr:hover { background: var(--surface2); }
  tbody tr:last-child td { border-bottom: none; }

  /* ── BADGES ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 600;
    font-family: var(--mono); white-space: nowrap;
  }
  .badge-green  { color: var(--accent); border: 1px solid rgba(0,229,160,.2); }
  .badge-blue   { color: var(--accent2); border: 1px solid rgba(0,153,255,.2); }
  .badge-red    { color: var(--accent3); border: 1px solid rgba(255,107,107,.2); }
  .badge-warn   { color: var(--warn); border: 1px solid rgba(255,184,48,.2); }
  .badge-gray   { color: var(--text2); border: 1px solid var(--border); }

  /* ── FORMS ── */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .form-grid .span2 { grid-column: span 2; }
  .form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:8px; }

  /* ── SEARCH ── */
  .search-row { display:flex; gap:12px; align-items:center; margin-bottom:20px; }
  .search-wrap { position:relative; flex:1; }
  .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text3); font-size:14px; }
  .search-input { padding-left:36px !important; }

  /* ── SECTION HEADER ── */
  .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .section-title { font-size:16px; font-weight:700; }
  .section-sub { font-size:11px; color:var(--text2); font-family:var(--mono); margin-top:2px; }

  /* ── PATIENT CARD (grid) ── */
  .patients-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
  .patient-card {
    background:var(--surface); border:1px solid var(--border); border-radius:var(--radius);
    padding:20px; cursor:pointer; transition: all .2s;
  }
  .patient-card:hover { border-color:var(--accent); transform:translateY(-2px); box-shadow:var(--shadow); }
  .patient-card-header { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
  .patient-avatar {
    width:44px; height:44px; border-radius:50%; background:var(--surface3);
    display:flex; align-items:center; justify-content:center;
    font-size:16px; font-weight:700; color:var(--accent2); flex-shrink:0;
  }
  .patient-name { font-size:14px; font-weight:600; }
  .patient-meta { font-size:11px; color:var(--text2); font-family:var(--mono); margin-top:2px; }
  .patient-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px; }
  .patient-stat { text-align:center; }
  .ps-val { font-size:18px; font-weight:800; color:var(--accent); }
  .ps-lbl { font-size:9px; color:var(--text3); font-family:var(--mono); }

  /* ── LIVE STREAM ── */
  .live-wrapper { background:#000; border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; position:relative; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; }
  .live-badge { position:absolute; top:14px; left:14px; background:var(--accent3); color:white; font-size:10px; font-weight:700; padding:3px 10px; border-radius:4px; display:flex; align-items:center; gap:5px; animation: pulse-badge 1.5s infinite; }
  @keyframes pulse-badge { 0%,100%{opacity:1} 50%{opacity:.6} }
  .live-dot { width:7px; height:7px; border-radius:50%; background:white; }
  .live-placeholder { color:var(--text3); font-family:var(--mono); font-size:13px; text-align:center; }

  /* ── METRIC PANEL ── */
  .metrics-live { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
  .metric-item { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:14px; text-align:center; }
  .metric-val { font-size:24px; font-weight:800; color:var(--accent); font-family:var(--mono); }
  .metric-lbl { font-size:9px; color:var(--text3); margin-top:4px; letter-spacing:1px; font-family:var(--mono); }

  /* ── TABS ── */
  .tabs { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:24px; }
  .tab { padding:10px 18px; font-size:13px; font-weight:600; cursor:pointer; color:var(--text2); border-bottom:2px solid transparent; transition:all .2s; }
  .tab:hover { color:var(--text); }
  .tab.active { color:var(--accent); border-bottom-color:var(--accent); }

  /* ── NOTIF PANEL ── */
  .notif-panel {
    position:absolute; top:calc(100% + 8px); right:0; width:320px;
    background:var(--surface); border:1px solid var(--border); border-radius:var(--radius);
    box-shadow:var(--shadow); z-index:100; overflow:hidden;
  }
  .notif-header { padding:14px 16px; border-bottom:1px solid var(--border); font-size:13px; font-weight:700; }
  .notif-item { padding:12px 16px; border-bottom:1px solid rgba(31,45,68,.5); cursor:pointer; transition:background .15s; }
  .notif-item:hover { background:var(--surface2); }
  .notif-item:last-child { border-bottom:none; }
  .notif-name { font-size:12px; font-weight:600; }
  .notif-msg { font-size:11px; color:var(--text2); margin-top:2px; }
  .notif-time { font-size:10px; color:var(--text3); font-family:var(--mono); margin-top:4px; }
  .notif-unread { background:rgba(0,229,160,.04); }

  /* ── LOGIN ── */
  .login-page {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:var(--bg); position:relative; overflow:hidden;
  }
  .login-bg {
    position:absolute; inset:0;
    background: radial-gradient(ellipse at 20% 80%, rgba(0,229,160,.06) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(0,153,255,.06) 0%, transparent 60%);
  }
  .login-grid {
    position:absolute; inset:0; opacity:.03;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .login-card {
    position:relative; background:var(--surface); border:1px solid var(--border);
    border-radius:16px; padding:48px; width:420px; box-shadow:var(--shadow);
  }
  .login-logo { font-size:32px; font-weight:800; letter-spacing:4px; margin-bottom:4px;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .login-sub { font-size:11px; color:var(--text3); font-family:var(--mono); margin-bottom:32px; }
  .login-form { display:flex; flex-direction:column; gap:16px; }
  .login-divider { border:none; border-top:1px solid var(--border); margin:8px 0; }
  .login-incn { font-size:11px; color:var(--text3); text-align:center; font-family:var(--mono); }

  /* ── CHART CARD ── */
  .chart-card { background:var(--surface4); border:1px solid var(--border); border-radius:var(--radius); padding:20px; }
  .chart-title { font-size:13px; font-weight:600; margin-bottom:16px; }
  .chart-sub { font-size:10px; color:var(--text2); font-family:var(--mono); margin-top:4px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .three-col { display:grid; grid-template-columns:2fr 1fr; gap:20px; }

  /* ── SESSION DETAIL ── */
  .session-row { display:flex; gap:14px; align-items:center; padding:14px 16px; border-radius:10px; background:var(--surface); border:1px solid var(--border); cursor:pointer; transition:all .2s; }
  .session-row:hover { border-color:var(--accent2); }
  .session-date { font-size:11px; font-family:var(--mono); color:var(--text2); min-width:90px; }
  .session-info { flex:1; }
  .session-title { font-size:13px; font-weight:600; }
  .session-meta { font-size:11px; color:var(--text2); font-family:var(--mono); }
  .session-scores { display:flex; gap:16px; align-items:center; }
  .score-item { text-align:right; }
  .score-val { font-size:16px; font-weight:800; color:var(--accent); font-family:var(--mono); }
  .score-lbl { font-size:9px; color:var(--text3); font-family:var(--mono); }

  /* ── PROGRESS BAR ── */
  .progress-wrap { background:var(--surface2); border-radius:4px; height:6px; overflow:hidden; }
  .progress-fill { height:100%; border-radius:4px; transition:width .6s ease; }

  /* ── DETAIL GRID ── */
  .detail-grid { display:grid; grid-template-columns:280px 1fr; gap:24px; align-items:start; }
  .info-list { display:flex; flex-direction:column; gap:0; }
  .info-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(31,45,68,.5); }
  .info-row:last-child { border-bottom:none; }
  .info-key { font-size:11px; color:var(--text2); font-family:var(--mono); }
  .info-val { font-size:13px; font-weight:600; }

  /* ── ALERT ── */
  .alert { border-radius:10px; padding:14px 16px; font-size:13px; border:1px solid; display:flex; align-items:flex-start; gap:10px; }
  .alert-warn { background:rgba(255,184,48,.06); border-color:rgba(255,184,48,.2); color:var(--warn); }
  .alert-green { background:rgba(0,229,160,.06); border-color:rgba(0,229,160,.2); color:var(--accent); }

  /* ── EMPTY STATE ── */
  .empty { text-align:center; padding:60px 20px; color:var(--text3); }
  .empty-icon { font-size:40px; margin-bottom:12px; }
  .empty-text { font-size:14px; margin-bottom:8px; color:var(--text2); }
  .empty-sub { font-size:12px; font-family:var(--mono); }

  /* ── ANIMATE ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation:fadeUp .35s ease both; }

  /* ── MODAL ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200; }
  .modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:32px; width:540px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow); }
  .modal-title { font-size:18px; font-weight:700; margin-bottom:24px; }

  /* ── RECOMEND CHIP ── */
  .rec-up   { color:var(--accent);  border:1px solid rgba(0,229,160,.2); }
  .rec-keep { color:var(--warn); border:1px solid rgba(255,184,48,.2); }
  .rec-down { color:var(--accent3); border:1px solid rgba(255,107,107,.2); }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function stageBadge(s: Patient["stage"]) {
    if (s === "Leve") return "badge-green";
    if (s === "Moderado") return "badge-warn";
    return "badge-red";
}

function statusBadge(s: Patient["status"]) {
    if (s === "Activo") return "badge-green";
    if (s === "En sesión") return "badge-blue";
    return "badge-gray";
}

function recClass(r: Session["recomendacion"]) {
    if (r === "Subir") return "badge rec-up";
    if (r === "Mantener") return "badge rec-keep";
    return "badge rec-down";
}

function recIcon(r: Session["recomendacion"]) {
    if (r === "Subir") return "↑";
    if (r === "Mantener") return "→";
    return "↓";
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: () => void }) {
    const [mode, setMode] = useState<"login" | "forgot">("login");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [msg, setMsg] = useState("");

    function handleLogin() {
        if (!email || !pass) { setMsg("Ingresa tus credenciales."); return; }
        onLogin();
    }
    function handleForgot() {
        if (!email) { setMsg("Ingresa tu correo institucional."); return; }
        setMsg("✓ Enlace de recuperación enviado a " + email);
    }

    return (
        <div className="login-page">
            <div className="login-bg" />
            <div className="login-grid" />
            <div className="login-card fade-up">
                <div className="login-logo">AREMEC</div>
                <div className="login-sub">INSTITUTO NACIONAL DE CIENCIAS NEUROLÓGICAS</div>

                {mode === "login" ? (
                    <>
                        <div className="login-form">
                            <div className="input-group">
                                <label className="input-label">CORREO INSTITUCIONAL</label>
                                <input className="input" type="email" placeholder="nombre@incn.gob.pe" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">CONTRASEÑA</label>
                                <input className="input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                            </div>
                            {msg && <div className="alert alert-warn"><span>⚠</span>{msg}</div>}
                            <button className="btn btn-primary" style={{ width: "100%", padding: "12px" }} onClick={handleLogin}>
                                Iniciar Sesión
                            </button>
                            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => { setMode("forgot"); setMsg(""); }}>
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                        <hr className="login-divider" />
                        <div className="login-incn">Acceso exclusivo para personal autorizado del INCN</div>
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Recuperar contraseña</div>
                            <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)" }}>Recibirás un enlace temporal en tu correo.</div>
                        </div>
                        <div className="login-form">
                            <div className="input-group">
                                <label className="input-label">CORREO INSTITUCIONAL</label>
                                <input className="input" type="email" placeholder="nombre@incn.gob.pe" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            {msg && <div className="alert alert-green"><span>✓</span>{msg}</div>}
                            <button className="btn btn-primary" style={{ width: "100%", padding: "12px" }} onClick={handleForgot}>
                                Enviar enlace de recuperación
                            </button>
                            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => { setMode("login"); setMsg(""); }}>
                                ← Volver al inicio de sesión
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Sidebar({ page, setPage, unread }: { page: Page, setPage: (p: Page) => void, unread: number }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-title">AREMEC</div>
                <div className="logo-sub">PANEL NEUROLÓGICO</div>
            </div>

            <nav className="nav">
                <div className="nav-label">PRINCIPAL</div>
                <div className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}>
                    <span className="nav-icon">⬡</span> Dashboard
                </div>
                <div className={`nav-item ${page === "patients" || page === "patient-detail" || page === "patient-new" || page === "patient-edit" ? "active" : ""}`} onClick={() => setPage("patients")}>
                    <span className="nav-icon">◈</span> Pacientes
                </div>

                <div className="nav-label">MONITOREO</div>
                <div className={`nav-item ${page === "session-live" ? "active" : ""}`} onClick={() => setPage("session-live")}>
                    <span className="nav-icon">◉</span> Sesión en Vivo
                    {unread > 0 && <span className="nav-badge">{unread}</span>}
                </div>

                <div className="nav-label">ANÁLISIS</div>
                <div className={`nav-item ${page === "session-history" ? "active" : ""}`} onClick={() => setPage("session-history")}>
                    <span className="nav-icon">◫</span> Historial de Sesiones
                </div>
                <div className={`nav-item ${page === "analytics" ? "active" : ""}`} onClick={() => setPage("analytics")}>
                    <span className="nav-icon">◳</span> Tendencias Cognitivas
                </div>
            </nav>

            <div className="sidebar-user">
                <div className="avatar">DR</div>
                <div>
                    <div className="user-name">Dr. Ricardo Salas</div>
                    <div className="user-role">Neurólogo · INCN</div>
                </div>
            </div>
        </aside>
    );
}

function Topbar({ title, sub, actions, notifications, onLogout }: {
    title: string; sub: string;
    actions?: React.ReactNode;
    notifications: Notification[];
    onLogout: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const unread = notifications.filter(n => !n.read).length;

    useEffect(() => {
        function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div className="topbar">
            <div>
                <div className="page-title">{title}</div>
                <div className="page-sub">{sub}</div>
            </div>
            <div className="topbar-actions">
                {actions}
                <div style={{ position: "relative" }} ref={ref}>
                    <button className="btn btn-ghost btn-icon" onClick={() => setOpen(o => !o)} style={{ position: "relative" }}>
                        🔔
                        {unread > 0 && <span style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, background: "var(--accent3)", borderRadius: "50%" }} />}
                    </button>
                    {open && (
                        <div className="notif-panel">
                            <div className="notif-header">Notificaciones {unread > 0 && <span style={{ color: "var(--accent3)", fontFamily: "var(--mono)", fontSize: 11 }}>({unread} nuevas)</span>}</div>
                            {notifications.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>Sin notificaciones</div>}
                            {notifications.map(n => (
                                <div key={n.id} className={`notif-item ${!n.read ? "notif-unread" : ""}`}>
                                    {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginBottom: 4 }} />}
                                    <div className="notif-name">{n.patientName}</div>
                                    <div className="notif-msg">{n.message}</div>
                                    <div className="notif-time">{n.time}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onLogout}>Cerrar sesión</button>
            </div>
        </div>
    );
}

// ── DASHBOARD PAGE ────────────────────────────────────────────────────────────
function DashboardPage({ patients, notifications, setPage, setSelected }: {
    patients: Patient[], notifications: Notification[],
    setPage: (p: Page) => void, setSelected: (id: string) => void
}) {
    const active = patients.filter(p => p.status !== "Inactivo").length;
    const inSession = patients.filter(p => p.status === "En sesión").length;
    const totalSessions = patients.reduce((a, p) => a + p.sessions.length, 0);
    const unread = notifications.filter(n => !n.read).length;

    const recentActivity = [...patients]
        .filter(p => p.sessions.length > 0)
        .sort((a, b) => b.lastSession.localeCompare(a.lastSession))
        .slice(0, 5);

    return (
        <div className="page fade-up">
            <div className="stats-grid">
                <div className="card stat-accent">
                    <div className="card-label">PACIENTES ACTIVOS</div>
                    <div className="card-value">{active}</div>
                    <div className="card-sub">de {patients.length} registrados</div>
                </div>
                <div className="card stat-blue">
                    <div className="card-label">EN SESIÓN AHORA</div>
                    <div className="card-value" style={{ color: "var(--accent2)" }}>{inSession}</div>
                    <div className="card-sub">sesiones inmersivas activas</div>
                </div>
                <div className="card stat-warn">
                    <div className="card-label">SESIONES TOTALES</div>
                    <div className="card-value" style={{ color: "var(--warn)" }}>{totalSessions}</div>
                    <div className="card-sub">registradas en el sistema</div>
                </div>
                <div className="card stat-red">
                    <div className="card-label">NOTIFICACIONES</div>
                    <div className="card-value" style={{ color: "var(--accent3)" }}>{unread}</div>
                    <div className="card-sub">pendientes de revisión</div>
                </div>
            </div>

            <div className="three-col">
                <div className="card">
                    <div className="section-header" style={{ marginBottom: 16 }}>
                        <div>
                            <div className="section-title">Actividad Reciente</div>
                            <div className="section-sub">Últimas sesiones completadas</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPage("session-history")}>Ver todo</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {recentActivity.map(p => {
                            const last = p.sessions[p.sessions.length - 1];
                            return (
                                <div key={p.id} className="session-row" onClick={() => { setSelected(p.id); setPage("patient-detail"); }}>
                                    <div className="patient-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{getInitials(p.name)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name.split(" ").slice(0, 2).join(" ")}</div>
                                        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>Nivel {last.level} · {last.date}</div>
                                    </div>
                                    <span className={`badge ${last.clasificacion === "Alto" ? "badge-green" : last.clasificacion === "Medio" ? "badge-warn" : "badge-red"}`}>
                                        {last.clasificacion}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card">
                        <div className="card-label">PACIENTES EN SESIÓN</div>
                        {inSession === 0 ? (
                            <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)", marginTop: 8 }}>Ningún paciente activo ahora</div>
                        ) : patients.filter(p => p.status === "En sesión").map(p => (
                            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent2)", animation: "pulse-badge 1.5s infinite" }} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name.split(" ").slice(0, 2).join(" ")}</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>Sesión activa</div>
                                </div>
                                <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setPage("session-live")}>Ver</button>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-label">DISTRIBUCIÓN POR ETAPA</div>
                        {(["Leve", "Moderado", "Severo"] as const).map(s => {
                            const count = patients.filter(p => p.stage === s).length;
                            const pct = Math.round(count / patients.length * 100);
                            return (
                                <div key={s} style={{ marginTop: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                                        <span style={{ color: "var(--text2)" }}>{s}</span>
                                        <span style={{ fontFamily: "var(--mono)", color: "var(--text3)" }}>{count} ({pct}%)</span>
                                    </div>
                                    <div className="progress-wrap">
                                        <div className="progress-fill" style={{
                                            width: `${pct}%`,
                                            background: s === "Leve" ? "var(--accent)" : s === "Moderado" ? "var(--warn)" : "var(--accent3)"
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── PATIENTS PAGE ─────────────────────────────────────────────────────────────
function PatientsPage({ patients, setPage, setSelected }: {
    patients: Patient[],

    setPage: (p: Page) => void,
    setSelected: (id: string) => void,
    setPatients: (ps: Patient[]) => void
}) {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");

    const filtered = patients.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.dni.includes(search);
        const matchStatus = filterStatus === "Todos" || p.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="page fade-up">
            <div className="search-row">
                <div className="search-wrap" style={{ flex: 2 }}>
                    <span className="search-icon">🔍</span>
                    <input className="input search-input" placeholder="Buscar por nombre o DNI…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option>Todos</option>
                    <option>Activo</option>
                    <option>En sesión</option>
                    <option>Inactivo</option>
                </select>
                <button className="btn btn-primary" onClick={() => setPage("patient-new")}>
                    + Nuevo Paciente
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>PACIENTE</th>
                                <th>DNI</th>
                                <th>DIAGNÓSTICO</th>
                                <th>MOCA</th>
                                <th>ETAPA</th>
                                <th>ESTADO</th>
                                <th>ÚLTIMA SESIÓN</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={8}>
                                    <div className="empty"><div className="empty-icon">◈</div><div className="empty-text">Sin resultados</div></div>
                                </td></tr>
                            )}
                            {filtered.map(p => (
                                <tr key={p.id} onClick={() => { setSelected(p.id); setPage("patient-detail"); }}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div className="patient-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{getInitials(p.name)}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                                                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>{p.age} años</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{p.dni}</span></td>
                                    <td style={{ maxWidth: 200, fontSize: 12, color: "var(--text2)" }}>{p.diagnosis}</td>
                                    <td><span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--accent2)" }}>{p.mocaScore}/30</span></td>
                                    <td><span className={`badge ${stageBadge(p.stage)}`}>{p.stage}</span></td>
                                    <td><span className={`badge ${statusBadge(p.status)}`}>{p.status === "En sesión" && "● "}{p.status}</span></td>
                                    <td><span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{p.lastSession}</span></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(p.id); setPage("patient-edit"); }}>Editar</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(p.id); setPage("patient-detail"); }}>Dashboard</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── PATIENT FORM (NEW / EDIT) ─────────────────────────────────────────────────
function PatientForm({ patients, selectedId, mode, setPage, setPatients, setSelected }: {
    patients: Patient[], selectedId: string, mode: "new" | "edit",
    setPage: (p: Page) => void, setPatients: (ps: Patient[]) => void, setSelected: (id: string) => void
}) {
    const existing = patients.find(p => p.id === selectedId);
    const [form, setForm] = useState({
        name: existing?.name ?? "",
        age: existing?.age ?? "",
        dni: existing?.dni ?? "",
        diagnosis: existing?.diagnosis ?? "",
        mocaScore: existing?.mocaScore ?? "",
        stage: existing?.stage ?? "Leve",
    });
    const [saved, setSaved] = useState(false);

    function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

    function save() {
        if (!form.name || !form.dni || !form.diagnosis) return;
        if (mode === "new") {
            const newP: Patient = {
                id: "p" + Date.now(), name: form.name, age: Number(form.age), dni: form.dni,
                diagnosis: form.diagnosis, mocaScore: Number(form.mocaScore),
                stage: form.stage as Patient["stage"], registeredAt: new Date().toISOString().slice(0, 10),
                lastSession: "—", status: "Activo", sessions: []
            };
            setPatients([...patients, newP]);
            setSelected(newP.id);
        } else {
            setPatients(patients.map(p => p.id === selectedId ? { ...p, ...form, age: Number(form.age), mocaScore: Number(form.mocaScore), stage: form.stage as Patient["stage"] } : p));
        }
        setSaved(true);
        setTimeout(() => setPage("patients"), 900);
    }

    return (
        <div className="page fade-up">
            <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{mode === "new" ? "Registrar Nuevo Paciente" : "Editar Información del Paciente"}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)", marginTop: 4 }}>
                        {mode === "new" ? "Complete los datos demográficos y clínicos iniciales." : "Actualice los datos del paciente."}
                    </div>
                </div>
                {saved && <div className="alert alert-green" style={{ marginBottom: 16 }}><span>✓</span>Datos guardados correctamente. Redirigiendo…</div>}
                <div className="form-grid">
                    <div className="input-group span2">
                        <label className="input-label">NOMBRE COMPLETO *</label>
                        <input className="input" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Apellidos y nombres" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">DNI *</label>
                        <input className="input" value={form.dni} onChange={e => update("dni", e.target.value)} placeholder="12345678" maxLength={8} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">EDAD</label>
                        <input className="input" type="number" value={form.age} onChange={e => update("age", e.target.value)} placeholder="65" />
                    </div>
                    <div className="input-group span2">
                        <label className="input-label">DIAGNÓSTICO INICIAL *</label>
                        <input className="input" value={form.diagnosis} onChange={e => update("diagnosis", e.target.value)} placeholder="Ej: Alzheimer leve (GDS-3)" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">PUNTAJE MoCA (0–30)</label>
                        <input className="input" type="number" min={0} max={30} value={form.mocaScore} onChange={e => update("mocaScore", e.target.value)} placeholder="22" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">ETAPA CLÍNICA</label>
                        <select className="input" value={form.stage} onChange={e => update("stage", e.target.value)}>
                            <option>Leve</option><option>Moderado</option><option>Severo</option>
                        </select>
                    </div>
                </div>
                <div className="form-actions">
                    <button className="btn btn-ghost" onClick={() => setPage("patients")}>Cancelar</button>
                    <button className="btn btn-primary" onClick={save}>{mode === "new" ? "Registrar Paciente" : "Guardar Cambios"}</button>
                </div>
            </div>
        </div>
    );
}

// ── PATIENT DETAIL ────────────────────────────────────────────────────────────
function PatientDetail({ patient, setPage }: { patient: Patient, setPage: (p: Page) => void }) {
    const [tab, setTab] = useState<"overview" | "sessions" | "trends">("overview");

    const trendData = patient.sessions.map((s, i) => ({
        name: `Ses.${i + 1}`,
        Memoria: s.memoriaEpisodica,
        Atención: s.atencionSostenida,
        Aciertos: s.aciertos * 10,
    }));

    const radarData = patient.sessions.length > 0 ? [
        { subject: "Memoria", A: patient.sessions[patient.sessions.length - 1].memoriaEpisodica },
        { subject: "Atención", A: patient.sessions[patient.sessions.length - 1].atencionSostenida },
        { subject: "Aciertos", A: patient.sessions[patient.sessions.length - 1].aciertos * 10 },
        { subject: "Velocidad", A: Math.round(100 - patient.sessions[patient.sessions.length - 1].tiempoReaccion * 15) },
        { subject: "Nivel", A: patient.sessions[patient.sessions.length - 1].level === 2 ? 80 : 50 },
    ] : [];

    const lastSession = patient.sessions[patient.sessions.length - 1];

    return (
        <div className="page fade-up">
            {/* Header */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="patient-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{getInitials(patient.name)}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{patient.name}</div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)" }}>DNI: {patient.dni}</span>
                            <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)" }}>·</span>
                            <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)" }}>{patient.age} años</span>
                            <span className={`badge ${stageBadge(patient.stage)}`}>{patient.stage}</span>
                            <span className={`badge ${statusBadge(patient.status)}`}>{patient.status}</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPage("patient-edit")}>✏ Editar</button>
                        {patient.status === "En sesión" && (
                            <button className="btn btn-primary btn-sm" onClick={() => setPage("session-live")}>◉ Ver en vivo</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {(["overview", "sessions", "trends"] as const).map(t => (
                    <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                        {t === "overview" ? "Resumen" : t === "sessions" ? "Historial de Sesiones" : "Tendencias"}
                    </div>
                ))}
            </div>

            {tab === "overview" && (
                <div>
                    <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 20 }}>
                        <div className="card stat-accent">
                            <div className="card-label">PUNTAJE MoCA</div>
                            <div className="card-value">{patient.mocaScore}<span style={{ fontSize: 16, color: "var(--text2)" }}>/30</span></div>
                            <div className="card-sub">Evaluación inicial</div>
                        </div>
                        <div className="card stat-blue">
                            <div className="card-label">SESIONES REALIZADAS</div>
                            <div className="card-value" style={{ color: "var(--accent2)" }}>{patient.sessions.length}</div>
                            <div className="card-sub">Sesiones completadas</div>
                        </div>
                        {lastSession && <>
                            <div className="card stat-warn">
                                <div className="card-label">ÚLTIMO RENDIMIENTO</div>
                                <div className="card-value" style={{ color: "var(--warn)" }}>{lastSession.memoriaEpisodica}%</div>
                                <div className="card-sub">Memoria episódica</div>
                            </div>
                            <div className="card stat-accent">
                                <div className="card-label">RECOMENDACIÓN ML</div>
                                <div className={`badge ${lastSession.recomendacion === "Subir" ? "rec-up" : lastSession.recomendacion === "Mantener" ? "rec-keep" : "rec-down"}`} style={{ fontSize: 14, padding: "6px 14px" }}>
                                    {recIcon(lastSession.recomendacion)} {lastSession.recomendacion}
                                </div>
                                <div className="card-sub">Ajuste de dificultad</div>
                            </div>
                        </>}
                    </div>

                    <div className="two-col">
                        <div className="card">
                            <div className="chart-title">Información Clínica</div>
                            <div className="info-list">
                                <div className="info-row"><span className="info-key">Diagnóstico</span><span className="info-val" style={{ fontSize: 12, maxWidth: 200, textAlign: "right" }}>{patient.diagnosis}</span></div>
                                <div className="info-row"><span className="info-key">Registro</span><span className="info-val">{patient.registeredAt}</span></div>
                                <div className="info-row"><span className="info-key">Última sesión</span><span className="info-val">{patient.lastSession}</span></div>
                                {lastSession && <>
                                    <div className="info-row"><span className="info-key">Nivel actual</span><span className="info-val">Nivel {lastSession.level}</span></div>
                                    <div className="info-row"><span className="info-key">Dificultad actual</span><span className="info-val">{lastSession.difficulty}</span></div>
                                    <div className="info-row"><span className="info-key">Clasificación SVM</span>
                                        <span className={`badge ${lastSession.clasificacion === "Alto" ? "badge-green" : lastSession.clasificacion === "Medio" ? "badge-warn" : "badge-red"}`}>{lastSession.clasificacion}</span>
                                    </div>
                                </>}
                            </div>
                        </div>
                        {radarData.length > 0 && (
                            <div className="card">
                                <div className="chart-title">Perfil Cognitivo — Última sesión</div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="var(--border)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text2)", fontSize: 11, fontFamily: "var(--mono)" }} />
                                        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--text3)", fontSize: 9 }} />
                                        <Radar name="Paciente" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === "sessions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {patient.sessions.length === 0 && (
                        <div className="empty"><div className="empty-icon">◫</div><div className="empty-text">Sin sesiones registradas</div><div className="empty-sub">Las sesiones aparecerán aquí tras completar niveles inmersivos</div></div>
                    )}
                    {[...patient.sessions].reverse().map(s => (
                        <div key={s.id} className="session-row">
                            <div>
                                <div className="session-date">{s.date}</div>
                                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>Duración: {s.duracion} min</div>
                            </div>
                            <div className="session-info">
                                <div className="session-title">Nivel {s.level} · Variación {s.variation}</div>
                                <div className="session-meta">Dificultad: {s.difficulty}</div>
                            </div>
                            <div className="session-scores">
                                <div className="score-item">
                                    <div className="score-val">{s.aciertos}/{s.aciertos + s.errores}</div>
                                    <div className="score-lbl">ACIERTOS</div>
                                </div>
                                <div className="score-item">
                                    <div className="score-val">{s.memoriaEpisodica}%</div>
                                    <div className="score-lbl">MEMORIA</div>
                                </div>
                                <div className="score-item">
                                    <div className="score-val">{s.atencionSostenida}%</div>
                                    <div className="score-lbl">ATENCIÓN</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                                <span className={`badge ${s.clasificacion === "Alto" ? "badge-green" : s.clasificacion === "Medio" ? "badge-warn" : "badge-red"}`}>{s.clasificacion}</span>
                                <span className={`badge ${s.recomendacion === "Subir" ? "rec-up" : s.recomendacion === "Mantener" ? "rec-keep" : "rec-down"}`} style={{ fontSize: 10 }}>
                                    {recIcon(s.recomendacion)} {s.recomendacion} dificultad
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === "trends" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {patient.sessions.length < 2 ? (
                        <div className="alert alert-warn"><span>⚠</span>Se necesitan al menos 2 sesiones para visualizar tendencias.</div>
                    ) : (
                        <>
                            <div className="chart-card">
                                <div className="chart-title">Evolución: Memoria Episódica y Atención Sostenida</div>
                                <div className="chart-sub">Por sesión cronológica — dominio cognitivo evaluado</div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="name" tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                        <YAxis domain={[0, 100]} tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                        <Tooltip contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Line type="monotone" dataKey="Memoria" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)", r: 4 }} />
                                        <Line type="monotone" dataKey="Atención" stroke="var(--accent2)" strokeWidth={2} dot={{ fill: "var(--accent2)", r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="chart-card">
                                <div className="chart-title">Aciertos por Sesión</div>
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="name" tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                        <YAxis tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                        <Tooltip contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                                        <Bar dataKey="Aciertos" fill="var(--accent2)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ── LIVE SESSION PAGE ─────────────────────────────────────────────────────────
function LiveSessionPage({ patients }: { patients: Patient[] }) {
    const activePatient = patients.find(p => p.status === "En sesión") || patients[0];
    const lastSession = activePatient?.sessions[activePatient.sessions.length - 1];
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");

    return (
        <div className="page fade-up">
            <div className="two-col" style={{ alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="live-wrapper">
                        <div className="live-badge"><div className="live-dot" />EN VIVO</div>
                        <div className="live-placeholder">
                            <div style={{ fontSize: 32, marginBottom: 8 }}>◉</div>
                            <div>Transmisión Agora RTC</div>
                            <div style={{ fontSize: 11, marginTop: 4, color: "var(--text3)" }}>Conectando con el visor Meta Quest 3S…</div>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 20, marginTop: 12, color: "var(--accent)" }}>{mm}:{ss}</div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-label">MÉTRICAS EN TIEMPO REAL</div>
                        <div className="metrics-live" style={{ marginTop: 12 }}>
                            <div className="metric-item"><div className="metric-val" style={{ color: "var(--accent)" }}>{lastSession?.aciertos ?? "-"}</div><div className="metric-lbl">ACIERTOS</div></div>
                            <div className="metric-item"><div className="metric-val" style={{ color: "var(--accent3)" }}>{lastSession?.errores ?? "-"}</div><div className="metric-lbl">ERRORES</div></div>
                            <div className="metric-item"><div className="metric-val" style={{ color: "var(--accent2)" }}>{lastSession?.objetosIdentificados ?? "-"}</div><div className="metric-lbl">OBJETOS</div></div>
                            <div className="metric-item"><div className="metric-val" style={{ color: "var(--warn)" }}>{lastSession?.eventosReconocidos ?? "-"}</div><div className="metric-lbl">EVENTOS</div></div>
                            <div className="metric-item"><div className="metric-val" style={{ color: "var(--text)" }}>{lastSession?.tiempoReaccion ? `${lastSession.tiempoReaccion}s` : "-"}</div><div className="metric-lbl">T. REACCIÓN</div></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {activePatient && (
                        <div className="card">
                            <div className="card-label">PACIENTE EN SESIÓN</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, marginBottom: 14 }}>
                                <div className="patient-avatar" style={{ width: 44, height: 44, fontSize: 15 }}>{getInitials(activePatient.name)}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{activePatient.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)", marginTop: 2 }}>{activePatient.diagnosis}</div>
                                </div>
                            </div>
                            <div className="info-list">
                                <div className="info-row"><span className="info-key">Nivel actual</span><span className="info-val">Nivel {lastSession?.level ?? 1}</span></div>
                                <div className="info-row"><span className="info-key">Variación</span><span className="info-val">{lastSession?.variation ?? "-"}</span></div>
                                <div className="info-row"><span className="info-key">Dificultad</span><span className="info-val">{lastSession?.difficulty ?? "-"}</span></div>
                                <div className="info-row"><span className="info-key">MoCA basal</span><span className="info-val">{activePatient.mocaScore}/30</span></div>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-label">CLASIFICACIÓN ML</div>
                        <div style={{ marginTop: 12 }}>
                            {lastSession ? (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <span style={{ fontSize: 12, color: "var(--text2)" }}>Rendimiento clasificado</span>
                                        <span className={`badge ${lastSession.clasificacion === "Alto" ? "badge-green" : lastSession.clasificacion === "Medio" ? "badge-warn" : "badge-red"}`}>{lastSession.clasificacion}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 12, color: "var(--text2)" }}>Recomendación dificultad</span>
                                        <span className={`badge ${recClass(lastSession.recomendacion)}`}>{recIcon(lastSession.recomendacion)} {lastSession.recomendacion}</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)" }}>Esperando finalización del nivel…</div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-label">MÉTRICAS POR DOMINIO COGNITIVO</div>
                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                                    <span style={{ color: "var(--text2)" }}>Memoria Episódica</span>
                                    <span style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>{lastSession?.memoriaEpisodica ?? 0}%</span>
                                </div>
                                <div className="progress-wrap">
                                    <div className="progress-fill" style={{ width: `${lastSession?.memoriaEpisodica ?? 0}%`, background: "var(--accent)" }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                                    <span style={{ color: "var(--text2)" }}>Atención Sostenida</span>
                                    <span style={{ fontFamily: "var(--mono)", color: "var(--accent2)" }}>{lastSession?.atencionSostenida ?? 0}%</span>
                                </div>
                                <div className="progress-wrap">
                                    <div className="progress-fill" style={{ width: `${lastSession?.atencionSostenida ?? 0}%`, background: "var(--accent2)" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── SESSION HISTORY ───────────────────────────────────────────────────────────
function SessionHistoryPage({ patients, setPage, setSelected }: {
    patients: Patient[], setPage: (p: Page) => void, setSelected: (id: string) => void
}) {
    const [filterPatient, setFilterPatient] = useState("Todos");
    const [filterSession, setFilterSession] = useState("");

    type FlatSession = Session & { patientName: string; patientId: string };
    const allSessions: FlatSession[] = patients.flatMap(p =>
        p.sessions.map(s => ({ ...s, patientName: p.name, patientId: p.id }))
    ).sort((a, b) => b.date.localeCompare(a.date));

    const filtered = allSessions.filter(s => {
        const matchPatient = filterPatient === "Todos" || s.patientId === filterPatient;
        const matchSession = !filterSession || s.id === filterSession || s.date.includes(filterSession);
        return matchPatient && matchSession;
    });

    return (
        <div className="page fade-up">
            <div className="search-row">
                <select className="input" style={{ width: 220 }} value={filterPatient} onChange={e => setFilterPatient(e.target.value)}>
                    <option value="Todos">Todos los pacientes</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name.split(" ").slice(0, 2).join(" ")}</option>)}
                </select>
                <input className="input" style={{ flex: 1 }} placeholder="Filtrar por fecha (YYYY-MM-DD)…" value={filterSession} onChange={e => setFilterSession(e.target.value)} />
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>FECHA</th>
                                <th>PACIENTE</th>
                                <th>NIVEL</th>
                                <th>DIFICULTAD</th>
                                <th>ACIERTOS</th>
                                <th>MEMORIA EP.</th>
                                <th>ATENCIÓN SOS.</th>
                                <th>T. REACCIÓN</th>
                                <th>CLASIFICACIÓN</th>
                                <th>RECOMENDACIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={10}><div className="empty"><div className="empty-icon">◫</div><div className="empty-text">Sin sesiones</div></div></td></tr>
                            )}
                            {filtered.map(s => (
                                <tr key={s.id + s.patientId} onClick={() => { setSelected(s.patientId); setPage("patient-detail"); }}>
                                    <td><span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{s.date}</span></td>
                                    <td style={{ fontSize: 12, fontWeight: 600 }}>{(s as FlatSession).patientName.split(" ").slice(0, 2).join(" ")}</td>
                                    <td><span style={{ fontFamily: "var(--mono)" }}>Nivel {s.level} · {s.variation}</span></td>
                                    <td><span className={`badge ${s.difficulty === "Alto" ? "badge-blue" : s.difficulty === "Medio" ? "badge-warn" : "badge-gray"}`}>{s.difficulty}</span></td>
                                    <td><span style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>{s.aciertos}/{s.aciertos + s.errores}</span></td>
                                    <td><span style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>{s.memoriaEpisodica}%</span></td>
                                    <td><span style={{ fontFamily: "var(--mono)", color: "var(--accent2)" }}>{s.atencionSostenida}%</span></td>
                                    <td><span style={{ fontFamily: "var(--mono)" }}>{s.tiempoReaccion}s</span></td>
                                    <td><span className={`badge ${s.clasificacion === "Alto" ? "badge-green" : s.clasificacion === "Medio" ? "badge-warn" : "badge-red"}`}>{s.clasificacion}</span></td>
                                    <td><span className={`badge ${s.recomendacion === "Subir" ? "rec-up" : s.recomendacion === "Mantener" ? "rec-keep" : "rec-down"}`}>{recIcon(s.recomendacion)} {s.recomendacion}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── ANALYTICS PAGE ────────────────────────────────────────────────────────────
function AnalyticsPage({ patients }: { patients: Patient[] }) {
    const [selectedPatient, setSelectedPatient] = useState(patients[0]?.id ?? "");
    const patient = patients.find(p => p.id === selectedPatient) || patients[0];

    const trendData = patient?.sessions.map((s, i) => ({
        name: `Ses.${i + 1}`,
        Memoria: s.memoriaEpisodica,
        Atención: s.atencionSostenida,
        date: s.date,
    })) || [];

    const avgMem = patient?.sessions.length ? Math.round(patient.sessions.reduce((a, s) => a + s.memoriaEpisodica, 0) / patient.sessions.length) : 0;
    const avgAt = patient?.sessions.length ? Math.round(patient.sessions.reduce((a, s) => a + s.atencionSostenida, 0) / patient.sessions.length) : 0;
    const trend = trendData.length >= 2 ? trendData[trendData.length - 1].Memoria - trendData[0].Memoria : 0;

    return (
        <div className="page fade-up">
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>Paciente:</div>
                <select className="input" style={{ width: 280 }} value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="card stat-accent">
                    <div className="card-label">MEMORIA PROMEDIO</div>
                    <div className="card-value">{avgMem}%</div>
                    <div className="card-sub">Episódica · todas las sesiones</div>
                </div>
                <div className="card stat-blue">
                    <div className="card-label">ATENCIÓN PROMEDIO</div>
                    <div className="card-value" style={{ color: "var(--accent2)" }}>{avgAt}%</div>
                    <div className="card-sub">Sostenida · todas las sesiones</div>
                </div>
                <div className="card stat-warn">
                    <div className="card-label">SESIONES ANALIZADAS</div>
                    <div className="card-value" style={{ color: "var(--warn)" }}>{patient?.sessions.length ?? 0}</div>
                    <div className="card-sub">Base del análisis longitudinal</div>
                </div>
                <div className="card" style={{ borderTop: `2px solid ${trend >= 0 ? "var(--accent)" : "var(--accent3)"}` }}>
                    <div className="card-label">TENDENCIA MEMORIA</div>
                    <div className="card-value" style={{ color: trend >= 0 ? "var(--accent)" : "var(--accent3)" }}>
                        {trend >= 0 ? "↑" : ""}{trend}%
                    </div>
                    <div className="card-sub">{trend >= 0 ? "Mejora" : "Retroceso"} desde sesión inicial</div>
                </div>
            </div>

            {trendData.length < 2 ? (
                <div className="alert alert-warn"><span>⚠</span>Se necesitan al menos 2 sesiones para visualizar tendencias comparativas.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="chart-card">
                        <div className="chart-title">Tendencia Cognitiva — {patient?.name}</div>
                        <div className="chart-sub">Evolución de dominios cognitivos evaluados por sesión</div>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                <YAxis domain={[0, 100]} tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                <Tooltip contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                    labelFormatter={(_, payload) => payload[0]?.payload?.date || ""} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="Memoria" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 5 }} activeDot={{ r: 7 }} />
                                <Line type="monotone" dataKey="Atención" stroke="var(--accent2)" strokeWidth={2.5} dot={{ fill: "var(--accent2)", r: 5 }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="two-col">
                        <div className="chart-card">
                            <div className="chart-title">Comparativo por Sesión</div>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                    <Tooltip contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Bar dataKey="Memoria" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Atención" fill="var(--accent2)" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card">
                            <div className="chart-title">Historial de Clasificaciones SVM</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                                {patient?.sessions.map((s, i) => (
                                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", minWidth: 48 }}>Ses. {i + 1}</span>
                                        <div className="progress-wrap" style={{ flex: 1 }}>
                                            <div className="progress-fill" style={{
                                                width: s.clasificacion === "Alto" ? "100%" : s.clasificacion === "Medio" ? "65%" : "35%",
                                                background: s.clasificacion === "Alto" ? "var(--accent)" : s.clasificacion === "Medio" ? "var(--warn)" : "var(--accent3)"
                                            }} />
                                        </div>
                                        <span className={`badge ${s.clasificacion === "Alto" ? "badge-green" : s.clasificacion === "Medio" ? "badge-warn" : "badge-red"}`} style={{ fontSize: 9 }}>
                                            {s.clasificacion}
                                        </span>
                                        <span className={`badge ${recClass(s.recomendacion)}`} style={{ fontSize: 9 }}>
                                            {recIcon(s.recomendacion)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
    const [authed, setAuthed] = useState(false);
    const [page, setPage] = useState<Page>("dashboard");
    const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
    const [selectedId, setSelectedId] = useState("");
    const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [inactiveTimer, setInactiveTimer] = useState(0);
    const inactiveRef = useRef(0);

    // HU-02 session expiry
    useEffect(() => {
        if (!authed) return;
        const reset = () => { inactiveRef.current = 0; setInactiveTimer(0); };
        window.addEventListener("mousemove", reset);
        window.addEventListener("keydown", reset);
        const t = setInterval(() => {
            inactiveRef.current++;
            setInactiveTimer(inactiveRef.current);
            if (inactiveRef.current >= 900) { setAuthed(false); }
        }, 1000);
        return () => { clearInterval(t); window.removeEventListener("mousemove", reset); window.removeEventListener("keydown", reset); };
    }, [authed]);

    const selectedPatient = patients.find(p => p.id === selectedId) || patients[0];
    const unread = notifications.filter(n => !n.read).length;

    const pageMeta: Record<Page, { title: string, sub: string }> = {
        login: { title: "", sub: "" },
        forgot: { title: "", sub: "" },
        dashboard: { title: "Dashboard", sub: "Vista general del sistema AREMEC" },
        patients: { title: "Gestión de Pacientes", sub: "Registro, consulta y edición de pacientes" },
        "patient-detail": { title: "Dashboard del Paciente", sub: "Métricas, historial y análisis cognitivo individual" },
        "patient-new": { title: "Registrar Nuevo Paciente", sub: "Complete los datos clínicos iniciales" },
        "patient-edit": { title: "Editar Paciente", sub: "Actualice la información clínica" },
        "session-live": { title: "Sesión en Vivo", sub: "Transmisión en tiempo real" },
        "session-history": { title: "Historial de Sesiones", sub: "Registro cronológico de sesiones inmersivas" },
        analytics: { title: "Tendencias Cognitivas", sub: "Gráficos de evolución por dominio cognitivo" },
    };

    const inactiveLeft = Math.max(0, 900 - inactiveTimer);
    const showInactiveWarn = authed && inactiveLeft <= 60;

    if (!authed) return (
        <>
            <style>{CSS}</style>
            <LoginPage onLogin={() => { setAuthed(true); setPage("dashboard"); }} />
        </>
    );

    const pm = pageMeta[page];

    return (
        <>
            <style>{CSS}</style>
            <div className="app-shell">
                <Sidebar page={page} setPage={setPage} unread={unread} />
                <div className="main">
                    <Topbar
                        title={pm.title} sub={pm.sub}
                        notifications={notifications}
                        onLogout={() => setAuthed(false)}
                        actions={
                            page === "patient-detail" && selectedPatient ? (
                                <button className="btn btn-ghost btn-sm" onClick={() => setPage("patients")}>← Pacientes</button>
                            ) : undefined
                        }
                    />
                    {showInactiveWarn && (
                        <div className="alert alert-warn fade-up" style={{ margin: "12px 32px 0", fontSize: 12 }}>
                            <span>⏱</span>
                            Tu sesión expirará por inactividad en <strong style={{ fontFamily: "var(--mono)" }}>{inactiveLeft}s</strong>. Mueve el mouse para continuar.
                        </div>
                    )}
                    {page === "dashboard" && <DashboardPage patients={patients} notifications={notifications} setPage={setPage} setSelected={setSelectedId} />}
                    {page === "patients" && <PatientsPage patients={patients} setPage={setPage} setSelected={setSelectedId} setPatients={setPatients} />}
                    {page === "patient-new" && <PatientForm patients={patients} selectedId={selectedId} mode="new" setPage={setPage} setPatients={setPatients} setSelected={setSelectedId} />}
                    {page === "patient-edit" && <PatientForm patients={patients} selectedId={selectedId} mode="edit" setPage={setPage} setPatients={setPatients} setSelected={setSelectedId} />}
                    {page === "patient-detail" && selectedPatient && <PatientDetail patient={selectedPatient} setPage={setPage} />}
                    {page === "session-live" && <LiveSessionPage patients={patients} />}
                    {page === "session-history" && <SessionHistoryPage patients={patients} setPage={setPage} setSelected={setSelectedId} />}
                    {page === "analytics" && <AnalyticsPage patients={patients} />}
                </div>
            </div>
        </>
    );
}