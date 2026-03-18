import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, CreditCard, Banknote, Landmark, Clock, CheckCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useSocketEvents } from '../../hooks/useSocket';

export default function ActiveOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Pago
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState('TOTAL'); // 'TOTAL', 'EQUAL_PARTS', 'BY_PRODUCT'
  const [splitWays, setSplitWays] = useState(2);
  const [selectedItemsForPayment, setSelectedItemsForPayment] = useState([]);

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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders?status=IN_PROGRESS&status=PENDING');
      // Filtramos en frontend y backend por seguridad, o traemos todos y filtramos
      const active = data.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS');
      setOrders(active);
    } catch (error) {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  // Escuchar por actualización de órdenes en tiempo real
  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders(prev => {
      // Si fue completada o cancelada, removerla de esta vista
      if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        return prev.filter(o => o.id !== updatedOrder.id);
      }
      
      // Si existe, actualizarla; si es nueva, ignórala porque otro hook debería encargar 'order:created'
      // O para ser robustos, volver a hacer fetch si los datos se complican
      return prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o);
    });
  }, []);

  const handleOrderCreated = useCallback(() => {
    fetchOrders(); // Refrescar lista completa para traer items y mesa
  }, []);

  useSocketEvents({
    'order:updated': handleOrderUpdate,
    'order:created': handleOrderCreated,
  });

  const handleUpdateStatus = async (id, status) => {
    try {
      toast.loading('Actualizando...', { id: 'status' });
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Estado actualizado', { id: 'status' });
      // Socket hará la actualización visual, pero también podemos refrescar
      fetchOrders();
    } catch (e) {
      toast.error('Error al actualizar', { id: 'status' });
    }
  };

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    
    // Calcular saldo pendiente y redondear a enteros
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
      fetchOrders(); // Refrescar para ver el nuevo estado/saldo
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Error al procesar pago');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center bg-neutral-900 min-h-screen">Cargando órdenes...</div>;

  return (
    <div className="flex-1 p-4 sm:p-6 bg-neutral-900 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pedidos Activos</h1>
        <p className="text-neutral-400">Total: {orders.length} pedidos sin cobrar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4 items-start">
        {orders.map(order => {
          const totalPaid = order.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
          const remaining = (parseFloat(order.total) - totalPaid).toFixed(2);
          const hasPayments = totalPaid > 0;

          return (
            <div key={order.id} className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden shadow-lg flex flex-col">
              {/* Header */}
              <div className="p-4 bg-neutral-800 border-b border-neutral-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 text-primary font-bold text-xl rounded-xl flex items-center justify-center">
                    M{order.table?.number}
                  </div>
                  <div>
                    <h3 className="text-white font-bold leading-tight">Orden #{order.id}</h3>
                    <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-white font-mono">{formatCurrency(order.total)}</p>
                  <span className={`px-2 py-0.5 mt-1 inline-block rounded text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 
                    'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  }`}>
                    {order.status === 'PENDING' ? 'COCIENANDO' : 'EN MESA (ENTREGADO)'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 bg-neutral-900 min-h-[120px] max-h-[250px] overflow-y-auto">
                <ul className="space-y-3">
                  {order.items?.map(item => (
                    <li key={item.id} className="flex justify-between items-start text-sm border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
                      <div className="flex gap-2">
                        <span className="font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">x{item.quantity}</span>
                        <div>
                          <p className="text-white font-medium">{item.product?.name}</p>
                          {item.notes && <p className="text-xs text-red-400 italic">Nota: {item.notes}</p>}
                        </div>
                      </div>
                      <span className="text-neutral-400 font-mono">{formatCurrency(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Parcial Payments summary if any */}
              {hasPayments && (
                <div className="px-4 py-2 border-t border-dashed border-neutral-700 bg-neutral-800/50 flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Abonado: <span className="text-white font-mono">{formatCurrency(totalPaid)}</span></span>
                  <span className="text-orange-400 font-bold">Resta: <span className="font-mono">{formatCurrency(remaining)}</span></span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="p-4 bg-neutral-800 border-t border-neutral-700 flex flex-wrap sm:flex-nowrap gap-2">
                
                {order.status === 'PENDING' ? (
                  <button 
                    onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                    className="flex-1 py-3 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-[0_3px_0_0_#1d4ed8] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Marcar Entregado
                  </button>
                ) : (
                  <button 
                    disabled // No action needed backwards here for simple UI
                    className="flex-1 py-3 px-2 bg-neutral-700 text-neutral-400 cursor-not-allowed rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Entregado
                  </button>
                )}

                <button 
                  onClick={() => openPaymentModal(order)}
                  className="flex-1 py-3 px-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm shadow-[0_3px_0_0_#15803d] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
                >
                  <Receipt className="w-5 h-5" /> {hasPayments ? 'Completar Cobro' : 'Realizar Cobro'}
                </button>
                
                {!hasPayments && (
                  <button
                    onClick={() => navigate(`/waiter/edit-order/${order.id}`)}
                    className="flex-1 py-3 px-2 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-white rounded-xl font-bold text-sm shadow-[0_3px_0_0_#404040] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-5 h-5" /> Editar
                  </button>
                )}

              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-700">
              <Receipt className="w-10 h-10 text-neutral-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin Pedidos Activos</h3>
            <p className="text-neutral-500">Todo está limpio. Vaya al mapa de mesas para crear pedidos nuevos.</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-neutral-700">
             <div className="p-5 border-b border-neutral-700 bg-neutral-900 text-center relative">
                <h2 className="text-xl font-bold text-white">Cobrar Orden #{selectedOrder.id}</h2>
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white">✕</button>
             </div>
             
             {/* Split Tabs */}
             {!selectedOrder.payments?.length ? (
               <div className="flex bg-neutral-900 border-b border-neutral-700">
                 <button type="button" onClick={() => setSplitMode('TOTAL')} className={`flex-1 p-3 text-sm font-bold ${splitMode === 'TOTAL' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500'}`}>Total</button>
                 <button type="button" onClick={() => setSplitMode('EQUAL_PARTS')} className={`flex-1 p-3 text-sm font-bold ${splitMode === 'EQUAL_PARTS' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500'}`}>En Partes</button>
                 <button type="button" onClick={() => setSplitMode('BY_PRODUCT')} className={`flex-1 p-3 text-sm font-bold ${splitMode === 'BY_PRODUCT' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500'}`}>Por Platos</button>
               </div>
             ) : (
               <div className="p-2 border-b border-neutral-700 bg-orange-500/10 text-center">
                 <span className="text-xs font-bold text-orange-400">Pago Parcial en curso - Solo Cobro Manual</span>
               </div>
             )}

             <div className="max-h-[65vh] overflow-y-auto hidden-scrollbar">
               <form onSubmit={handlePayment} className="p-5 space-y-6">
                  
                  {splitMode === 'EQUAL_PARTS' && (
                    <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-between">
                      <span className="text-neutral-400 font-medium text-sm">Dividir entre:</span>
                      <div className="flex items-center gap-3">
                         <button type="button" onClick={() => setSplitWays(Math.max(2, splitWays - 1))} className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold flex items-center justify-center transition-colors">-</button>
                         <span className="text-xl font-bold text-white w-6 text-center">{splitWays}</span>
                         <button type="button" onClick={() => setSplitWays(splitWays + 1)} className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold flex items-center justify-center transition-colors">+</button>
                      </div>
                    </div>
                  )}

                  {splitMode === 'BY_PRODUCT' && (
                     <div className="bg-neutral-800 border border-neutral-700 rounded-xl min-h-[100px] max-h-56 overflow-y-auto p-2 space-y-1">
                       <p className="text-xs text-neutral-400 px-2 py-1 uppercase tracking-wider font-bold">Selecciona qué vas a pagar:</p>
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
                            <div key={item.id} onClick={toggleSelection} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-neutral-700/50'}`}>
                               <div className="flex items-center gap-3">
                                 <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-neutral-500'}`}>
                                    {isSelected && <CheckCircle className="w-3 h-3" />}
                                 </div>
                                 <div className="text-left">
                                    <p className="text-sm font-bold text-white leading-tight">{item.product?.name}</p>
                                    <p className="text-xs text-primary font-bold mt-0.5">x{item.quantity}</p>
                                 </div>
                               </div>
                               <span className="font-mono text-sm font-medium text-neutral-300">{formatCurrency(item.subtotal)}</span>
                            </div>
                          )
                       })}
                     </div>
                  )}

                  <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 flex flex-col items-center justify-center">
                    <span className="text-neutral-400 text-sm font-medium mb-1">Monto a Cobrar</span>
                    <div className="relative w-full max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-neutral-500 font-mono">$</span>
                    <input 
                      type="text" 
                      required
                      value={paymentAmount}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        if (!rawValue) return setPaymentAmount('');
                        setPaymentAmount(Math.round(parseInt(rawValue, 10)).toLocaleString('de-DE'));
                      }}
                      className="w-full bg-transparent text-3xl font-bold text-center text-white font-mono py-2 border-b-2 border-primary focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-400">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                     <button type="button" onClick={() => setPaymentMethod('CASH')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-primary bg-primary/20 text-primary' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}>
                        <Banknote className="w-6 h-6 mb-1" />
                        <span className="text-xs font-bold">Efectivo</span>
                     </button>
                     <button type="button" onClick={() => setPaymentMethod('CARD')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-primary/20 text-primary' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}>
                        <CreditCard className="w-6 h-6 mb-1" />
                        <span className="text-xs font-bold">Tarjeta</span>
                     </button>
                     <button type="button" onClick={() => setPaymentMethod('TRANSFER')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'TRANSFER' ? 'border-primary bg-primary/20 text-primary' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}>
                        <Landmark className="w-6 h-6 mb-1" />
                        <span className="text-xs font-bold">Transf.</span>
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                   <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="py-3 rounded-xl bg-neutral-700 text-white font-bold hover:bg-neutral-600 transition-colors">
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
    </div>
  );
}
