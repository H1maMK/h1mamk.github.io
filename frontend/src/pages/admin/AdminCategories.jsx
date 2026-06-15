import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { buildApiUrl, buildAssetUrl } from '../../config/api';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

const isAllowedImageFile = (file) => {
  const extension = file?.name?.split('.').pop()?.toLowerCase();
  return Boolean(file && ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension));
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    deviceType: 'Игровое',
    description: '',
    image: null
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/products/categories'));
      
      const data = await response.json();
      
      if (data.success) {
        // API возвращает { categories: [...] }
        const categoriesList = data.data?.categories || data.data || [];
        setCategories(Array.isArray(categoriesList) ? categoriesList : []);
      } else {
        console.error('Error fetching categories:', data.message);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files?.[0];
      if (file && !isAllowedImageFile(file)) {
        toast.error('Можно загружать только изображения: JPG, PNG, WEBP, GIF или SVG');
        e.target.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('deviceType', formData.deviceType);
      formDataToSend.append('description', formData.description);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = editingCategory 
        ? buildApiUrl(`/api/admin/categories/${editingCategory._id}`)
        : buildApiUrl('/api/admin/categories');
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        fetchCategories();
        alert(editingCategory ? 'Категория обновлена!' : 'Категория создана!');
      } else {
        alert(data.message || 'Ошибка при сохранении категории');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Ошибка при сохранении категории');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      deviceType: category.deviceType,
      description: category.description || '',
      image: null
    });
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/admin/categories/${categoryId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchCategories();
        alert('Категория удалена!');
      } else {
        alert(data.message || 'Ошибка при удалении категории');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Ошибка при удалении категории');
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      deviceType: 'Игровое',
      description: '',
      image: null
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return buildAssetUrl(imagePath);
  };

  if (loading) {
    return <div className="admin-loading">Загрузка категорий...</div>;
  }

  return (
    <div className="content-wrapper">
      <div className="table-container">
        <h2>Категории</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Изображение</th>
              <th>Название</th>
              <th>Тип устройства</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td>
                  {category.image ? (
                    <img 
                      src={getImageUrl(category.image)} 
                      alt="" 
                      className="product-image-thumbnail" 
                    />
                  ) : (
                    <span style={{ color: '#888' }}>Нет</span>
                  )}
                </td>
                <td>{category.name}</td>
                <td>{category.deviceType}</td>
                <td>
                  <button 
                    className="action-button edit-button"
                    onClick={() => handleEdit(category)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="action-button delete-button"
                    onClick={() => handleDelete(category._id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-container">
        <h2>{editingCategory ? 'Редактировать категорию' : 'Добавить новую категорию'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Название:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Например: Мыши"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deviceType">Тип устройства:</label>
            <select
              id="deviceType"
              name="deviceType"
              value={formData.deviceType}
              onChange={handleInputChange}
              required
            >
              <option value="Игровое">Игровое</option>
              <option value="Офисное">Офисное</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Краткое описание категории"
            />
          </div>

          <div className="form-group">
            <label>Изображение:</label>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={handleInputChange}
            />
            {editingCategory?.image && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={getImageUrl(editingCategory.image)} 
                  alt="Current" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <span style={{ marginLeft: '10px', color: '#888', fontSize: '12px' }}>
                  Текущее изображение
                </span>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="action-button save-button">
              {editingCategory ? 'Обновить' : 'Создать'}
            </button>
            {editingCategory && (
              <button 
                type="button" 
                className="action-button cancel-button"
                onClick={resetForm}
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCategories;
