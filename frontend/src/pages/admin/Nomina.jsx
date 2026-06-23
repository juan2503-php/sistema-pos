import { useState, useEffect, useCallback } from 'react';
import {
  Banknote,
  Users,
  CalendarDays,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';

// ─── Helpers ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sunday
}

function padDate(n) {
  return String(n).padStart(2, '0');
}

// ─── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    green: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500',
    blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500',
    purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500',
    orange: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500',
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</h3>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Attendance Grid (GitHub Contributions style) ─────────────────────────

function AttendanceGrid({ year, month, attendedDays, onToggle, isAdmin }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padDate(today.getMonth() + 1)}-${padDate(today.getDate())}`;

  // Construir grid con celdas vacías para alinear el primer día
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div>
      {/* Etiquetas días de la semana */}
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const dateStr = `${year}-${padDate(month)}-${padDate(day)}`;
          const attended = attendedDays.includes(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = new Date(dateStr) > new Date(todayStr);

          return (
            <button
              key={dateStr}
              title={`${day} ${MONTH_NAMES[month - 1]} — ${attended ? 'Asistió' : 'No asistió'}`}
              disabled={!isAdmin || isFuture}
              onClick={() => onToggle(dateStr)}
              className={[
                'aspect-square rounded-md text-xs font-semibold transition-all duration-150 flex items-center justify-center',
                attended
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-300 dark:shadow-emerald-900 hover:bg-emerald-400'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600',
                isToday ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-neutral-800' : '',
                isFuture ? 'opacity-30 cursor-not-allowed' : isAdmin ? 'cursor-pointer' : 'cursor-default',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span>Asistió</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <span>No asistió</span>
        </div>
        {isAdmin && (
          <span className="ml-auto italic">Haz clic en un día para marcar/desmarcar</span>
        )}
      </div>
    </div>
  );
}

// ─── Inline Daily Rate Editor ──────────────────────────────────────────────

function DailyRateCell({ waiterId, currentRate, onSave, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentRate));

  const handleSave = async () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Ingresa un valor válido');
      return;
    }
    await onSave(waiterId, parsed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setValue(String(currentRate));
      setEditing(false);
    }
  };

  if (!isAdmin) {
    return <span className="font-medium">{formatCurrency(currentRate)}</span>;
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-neutral-400 text-sm">$</span>
        <input
          type="number"
          min="0"
          step="1000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-28 px-2 py-1 text-sm border border-primary rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleSave}
          className="p-1 text-emerald-600 hover:text-emerald-500 transition-colors"
          title="Guardar"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setValue(String(currentRate)); setEditing(false); }}
          className="p-1 text-red-500 hover:text-red-400 transition-colors"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 group font-medium hover:text-primary transition-colors"
      title="Click para editar"
    >
      {formatCurrency(currentRate)}
      <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
    </button>
  );
}

// ─── Modal de Asistencia ───────────────────────────────────────────────────

function AttendanceModal({ waiter, year, month, onClose, isAdmin }) {
  const [attendedDays, setAttendedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await api.get(`/nomina/attendance/${waiter.id}?year=${year}&month=${month}`);
        setAttendedDays(data.attendedDays || []);
      } catch {
        toast.error('Error al cargar asistencias');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [waiter.id, year, month]);

  const handleToggle = async (dateStr) => {
    if (toggling) return;
    setToggling(true);
    try {
      const { data } = await api.post('/nomina/attendance/toggle', {
        userId: waiter.id,
        date: dateStr,
      });

      setAttendedDays((prev) => {
        if (data.attended) {
          return prev.includes(dateStr) ? prev : [...prev, dateStr].sort();
        } else {
          return prev.filter((d) => d !== dateStr);
        }
      });
    } catch {
      toast.error('Error al actualizar asistencia');
    } finally {
      setToggling(false);
    }
  };

  const daysWorked = attendedDays.length;
  const totalSalary = daysWorked * waiter.dailyRate;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
              {waiter.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold">{waiter.name}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {MONTH_NAMES[month - 1]} {year}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : (
            <AttendanceGrid
              year={year}
              month={month}
              attendedDays={attendedDays}
              onToggle={handleToggle}
              isAdmin={isAdmin}
            />
          )}
        </div>

        {/* Footer — resumen */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Días asistidos:</span>{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-500">{daysWorked}</span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Valor/día:</span>{' '}
              <span className="font-bold">{formatCurrency(waiter.dailyRate)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Nómina</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalSalary)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────

export default function Nomina() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [stats, setStats] = useState(null);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWaiter, setSelectedWaiter] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, waitersRes] = await Promise.all([
        api.get(`/nomina/stats?year=${year}&month=${month}`),
        api.get(`/nomina/waiters?year=${year}&month=${month}`),
      ]);
      setStats(statsRes.data);
      setWaiters(waitersRes.data);
    } catch {
      toast.error('Error al cargar datos de nómina');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const handleSaveDailyRate = async (waiterId, dailyRate) => {
    try {
      await api.put(`/nomina/salary-config/${waiterId}`, { dailyRate });
      toast.success('Valor por día actualizado');
      // Refrescar datos para actualizar el total calculado
      await fetchData();
    } catch {
      toast.error('Error al actualizar el valor por día');
    }
  };

  const handleCloseModal = () => {
    setSelectedWaiter(null);
    // Refrescar la tabla al cerrar el modal (pueden haber cambiado asistencias)
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nómina</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Gestión de asistencias y sueldos de meseros
          </p>
        </div>

        {/* Selector de mes */}
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 px-2 py-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold px-2 min-w-[130px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {loading || !stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 animate-pulse"
            >
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4" />
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Users}
            label="Total Meseros"
            value={stats.totalWaiters}
            color="blue"
          />
          <KpiCard
            icon={CalendarDays}
            label="Días Trabajados (mes)"
            value={stats.totalDays}
            color="green"
          />
          <KpiCard
            icon={Banknote}
            label="Nómina Total del Mes"
            value={formatCurrency(stats.totalPayroll)}
            color="purple"
          />
          <KpiCard
            icon={TrendingUp}
            label="Promedio de Sueldo"
            value={formatCurrency(stats.avgSalary)}
            color="orange"
          />
        </div>
      )}

      {/* ── Tabla de meseros ── */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-base font-semibold">Meseros registrados</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {MONTH_NAMES[month - 1]} {year} — Haz clic en "Asistencia" para registrar días trabajados
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          </div>
        ) : waiters.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              No hay meseros activos registrados
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
              Crea usuarios con rol "Mesero" en el módulo de Usuarios
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Mesero</th>
                  <th className="px-6 py-4 font-medium text-center">Días Trabajados</th>
                  <th className="px-6 py-4 font-medium">Valor por Día (COP)</th>
                  <th className="px-6 py-4 font-medium">Sueldo Total (COP)</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {waiters.map((waiter) => (
                  <tr
                    key={waiter.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/20 transition-colors"
                  >
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                          {waiter.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-white">
                            {waiter.name}
                          </div>
                          <div className="text-xs text-neutral-500">{waiter.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Días trabajados */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                          waiter.daysWorked > 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                        }`}
                      >
                        {waiter.daysWorked}
                      </span>
                    </td>

                    {/* Valor por día (editable) */}
                    <td className="px-6 py-4">
                      <DailyRateCell
                        waiterId={waiter.id}
                        currentRate={waiter.dailyRate}
                        onSave={handleSaveDailyRate}
                        isAdmin={isAdmin}
                      />
                    </td>

                    {/* Sueldo total */}
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          waiter.totalSalary > 0
                            ? 'text-neutral-900 dark:text-white'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {formatCurrency(waiter.totalSalary)}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedWaiter(waiter)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/15 dark:hover:bg-primary/25 transition-colors"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Asistencia
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totales */}
              {waiters.length > 0 && stats && (
                <tfoot className="bg-neutral-50 dark:bg-neutral-900/50 border-t-2 border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <td className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">
                      Totales
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-500">
                      {stats.totalDays}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">—</td>
                    <td className="px-6 py-4 font-bold text-lg text-neutral-900 dark:text-white">
                      {formatCurrency(stats.totalPayroll)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de asistencia ── */}
      {selectedWaiter && (
        <AttendanceModal
          waiter={selectedWaiter}
          year={year}
          month={month}
          onClose={handleCloseModal}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
