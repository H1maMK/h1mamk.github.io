import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { buildAssetUrl } from '../../config/api';

const PROTECTED_ADMIN_EMAIL = 'mr.maxim.8806@mail.ru';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const isAllowedImageFile = (file) => {
  const extension = file?.name?.split('.').pop()?.toLowerCase();
  return Boolean(file && ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension));
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles] = useState([
    { id: 'user', name: 'Пользователь' },
    { id: 'admin', name: 'Администратор' }
  ]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    avatar: null
  });

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    return buildAssetUrl(avatarPath);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getCurrentUserId = () => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return null;

      const parsedUser = JSON.parse(rawUser);
      return parsedUser?.id || parsedUser?._id || null;
    } catch {
      return null;
    }
  };

  const getCurrentUserEmail = () => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return null;

      const parsedUser = JSON.parse(rawUser);
      return parsedUser?.email || null;
    } catch {
      return null;
    }
  };

  const isProtectedAdmin = (user) => user?.email?.toLowerCase() === PROTECTED_ADMIN_EMAIL;

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      } else {
        console.error('Error fetching users:', data.message);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar') {
      const file = files?.[0];
      if (file && !isAllowedImageFile(file)) {
        toast.error('Можно загружать только изображения: JPG, PNG или WEBP');
        e.target.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, avatar: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        if (isProtectedAdmin(editingUser) && formData.role !== 'admin') {
          toast.error('Этому администратору нельзя сменить роль');
          return;
        }

        // Обновление пользователя
        const response = await fetch(`/api/admin/users/${editingUser._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            role: formData.role,
            ...(formData.password && { password: formData.password })
          })
        });

        const data = await response.json();

        if (data.success) {
          // Если есть новый аватар, загружаем его отдельно для этого пользователя
          if (formData.avatar) {
            const avatarFormData = new FormData();
            avatarFormData.append('avatar', formData.avatar);

            const avatarResponse = await fetch(`/api/admin/users/${editingUser._id}/avatar`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: avatarFormData
            });

            const avatarData = await avatarResponse.json();
            if (!avatarData.success) {
              console.error('Error uploading avatar:', avatarData.message);
            }
          }

          resetForm();
          fetchUsers();
          toast.success('Пользователь обновлён!');
        } else {
          toast.error(data.message || 'Ошибка при сохранении пользователя');
        }
      } else {
        // Создание нового пользователя (пока не реализовано в API)
        toast.error('Создание пользователей пока не поддерживается');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Ошибка при сохранении пользователя');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      avatar: null
    });
  };

  const handleToggleBlock = async (user) => {
    const isCurrentUser = user._id === getCurrentUserId();

    if ((isCurrentUser || isProtectedAdmin(user)) && !user.isBlocked) {
      toast.error('Нельзя заблокировать этот аккаунт администратора');
      return;
    }

    const actionText = user.isBlocked ? 'разблокировать' : 'заблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${actionText} этого пользователя?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user._id}/block`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isBlocked: !user.isBlocked
        })
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        toast.success(user.isBlocked ? 'Пользователь разблокирован!' : 'Пользователь заблокирован!');
      } else {
        toast.error(data.message || 'Ошибка при изменении статуса пользователя');
      }
    } catch (error) {
      console.error('Error toggling user block status:', error);
      toast.error('Ошибка при изменении статуса пользователя');
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user',
      avatar: null
    });
  };

  if (loading) {
    return <div className="admin-loading">Загрузка пользователей...</div>;
  }

  return (
    <div className="content-wrapper">
      <div className="table-container">
        <h2>Список пользователей</h2>
        <table className="admin-table users-table">
          <thead>
            <tr>
              <th>Имя пользователя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-name-cell">
                    {user.profile?.avatar && (
                      <img 
                        src={getAvatarUrl(user.profile.avatar)} 
                        alt="" 
                        className="product-image-thumbnail" 
                      />
                    )}
                    <span>{user.username}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  {user.isBlocked ? ' (заблокирован)' : ''}
                </td>
                <td>
                  <button 
                    className="action-button edit-button"
                    onClick={() => handleEdit(user)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className={`action-button ${user.isBlocked ? 'unblock-button' : 'block-button'}`}
                    onClick={() => handleToggleBlock(user)}
                  >
                    {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-container">
        <h2>{editingUser ? 'Редактировать пользователя' : 'Добавить нового пользователя'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Имя пользователя:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Пароль {editingUser && '(оставьте пустым, чтобы не менять):'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editingUser}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Роль:</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              disabled={isProtectedAdmin(editingUser) || editingUser?._id === getCurrentUserId() || getCurrentUserEmail() === PROTECTED_ADMIN_EMAIL && isProtectedAdmin(editingUser)}
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Аватар:</label>
            <input
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
            />
            {editingUser?.profile?.avatar && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={getAvatarUrl(editingUser.profile.avatar)} 
                  alt="Current avatar" 
                  style={{ width: '50px', height: '50px', borderRadius: '4px' }}
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="action-button save-button">
              Сохранить
            </button>
            <button 
              type="button" 
              className="action-button cancel-button"
              onClick={resetForm}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUsers;
