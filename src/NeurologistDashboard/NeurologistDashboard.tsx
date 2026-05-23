import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Page =
    | "login"
    | "forgot"
    | "patients"
    | "patient-detail"
    | "patient-new"
    | "patient-edit"
    | "session-live"
    | "session-history";

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
    ors: number;
    ers: number;
    scs: number;
    er: number;
    rta: number;
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
    { id: "s1", date: "2026-04-20", level: 1, variation: "A", difficulty: "Bajo", aciertos: 6, errores: 4, objetosIdentificados: 6, eventosReconocidos: 4, tiempoReaccion: 3.2, memoriaEpisodica: 62, atencionSostenida: 58, clasificacion: "Bajo", recomendacion: "Subir", duracion: 18, ors: 0.60, ers: 0.40, scs: 0.62, er: 0.40, rta: 3.2 },
    { id: "s2", date: "2026-04-22", level: 1, variation: "B", difficulty: "Medio", aciertos: 8, errores: 2, objetosIdentificados: 8, eventosReconocidos: 7, tiempoReaccion: 2.8, memoriaEpisodica: 74, atencionSostenida: 71, clasificacion: "Medio", recomendacion: "Mantener", duracion: 20, ors: 0.80, ers: 0.70, scs: 0.74, er: 0.20, rta: 2.8 },
    { id: "s3", date: "2026-04-24", level: 2, variation: "A", difficulty: "Medio", aciertos: 9, errores: 1, objetosIdentificados: 9, eventosReconocidos: 8, tiempoReaccion: 2.4, memoriaEpisodica: 81, atencionSostenida: 78, clasificacion: "Alto", recomendacion: "Subir", duracion: 22, ors: 0.90, ers: 0.80, scs: 0.81, er: 0.10, rta: 2.4 },
    { id: "s4", date: "2026-04-26", level: 2, variation: "C", difficulty: "Alto", aciertos: 10, errores: 0, objetosIdentificados: 10, eventosReconocidos: 9, tiempoReaccion: 2.1, memoriaEpisodica: 88, atencionSostenida: 85, clasificacion: "Alto", recomendacion: "Mantener", duracion: 25, ors: 1.00, ers: 0.90, scs: 0.88, er: 0.00, rta: 2.1 },
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

function computeSPS(s: Session): number {
    const rtaScore = Math.min(Math.max(1 - s.rta / 8.0, 0), 1);
    return 0.3 * s.ors + 0.3 * s.ers + 0.2 * s.scs + 0.1 * (1 - s.er) + 0.1 * rtaScore;
}

function linearSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (i - xMean) * (values[i] - yMean);
        den += (i - xMean) ** 2;
    }
    return den === 0 ? 0 : num / den;
}

function slopeTrend(slope: number): "subiendo" | "estable" | "bajando" {
    if (slope > 0.02) return "subiendo";
    if (slope < -0.02) return "bajando";
    return "estable";
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
                <div className={`nav-item ${page === "patients" || page === "patient-detail" || page === "patient-new" || page === "patient-edit" ? "active" : ""}`} onClick={() => setPage("patients")}>
                    <span className="nav-icon">◈</span> Pacientes
                </div>

                <div className="nav-label">MONITOREO</div>
                <div className={`nav-item ${page === "session-live" ? "active" : ""}`} onClick={() => setPage("session-live")}>
                    <span className="nav-icon">◉</span> Sesión en Vivo
                </div>

                <div className="nav-label">ANÁLISIS</div>
                <div className={`nav-item ${page === "session-history" ? "active" : ""}`} onClick={() => setPage("session-history")}>
                    <span className="nav-icon">◫</span> Historial de Sesiones
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
                                <th>ACIERTOS</th>
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
    const [tab, setTab] = useState<"overview" | "sessions">("overview");

    const lastSession = patient.sessions[patient.sessions.length - 1];

    const spsChartData = patient.sessions.map((s, i) => ({
        session: i + 1,
        sps: Math.round(computeSPS(s) * 1000) / 10,
        clasificacion: s.clasificacion,
        recomendacion: s.recomendacion,
    }));

    const slope = linearSlope(patient.sessions.map(s => computeSPS(s)));
    const trend = slopeTrend(slope);

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
                {(["overview", "sessions"] as const).map(t => (
                    <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                        {t === "overview" ? "Resumen" : "Historial de Sesiones"}
                    </div>
                ))}
            </div>

            {tab === "overview" && (
                <div>
                    {patient.sessions.length === 0 ? (
                        <div className="empty"><div className="empty-icon">◈</div><div className="empty-text">Sin sesiones registradas</div></div>
                    ) : (
                        <>
                            {/* Summary cards — última sesión */}
                            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 20 }}>
                                <div className="card">
                                    <div className="card-label">ORS</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>Recuerdo de Objetos</div>
                                    <div className="card-value">{Math.round(lastSession.ors * 100)}<span style={{ fontSize: 14, color: "var(--text2)" }}>%</span></div>
                                </div>
                                <div className="card">
                                    <div className="card-label">ERS</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>Recuerdo de Eventos</div>
                                    <div className="card-value">{Math.round(lastSession.ers * 100)}<span style={{ fontSize: 14, color: "var(--text2)" }}>%</span></div>
                                </div>
                                <div className="card">
                                    <div className="card-label">SCS</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>Comprensión Semántica</div>
                                    <div className="card-value">{Math.round(lastSession.scs * 100)}<span style={{ fontSize: 14, color: "var(--text2)" }}>%</span></div>
                                </div>
                                <div className="card">
                                    <div className="card-label">ER</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>Tasa de Error</div>
                                    <div className="card-value" style={{ color: lastSession.er > 0.3 ? "var(--accent3)" : "var(--accent)" }}>
                                        {Math.round(lastSession.er * 100)}<span style={{ fontSize: 14, color: "var(--text2)" }}>%</span>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-label">RTA</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 6 }}>T. Prom. Respuesta</div>
                                    <div className="card-value">{lastSession.rta.toFixed(1)}<span style={{ fontSize: 14, color: "var(--text2)" }}>s</span></div>
                                </div>
                            </div>

                            {/* SPS chart + slope panel */}
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
                                <div className="chart-card">
                                    <div className="chart-title">Evolución del SPS (Session Performance Score)</div>
                                    <div className="chart-sub">Eje X: número de sesión · Eje Y: SPS (0–100) · Color del punto: nivel cognitivo · Marcador: recomendación SVM</div>
                                    {patient.sessions.length < 2 ? (
                                        <div className="alert alert-warn" style={{ marginTop: 12 }}><span>⚠</span>Se necesitan al menos 2 sesiones para visualizar la evolución.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <LineChart data={spsChartData} margin={{ top: 32, right: 20, bottom: 20, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                <XAxis dataKey="session" label={{ value: "Sesión", position: "insideBottom", offset: -8, fill: "var(--text3)", fontSize: 10 }} tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                                <YAxis domain={[0, 100]} label={{ value: "SPS", angle: -90, position: "insideLeft", fill: "var(--text3)", fontSize: 10 }} tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "var(--mono)" }} />
                                                <Tooltip contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v.toFixed(1)}`, "SPS"]} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="sps"
                                                    stroke="var(--border)"
                                                    strokeWidth={2}
                                                    dot={(dotProps: any) => {
                                                        const { cx, cy, payload } = dotProps;
                                                        if (cx == null || cy == null) return <g />;
                                                        const col = payload.clasificacion === "Alto" ? "#4ade80" : payload.clasificacion === "Medio" ? "#facc15" : "#f87171";
                                                        const arrow = payload.recomendacion === "Subir" ? "↑" : payload.recomendacion === "Mantener" ? "→" : "↓";
                                                        return (
                                                            <g key={`dot-${payload.session}`}>
                                                                <circle cx={cx} cy={cy} r={8} fill={col} stroke="var(--surface)" strokeWidth={2} />
                                                                <text x={cx} y={cy - 16} textAnchor="middle" fontSize={13} fill={col} fontWeight="bold">{arrow}</text>
                                                            </g>
                                                        );
                                                    }}
                                                    activeDot={{ r: 10 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                    <div style={{ display: "flex", gap: 20, marginTop: 8, justifyContent: "center", flexWrap: "wrap" }}>
                                        {([["#4ade80", "Alto"], ["#facc15", "Medio"], ["#f87171", "Bajo"]] as const).map(([c, l]) => (
                                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text2)" }}>
                                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />{l}
                                            </div>
                                        ))}
                                        <span style={{ fontSize: 11, color: "var(--text3)" }}>· ↑ Subir · → Mantener · ↓ Bajar dificultad</span>
                                    </div>
                                </div>

                                {/* Panel lateral: slope_sps */}
                                <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                                    <div className="card-label">TENDENCIA SPS</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 8 }}>slope_sps · regresión lineal</div>
                                    {patient.sessions.length < 2 ? (
                                        <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)" }}>Datos insuficientes</div>
                                    ) : (
                                        <>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 0" }}>
                                                <div style={{ fontSize: 52, lineHeight: 1, color: trend === "subiendo" ? "#4ade80" : trend === "bajando" ? "#f87171" : "var(--text3)" }}>
                                                    {trend === "subiendo" ? "↑" : trend === "bajando" ? "↓" : "→"}
                                                </div>
                                                <div style={{ fontSize: 20, fontWeight: 800, color: trend === "subiendo" ? "#4ade80" : trend === "bajando" ? "#f87171" : "var(--text3)" }}>
                                                    {trend === "subiendo" ? "Subiendo" : trend === "bajando" ? "Bajando" : "Estable"}
                                                </div>
                                                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                                                    {slope >= 0 ? "+" : ""}{slope.toFixed(4)}/sesión
                                                </div>
                                                <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", lineHeight: 1.6, maxWidth: 140, marginTop: 8 }}>
                                                    {trend === "subiendo" ? "Mejora progresiva del rendimiento cognitivo"
                                                        : trend === "bajando" ? "Deterioro detectado en el rendimiento"
                                                        : "Rendimiento cognitivo estable"}
                                                </div>
                                            </div>
                                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                                                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>SPS ÚLTIMA SESIÓN</div>
                                                <div style={{ fontSize: 30, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>
                                                    {Math.round(computeSPS(lastSession) * 100)}
                                                    <span style={{ fontSize: 14, color: "var(--text3)", fontWeight: 400 }}> / 100</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
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

        </div>
    );
}

// ── LIVE SESSION PAGE ─────────────────────────────────────────────────────────
function LiveSessionPage({ patients }: { patients: Patient[] }) {
    const activePatient = patients.find(p => p.status === "En sesión") || patients[0];
    const lastSession = activePatient?.sessions[activePatient.sessions.length - 1];

    const sps = lastSession ? Math.round(computeSPS(lastSession) * 100) : null;

    const erAccent = lastSession && lastSession.er > 0.3 ? "var(--accent3)" : "var(--warn)";

    const spsColor = sps !== null
        ? sps >= 70 ? "#0D9488" : sps >= 50 ? "var(--warn)" : "var(--accent3)"
        : "var(--text3)";

    return (
        <div className="page fade-up">
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>

                {/* ── COLUMNA IZQUIERDA: solo el stream ── */}
                <div className="live-wrapper" style={{ height: "100%", aspectRatio: "auto" }}>
                    <img className="live-background" src="/assets/img/sample.jpg" alt="Transmisión VR" />
                    <div className="live-badge"><div className="live-dot" />EN VIVO</div>
                </div>

                {/* ── COLUMNA DERECHA: paciente + SPS + clasificación ML ── */}
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
                                <div className="info-row">
                                    <span className="info-key">Nivel actual</span>
                                    <span className="info-val">Nivel {lastSession?.level ?? 1} — Mar de Pensamientos</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-key">Variación</span>
                                    <span className="info-val">{lastSession?.variation ?? "—"} — El helado perdido</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-key">Dificultad</span>
                                    <span className="info-val">{lastSession?.difficulty ?? "—"}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-key">Preguntas</span>
                                    <span className="info-val">6 / 6</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {sps !== null && (
                        <div className="card" style={{ borderTop: `2px solid ${spsColor}` }}>
                            <div className="card-label">SPS — RENDIMIENTO EN VIVO</div>
                            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 14, marginTop: 2 }}>
                                Session Performance Score · último nivel completado
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 12 }}>
                                <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: spsColor }}>{sps}</div>
                                <div style={{ fontSize: 16, color: "var(--text3)", marginBottom: 6, fontFamily: "var(--mono)" }}>/100</div>
                            </div>
                            <div className="progress-wrap">
                                <div className="progress-fill" style={{ width: `${sps}%`, background: spsColor }} />
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 10 }}>
                                {sps >= 70 ? "Rendimiento satisfactorio"
                                    : sps >= 50 ? "Rendimiento aceptable"
                                    : "Rendimiento bajo — revisar con el paciente"}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-label">CLASIFICACIÓN ML</div>
                        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 14, marginTop: 2 }}>
                            Modelo SVM · clasificación y recomendación adaptativa
                        </div>
                        {lastSession ? (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <span style={{ fontSize: 12, color: "var(--text2)" }}>Rendimiento cognitivo</span>
                                    <span className={`badge ${lastSession.clasificacion === "Alto" ? "badge-green" : lastSession.clasificacion === "Medio" ? "badge-warn" : "badge-red"}`}>
                                        {lastSession.clasificacion}
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12, color: "var(--text2)" }}>Recomendación dificultad</span>
                                    <span className={`badge ${recClass(lastSession.recomendacion)}`}>
                                        {recIcon(lastSession.recomendacion)} {lastSession.recomendacion}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)" }}>
                                Esperando finalización del nivel…
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── MÉTRICAS: fila completa debajo del grid ── */}
            <div className="card">
                <div style={{ marginBottom: 16 }}>
                    <div className="card-label">MÉTRICAS DE LA SESIÓN ACTUAL</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 2 }}>
                        Resultados al cierre del último nivel completado · hover para descripción clínica
                    </div>
                </div>
                <div className="metrics-live">

                    <div className="metric-item" style={{ borderTop: "2px solid var(--accent)" }}>
                        <div className="metric-val" style={{ color: "var(--accent)" }}>
                            {lastSession ? `${Math.round(lastSession.ors * 100)}%` : "—"}
                        </div>
                        <div className="metric-label">
                            <span className="metric-abbr">ORS</span>
                            <span className="metric-tooltip">Proporción de objetos clave identificados correctamente por el paciente dentro del entorno VR.</span>
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 6 }}>Recuerdo de Objetos</div>
                    </div>

                    <div className="metric-item" style={{ borderTop: "2px solid var(--accent2)" }}>
                        <div className="metric-val" style={{ color: "var(--accent2)" }}>
                            {lastSession ? `${Math.round(lastSession.ers * 100)}%` : "—"}
                        </div>
                        <div className="metric-label">
                            <span className="metric-abbr">ERS</span>
                            <span className="metric-tooltip">Porcentaje de eventos narrativos de la escena VR que el paciente reconoció y respondió de forma correcta.</span>
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 6 }}>Recuerdo de Eventos</div>
                    </div>

                    <div className="metric-item" style={{ borderTop: "2px solid #0D9488" }}>
                        <div className="metric-val" style={{ color: "#0D9488" }}>
                            {lastSession ? `${Math.round(lastSession.scs * 100)}%` : "—"}
                        </div>
                        <div className="metric-label">
                            <span className="metric-abbr">SCS</span>
                            <span className="metric-tooltip">Puntaje de comprensión de la narrativa del nivel VR, basado en las respuestas a preguntas de comprensión al finalizar la escena.</span>
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 6 }}>Comprensión Semántica</div>
                    </div>

                    <div className="metric-item" style={{ borderTop: `2px solid ${erAccent}` }}>
                        <div className="metric-val" style={{ color: erAccent }}>
                            {lastSession ? `${Math.round(lastSession.er * 100)}%` : "—"}
                        </div>
                        <div className="metric-label">
                            <span className="metric-abbr">ER</span>
                            <span className="metric-tooltip">Proporción de respuestas incorrectas sobre el total de intentos del nivel. Un ER elevado puede indicar confusión o fatiga cognitiva.</span>
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 6 }}>Tasa de Error</div>
                    </div>

                    <div className="metric-item" style={{ borderTop: "2px solid var(--border)" }}>
                        <div className="metric-val" style={{ color: "var(--text)" }}>
                            {lastSession?.rta != null ? `${lastSession.rta.toFixed(1)}s` : "—"}
                        </div>
                        <div className="metric-label">
                            <span className="metric-abbr">RTA</span>
                            <span className="metric-tooltip">Promedio en segundos del tiempo que tardó el paciente en responder a cada estímulo del nivel. Un valor más alto indica mayor latencia cognitiva.</span>
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 6 }}>T. Prom. Respuesta</div>
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

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
    const [authed, setAuthed] = useState(false);
    const [page, setPage] = useState<Page>("patients");
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
        patients: { title: "Gestión de Pacientes", sub: "Registro, consulta y edición de pacientes" },
        "patient-detail": { title: "Dashboard del Paciente", sub: "Métricas, historial y análisis cognitivo individual" },
        "patient-new": { title: "Registrar Nuevo Paciente", sub: "Complete los datos clínicos iniciales" },
        "patient-edit": { title: "Editar Paciente", sub: "Actualice la información clínica" },
        "session-live": { title: "Sesión en Vivo", sub: "Transmisión en tiempo real" },
        "session-history": { title: "Historial de Sesiones", sub: "Registro cronológico de sesiones inmersivas" },
    };

    const inactiveLeft = Math.max(0, 900 - inactiveTimer);
    const showInactiveWarn = authed && inactiveLeft <= 60;

    if (!authed) return (
        <>
            <LoginPage onLogin={() => { setAuthed(true); setPage("patients"); }} />
        </>
    );

    const pm = pageMeta[page];

    return (
        <>
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
                    {page === "patients" && <PatientsPage patients={patients} setPage={setPage} setSelected={setSelectedId} setPatients={setPatients} />}
                    {page === "patient-new" && <PatientForm patients={patients} selectedId={selectedId} mode="new" setPage={setPage} setPatients={setPatients} setSelected={setSelectedId} />}
                    {page === "patient-edit" && <PatientForm patients={patients} selectedId={selectedId} mode="edit" setPage={setPage} setPatients={setPatients} setSelected={setSelectedId} />}
                    {page === "patient-detail" && selectedPatient && <PatientDetail patient={selectedPatient} setPage={setPage} />}
                    {page === "session-live" && <LiveSessionPage patients={patients} />}
                    {page === "session-history" && <SessionHistoryPage patients={patients} setPage={setPage} setSelected={setSelectedId} />}
                </div>
            </div>
        </>
    );
}