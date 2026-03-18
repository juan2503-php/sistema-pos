import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocketEvents } from '../../hooks/useSocket';
import toast from 'react-hot-toast';

export default function TablesView() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchTables();
  }, []);

  // Socket.io updates for tables
  const handleTableUpdate = useCallback((updatedTable) => {
    setTables(prev => prev.map(t => {
      if (t.id === updatedTable.id) {
        return { ...t, status: updatedTable.status }; // Actualizar solo el estado
      }
      return t;
    }));
  }, []);

  useSocketEvents({
    'table:updated': handleTableUpdate,
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'FREE': return 'bg-green-500 hover:bg-green-600 border-green-700 shadow-[0_4px_0_0_rgba(21,128,61,1)] active:shadow-none active:translate-y-1';
      case 'OCCUPIED': return 'bg-orange-500 hover:bg-orange-600 border-orange-700 shadow-[0_4px_0_0_rgba(194,65,12,1)] active:shadow-none active:translate-y-1';
      case 'ATTENDED': return 'bg-blue-500 hover:bg-blue-600 border-blue-700 shadow-[0_4px_0_0_rgba(29,78,216,1)] active:shadow-none active:translate-y-1';
      case 'PAID': return 'bg-purple-500 hover:bg-purple-600 border-purple-700 shadow-[0_4px_0_0_rgba(126,34,206,1)] active:shadow-none active:translate-y-1';
      default: return 'bg-neutral-500 hover:bg-neutral-600 border-neutral-700 shadow-[0_4px_0_0_rgba(64,64,64,1)] active:shadow-none active:translate-y-1';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'FREE': return 'Libre';
      case 'OCCUPIED': return 'Ocupada';
      case 'ATTENDED': return 'En Atención';
      case 'PAID': return 'Pagada';
      default: return status;
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'FREE' || table.status === 'PAID') {
      navigate(`/waiter/new-order/${table.id}`);
    } else {
      // Si está ocupada/atendida, ir a la vista de órdenes activas filtrando su mesa (o ir directamente al detalle)
      navigate(`/waiter/orders`);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center h-full">Cargando mesas...</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-neutral-900 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Seleccione una Mesa</h1>
        <p className="text-neutral-400">Toque una mesa libre para tomar un pedido</p>
      </div>

      <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`
              relative flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 
              transition-all h-32 sm:h-40
              ${getStatusColor(table.status)}
            `}
          >
            <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-md mb-2">
              {table.number}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wide">
              {getStatusText(table.status)}
            </span>
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-70">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              <span className="text-[10px] text-white font-bold">{table.capacity}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-neutral-400 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div> Libre
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div> Ocupada (Con pedido pendiente)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div> En Atención
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div> Pagada / Limpiando
        </div>
      </div>
    </div>
  );
}
