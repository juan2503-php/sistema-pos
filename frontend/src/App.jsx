import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';

// === Pages & Layouts ===
import Login from './pages/auth/Login';
import AdminLayout from './layouts/AdminLayout';
import WaiterLayout from './layouts/WaiterLayout';

// === Admin Pages ===
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Tables from './pages/admin/Tables';
import Users from './pages/admin/Users';
import Inventory from './pages/admin/Inventory';
import Sales from './pages/admin/Sales';

// === Waiter Pages ===
import TablesView from './pages/waiter/TablesView';
import NewOrder from './pages/waiter/NewOrder';
import EditOrder from './pages/waiter/EditOrder';
import ActiveOrders from './pages/waiter/ActiveOrders';

function App() {
  const { token, user } = useAuthStore();

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={
          !token ? <Navigate to="/login" /> :
          user?.role === 'ADMIN' ? <Navigate to="/admin" /> :
          <Navigate to="/waiter" />
        } />
        
        {/* Auth Route */}
        <Route path="/login" element={token ? (user?.role === 'ADMIN' ? <Navigate to="/admin" /> : <Navigate to="/waiter" />) : <Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="sales" element={<Sales />} />
          <Route path="tables" element={<Tables />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="users" element={<Users />} />
        </Route>

        {/* Waiter Routes */}
        <Route path="/waiter" element={<WaiterLayout />}>
          <Route index element={<TablesView />} />
          <Route path="new-order/:tableId" element={<NewOrder />} />
          <Route path="edit-order/:orderId" element={<EditOrder />} />
          <Route path="orders" element={<ActiveOrders />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
