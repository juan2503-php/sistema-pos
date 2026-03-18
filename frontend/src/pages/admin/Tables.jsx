import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    number: '',
    capacity: '4',
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data);
    } catch (error) {
      toast.error('Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (table = null) => {
    setCurrentTable(table);
    if (table) {
      setFormData({
        number: table.number.toString(),
        capacity: table.capacity.toString(),
      });
    } else {
      setFormData({
        number: '',
        capacity: '4',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentTable) {
        await api.put(`/tables/${currentTable.id}`, formData);
        toast.success('Mesa actualizada');
      } else {
        await api.post('/tables', formData);
        toast.success('Mesa creada');
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar mesa');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta mesa?')) {
      try {
        await api.delete(`/tables/${id}`);
        toast.success('Mesa eliminada');
        fetchTables();
      } catch (error) {
        toast.error('Error al eliminar (puede tener órdenes asociadas)');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'FREE': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500';
      case 'OCCUPIED': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-500';
      case 'ATTENDED': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500';
      case 'PAID': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-500';
      default: return 'bg-neutral-100 text-neutral-700 border border-neutral-200';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'FREE': return 'Libre';
      case 'OCCUPIED': return 'Ocupada';
      case 'ATTENDED': return 'En Atención';
      case 'PAID': return 'Pagada / Por Limpiar';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Mesas</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Administra las mesas y su capacidad</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Mesa
        </button>
      </div>

      {/* Grid de Mesas */}
      {loading ? (
        <div className="p-8 text-center text-neutral-500">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 flex flex-col items-center justify-center relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button 
                  onClick={() => handleOpenModal(table)}
                  className="p-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded hover:text-primary dark:hover:text-primary transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(table.id)}
                  className="p-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded hover:text-red-600 dark:hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">{table.number}</span>
              </div>
              
              <div className="text-center w-full">
                <p className="text-xs text-neutral-500 mb-2">Capacidad: {table.capacity} p.</p>
                <span className={`block w-full py-1 text-[10px] font-bold uppercase rounded ${getStatusColor(table.status)}`}>
                  {getStatusText(table.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-bold">{currentTable ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Número de Mesa
                </label>
                <input
                  type="number" min="1" required
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Capacidad (Personas)
                </label>
                <input
                  type="number" min="1" required
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
