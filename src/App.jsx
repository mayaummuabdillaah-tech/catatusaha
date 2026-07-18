import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, HandCoins, FileBarChart,
  Settings, Plus, Search, Edit2, Trash2, X, Menu, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Download, Upload, Moon, Sun, ChevronRight,
  Sprout, Wallet, ArrowUpRight, ArrowDownRight, Filter, Users, CalendarClock,
  Store, RotateCcw, FileDown, ChevronDown, Minus
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/* ============================== CONSTANTS ============================== */

const STORAGE_KEY = "catatusaha-store-v1";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "produk", label: "Produk", icon: Package },
  { id: "penjualan", label: "Penjualan", icon: ShoppingCart },
  { id: "pengeluaran", label: "Pengeluaran", icon: Receipt },
  { id: "hutangpiutang", label: "Hutang & Piutang", icon: HandCoins },
  { id: "laporan", label: "Laporan", icon: FileBarChart },
  { id: "pengaturan", label: "Pengaturan", icon: Settings },
];

const BOTTOM_NAV = ["dashboard", "produk", "penjualan", "pengeluaran", "laporan"];

const EXPENSE_CATEGORIES = ["Bahan Baku", "Ongkir", "Kemasan", "Operasional", "Marketing", "Gaji", "Listrik", "Internet", "Lainnya"];
const PAYMENT_METHODS = ["Tunai", "Transfer Bank", "E-Wallet", "QRIS", "Belum Lunas"];
const PIE_COLORS = ["#0F6B4F", "#E8A33D", "#3A8DAE", "#C7473F", "#8B6FB3", "#6B7568", "#1F8A5A", "#B08840"];

/* =============================== HELPERS ================================ */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const todayISO = () => new Date().toISOString().slice(0, 10);
const formatRupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");
const formatDateShort = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function emptyData() {
  return {
    products: [],
    sales: [],
    expenses: [],
    receivables: [],
    payables: [],
    settings: { businessName: "Usaha Saya", ownerName: "", phone: "", address: "", theme: "light" },
    trxCounter: 1,
  };
}

function sampleData() {
  const p1 = uid(), p2 = uid(), p3 = uid(), p4 = uid(), p5 = uid();
  const products = [
    { id: p1, name: "Kopi Susu Gula Aren", sku: "KSG-01", category: "Minuman", costPrice: 8000, sellPrice: 15000, stock: 40, minStock: 10, unit: "cup", description: "", createdAt: todayISO() },
    { id: p2, name: "Teh Leci", sku: "TL-02", category: "Minuman", costPrice: 5000, sellPrice: 12000, stock: 5, minStock: 10, unit: "cup", description: "", createdAt: todayISO() },
    { id: p3, name: "Roti Bakar Coklat", sku: "RB-03", category: "Makanan", costPrice: 6000, sellPrice: 13000, stock: 25, minStock: 8, unit: "pcs", description: "", createdAt: todayISO() },
    { id: p4, name: "Es Kepal Milo", sku: "EKM-04", category: "Minuman", costPrice: 7000, sellPrice: 16000, stock: 15, minStock: 5, unit: "cup", description: "", createdAt: todayISO() },
    { id: p5, name: "Nasi Goreng Spesial", sku: "NGS-05", category: "Makanan", costPrice: 10000, sellPrice: 22000, stock: 20, minStock: 5, unit: "porsi", description: "", createdAt: todayISO() },
  ];
  const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const mkSale = (n, prod, qty, pay, status) => {
    const subtotal = prod.sellPrice * qty;
    const cost = prod.costPrice * qty;
    return {
      id: uid(), trxNo: "TRX-" + String(n).padStart(4, "0"), date: dayOffset(n),
      customer: ["Bu Sari", "Pak Joko", "Dedi", "Mbak Ratih", "Anonim"][n % 5],
      items: [{ productId: prod.id, name: prod.name, qty, price: prod.sellPrice }],
      subtotal, discount: 0, extraFee: 0, total: subtotal, cost, profit: subtotal - cost,
      paymentMethod: pay, status, note: "",
    };
  };
  const sales = [
    mkSale(1, p1, 3, "Tunai", "Lunas"),
    mkSale(2, p5, 2, "QRIS", "Lunas"),
    mkSale(3, p3, 4, "Transfer Bank", "Lunas"),
    mkSale(4, p4, 1, "E-Wallet", "Lunas"),
    mkSale(5, p2, 2, "Belum Lunas", "Belum Lunas"),
  ];
  const expenses = [
    { id: uid(), name: "Belanja bahan baku mingguan", category: "Bahan Baku", amount: 250000, date: dayOffset(1), note: "" },
    { id: uid(), name: "Ongkir kirim supplier", category: "Ongkir", amount: 50000, date: dayOffset(3), note: "" },
    { id: uid(), name: "Bayar listrik warung", category: "Listrik", amount: 150000, date: dayOffset(5), note: "" },
  ];
  const receivables = [
    { id: uid(), customer: "Bu Sari", phone: "0812xxxxxxx", amount: 75000, paidAmount: 0, date: dayOffset(2), dueDate: dayOffset(-5), status: "Belum Lunas", note: "" },
    { id: uid(), customer: "Pak Joko", phone: "0813xxxxxxx", amount: 120000, paidAmount: 60000, date: dayOffset(6), dueDate: dayOffset(-1), status: "Sebagian", note: "" },
  ];
  return { products, sales, expenses, receivables, payables: [], settings: { businessName: "Warung Berkah", ownerName: "", phone: "", address: "", theme: "light" }, trxCounter: 6 };
}

/* ============================== UI ATOMS ================================ */

function Btn({ children, variant = "primary", size = "md", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-base" };
  const variants = {
    primary: "bg-[#0F6B4F] text-white hover:bg-[#0B4E3A] shadow-sm",
    secondary: "bg-white text-[#1E2A24] border border-[#E4E7E0] hover:bg-[#F6F7F3]",
    danger: "bg-[#C7473F] text-white hover:bg-[#a83a33]",
    ghost: "text-[#1E2A24] hover:bg-[#EEF1EC]",
    accent: "bg-[#E8A33D] text-white hover:bg-[#d1912f]",
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function Field({ label, required, error, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-[#1E2A24] mb-1.5">
        {label} {required && <span className="text-[#C7473F]">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-[#6B7568] mt-1">{hint}</span>}
      {error && <span className="block text-xs text-[#C7473F] mt-1">{error}</span>}
    </label>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7E0] bg-white text-[#1E2A24] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4F]/30 focus:border-[#0F6B4F] placeholder:text-[#A3ADA1]";

function Input(props) { return <input className={inputCls} {...props} />; }
function Select({ children, ...props }) { return <select className={inputCls} {...props}>{children}</select>; }
function TextArea(props) { return <textarea className={inputCls} rows={3} {...props} />; }

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className={`bg-white w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto animate-[slideup_0.2s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#E4E7E0] z-10">
          <h3 className="font-semibold text-[#1E2A24] text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F6F7F3] text-[#6B7568]"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-[#FDF3E2] text-[#C7473F] shrink-0"><AlertTriangle size={20} /></div>
          <div>
            <h3 className="font-semibold text-[#1E2A24] mb-1">{title}</h3>
            <p className="text-sm text-[#6B7568]">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Btn variant="secondary" onClick={onCancel}>Batal</Btn>
          <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}>Ya, Lanjutkan</Btn>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="p-4 rounded-full bg-[#EEF1EC] text-[#0F6B4F] mb-4"><Icon size={32} /></div>
      <h3 className="font-semibold text-[#1E2A24] mb-1.5">{title}</h3>
      <p className="text-sm text-[#6B7568] max-w-xs mb-5">{desc}</p>
      {actionLabel && <Btn onClick={onAction}><Plus size={16} /> {actionLabel}</Btn>}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[#EEF1EC] text-[#4A554E]",
    success: "bg-[#E4F3EC] text-[#0F6B4F]",
    warning: "bg-[#FDF3E2] text-[#B08840]",
    danger: "bg-[#FBEAE9] text-[#C7473F]",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function StatCard({ icon: Icon, label, value, delta, deltaLabel, accent }) {
  const positive = delta !== undefined && delta >= 0;
  return (
    <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl`} style={{ background: accent + "1A", color: accent }}><Icon size={18} /></div>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-[#0F6B4F]" : "text-[#C7473F]"}`}>
            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      <div className="text-xs text-[#6B7568] mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-[#1E2A24] tabular-nums">{value}</div>
      {deltaLabel && <div className="text-[11px] text-[#A3ADA1] mt-1">{deltaLabel}</div>}
    </div>
  );
}

/* ============================== ONBOARDING =============================== */

function Onboarding({ onChoose }) {
  return (
    <div className="min-h-screen bg-[#F6F7F3] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0F6B4F] text-white flex items-center justify-center mx-auto mb-5">
          <Sprout size={30} />
        </div>
        <h1 className="text-2xl font-bold text-[#1E2A24] mb-2">Selamat Datang di CatatUsaha</h1>
        <p className="text-[#6B7568] mb-8 text-sm">Kelola produk, penjualan, pengeluaran, dan keuntungan usahamu dalam satu aplikasi sederhana.</p>
        <div className="bg-white rounded-2xl border border-[#E4E7E0] p-5 mb-3 text-left">
          <h3 className="font-semibold text-[#1E2A24] mb-1">Mulai dengan data contoh?</h3>
          <p className="text-sm text-[#6B7568] mb-4">Lihat dashboard langsung terisi dengan contoh produk, penjualan, dan pengeluaran — cocok untuk demo.</p>
          <Btn className="w-full" onClick={() => onChoose(true)}><Sprout size={16} /> Gunakan Data Contoh</Btn>
        </div>
        <button onClick={() => onChoose(false)} className="text-sm text-[#6B7568] underline hover:text-[#1E2A24]">Gunakan Data Kosong, mulai dari nol</button>
      </div>
    </div>
  );
}

/* ================================ APP ==================================== */

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) setData(JSON.parse(res.value));
        else setData(null);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next) => {
    setData(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next), false); } catch (e) { /* ignore */ }
  };

  const addToast = (message, type = "success") => {
    const id = uid();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  const confirm = (title, message, onConfirm, danger = true) => setConfirmState({ title, message, onConfirm, danger });

  if (loading) {
    return <div className="min-h-screen bg-[#F6F7F3] flex items-center justify-center text-[#6B7568]">Memuat...</div>;
  }

  if (!data) {
    return <Onboarding onChoose={(useSample) => persist(useSample ? sampleData() : emptyData())} />;
  }

  const theme = data.settings?.theme || "light";
  const dark = theme === "dark";

  return (
    <div className={dark ? "dark" : ""}>
      <div className={`min-h-screen ${dark ? "bg-[#121815] text-[#EDEFEC]" : "bg-[#F6F7F3] text-[#1E2A24]"} flex`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
          @keyframes slideup { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
          .font-display { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-thumb { background: #D6DAD1; border-radius: 8px; }
        `}</style>

        {/* Sidebar - desktop */}
        <aside className={`hidden md:flex flex-col w-64 shrink-0 border-r ${dark ? "border-[#22302A] bg-[#161F1B]" : "border-[#E4E7E0] bg-white"} h-screen sticky top-0`}>
          <div className="px-5 py-5">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#0F6B4F] text-white flex items-center justify-center"><Sprout size={18} /></div>
              <div>
                <div className="font-display font-bold text-[15px] leading-tight">CatatUsaha</div>
                <div className="text-[11px] text-[#6B7568] leading-tight truncate max-w-[140px]">{data.settings.businessName || "Usaha Saya"}</div>
              </div>
            </div>
            <div className="h-[3px] rounded-full mt-3" style={{ background: "linear-gradient(90deg,#0F6B4F,#E8A33D,#0F6B4F)", backgroundSize: "200% 100%" }} />
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {NAV.map((n) => {
              const active = route === n.id;
              return (
                <button key={n.id} onClick={() => setRoute(n.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-[#0F6B4F] text-white" : dark ? "text-[#C7CDC7] hover:bg-[#1E2822]" : "text-[#4A554E] hover:bg-[#F0F2ED]"
                  }`}>
                  <n.icon size={18} /> {n.label}
                </button>
              );
            })}
          </nav>
          <div className="p-4 text-[11px] text-[#8B9589]">CatatUsaha &middot; v1.0</div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 pb-20 md:pb-0">
          <header className={`md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 border-b ${dark ? "border-[#22302A] bg-[#161F1B]" : "border-[#E4E7E0] bg-white"}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F6B4F] text-white flex items-center justify-center"><Sprout size={16} /></div>
              <span className="font-display font-bold">CatatUsaha</span>
            </div>
            <span className="text-xs text-[#6B7568] truncate max-w-[120px]">{data.settings.businessName}</span>
          </header>

          <main className="p-4 sm:p-6 max-w-6xl mx-auto">
            {route === "dashboard" && <Dashboard data={data} dark={dark} setRoute={setRoute} />}
            {route === "produk" && <Produk data={data} persist={persist} addToast={addToast} confirm={confirm} dark={dark} />}
            {route === "penjualan" && <Penjualan data={data} persist={persist} addToast={addToast} confirm={confirm} dark={dark} />}
            {route === "pengeluaran" && <Pengeluaran data={data} persist={persist} addToast={addToast} confirm={confirm} dark={dark} />}
            {route === "hutangpiutang" && <HutangPiutang data={data} persist={persist} addToast={addToast} confirm={confirm} dark={dark} />}
            {route === "laporan" && <Laporan data={data} dark={dark} />}
            {route === "pengaturan" && <Pengaturan data={data} persist={persist} addToast={addToast} confirm={confirm} dark={dark} />}
          </main>
        </div>

        {/* Bottom nav - mobile */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t ${dark ? "border-[#22302A] bg-[#161F1B]" : "border-[#E4E7E0] bg-white"}`}>
          {BOTTOM_NAV.map((id) => {
            const n = NAV.find((x) => x.id === id);
            const active = route === id;
            return (
              <button key={id} onClick={() => setRoute(id)} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 ${active ? "text-[#0F6B4F]" : "text-[#8B9589]"}`}>
                <n.icon size={19} />
                <span className="text-[10px] font-medium">{n.label.split(" ")[0]}</span>
              </button>
            );
          })}
          <button onClick={() => setRoute("pengaturan")} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 ${route === "pengaturan" ? "text-[#0F6B4F]" : "text-[#8B9589]"}`}>
            <Settings size={19} /><span className="text-[10px] font-medium">Atur</span>
          </button>
        </nav>

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-[70] space-y-2 max-w-[90vw]">
          {toasts.map((t) => (
            <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-[slideup_0.2s_ease-out] ${
              t.type === "error" ? "bg-[#C7473F] text-white" : "bg-[#0F6B4F] text-white"
            }`}>
              <CheckCircle2 size={16} /> {t.message}
            </div>
          ))}
        </div>

        {confirmState && (
          <ConfirmDialog {...confirmState} onCancel={() => setConfirmState(null)} onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }} />
        )}
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ================================ */

function Dashboard({ data, setRoute }) {
  const today = todayISO();
  const now = new Date();
  const thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);

  const salesToday = data.sales.filter((s) => s.date === today);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const salesYesterday = data.sales.filter((s) => s.date === yesterday.toISOString().slice(0, 10));

  const inMonth = (dateStr, m, y) => { const d = new Date(dateStr); return d.getMonth() === m && d.getFullYear() === y; };
  const salesThisMonth = data.sales.filter((s) => inMonth(s.date, thisMonth, thisYear));
  const salesLastMonth = data.sales.filter((s) => inMonth(s.date, lastMonthDate.getMonth(), lastMonthDate.getFullYear()));
  const expThisMonth = data.expenses.filter((e) => inMonth(e.date, thisMonth, thisYear));
  const expLastMonth = data.expenses.filter((e) => inMonth(e.date, lastMonthDate.getMonth(), lastMonthDate.getFullYear()));

  const sum = (arr, key) => arr.reduce((a, b) => a + (b[key] || 0), 0);
  const todayTotal = sum(salesToday, "total");
  const yesterdayTotal = sum(salesYesterday, "total");
  const monthTotal = sum(salesThisMonth, "total");
  const lastMonthTotal = sum(salesLastMonth, "total");
  const monthExpenseTotal = sum(expThisMonth, "amount");
  const lastMonthExpenseTotal = sum(expLastMonth, "amount");
  const monthProfit = sum(salesThisMonth, "profit") - monthExpenseTotal;
  const lastMonthProfit = sum(salesLastMonth, "profit") - lastMonthExpenseTotal;

  const pct = (cur, prev) => (prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100);

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const total = sum(data.sales.filter((s) => s.date === iso), "total");
    return { label: d.toLocaleDateString("id-ID", { weekday: "short" }), total };
  });

  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(thisYear, thisMonth - (5 - i), 1);
    const income = sum(data.sales.filter((s) => inMonth(s.date, d.getMonth(), d.getFullYear())), "total");
    const expense = sum(data.expenses.filter((e) => inMonth(e.date, d.getMonth(), d.getFullYear())), "amount");
    return { label: d.toLocaleDateString("id-ID", { month: "short" }), income, expense };
  });

  const productSales = {};
  data.sales.forEach((s) => s.items.forEach((it) => { productSales[it.name] = (productSales[it.name] || 0) + it.qty; }));
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recentTrx = [...data.sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (data.sales.length === 0 && data.products.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-[#6B7568] text-sm mb-4">Ringkasan usahamu, sekali lihat langsung paham.</p>
        <EmptyState icon={ShoppingCart} title="Belum ada transaksi" desc="Tambahkan transaksi penjualan pertamamu untuk mulai memantau usaha." actionLabel="Tambah Transaksi Pertama" onAction={() => setRoute("penjualan")} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-[#6B7568] text-sm mb-5">Ringkasan usahamu, sekali lihat langsung paham.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={ShoppingCart} label="Penjualan Hari Ini" value={formatRupiah(todayTotal)} delta={pct(todayTotal, yesterdayTotal)} deltaLabel="vs kemarin" accent="#0F6B4F" />
        <StatCard icon={TrendingUp} label="Penjualan Bulan Ini" value={formatRupiah(monthTotal)} delta={pct(monthTotal, lastMonthTotal)} deltaLabel="vs bulan lalu" accent="#3A8DAE" />
        <StatCard icon={Receipt} label="Pengeluaran Bulan Ini" value={formatRupiah(monthExpenseTotal)} delta={pct(monthExpenseTotal, lastMonthExpenseTotal)} deltaLabel="vs bulan lalu" accent="#C7473F" />
        <StatCard icon={Wallet} label="Estimasi Untung Bulan Ini" value={formatRupiah(monthProfit)} delta={pct(monthProfit, lastMonthProfit)} deltaLabel="vs bulan lalu" accent="#E8A33D" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4">Penjualan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7568" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7568" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+"rb" : v} />
              <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E4E7E0", fontSize: 13 }} />
              <Line type="monotone" dataKey="total" stroke="#0F6B4F" strokeWidth={2.5} dot={{ r: 3, fill: "#0F6B4F" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4">Pemasukan vs Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7568" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7568" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+"rb" : v} />
              <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E4E7E0", fontSize: 13 }} />
              <Bar dataKey="income" name="Pemasukan" fill="#0F6B4F" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#E8A33D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4">Produk Terlaris</h3>
          {topProducts.length === 0 ? <p className="text-sm text-[#6B7568]">Belum ada penjualan.</p> : (
            <div className="space-y-3">
              {topProducts.map(([name, qty], i) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#EEF1EC] text-[#0F6B4F] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{name}</div></div>
                  <div className="text-sm text-[#6B7568] shrink-0">{qty} terjual</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-4">Transaksi Terbaru</h3>
          {recentTrx.length === 0 ? <p className="text-sm text-[#6B7568]">Belum ada transaksi.</p> : (
            <div className="space-y-3">
              {recentTrx.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.trxNo} &middot; {t.customer || "Anonim"}</div>
                    <div className="text-xs text-[#6B7568]">{formatDateShort(t.date)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums">{formatRupiah(t.total)}</div>
                    <Badge tone={t.status === "Lunas" ? "success" : "warning"}>{t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================ PRODUK ================================= */

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", sku: "", category: "", costPrice: "", sellPrice: "", stock: "", minStock: "", unit: "pcs", description: "" });
  const [errors, setErrors] = useState({});

  const submit = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Nama produk wajib diisi.";
    if (form.costPrice === "" || Number(form.costPrice) < 0) err.costPrice = "Harga modal wajib diisi dan tidak boleh negatif.";
    if (form.sellPrice === "" || Number(form.sellPrice) < 0) err.sellPrice = "Harga jual wajib diisi dan tidak boleh negatif.";
    if (form.stock === "" || Number(form.stock) < 0) err.stock = "Stok wajib diisi dan tidak boleh negatif.";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({
      ...form,
      costPrice: Number(form.costPrice), sellPrice: Number(form.sellPrice),
      stock: Number(form.stock), minStock: Number(form.minStock || 0),
    });
  };

  const profit = (Number(form.sellPrice) || 0) - (Number(form.costPrice) || 0);
  const margin = form.sellPrice ? (profit / Number(form.sellPrice)) * 100 : 0;

  return (
    <div>
      <Field label="Nama Produk" required error={errors.name}>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Kopi Susu Gula Aren" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU" hint="Opsional"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
        <Field label="Kategori" hint="Opsional"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Harga Modal" required error={errors.costPrice}>
          <Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Harga Jual" required error={errors.sellPrice}>
          <Input type="number" min="0" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} placeholder="0" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Stok" required error={errors.stock}>
          <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Stok Minimum"><Input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="0" /></Field>
        <Field label="Satuan"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs" /></Field>
      </div>
      <Field label="Deskripsi" hint="Opsional"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>

      {(form.costPrice !== "" && form.sellPrice !== "") && (
        <div className="bg-[#F6F7F3] rounded-xl p-3 mb-4 flex justify-between text-sm">
          <span className="text-[#6B7568]">Keuntungan / Margin</span>
          <span className="font-semibold">{formatRupiah(profit)} &middot; {margin.toFixed(1)}%</span>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="secondary" onClick={onCancel}>Batal</Btn>
        <Btn onClick={submit}>Simpan Produk</Btn>
      </div>
    </div>
  );
}

function Produk({ data, persist, addToast, confirm }) {
  const [modal, setModal] = useState(null); // {mode:'add'|'edit', product}
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const categories = [...new Set(data.products.map((p) => p.category).filter(Boolean))];

  const filtered = data.products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !category || p.category === category)
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return a.sellPrice - b.sellPrice;
      if (sortBy === "stock") return a.stock - b.stock;
      return 0;
    });

  const saveProduct = (form) => {
    let next;
    if (modal.mode === "edit") {
      next = { ...data, products: data.products.map((p) => (p.id === modal.product.id ? { ...p, ...form } : p)) };
      addToast("Produk berhasil diperbarui.");
    } else {
      next = { ...data, products: [...data.products, { id: uid(), createdAt: todayISO(), ...form }] };
      addToast("Produk berhasil ditambahkan.");
    }
    persist(next);
    setModal(null);
  };

  const deleteProduct = (p) => {
    confirm("Hapus Produk?", `"${p.name}" akan dihapus permanen. Data penjualan lama tetap tersimpan.`, () => {
      persist({ ...data, products: data.products.filter((x) => x.id !== p.id) });
      addToast("Produk dihapus.");
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Produk</h1>
          <p className="text-[#6B7568] text-sm">{data.products.length} produk terdaftar</p>
        </div>
        <Btn onClick={() => setModal({ mode: "add" })}><Plus size={16} /> Tambah Produk</Btn>
      </div>

      {data.products.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA1]" />
            <input className={inputCls + " pl-9"} placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputCls + " w-auto"} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={inputCls + " w-auto"} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Urutkan: Nama</option>
            <option value="price">Urutkan: Harga</option>
            <option value="stock">Urutkan: Stok</option>
          </select>
        </div>
      )}

      {data.products.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada produk" desc="Tambahkan produk pertama untuk mulai mengelola stok usaha Anda." actionLabel="Tambah Produk" onAction={() => setModal({ mode: "add" })} />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#6B7568] py-8 text-center">Tidak ada produk yang cocok.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const lowStock = p.stock <= p.minStock;
            const margin = p.sellPrice ? (((p.sellPrice - p.costPrice) / p.sellPrice) * 100).toFixed(0) : 0;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-[#E4E7E0] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    {p.category && <span className="text-xs text-[#6B7568]">{p.category}</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setModal({ mode: "edit", product: p })} className="p-1.5 rounded-lg hover:bg-[#F6F7F3] text-[#6B7568]"><Edit2 size={15} /></button>
                    <button onClick={() => deleteProduct(p)} className="p-1.5 rounded-lg hover:bg-[#FBEAE9] text-[#C7473F]"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-bold tabular-nums">{formatRupiah(p.sellPrice)}</span>
                  <span className="text-xs text-[#6B7568]">margin {margin}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7568]">Stok: {p.stock} {p.unit}</span>
                  {lowStock && <Badge tone="danger">Stok Menipis</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "edit" ? "Edit Produk" : "Tambah Produk"} onClose={() => setModal(null)}>
          <ProductForm initial={modal.mode === "edit" ? modal.product : null} onSave={saveProduct} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* =============================== PENJUALAN ================================ */

function SaleForm({ products, onSave, onCancel, nextTrxNo }) {
  const [customer, setCustomer] = useState("");
  const [rows, setRows] = useState([{ productId: "", qty: 1 }]);
  const [discount, setDiscount] = useState(0);
  const [extraFee, setExtraFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const addRow = () => setRows([...rows, { productId: "", qty: 1 }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, key, val) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const lineItems = rows.filter((r) => r.productId).map((r) => {
    const p = products.find((x) => x.id === r.productId);
    return { ...r, product: p, lineTotal: p ? p.sellPrice * Number(r.qty || 0) : 0, lineCost: p ? p.costPrice * Number(r.qty || 0) : 0 };
  });
  const subtotal = lineItems.reduce((a, b) => a + b.lineTotal, 0);
  const cost = lineItems.reduce((a, b) => a + b.lineCost, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(extraFee || 0));
  const profit = total - cost - Number(discount || 0) + Number(discount || 0); // profit excludes extra fee treatment simplicity
  const realProfit = subtotal - cost - Number(discount || 0);

  const submit = () => {
    if (lineItems.length === 0) { setError("Pilih minimal satu produk."); return; }
    for (const li of lineItems) {
      if (!li.product) continue;
      if (Number(li.qty) <= 0) { setError(`Jumlah "${li.product.name}" tidak valid.`); return; }
      if (Number(li.qty) > li.product.stock) { setError(`Jumlah "${li.product.name}" melebihi stok tersedia (${li.product.stock}).`); return; }
    }
    setError("");
    onSave({
      trxNo: nextTrxNo, date: todayISO(), customer: customer.trim(),
      items: lineItems.map((li) => ({ productId: li.productId, name: li.product.name, qty: Number(li.qty), price: li.product.sellPrice })),
      subtotal, discount: Number(discount || 0), extraFee: Number(extraFee || 0), total,
      cost, profit: realProfit,
      paymentMethod, status: paymentMethod === "Belum Lunas" ? "Belum Lunas" : "Lunas", note,
    });
  };

  return (
    <div>
      <Field label="Pelanggan" hint="Opsional, kosongkan jika anonim">
        <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama pelanggan" />
      </Field>

      <span className="block text-sm font-medium mb-1.5">Produk <span className="text-[#C7473F]">*</span></span>
      <div className="space-y-2 mb-3">
        {rows.map((r, i) => {
          const p = products.find((x) => x.id === r.productId);
          return (
            <div key={i} className="flex gap-2 items-start">
              <select className={inputCls + " flex-1"} value={r.productId} onChange={(e) => updateRow(i, "productId", e.target.value)}>
                <option value="">Pilih produk...</option>
                {products.map((pr) => <option key={pr.id} value={pr.id} disabled={pr.stock <= 0}>{pr.name} ({pr.stock} {pr.unit}) {pr.stock <= 0 ? "- Habis" : ""}</option>)}
              </select>
              <Input type="number" min="1" className="w-20" value={r.qty} onChange={(e) => updateRow(i, "qty", e.target.value)} />
              {rows.length > 1 && <button onClick={() => removeRow(i)} className="p-2.5 rounded-xl hover:bg-[#FBEAE9] text-[#C7473F] shrink-0"><Minus size={16} /></button>}
            </div>
          );
        })}
      </div>
      <button onClick={addRow} className="text-sm text-[#0F6B4F] font-medium mb-4 flex items-center gap-1"><Plus size={14} /> Tambah produk lain</button>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Diskon (Rp)"><Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
        <Field label="Biaya Tambahan (Rp)"><Input type="number" min="0" value={extraFee} onChange={(e) => setExtraFee(e.target.value)} /></Field>
      </div>
      <Field label="Metode Pembayaran">
        <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>
      <Field label="Catatan" hint="Opsional"><TextArea value={note} onChange={(e) => setNote(e.target.value)} /></Field>

      <div className="bg-[#F6F7F3] rounded-xl p-3.5 mb-4 space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-[#6B7568]">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-[#6B7568]">Diskon</span><span>-{formatRupiah(discount)}</span></div>
        <div className="flex justify-between"><span className="text-[#6B7568]">Biaya Tambahan</span><span>+{formatRupiah(extraFee)}</span></div>
        <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-[#E4E7E0]"><span>Total</span><span>{formatRupiah(total)}</span></div>
      </div>

      {error && <p className="text-sm text-[#C7473F] mb-3">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onCancel}>Batal</Btn>
        <Btn onClick={submit}>Simpan Transaksi</Btn>
      </div>
    </div>
  );
}

function Penjualan({ data, persist, addToast, confirm }) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = [...data.sales].filter((s) =>
    (s.customer || "").toLowerCase().includes(search.toLowerCase()) || s.trxNo.toLowerCase().includes(search.toLowerCase())
  ).filter((s) => !statusFilter || s.status === statusFilter)
   .sort((a, b) => new Date(b.date) - new Date(a.date));

  const saveSale = (sale) => {
    const products = data.products.map((p) => {
      const item = sale.items.find((i) => i.productId === p.id);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    });
    let receivables = data.receivables;
    if (sale.paymentMethod === "Belum Lunas") {
      receivables = [...receivables, {
        id: uid(), customer: sale.customer || "Anonim", phone: "", amount: sale.total, paidAmount: 0,
        date: sale.date, dueDate: "", status: "Belum Lunas", note: `Otomatis dari transaksi ${sale.trxNo}`,
      }];
    }
    const next = {
      ...data, products, receivables,
      sales: [...data.sales, { id: uid(), ...sale }],
      trxCounter: (data.trxCounter || 1) + 1,
    };
    persist(next);
    addToast("Transaksi berhasil disimpan.");
    setModal(false);
  };

  const deleteSale = (s) => {
    confirm("Hapus Transaksi?", `Transaksi ${s.trxNo} akan dihapus dan stok produk terkait akan dikembalikan.`, () => {
      const products = data.products.map((p) => {
        const item = s.items.find((i) => i.productId === p.id);
        return item ? { ...p, stock: p.stock + item.qty } : p;
      });
      persist({ ...data, products, sales: data.sales.filter((x) => x.id !== s.id) });
      addToast("Transaksi dihapus.");
    });
  };

  const nextTrxNo = "TRX-" + String(data.trxCounter || 1).padStart(4, "0");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Penjualan</h1>
          <p className="text-[#6B7568] text-sm">{data.sales.length} transaksi tercatat</p>
        </div>
        <Btn onClick={() => setModal(true)} disabled={data.products.length === 0}><Plus size={16} /> Tambah Transaksi</Btn>
      </div>
      {data.products.length === 0 && <p className="text-sm text-[#B08840] bg-[#FDF3E2] rounded-xl px-3.5 py-2.5 mb-4">Tambahkan produk terlebih dahulu sebelum mencatat penjualan.</p>}

      {data.sales.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA1]" />
            <input className={inputCls + " pl-9"} placeholder="Cari No. Transaksi / pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputCls + " w-auto"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Belum Lunas">Belum Lunas</option>
          </select>
        </div>
      )}

      {data.sales.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Belum ada transaksi" desc="Tambahkan transaksi penjualan pertama untuk mulai memantau usaha." actionLabel="Tambah Transaksi Pertama" onAction={() => setModal(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E4E7E0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[#F6F7F3] text-[#6B7568] text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">No. Transaksi</th>
                  <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium">Pelanggan</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-[#E4E7E0]">
                    <td className="px-4 py-3 font-medium">{s.trxNo}</td>
                    <td className="px-4 py-3 text-[#6B7568]">{formatDateShort(s.date)}</td>
                    <td className="px-4 py-3">{s.customer || "Anonim"}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatRupiah(s.total)}</td>
                    <td className="px-4 py-3"><Badge tone={s.status === "Lunas" ? "success" : "warning"}>{s.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteSale(s)} className="p-1.5 rounded-lg hover:bg-[#FBEAE9] text-[#C7473F]"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <Modal title="Tambah Transaksi Penjualan" onClose={() => setModal(false)} wide>
          <SaleForm products={data.products} onSave={saveSale} onCancel={() => setModal(false)} nextTrxNo={nextTrxNo} />
        </Modal>
      )}
    </div>
  );
}

/* ============================== PENGELUARAN =============================== */

function ExpenseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", category: EXPENSE_CATEGORIES[0], amount: "", date: todayISO(), note: "" });
  const [errors, setErrors] = useState({});
  const submit = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Nama pengeluaran wajib diisi.";
    if (form.amount === "" || Number(form.amount) <= 0) err.amount = "Nominal harus valid dan lebih dari 0.";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({ ...form, amount: Number(form.amount) });
  };
  return (
    <div>
      <Field label="Nama Pengeluaran" required error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Belanja bahan baku" /></Field>
      <Field label="Kategori">
        <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nominal" required error={errors.amount}><Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
        <Field label="Tanggal"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      </div>
      <Field label="Catatan" hint="Opsional"><TextArea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="secondary" onClick={onCancel}>Batal</Btn>
        <Btn onClick={submit}>Simpan Pengeluaran</Btn>
      </div>
    </div>
  );
}

function Pengeluaran({ data, persist, addToast, confirm }) {
  const [modal, setModal] = useState(null);
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = [...data.expenses]
    .filter((e) => !category || e.category === category)
    .filter((e) => !dateFrom || e.date >= dateFrom)
    .filter((e) => !dateTo || e.date <= dateTo)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = filtered.reduce((a, b) => a + b.amount, 0);

  const save = (form) => {
    let next;
    if (modal.mode === "edit") {
      next = { ...data, expenses: data.expenses.map((e) => (e.id === modal.expense.id ? { ...e, ...form } : e)) };
      addToast("Pengeluaran diperbarui.");
    } else {
      next = { ...data, expenses: [...data.expenses, { id: uid(), ...form }] };
      addToast("Pengeluaran ditambahkan.");
    }
    persist(next); setModal(null);
  };
  const del = (e) => confirm("Hapus Pengeluaran?", `"${e.name}" akan dihapus permanen.`, () => {
    persist({ ...data, expenses: data.expenses.filter((x) => x.id !== e.id) });
    addToast("Pengeluaran dihapus.");
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div><h1 className="font-display text-2xl font-bold mb-1">Pengeluaran</h1><p className="text-[#6B7568] text-sm">Total: {formatRupiah(total)}</p></div>
        <Btn onClick={() => setModal({ mode: "add" })}><Plus size={16} /> Tambah Pengeluaran</Btn>
      </div>

      {data.expenses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select className={inputCls + " w-auto"} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input type="date" className="w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" className="w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      )}

      {data.expenses.length === 0 ? (
        <EmptyState icon={Receipt} title="Belum ada pengeluaran" desc="Catat pengeluaran pertama untuk memantau arus kas usaha Anda." actionLabel="Tambah Pengeluaran" onAction={() => setModal({ mode: "add" })} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-[#E4E7E0] p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{e.name}</h3>
                <div className="flex items-center gap-2 mt-1"><Badge>{e.category}</Badge><span className="text-xs text-[#6B7568]">{formatDateShort(e.date)}</span></div>
                <div className="text-base font-bold mt-2 tabular-nums">{formatRupiah(e.amount)}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setModal({ mode: "edit", expense: e })} className="p-1.5 rounded-lg hover:bg-[#F6F7F3] text-[#6B7568]"><Edit2 size={15} /></button>
                <button onClick={() => del(e)} className="p-1.5 rounded-lg hover:bg-[#FBEAE9] text-[#C7473F]"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "edit" ? "Edit Pengeluaran" : "Tambah Pengeluaran"} onClose={() => setModal(null)}>
          <ExpenseForm initial={modal.mode === "edit" ? modal.expense : null} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ============================ HUTANG & PIUTANG ============================= */

function DebtForm({ mode, initial, onSave, onCancel }) {
  const isReceivable = mode === "piutang";
  const [form, setForm] = useState(initial || {
    [isReceivable ? "customer" : "party"]: "", phone: "", amount: "", paidAmount: "",
    date: todayISO(), dueDate: "", status: "Belum Lunas", note: "",
  });
  const [errors, setErrors] = useState({});
  const nameKey = isReceivable ? "customer" : "party";
  const submit = () => {
    const err = {};
    if (!form[nameKey] || !form[nameKey].trim()) err[nameKey] = `Nama ${isReceivable ? "pelanggan" : "pihak"} wajib diisi.`;
    if (form.amount === "" || Number(form.amount) <= 0) err.amount = "Nominal harus valid.";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({ ...form, amount: Number(form.amount), paidAmount: Number(form.paidAmount || 0) });
  };
  return (
    <div>
      <Field label={isReceivable ? "Nama Pelanggan" : "Nama Pihak"} required error={errors[nameKey]}>
        <Input value={form[nameKey]} onChange={(e) => setForm({ ...form, [nameKey]: e.target.value })} />
      </Field>
      {isReceivable && <Field label="No. Telepon" hint="Opsional"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>}
      <div className="grid grid-cols-2 gap-3">
        <Field label={isReceivable ? "Jumlah Piutang" : "Nominal Hutang"} required error={errors.amount}>
          <Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Tanggal"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jatuh Tempo"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Belum Lunas">Belum Lunas</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Lunas">Lunas</option>
          </Select>
        </Field>
      </div>
      <Field label="Catatan" hint="Opsional"><TextArea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="secondary" onClick={onCancel}>Batal</Btn>
        <Btn onClick={submit}>Simpan</Btn>
      </div>
    </div>
  );
}

function DebtList({ items, nameKey, onEdit, onDelete, emptyIcon, emptyTitle, emptyDesc, onAdd }) {
  if (items.length === 0) return <EmptyState icon={emptyIcon} title={emptyTitle} desc={emptyDesc} actionLabel="Tambah Data" onAction={onAdd} />;
  const statusTone = (s) => (s === "Lunas" ? "success" : s === "Sebagian" ? "warning" : "danger");
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((it) => {
        const overdue = it.dueDate && it.status !== "Lunas" && new Date(it.dueDate) < new Date();
        return (
          <div key={it.id} className="bg-white rounded-2xl border border-[#E4E7E0] p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm truncate">{it[nameKey]}</h3>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onEdit(it)} className="p-1.5 rounded-lg hover:bg-[#F6F7F3] text-[#6B7568]"><Edit2 size={15} /></button>
                <button onClick={() => onDelete(it)} className="p-1.5 rounded-lg hover:bg-[#FBEAE9] text-[#C7473F]"><Trash2 size={15} /></button>
              </div>
            </div>
            <div className="text-lg font-bold tabular-nums mb-1">{formatRupiah(it.amount)}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={statusTone(it.status)}>{it.status}</Badge>
              {overdue && <Badge tone="danger">Jatuh Tempo</Badge>}
              {it.dueDate && <span className="text-xs text-[#6B7568]">Jatuh tempo {formatDateShort(it.dueDate)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HutangPiutang({ data, persist, addToast, confirm }) {
  const [tab, setTab] = useState("piutang");
  const [modal, setModal] = useState(null);

  const isOverdue = (it) => it.dueDate && it.status !== "Lunas" && new Date(it.dueDate) < new Date();
  const totalPiutang = data.receivables.filter((r) => r.status !== "Lunas").reduce((a, b) => a + (b.amount - (b.paidAmount || 0)), 0);
  const totalHutang = data.payables.filter((p) => p.status !== "Lunas").reduce((a, b) => a + (b.amount - (b.paidAmount || 0)), 0);
  const piutangJT = data.receivables.filter(isOverdue).length;
  const hutangJT = data.payables.filter(isOverdue).length;

  const save = (form) => {
    const key = tab === "piutang" ? "receivables" : "payables";
    let next;
    if (modal.mode === "edit") {
      next = { ...data, [key]: data[key].map((x) => (x.id === modal.item.id ? { ...x, ...form } : x)) };
      addToast("Data diperbarui.");
    } else {
      next = { ...data, [key]: [...data[key], { id: uid(), ...form }] };
      addToast("Data ditambahkan.");
    }
    persist(next); setModal(null);
  };
  const del = (it) => {
    const key = tab === "piutang" ? "receivables" : "payables";
    confirm("Hapus Data?", "Data ini akan dihapus permanen.", () => {
      persist({ ...data, [key]: data[key].filter((x) => x.id !== it.id) });
      addToast("Data dihapus.");
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Hutang & Piutang</h1>
      <p className="text-[#6B7568] text-sm mb-5">Pantau uang yang belum dibayar pelanggan dan hutang usaha.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={ArrowDownRight} label="Total Piutang" value={formatRupiah(totalPiutang)} accent="#0F6B4F" />
        <StatCard icon={ArrowUpRight} label="Total Hutang" value={formatRupiah(totalHutang)} accent="#C7473F" />
        <StatCard icon={CalendarClock} label="Piutang Jatuh Tempo" value={piutangJT} accent="#E8A33D" />
        <StatCard icon={CalendarClock} label="Hutang Jatuh Tempo" value={hutangJT} accent="#E8A33D" />
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("piutang")} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "piutang" ? "bg-[#0F6B4F] text-white" : "bg-white border border-[#E4E7E0] text-[#4A554E]"}`}>Piutang</button>
        <button onClick={() => setTab("hutang")} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "hutang" ? "bg-[#0F6B4F] text-white" : "bg-white border border-[#E4E7E0] text-[#4A554E]"}`}>Hutang</button>
        <div className="flex-1" />
        <Btn onClick={() => setModal({ mode: "add" })}><Plus size={16} /> Tambah</Btn>
      </div>

      {tab === "piutang" ? (
        <DebtList items={data.receivables} nameKey="customer" onEdit={(it) => setModal({ mode: "edit", item: it })} onDelete={del}
          emptyIcon={Users} emptyTitle="Belum ada piutang" emptyDesc="Catat uang yang belum dibayar pelanggan Anda." onAdd={() => setModal({ mode: "add" })} />
      ) : (
        <DebtList items={data.payables} nameKey="party" onEdit={(it) => setModal({ mode: "edit", item: it })} onDelete={del}
          emptyIcon={HandCoins} emptyTitle="Belum ada hutang" emptyDesc="Catat hutang usaha kepada pihak lain." onAdd={() => setModal({ mode: "add" })} />
      )}

      {modal && (
        <Modal title={`${modal.mode === "edit" ? "Edit" : "Tambah"} ${tab === "piutang" ? "Piutang" : "Hutang"}`} onClose={() => setModal(null)}>
          <DebtForm mode={tab} initial={modal.mode === "edit" ? modal.item : null} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ================================ LAPORAN ================================= */

function Laporan({ data }) {
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());

  const range = useMemo(() => {
    const now = new Date();
    let from, to = now;
    if (period === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === "week") { from = new Date(now); from.setDate(now.getDate() - 6); }
    else if (period === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === "year") from = new Date(now.getFullYear(), 0, 1);
    else { from = new Date(customFrom); to = new Date(customTo); }
    return { from, to };
  }, [period, customFrom, customTo]);

  const inRange = (d) => { const dt = new Date(d); return dt >= new Date(range.from.toDateString()) && dt <= new Date(new Date(range.to).setHours(23, 59, 59)); };

  const salesInRange = data.sales.filter((s) => inRange(s.date));
  const expensesInRange = data.expenses.filter((e) => inRange(e.date));

  const omzet = salesInRange.reduce((a, b) => a + b.total, 0);
  const modal = salesInRange.reduce((a, b) => a + b.cost, 0);
  const keuntunganKotor = salesInRange.reduce((a, b) => a + b.profit, 0);
  const totalPengeluaran = expensesInRange.reduce((a, b) => a + b.amount, 0);
  const keuntunganBersih = keuntunganKotor - totalPengeluaran;

  const byDate = {};
  salesInRange.forEach((s) => { byDate[s.date] = (byDate[s.date] || 0) + s.total; });
  const salesByDate = Object.entries(byDate).sort(([a], [b]) => new Date(a) - new Date(b)).map(([date, total]) => ({ date: formatDateShort(date), total }));

  const byProduct = {};
  salesInRange.forEach((s) => s.items.forEach((it) => { byProduct[it.name] = (byProduct[it.name] || 0) + it.qty * it.price; }));
  const salesByProduct = Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, total]) => ({ name, total }));

  const byCategory = {};
  expensesInRange.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const expenseByCategory = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  const exportTransactions = () => {
    const rows = [["No Transaksi", "Tanggal", "Pelanggan", "Produk", "Subtotal", "Diskon", "Total", "Modal", "Untung", "Metode Bayar", "Status"]];
    salesInRange.forEach((s) => rows.push([s.trxNo, s.date, s.customer, s.items.map((i) => `${i.name} x${i.qty}`).join("; "), s.subtotal, s.discount, s.total, s.cost, s.profit, s.paymentMethod, s.status]));
    downloadCSV(`transaksi-${period}-${todayISO()}.csv`, rows);
  };
  const exportSummary = () => {
    const rows = [
      ["Ringkasan Laporan"], ["Periode", period], ["Total Omzet", omzet], ["Total Modal", modal],
      ["Keuntungan Kotor", keuntunganKotor], ["Total Pengeluaran", totalPengeluaran], ["Keuntungan Bersih", keuntunganBersih],
      ["Jumlah Transaksi", salesInRange.length],
    ];
    downloadCSV(`ringkasan-laporan-${todayISO()}.csv`, rows);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div><h1 className="font-display text-2xl font-bold mb-1">Laporan</h1><p className="text-[#6B7568] text-sm">Analisis performa usahamu.</p></div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={exportTransactions}><FileDown size={15} /> Export Transaksi</Btn>
          <Btn variant="secondary" size="sm" onClick={exportSummary}><Download size={15} /> Export Ringkasan</Btn>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[["today", "Hari Ini"], ["week", "Minggu Ini"], ["month", "Bulan Ini"], ["year", "Tahun Ini"], ["custom", "Custom"]].map(([id, label]) => (
          <button key={id} onClick={() => setPeriod(id)} className={`px-3.5 py-2 rounded-xl text-sm font-medium ${period === id ? "bg-[#0F6B4F] text-white" : "bg-white border border-[#E4E7E0] text-[#4A554E]"}`}>{label}</button>
        ))}
        {period === "custom" && (
          <>
            <Input type="date" className="w-auto" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <Input type="date" className="w-auto" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={ShoppingCart} label="Total Omzet" value={formatRupiah(omzet)} accent="#0F6B4F" />
        <StatCard icon={Package} label="Total Modal" value={formatRupiah(modal)} accent="#3A8DAE" />
        <StatCard icon={TrendingUp} label="Untung Kotor" value={formatRupiah(keuntunganKotor)} accent="#E8A33D" />
        <StatCard icon={Receipt} label="Pengeluaran" value={formatRupiah(totalPengeluaran)} accent="#C7473F" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Wallet} label="Untung Bersih" value={formatRupiah(keuntunganBersih)} accent="#0F6B4F" />
        <StatCard icon={Receipt} label="Jumlah Transaksi" value={salesInRange.length} accent="#8B6FB3" />
      </div>

      {salesInRange.length === 0 && expensesInRange.length === 0 ? (
        <p className="text-sm text-[#6B7568] text-center py-10">Tidak ada data pada periode ini.</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-4">Penjualan Berdasarkan Tanggal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7568" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7568" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+"rb" : v} />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E4E7E0", fontSize: 13 }} />
                <Line type="monotone" dataKey="total" stroke="#0F6B4F" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-4">Penjualan Berdasarkan Produk</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByProduct} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7568" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+"rb" : v} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#6B7568" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E4E7E0", fontSize: 13 }} />
                <Bar dataKey="total" fill="#0F6B4F" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-[#E4E7E0] p-4 sm:p-5 lg:col-span-2">
            <h3 className="font-semibold text-sm mb-4">Pengeluaran Berdasarkan Kategori</h3>
            {expenseByCategory.length === 0 ? <p className="text-sm text-[#6B7568]">Tidak ada pengeluaran pada periode ini.</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E4E7E0", fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================== PENGATURAN ================================ */

function Pengaturan({ data, persist, addToast, confirm }) {
  const [profile, setProfile] = useState(data.settings);
  const fileRef = useRef(null);

  const saveProfile = () => { persist({ ...data, settings: profile }); addToast("Profil usaha disimpan."); };
  const toggleTheme = () => {
    const next = { ...profile, theme: profile.theme === "dark" ? "light" : "dark" };
    setProfile(next); persist({ ...data, settings: next });
  };
  const exportAll = () => downloadJSON(`catatusaha-backup-${todayISO()}.json`, data);
  const importAll = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        confirm("Timpa Data?", "Data saat ini akan digantikan dengan data dari file backup ini.", () => {
          persist(parsed); addToast("Data berhasil dipulihkan.");
        });
      } catch (err) { addToast("File tidak valid.", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  const resetAll = () => confirm("Hapus Semua Data?", "Tindakan ini akan menghapus seluruh produk, transaksi, dan pengaturan secara permanen. Tidak dapat dibatalkan.", () => {
    persist(emptyData()); addToast("Semua data telah dihapus.");
  });
  const loadSample = () => confirm("Isi Data Contoh?", "Data contoh akan ditambahkan menggantikan data kosong saat ini.", () => {
    persist(sampleData()); addToast("Data contoh dimuat.");
  }, false);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-1">Pengaturan</h1>
      <p className="text-[#6B7568] text-sm mb-6">Kelola profil usaha, tampilan, dan data aplikasi.</p>

      <div className="bg-white rounded-2xl border border-[#E4E7E0] p-5 mb-4">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Store size={16} /> Profil Usaha</h3>
        <Field label="Nama Usaha"><Input value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} /></Field>
        <Field label="Nama Pemilik"><Input value={profile.ownerName} onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })} /></Field>
        <Field label="Nomor Telepon"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
        <Field label="Alamat"><TextArea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></Field>
        <Btn onClick={saveProfile}>Simpan Profil</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7E0] p-5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profile.theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          <div>
            <h3 className="font-semibold text-sm">Tema Tampilan</h3>
            <p className="text-xs text-[#6B7568]">{profile.theme === "dark" ? "Tema Gelap aktif" : "Tema Terang aktif"}</p>
          </div>
        </div>
        <button onClick={toggleTheme} className={`w-12 h-7 rounded-full p-1 transition-colors ${profile.theme === "dark" ? "bg-[#0F6B4F]" : "bg-[#E4E7E0]"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile.theme === "dark" ? "translate-x-5" : ""}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7E0] p-5 mb-4">
        <h3 className="font-semibold text-sm mb-1">Demo Data</h3>
        <p className="text-xs text-[#6B7568] mb-3">Isi ulang aplikasi dengan data contoh untuk keperluan demo ke calon klien.</p>
        <Btn variant="accent" size="sm" onClick={loadSample}><Sprout size={15} /> Isi Data Contoh</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7E0] p-5">
        <h3 className="font-semibold text-sm mb-4">Data</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <Btn variant="secondary" size="sm" onClick={exportAll}><Download size={15} /> Export Semua Data</Btn>
          <Btn variant="secondary" size="sm" onClick={() => fileRef.current && fileRef.current.click()}><Upload size={15} /> Import Data</Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
            onChange={importAll}
          />
        </div>
        <div className="border-t border-[#E4E7E0] pt-3 mt-3">
          <Btn variant="danger" size="sm" onClick={resetAll}><RotateCcw size={15} /> Hapus Semua Data</Btn>
        </div>
      </div>
    </div>
  );
}
