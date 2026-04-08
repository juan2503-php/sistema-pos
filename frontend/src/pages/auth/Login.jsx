import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail, Store } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token, data.refreshToken);
      
      toast.success(`Bienvenido, ${data.user.name}`);
      
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/waiter');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-800 rounded-2xl shadow-xl overflow-hidden border border-neutral-700">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
              <Store size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Ace Dev Solutions</h1>
            <p className="text-neutral-400 mt-2">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-700 rounded-xl leading-5 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="admin@pos.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-700 rounded-xl leading-5 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'Ingresar al sistema'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-8 text-center text-sm text-neutral-500">
              <p>Demo (solo desarrollo):</p>
              <p>Admin: admin@pos.com / Admin2026!Secure</p>
              <p>Mesero: mesero@pos.com / Mesero2026!Secure</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
