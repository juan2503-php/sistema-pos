import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Minus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';

export default function EditOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Cart state: array of { product, quantity, notes }
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const [orderRes, catRes, prodRes] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get('/categories'),
        api.get('/products?active=true')
      ]);
      setTable(orderRes.data.table);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      if (catRes.data.length > 0) setActiveCategory(catRes.data[0].id);

      // Precargar carrito con los items existentes de la orden
      if (orderRes.data.items) {
        setCart(orderRes.data.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          notes: item.notes || ''
        })));
      }
    } catch (error) {
      toast.error('Error al cargar datos de la orden');
      navigate('/waiter/orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchTerm) return p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return p.categoryId === activeCategory;
    });
  }, [products, activeCategory, searchTerm]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      return toast.error(`¡${product.name} agotado!`);
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Solo hay ${product.stock} disponibles`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
    
    // Quick vibration feedback if supported
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta;
          if (newQ > item.product.stock) {
            toast.error(`Solo hay ${item.product.stock} disponibles`);
            return item;
          }
          if (newQ <= 0) return null; // Marked for deletion
          return { ...item, quantity: newQ };
        }
        return item;
      }).filter(Boolean); // Remove nulls
    });
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateNotes = (productId, notes) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, notes } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return toast.error('La orden está vacía');
    setSubmitting(true);

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes
        }))
      };

      await api.put(`/orders/${orderId}`, orderData);
      toast.success('Cambios guardados exitosamente');
      navigate('/waiter/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Error al guardar cambios');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando menú...</div>;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 overflow-hidden bg-neutral-900">
      {/* Left Pane: Categories & Products */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full border-b md:border-b-0 md:border-r border-neutral-700">
        <div className="p-4 bg-neutral-800 flex items-center gap-4">
          <button 
            onClick={() => navigate('/waiter')}
            className="p-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white leading-tight">Mesa {table?.number}</h1>
            <p className="text-sm text-neutral-400">Mesero: {user?.name}</p>
          </div>
          
          <div className="relative flex-1 max-w-[200px] hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        {!searchTerm && (
          <div className="bg-neutral-800 border-b border-neutral-700 px-2 py-3 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white shadow-lg scale-105' 
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-900">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const inCartCount = cart.find(item => item.product.id === product.id)?.quantity || 0;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                  className={`
                    relative flex flex-col p-3 rounded-xl border text-left transition-transform active:scale-95 bg-neutral-800
                    ${isOutOfStock ? 'opacity-50 border-neutral-700 cursor-not-allowed' : 'border-neutral-700 hover:border-primary shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'}
                  `}
                >
                  {inCartCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg pointer-events-none z-10">
                      {inCartCount}
                    </div>
                  )}

                  {product.image ? (
                    <div className="w-full h-24 mb-3 rounded-lg overflow-hidden relative">
                       <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                       {isOutOfStock && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-red-500 bg-red-900/40 rounded backdrop-blur-[2px]">AGOTADO</div>}
                    </div>
                  ) : (
                    <div className="w-full h-12">
                       {isOutOfStock && <div className="absolute inset-x-0 top-0 h-10 w-full flex items-center justify-center font-bold text-red-500 bg-red-900/20 rounded">AGOTADO</div>}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm uppercase leading-tight mt-1 ${inCartCount > 0 ? 'text-primary' : 'text-white'}`}>
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-2 w-full flex justify-between items-end">
                    <p className="font-bold text-lg text-white font-mono">{formatCurrency(product.price)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-neutral-500">
              No hay productos disponibles.
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Current Order (Cart) */}
      <div className="w-full md:w-[380px] lg:w-[450px] bg-neutral-800 flex flex-col h-1/2 md:h-full z-20 shadow-[-5px_0_20px_rgba(0,0,0,0.2)] border-t md:border-t-0 border-neutral-700 min-h-0">
        <div className="p-4 bg-neutral-900 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-white">Detalle de Orden</h2>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-50 space-y-4">
               {/* Cart Icon SVG placeholder */}
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <p>Toque productos para agregar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="bg-neutral-900 rounded-xl p-3 border border-neutral-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-sm leading-tight pr-4">{item.product.name}</h4>
                  <p className="font-mono text-primary font-bold">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 rounded-md bg-neutral-700 flex items-center justify-center text-white active:bg-neutral-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-lg text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white active:bg-primary/80"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Notas Switcher (optional UX enhancement) */}
                <input 
                  type="text" 
                  placeholder="Sin cebolla, extra salsa..."
                  value={item.notes}
                  onChange={(e) => updateNotes(item.product.id, e.target.value)}
                  className="w-full mt-3 bg-neutral-800 text-xs text-white p-2 rounded border border-neutral-700 focus:outline-none focus:border-neutral-500"
                />
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-700 space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-end">
            <span className="text-neutral-400 font-medium">Total</span>
            <span className="text-3xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
          </div>
          
          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || submitting}
            className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg shadow-[0_4px_0_0_#9a3412] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {submitting ? 'Guardando...' : (
              <>
                Guardar Cambios <Send className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
