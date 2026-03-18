import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    minStock: '5',
    categoryId: '',
    image: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodsRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? p.categoryId.toString() === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product = null) => {
    setCurrentProduct(product);
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        categoryId: product.categoryId,
        image: product.image || '',
        active: product.active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        minStock: '5',
        categoryId: categories.length > 0 ? categories[0].id : '',
        image: '',
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await api.put(`/products/${currentProduct.id}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas desactivar este producto?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Producto desactivado');
        fetchData();
      } catch (error) {
        toast.error('Error al desactivar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Catálogo de productos e inventario inicial</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Producto</th>
                  <th className="px-6 py-4 font-medium">Categoría</th>
                  <th className="px-6 py-4 font-medium">Precio</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{p.name}</p>
                          <p className="text-xs text-neutral-500 max-w-[200px] truncate">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.stock <= p.minStock ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        <span className={p.stock <= p.minStock ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {p.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!p.active && (
                        <span className="text-xs text-red-500 mr-2 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded">Inactivo</span>
                      )}
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="p-2 text-neutral-500 hover:text-primary dark:hover:text-primary transition-colors inline-block"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {p.active && (
                         <button 
                           onClick={() => handleDelete(p.id)}
                           className="p-2 text-neutral-500 hover:text-red-600 dark:hover:text-red-500 transition-colors inline-block"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-neutral-500">
                      No se encontraron productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">{currentProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nombre *</label>
                  <input
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Precio ($) *</label>
                  <input
                    type="number" step="0.01" min="0" required
                    value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoría *</label>
                  <select
                    required
                    value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="" disabled>Seleccione una...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Stock Inicial *</label>
                  <input
                    type="number" min="0" required
                    value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Stock Mínimo (Alerta) *</label>
                  <input
                    type="number" min="0" required
                    value={formData.minStock} onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">URL Imagen (Opcional)</label>
                  <input
                    type="url"
                    value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Descripción (Opcional)</label>
                  <textarea
                    rows={2}
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>

                {currentProduct && (
                   <div className="flex items-center gap-2 mt-2 md:col-span-2">
                    <input
                      type="checkbox"
                      id="active-check"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="w-4 h-4 text-primary bg-neutral-100 border-neutral-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="active-check" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Producto Activo (Visible en ventas)
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-700 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
