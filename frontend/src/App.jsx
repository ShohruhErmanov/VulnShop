import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import { Login, Register } from './pages/Auth';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import LabDashboard from './pages/lab/LabDashboard';
import LabModule from './pages/lab/LabModule';
import Instructor from './pages/lab/Instructor';

const P = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route index element={<Catalog />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="users/:id" element={<PublicProfile />} />
        <Route path="cart" element={P(<Cart />)} />
        <Route path="orders" element={P(<Orders />)} />
        <Route path="orders/:id" element={P(<OrderDetail />)} />
        <Route path="profile" element={P(<Profile />)} />
        {/* Admin pages require login only; the API decides authorization (Broken Access Control lab). */}
        <Route path="admin" element={P(<AdminDashboard />)} />
        <Route path="admin/products" element={P(<AdminProducts />)} />
        <Route path="admin/orders" element={P(<AdminOrders />)} />
        <Route path="admin/users" element={P(<AdminUsers />)} />
        <Route path="admin/settings" element={P(<AdminSettings />)} />
        <Route path="lab" element={P(<LabDashboard />)} />
        <Route path="lab/instructor" element={P(<Instructor />)} />
        <Route path="lab/:id" element={P(<LabModule />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
