import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from './components/AdminHeader';
import AdminUsers from './AdminUsers';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminArticles from './AdminArticles';
import AdminReviews from './AdminReviews';
import ArticleEditor from './ArticleEditor';
import ProductEditor from './ProductEditor';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-loading">
        <div>Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h1>Доступ запрещен</h1>
        <p>У вас нет прав для доступа к административной панели.</p>
      </div>
    );
  }


  return (
    <div className="admin-panel">
      <Routes>
        <Route path="/articles/new" element={<ArticleEditor />} />
        <Route path="/articles/edit/:id" element={<ArticleEditor />} />
        <Route path="/products/new" element={<ProductEditor />} />
        <Route path="/products/edit/:id" element={<ProductEditor />} />
        <Route path="*" element={
          <>
            <AdminHeader />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<AdminProducts />} />
                <Route path="/products" element={<AdminProducts />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/orders" element={<AdminOrders />} />
                <Route path="/articles" element={<AdminArticles />} />
                <Route path="/reviews" element={<AdminReviews />} />
                <Route path="*" element={<Navigate to="/admin/products" replace />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  );
};

export default AdminPanel;
