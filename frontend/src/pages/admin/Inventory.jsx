import { useState, useEffect } from 'react';
import { PackagePlus, History, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';

export default function Inventory() {
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // summary, movements
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '1',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'summary') {
        const { data } = await api.get('/inventory/summary');
        setSummary(data);
      } else {
        const { data } = await api.get('/inventory/movements');
        setMovements(data);
      }
    } catch (error) {
      toast.error('Error al cargar datos de inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/add-stock', formData);
      toast.success('Stock actualizado');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar stock');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Control de existencias y movimientos</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ productId: summary?.allProducts?.[0]?.id || '', quantity: '1', reason: '' });
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <PackagePlus className="w-5 h-5" />
          Ingresar Stock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          Estado Actual
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'movements' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial Movimientos
          </div>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-neutral-500">Cargando...</div>
      ) : activeTab === 'summary' && summary ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-neutral-500 text-sm font-medium">Total Productos</h3>
              <p className="text-3xl font-bold mt-2">{summary.totalProducts}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-500/5">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-medium">Stock Bajo</h3>
              </div>
              <p className="text-3xl font-bold mt-2 text-orange-700 dark:text-orange-400">{summary.lowStockCount}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-500/5">
              <h3 className="text-red-600 dark:text-red-500 text-sm font-medium">Agotados</h3>
              <p className="text-3xl font-bold mt-2 text-red-700 dark:text-red-400">{summary.outOfStockCount}</p>
            </div>
          </div>

          {/* Low Stock Table */}
          {summary.lowStockProducts.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-red-50/50 dark:bg-red-500/5">
                <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Productos que requieren reabastecimiento
                </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Producto</th>
                    <th className="px-6 py-3 font-medium">Stock Actual</th>
                    <th className="px-6 py-3 font-medium">Mínimo Permitido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {summary.lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-3 font-medium">{p.name}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 rounded font-bold">
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-neutral-500">{p.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : activeTab === 'movements' ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500">
              <tr>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Producto</th>
                <th className="px-6 py-4 font-medium">Cant.</th>
                <th className="px-6 py-4 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/20">
                  <td className="px-6 py-4 text-neutral-500">{formatDate(mov.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${mov.type === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-500'}`}>
                      {mov.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{mov.product.name}</td>
                  <td className="px-6 py-4 font-bold">{Math.abs(mov.quantity)}</td>
                  <td className="px-6 py-4 text-neutral-500">{mov.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && (
            <div className="p-8 text-center text-neutral-500">No hay movimientos recientes</div>
          )}
        </div>
      ) : null}

      {/* Manual Stock Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-bold">Ingresar Stock</h2>
            </div>
            
            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Producto</label>
                <select
                  required
                  value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-primary"
                >
                  <option value="" disabled>Seleccione producto...</option>
                  {summary?.allProducts?.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Actual: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cantidad a ingresar</label>
                <input
                  type="number" min="1" required
                  value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Ej: Compra a proveedor"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-primary"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg gap-2 flex items-center">
                  <PackagePlus className="w-4 h-4" /> Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
