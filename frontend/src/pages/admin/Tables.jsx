import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Receipt, Banknote, CreditCard, Landmark, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { useSocketEvents } from '../../hooks/useSocket';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [activeTableId, setActiveTableId] = useState(null);
  
  // Payment Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState('TOTAL');
  const [splitWays, setSplitWays] = useState(2);
  const [selectedItemsForPayment, setSelectedItemsForPayment] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    number: '',
    capacity: '4',
  });

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (!selectedOrder || !isPaymentModalOpen) return;
    const totalPaid = selectedOrder.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const remaining = parseFloat(selectedOrder.total) - totalPaid;

    if (splitMode === 'TOTAL') {
      setPaymentAmount(Math.round(remaining).toLocaleString('de-DE'));
    } else if (splitMode === 'EQUAL_PARTS') {
      setPaymentAmount(Math.round(remaining / splitWays).toLocaleString('de-DE'));
    } else if (splitMode === 'BY_PRODUCT') {
      const sum = selectedItemsForPayment.reduce((s, item) => s + parseFloat(item.subtotal), 0);
      setPaymentAmount(Math.round(sum).toLocaleString('de-DE'));
    }
  }, [splitMode, splitWays, selectedItemsForPayment, selectedOrder, isPaymentModalOpen]);

  // Eventos de real-time para actualizar mesas sin refrescar
  useSocketEvents({
    'table:updated': () => fetchTables(),
    'order:created': () => fetchTables(),
    'order:updated': () => fetchTables(),
  });

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

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    const totalPaid = order.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const remaining = parseFloat(order.total) - totalPaid;

    setPaymentAmount(Math.round(remaining).toLocaleString('de-DE'));
    setPaymentMethod('CASH');
    setSplitMode('TOTAL');
    setSplitWays(2);
    setSelectedItemsForPayment([]);
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.post('/payments', {
        orderId: selectedOrder.id,
        amount: parseInt(paymentAmount.toString().replace(/\./g, ''), 10),
        method: paymentMethod
      });

      toast.success('Pago registrado');
      setIsPaymentModalOpen(false);
      fetchTables(); 
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Error al procesar pago');
    } finally {
      setIsProcessing(false);
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
          {tables.map((table) => {
            const activeOrder = table.orders && table.orders.length > 0 ? table.orders[0] : null;
            const isOccupied = ['OCCUPIED', 'ATTENDED', 'PAID'].includes(table.status);
            const orderTotal = activeOrder ? activeOrder.items?.reduce((sum, item) => sum + parseFloat(item.subtotal || (item.unitPrice * item.quantity)), 0) : 0;
            const isActive = activeTableId === table.id;

            return (
            <div 
              key={table.id} 
              onClick={() => setActiveTableId(isActive ? null : table.id)}
              onMouseLeave={() => setActiveTableId(null)}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 flex flex-col items-center justify-center relative group cursor-pointer lg:cursor-default"
            >
              
              {/* Popover con detalles del pedido */}
              {(isOccupied && activeOrder) && (
                <>
                  {/* Overlay for mobile tap outside */}
                  {isActive && <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setActiveTableId(null)} />}
                  <div className={`fixed lg:absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:top-[80%] lg:-translate-y-0 lg:left-1/2 lg:-translate-x-1/2 w-[90vw] max-w-sm lg:w-72 bg-white dark:bg-neutral-800 rounded-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] lg:shadow-2xl border border-neutral-200 dark:border-neutral-700 transition-all duration-200 z-[60] cursor-default ${isActive ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95 lg:scale-100 lg:group-hover:opacity-100 lg:group-hover:visible'}`}>
                    <div className="p-4 max-h-[60vh] lg:max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 overscroll-contain relative z-10 bg-white dark:bg-neutral-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-3 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-sm">
                        Pedido - Mesero: {activeOrder.user?.name?.split(' ')[0] || 'Desconocido'}
                      </h3>
                    </div>
                    <ul className="space-y-2 mb-3">
                      {activeOrder.items?.map((item, idx) => (
                        <li key={item.id || idx} className="text-sm flex justify-between gap-3">
                          <span className="flex-1 text-neutral-600 dark:text-neutral-300">
                            <span className="font-medium mr-1.5">{item.quantity}x</span> 
                            {item.product?.name}
                          </span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                            {formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center font-bold text-base pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(activeOrder.total || orderTotal || 0)}</span>
                    </div>
                    {activeOrder.status !== 'COMPLETED' && activeOrder.status !== 'CANCELLED' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openPaymentModal(activeOrder); }}
                        className="mt-3 w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Receipt className="w-4 h-4" /> Cobrar Mesa
                      </button>
                    )}
                  </div>
                </div>
              </>
              )}

              <div className={`absolute top-2 right-2 transition-opacity flex gap-1 z-10 ${isActive ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(table); }}
                  className="p-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded hover:text-primary dark:hover:text-primary transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
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
          );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-center relative">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Cobrar Orden #{selectedOrder.id}</h2>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white">✕</button>
            </div>

            {/* Split Tabs */}
            {!selectedOrder.payments?.length ? (
              <div className="flex bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                <button type="button" onClick={() => setSplitMode('TOTAL')} className={`flex-1 p-3 text-sm font-bold ${splitMode === 'TOTAL' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>Total</button>
                <button type="button" onClick={() => setSplitMode('EQUAL_PARTS')} className={`flex-1 p-3 text-sm font-bold ${splitMode === 'EQUAL_PARTS' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>En Partes</button>
                <button type="button" onClick={() => setSplitMode('BY_PRODUCT')} className={`flex-1 p-3 text-sm font-bold ${splitMode === 'BY_PRODUCT' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 dark:text-neutral-400'}`}>Por Platos</button>
              </div>
            ) : (
              <div className="p-2 border-b border-neutral-200 dark:border-neutral-700 bg-orange-100 text-center dark:bg-orange-500/10">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Pago Parcial en curso - Solo Cobro Manual</span>
              </div>
            )}

            <div className="max-h-[65vh] overflow-y-auto scrollbar-thin">
              <form onSubmit={handlePayment} className="p-5 space-y-6">

                {splitMode === 'EQUAL_PARTS' && (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium text-sm">Dividir entre:</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setSplitWays(Math.max(2, splitWays - 1))} className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white font-bold flex items-center justify-center transition-colors">-</button>
                      <span className="text-xl font-bold text-neutral-900 dark:text-white w-6 text-center">{splitWays}</span>
                      <button type="button" onClick={() => setSplitWays(splitWays + 1)} className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white font-bold flex items-center justify-center transition-colors">+</button>
                    </div>
                  </div>
                )}

                {splitMode === 'BY_PRODUCT' && (
                  <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl min-h-[100px] max-h-56 overflow-y-auto p-2 space-y-1">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 px-2 py-1 uppercase tracking-wider font-bold">Selecciona qué vas a pagar:</p>
                    {selectedOrder?.items?.map(item => {
                      const isSelected = selectedItemsForPayment.some(i => i.id === item.id);
                      const toggleSelection = () => {
                        if (isSelected) {
                          setSelectedItemsForPayment(prev => prev.filter(i => i.id !== item.id));
                        } else {
                          setSelectedItemsForPayment(prev => [...prev, item]);
                        }
                      };
                      return (
                        <div key={item.id} onClick={toggleSelection} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-neutral-400 dark:border-neutral-500'}`}>
                              {isSelected && <CheckCircle className="w-3 h-3" />}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">{item.product?.name}</p>
                              <p className="text-xs text-primary font-bold mt-0.5">x{item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-mono text-sm font-medium text-neutral-600 dark:text-neutral-300">{formatCurrency(item.subtotal)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center">
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-1">Monto a Cobrar</span>
                  <div className="relative w-full max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-neutral-400 dark:text-neutral-500 font-mono">$</span>
                    <input
                      type="text"
                      required
                      value={paymentAmount}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        if (!rawValue) return setPaymentAmount('');
                        setPaymentAmount(Math.round(parseInt(rawValue, 10)).toLocaleString('de-DE'));
                      }}
                      className="w-full bg-transparent text-3xl font-bold text-center text-neutral-900 dark:text-white font-mono py-2 border-b-2 border-primary focus:border-neutral-700 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setPaymentMethod('CASH')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-500'}`}>
                      <Banknote className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Efectivo</span>
                    </button>
                    <button type="button" onClick={() => setPaymentMethod('CARD')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-500'}`}>
                      <CreditCard className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Tarjeta</span>
                    </button>
                    <button type="button" onClick={() => setPaymentMethod('TRANSFER')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'TRANSFER' ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-500'}`}>
                      <Landmark className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Transf.</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="py-3 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-white font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isProcessing} className="py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? 'Procesando...' : 'Cobrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
