import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import Login from './pages/Login';

// Sales Mobile Pages
import SalesHome from './pages/sales/SalesHome';
import Attendance from './pages/sales/Attendance';
import RouteSchedule from './pages/sales/RouteSchedule';
import CustomerList from './pages/sales/CustomerList';
import VisitCheckIn from './pages/sales/VisitCheckIn';
import OrderCapture from './pages/sales/OrderCapture';
import VanStock from './pages/sales/VanStock';
import PromoCatalog from './pages/sales/PromoCatalog';
import SalesAllowances from './pages/sales/SalesAllowances';

// Admin / Supervisor Pages
import Dashboard from './pages/admin/Dashboard';
import LiveTracking from './pages/admin/LiveTracking';
import TerritoryRoutes from './pages/admin/TerritoryRoutes';
import OrdersApproval from './pages/admin/OrdersApproval';
import SalesReports from './pages/admin/SalesReports';
import AccountingFinance from './pages/admin/AccountingFinance';
import Customers from './pages/admin/Customers';
import Products from './pages/admin/Products';
import VanStockManagement from './pages/admin/VanStockManagement';
import Promotions from './pages/admin/Promotions';
import AttendanceMonitor from './pages/admin/AttendanceMonitor';
import UsersManagement from './pages/admin/UsersManagement';
import OperationalAllowancesAdmin from './pages/admin/OperationalAllowances';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';

// Route Guards
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('alsyifa_token');
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || 'null');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    return <Navigate to={user.role === 'admin' || user.role === 'supervisor' ? '/admin' : '/sales'} replace />;
  }

  return children;
}

function DefaultRedirect() {
  const token = localStorage.getItem('alsyifa_token');
  const user = JSON.parse(localStorage.getItem('alsyifa_user') || 'null');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'owner') {
    return <Navigate to="/owner" replace />;
  }

  if (user.role === 'admin' || user.role === 'supervisor') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/sales" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Sales Mobile-First Routes */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <SalesHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/absensi"
          element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/rute"
          element={
            <ProtectedRoute>
              <RouteSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/customers"
          element={
            <ProtectedRoute>
              <CustomerList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/visit/:customerId"
          element={
            <ProtectedRoute>
              <VisitCheckIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/order"
          element={
            <ProtectedRoute>
              <OrderCapture />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/van-stock"
          element={
            <ProtectedRoute>
              <VanStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/promo"
          element={
            <ProtectedRoute>
              <PromoCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/tunjangan"
          element={
            <ProtectedRoute>
              <SalesAllowances />
            </ProtectedRoute>
          }
        />

        {/* Admin & Supervisor Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tracking"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <LiveTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/routes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <TerritoryRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <OrdersApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <SalesReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounting"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <AccountingFinance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/van-stocks"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <VanStockManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/promotions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <Promotions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <AttendanceMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <UsersManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/allowances"
          element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor', 'owner']}>
              <OperationalAllowancesAdmin />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Owner Route */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback Redirect */}
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
