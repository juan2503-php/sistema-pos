import { useState, useEffect } from 'react';
import { Search, Calendar, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const METHOD_NAMES = {
  CASH: 'EFECTIVO',
  CARD: 'TARJETA',
  TRANSFER: 'TRANSF.'
};

export default function Sales() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Recibo Individual
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [method, setMethod] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [dateFrom, dateTo, method]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments', {
        params: { from: dateFrom, to: dateTo, method }
      });
      setPayments(data);
    } catch (error) {
      toast.error('Error al cargar reporte de ventas');
    } finally {
      setLoading(false);
    }
  };

  const totalFiltered = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const exportToExcel = () => {
    if (payments.length === 0) return toast.error('No hay datos para exportar');
    const data = payments.map(p => ({
      'Fecha': new Date(p.createdAt).toLocaleDateString(),
      'Hora': new Date(p.createdAt).toLocaleTimeString(),
      'Ticket': `#${p.orderId.toString().padStart(5, '0')}`,
      'Mesa': `Mesa ${p.order.table.number}`,
      'Método': METHOD_NAMES[p.method] || p.method,
      'Monto': parseFloat(p.amount)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas");
    XLSX.writeFile(wb, "Reporte_Ventas.xlsx");
    toast.success('Excel exportado exitosamente');
  };

  const exportToPDF = () => {
    if (payments.length === 0) return toast.error('No hay datos para exportar');
    const doc = new jsPDF();
    doc.text('Reporte de Ventas', 14, 15);
    
    const tableColumn = ["Fecha", "Ticket", "Mesa", "Método", "Monto"];
    const tableRows = [];

    payments.forEach(p => {
      tableRows.push([
        formatDate(p.createdAt),
        `#${p.orderId.toString().padStart(5, '0')}`,
        `Mesa ${p.order.table.number}`,
        METHOD_NAMES[p.method] || p.method,
        formatCurrency(p.amount)
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save("Reporte_Ventas.pdf");
    toast.success('PDF exportado exitosamente');
  };

  const handleViewReceipt = async (orderId) => {
    setLoadingReceipt(true);
    setIsReceiptModalOpen(true);
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setSelectedOrder(data);
    } catch (error) {
      toast.error('Error al cargar la factura');
      setIsReceiptModalOpen(false);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const downloadReceiptPDF = () => {
    if (!selectedOrder) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('POS Restaurant', 105, 20, null, null, 'center');
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text('FACTURA DE VENTA', 105, 30, null, null, 'center');
    
    doc.setFontSize(11);
    doc.text(`Ticket/Orden: #${selectedOrder.id.toString().padStart(5, '0')}`, 14, 45);
    doc.text(`Fecha: ${formatDate(selectedOrder.createdAt)}`, 14, 52);
    doc.text(`Mesa: Mesa ${selectedOrder.table?.number}`, 14, 59);
    doc.text(`Atendido por: ${selectedOrder.user?.name}`, 14, 66);
    
    const tableColumn = ["Cant.", "Descripción", "P. Unit", "Subtotal"];
    const tableRows = selectedOrder.items.map(item => [
      item.quantity,
      item.product.name,
      formatCurrency(item.unitPrice),
      formatCurrency(item.subtotal)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    const finalY = doc.lastAutoTable.finalY || 75;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Pagado: ${formatCurrency(selectedOrder.total)}`, 14, finalY + 15);
    
    doc.save(`Factura_${selectedOrder.id.toString().padStart(5, '0')}.pdf`);
    toast.success('Factura descargada');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reporte de Ventas</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Historial de pagos y facturación</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Desde Fecha</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="date" 
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Hasta Fecha</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="date" 
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Método de Pago</label>
          <select 
            value={method} onChange={(e) => setMethod(e.target.value)}
            className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
          >
            <option value="">Todos los métodos</option>
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="TRANSFER">Transferencia</option>
          </select>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Total Periodo</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(totalFiltered)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Cargando reporte...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                  <th className="px-6 py-4 font-medium">Ticket / Orden</th>
                  <th className="px-6 py-4 font-medium">Mesa</th>
                  <th className="px-6 py-4 font-medium">Método</th>
                  <th className="px-6 py-4 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {payments.map((p) => (
                  <tr key={p.id} onClick={() => handleViewReceipt(p.orderId)} className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <span className="font-mono text-xs">#{p.orderId.toString().padStart(5, '0')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      Mesa {p.order.table.number}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        p.method === 'CASH' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' :
                        p.method === 'CARD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-500 text-purple-500'
                      }`}>
                        {METHOD_NAMES[p.method] || p.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-neutral-500">
                      No hay registros de ventas para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recibo Individual Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-700 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-center relative">
              <h2 className="text-xl font-bold dark:text-white">Detalle de Factura</h2>
              <button 
                onClick={() => setIsReceiptModalOpen(false)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingReceipt ? (
                <div className="text-center py-10 dark:text-neutral-400">Cargando datos de la factura...</div>
              ) : selectedOrder ? (
                <div className="space-y-6">
                  <div className="text-center border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-4">
                    <h3 className="text-2xl font-bold dark:text-white mb-1 tracking-tight">POS Restaurant</h3>
                    <p className="text-neutral-500 text-sm uppercase tracking-wider font-semibold">Recibo de Venta</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 text-sm dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                    <span className="text-neutral-500">Ticket No.:</span>
                    <span className="text-right font-mono font-bold text-lg dark:text-white">#{selectedOrder.id.toString().padStart(5, '0')}</span>
                    
                    <span className="text-neutral-500">Fecha:</span>
                    <span className="text-right font-medium">{formatDate(selectedOrder.createdAt)}</span>
                    
                    <span className="text-neutral-500">Mesa:</span>
                    <span className="text-right font-medium">Mesa {selectedOrder.table?.number}</span>
                    
                    <span className="text-neutral-500">Atendió:</span>
                    <span className="text-right font-medium">{selectedOrder.user?.name}</span>
                  </div>

                  <div className="pt-2">
                    <table className="w-full text-sm dark:text-neutral-300">
                      <thead>
                        <tr className="text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                          <th className="font-semibold text-left pb-2 w-12">Cant</th>
                          <th className="font-semibold text-left pb-2">Descripción</th>
                          <th className="font-semibold text-right pb-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map(item => (
                          <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800">
                            <td className="py-3 text-primary font-bold">x{item.quantity}</td>
                            <td className="py-3 font-medium">{item.product?.name}</td>
                            <td className="py-3 text-right font-mono text-neutral-600 dark:text-neutral-400">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-3 pb-1 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700 text-right text-xl font-bold dark:text-white flex justify-between items-center">
                    <span className="text-neutral-500 text-base uppercase font-semibold">Total Pagado</span>
                    <span className="font-mono text-3xl text-green-600 dark:text-green-500">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              ) : (
                 <div className="text-center py-10 text-red-500">Error al cargar la información. Intenta de nuevo.</div>
              )}
            </div>
            
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 grid grid-cols-2 gap-3">
               <button onClick={() => setIsReceiptModalOpen(false)} className="py-3 rounded-xl bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors shadow-sm">
                 Volver
               </button>
               <button onClick={downloadReceiptPDF} disabled={loadingReceipt || !selectedOrder} className="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-[0_4px_0_0_#991b1b] active:shadow-none active:translate-y-1 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed">
                  <Download className="w-5 h-5" /> Descargar PDF
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
