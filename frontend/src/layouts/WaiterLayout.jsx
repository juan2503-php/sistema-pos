import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { User, LogOut, Grid, ClipboardList } from 'lucide-react';

export default function WaiterLayout() {
  const { user, token, logout } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admins are generally allowed anywhere, but keeping it strict to Waiters/Admins
  if (user?.role !== 'WAITER' && user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const isNewOrderView = location.pathname.includes('/new-order/');

  return (
    <div className="h-screen h-[100dvh] bg-neutral-900 flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar - Waiters need max screen space for table maps/orders */}
      {!isNewOrderView && (
        <header className="bg-neutral-800 border-b border-neutral-700 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-lg">
                P
              </span>
              <span className="hidden sm:inline-block">POS<span className="text-white">System</span></span>
            </div>

            <nav className="flex gap-1 ml-4">
              <Link 
                to="/waiter" 
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${location.pathname === '/waiter' ? 'bg-primary/20 text-primary' : 'text-neutral-400 hover:text-white hover:bg-neutral-700'}`}
              >
                <Grid className="w-5 h-5" />
                <span className="hidden sm:inline">Mesas</span>
              </Link>
              <Link 
                to="/waiter/orders" 
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${location.pathname === '/waiter/orders' ? 'bg-primary/20 text-primary' : 'text-neutral-400 hover:text-white hover:bg-neutral-700'}`}
              >
                <ClipboardList className="w-5 h-5" />
                <span className="hidden sm:inline">Pedidos</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-700/50 px-3 py-1.5 rounded-full border border-neutral-600">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">{user.name}</span>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}
