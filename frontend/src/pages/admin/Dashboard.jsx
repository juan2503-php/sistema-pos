import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useSocketEvents } from '../../hooks/useSocket';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setMetrics(data);
    } catch (error) {
      toast.error('Error al cargar métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Real-time integration
  useSocketEvents({
    'new_order': fetchMetrics,
    'order_updated': fetchMetrics
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard General</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Resumen de actividad y ventas del día
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 px-4 py-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Ventas Hoy</h3>
            <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{formatCurrency(metrics.todayRevenue)}</p>
            <p className="text-sm text-neutral-500 mt-1">{metrics.todayOrders} órdenes completadas</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Mesas Atendidas</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{metrics.tablesServedToday}</p>
            <p className="text-sm text-neutral-500 mt-1">En lo que va del día</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Pedios Activos</h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-purple-600 dark:text-purple-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{metrics.activeOrders}</p>
            <p className="text-sm text-neutral-500 mt-1">En preparación o en mesa</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Alertas Stock</h3>
            <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{metrics.lowStockCount}</p>
            <p className="text-sm text-neutral-500 mt-1">Productos por agotarse</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-medium mb-6">Ventas Últimos 7 Días</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.salesByDay.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('es-MX', { weekday: 'short' })}
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-medium mb-6">Top Productos (Histórico)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topProducts.slice(0, 5)} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                <XAxis type="number" stroke="#888888" fontSize={12} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#888888" 
                  fontSize={12}
                  tickLine={false} 
                  axisLine={false} 
                  width={100}
                />
                <Tooltip
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  formatter={(value) => [value, 'Unidades vendidas']}
                />
                <Bar dataKey="totalSold" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
