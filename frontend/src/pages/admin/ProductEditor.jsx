import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ProductEditor.css';

const SPECIFICATION_TEMPLATES = {
  default: {
    'Основные характеристики': {
      'Назначение': ['Игровое', 'Офисное', 'Универсальное'],
      'Подключение': ['Проводное', 'Беспроводное', 'Комбинированное'],
      'Цвет': ['Чёрный', 'Белый', 'Серый', 'Красный', 'Синий']
    }
  },
  'микрофон': {
    'Общие': {
      'Цвет': ['Чёрный', 'Белый', 'Серый', 'Красный', 'Синий'],
      'Тип': ['Конденсаторный', 'Динамический', 'Электретный'],
      'Направленность': ['Кардиоидная', 'Всенаправленная', 'Двунаправленная', 'Суперкардиоидная'],
      'Частотный диапазон': ['20 Гц - 20 кГц', '30 Гц - 18 кГц', '50 Гц - 16 кГц', '70 Гц - 15 кГц'],
      'Чувствительность': ['-30 дБ', '-34 дБ', '-38 дБ', '-42 дБ', '-45 дБ'],
      'Импеданс': ['16 Ом', '32 Ом', '100 Ом', '150 Ом', '200 Ом'],
      'Макс. SPL': ['110 дБ', '120 дБ', '130 дБ', '140 дБ'],
      'Размеры': ['Компактный', 'Средний', 'Крупный'],
      'Вес': ['До 200 г', '200-400 г', '400-700 г', 'Более 700 г']
    },
    '- Plug-and-play': {
      '*Примечание': ['Не требует драйверов', 'Требуется ПО производителя', 'Совместим с OBS / Discord / Teams']
    }
  },
  'наушник': {
    'Общие': {
      'Цвет': ['Чёрный', 'Белый', 'Серый', 'Красный', 'Синий', 'Розовый'],
      'Тип': ['Полноразмерные', 'Накладные', 'Внутриканальные', 'Вкладыши'],
      'Вес': ['До 100 г', '100-200 г', '200-300 г', '300-400 г', 'Более 400 г'],
      'Длина кабеля': ['Нет', '1.2 м', '1.5 м', '1.8 м', '2 м', '3 м'],
      'Микрофон': ['Есть', 'Нет', 'Съёмный', 'Выдвижной', 'На кабеле'],
      'Драйверы': ['30 мм', '40 мм', '50 мм', '53 мм'],
      'Частотный диапазон': ['20 Гц - 20 кГц', '15 Гц - 25 кГц', '10 Гц - 40 кГц'],
      'Импеданс': ['16 Ом', '32 Ом', '64 Ом', '80 Ом'],
      'Чувствительность': ['90 дБ', '96 дБ', '100 дБ', '105 дБ', '110 дБ']
    },
    '- Инструмент для настройки Blue VO!CE': {
      '- Поддержка DTS Headphone': ['Нет', 'DTS Headphone:X', 'DTS Headphone:X 2.0']
    },
    '- Совместимость с ПК/PS4/PS5/Xbox (USB)': {
      '- Ресурс драйверов': ['Не указан', 'До 10000 часов', 'До 20000 часов', 'До 50000 часов'],
      '*Примечание': ['Plug-and-play', 'Требуется ПО производителя', 'Совместимость зависит от подключения']
    }
  },
  'мыш': {
    'Общие': {
      'Цвет': ['Чёрный', 'Белый', 'Серый', 'Красный', 'Синий', 'Розовый'],
      'Подсветка': ['Нет', 'RGB', 'Одноцветная'],
      'Питание': ['От USB', 'Аккумулятор', 'Батарейка AA', 'Батарейка AAA'],
      'Тип': ['Игровая', 'Офисная', 'Универсальная'],
      'Вес': ['До 60 г', '60-80 г', '80-100 г', '100-120 г', 'Более 120 г'],
      'Размеры': ['Компактная', 'Средняя', 'Крупная']
    },
    'Сенсор': {
      'Сенсор': ['Оптический', 'Лазерный'],
      'Частота опроса': ['125 Гц', '500 Гц', '1000 Гц', '2000 Гц', '4000 Гц', '8000 Гц']
    },
    'Автономность': {
      'Автономность': ['Нет', 'До 30 часов', 'До 50 часов', 'До 70 часов', 'До 100 часов', 'Более 100 часов']
    },
    'Кнопки': {
      'Кнопки': ['3', '5', '6', '7', '8', '9', '12']
    },
    'Гарантия': {
      'Гарантия': ['6 месяцев', '12 месяцев', '24 месяца', '36 месяцев']
    },
    '- Двойное соединение (Nordic MCU + BLE)': {
      '- Совместимость': ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Windows / macOS / Linux']
    }
  },
  'клавиатур': {
    'Общие': {
      'Цвет': ['Чёрный', 'Белый', 'Серый', 'Красный', 'Синий', 'Розовый'],
      'Подсветка': ['Нет', 'RGB', 'Одноцветная'],
      'Питание': ['От USB', 'Аккумулятор', 'Батарейка AA', 'Батарейка AAA'],
      'Тип': ['Механическая', 'Мембранная', 'Ножничная', 'Оптико-механическая'],
      'Вес': ['До 500 г', '500-800 г', '800-1000 г', '1000-1200 г', 'Более 1200 г'],
      'Размеры': ['60%', '65%', '75%', 'TKL', '100%', 'Компактная', 'Полноразмерная'],
      'Тип клавиш': ['Высокопрофильные', 'Низкопрофильные', 'Островные'],
      'Раскладка': ['ANSI', 'ISO', 'JIS', 'RU/EN'],
      'Приемник': ['Нет', 'USB-A', 'USB-C', '2.4 ГГц', 'Bluetooth'],
      'Дальность': ['До 5 м', 'До 10 м', 'До 15 м'],
      'Гарантия': ['6 месяцев', '12 месяцев', '24 месяца', '36 месяцев']
    },
    '- Шумоподавление (уровень <30дБ)': {
      '- Совместимость': ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Windows / macOS / Linux']
    }
  },
  'веб-камер': {
    'Общие': {
      'Цвет': ['Чёрный', 'Белый', 'Серый'],
      'Тип': ['Веб-камера', 'PTZ-камера', 'Стриминговая камера'],
      'Разрешение': ['HD 720p', 'Full HD 1080p', '2K QHD', '4K UHD'],
      'Сенсор': ['CMOS', 'Exmor CMOS', 'STARVIS CMOS'],
      'Диафрагма': ['f/1.8', 'f/2.0', 'f/2.2', 'f/2.4', 'f/2.8'],
      'Фокусировка': ['Фиксированная', 'Автофокус', 'Ручная', 'Автофокус / ручная'],
      'Угол обзора': ['60°', '70°', '78°', '90°', '120°'],
      'Микрофон': ['Есть', 'Нет', 'Стерео', 'С шумоподавлением'],
      'Крепление': ['Клипса', 'Штатив 1/4"', 'Клипса / штатив', 'Магнитное'],
      'Длина кабеля': ['1 м', '1.5 м', '1.8 м', '2 м', '3 м'],
      'Вес': ['До 100 г', '100-200 г', '200-400 г', 'Более 400 г']
    }
  },
  'монитор': {
    'Общие': {
      'Цвет': ['Чёрный', 'Белый', 'Серый'],
      'Тип': ['Игровой', 'Офисный', 'Профессиональный', 'Универсальный'],
      'Разрешение': ['HD', 'Full HD', '2K QHD', '4K UHD', 'UltraWide', 'Dual QHD'],
      'Частота обновления': ['60 Гц', '75 Гц', '100 Гц', '144 Гц', '165 Гц', '180 Гц', '240 Гц', '360 Гц'],
      'Время отклика': ['1 мс', '2 мс', '4 мс', '5 мс'],
      'Яркость': ['250 кд/м²', '300 кд/м²', '350 кд/м²', '400 кд/м²', '600 кд/м²'],
      'Контрастность': ['1000:1', '3000:1', '4000:1', '1000000:1'],
      'Углы обзора': ['160°/160°', '170°/170°', '178°/178°'],
      'Поддержка HDR': ['Нет', 'HDR10', 'DisplayHDR 400', 'DisplayHDR 600', 'DisplayHDR 1000']
    },
    '- 3.5mm аудиовыход': {
      '- Регулировка': ['Нет', 'Наклон', 'Наклон / высота', 'Наклон / поворот / высота']
    },
    '- Чехол для транспортировки': {
      '**Совместимость**': ['Windows', 'macOS', 'Linux', 'Windows / macOS / Linux', 'Игровые консоли']
    }
  }
};

const ProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    deviceType: '',
    category: '',
    description: '',
    specifications: {},
    isWeeklySpecial: false,
    images: [null, null, null]
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [weeklySpecials, setWeeklySpecials] = useState([]);
  const [weeklyLimitModalOpen, setWeeklyLimitModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchWeeklySpecials();
  }, []);

  useEffect(() => {
    if (id && categories.length > 0) {
      fetchProduct();
    }
  }, [id, categories]);

  const fetchWeeklySpecials = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/products?limit=500', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setWeeklySpecials(data.data.filter(product => product.isWeeklySpecial));
      }
    } catch (error) {
      console.error('Error fetching weekly specials:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/products/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success && data.data?.categories) {
        const formattedCategories = data.data.categories.map(cat => ({
          _id: cat._id || cat.id,
          name: cat.name,
          deviceType: cat.deviceType || cat.device_type
        }));
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/products/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        const product = data.data.product || data.data;
        const productCategoryId = product.category?._id || product.category || '';
        const productCategory = product.category && typeof product.category === 'object'
          ? product.category
          : categories.find(cat => cat._id === productCategoryId);

        setFormData({
          name: product.name || '',
          price: product.price?.toString() || '',
          stock: product.stock?.toString() || '',
          deviceType: productCategory?.deviceType || productCategory?.device_type || '',
          category: productCategoryId,
          description: product.description || '',
          specifications: product.specifications || {},
          isWeeklySpecial: product.isWeeklySpecial || false,
          images: [null, null, null]
        });
        setExistingImages(product.images || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Ошибка загрузки товара');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name.startsWith('image-')) {
      const index = parseInt(name.split('-')[1], 10);
      setImageAtIndex(index, files?.[0]);
    } else if (type === 'checkbox') {
      if (name === 'isWeeklySpecial' && checked) {
        handleWeeklySpecialToggle();
        return;
      }

      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleWeeklySpecialToggle = () => {
    const selectedWeeklySpecials = weeklySpecials.filter(product => product._id !== id);

    if (selectedWeeklySpecials.length < 4) {
      setFormData(prev => ({ ...prev, isWeeklySpecial: true }));
      return;
    }

    setWeeklyLimitModalOpen(true);
  };

  const setImageAtIndex = (index, file) => {
    if (!file) return false;

    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return false;
    }

    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = file;
      return { ...prev, images: newImages };
    });

    return true;
  };

  const createImageFileFromBlob = (blob) => {
    const mimeType = blob.type || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';

    return new File([blob], `clipboard-${Date.now()}.${extension}`, {
      type: mimeType,
      lastModified: Date.now()
    });
  };

  const handlePasteImage = (index, event) => {
    event.preventDefault();
    event.stopPropagation();

    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));

    if (!imageItem) {
      toast.error('В буфере обмена нет изображения');
      return;
    }

    const pastedFile = imageItem.getAsFile();
    if (!pastedFile) {
      toast.error('Не удалось вставить изображение');
      return;
    }

    const file = createImageFileFromBlob(pastedFile);
    if (setImageAtIndex(index, file)) {
      toast.success('Изображение вставлено');
    }
  };

  const pasteImageFromClipboard = async (index) => {
    if (!navigator?.clipboard?.read) {
      toast.error('Кнопка вставки не поддерживается. Используйте Ctrl+V в карточке');
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find((type) => type.startsWith('image/'));
        if (!imageType) continue;

        const blob = await clipboardItem.getType(imageType);
        const file = createImageFileFromBlob(blob);

        if (setImageAtIndex(index, file)) {
          toast.success('Изображение вставлено из буфера');
        }
        return;
      }

      toast.error('В буфере обмена нет изображения');
    } catch (error) {
      console.error('Paste from clipboard error:', error);
      toast.error('Не удалось вставить изображение. Разрешите доступ к буферу или используйте Ctrl+V');
    }
  };

  const handleDeviceTypeChange = (e) => {
    const deviceType = e.target.value;
    setFormData(prev => ({ ...prev, deviceType, category: '', specifications: {} }));
  };

  const getTemplateForCategory = (categoryId = formData.category) => {
    const category = categories.find(cat => cat._id === categoryId);
    const categoryName = category?.name?.toLowerCase() || '';
    const templateKey = Object.keys(SPECIFICATION_TEMPLATES).find(key => key !== 'default' && categoryName.includes(key));
    return SPECIFICATION_TEMPLATES[templateKey] || SPECIFICATION_TEMPLATES.default;
  };

  const buildSpecsFromTemplate = (template, currentSpecs = {}) => {
    const nextSpecs = { ...currentSpecs };

    Object.entries(template).forEach(([sectionName, fields]) => {
      nextSpecs[sectionName] = { ...(nextSpecs[sectionName] || {}) };

      Object.entries(fields).forEach(([fieldName, options]) => {
        if (!nextSpecs[sectionName][fieldName]) {
          nextSpecs[sectionName][fieldName] = options[0] || '';
        }
      });
    });

    return nextSpecs;
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const template = getTemplateForCategory(category);

    setFormData(prev => ({
      ...prev,
      category,
      specifications: category ? buildSpecsFromTemplate(template, prev.specifications) : prev.specifications
    }));
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => cat.deviceType === formData.deviceType);
  };

  // Функции для работы с характеристиками
  const addSection = () => {
    if (!newSectionName.trim()) return;
    const specs = { ...formData.specifications };
    if (!specs[newSectionName]) {
      specs[newSectionName] = {};
      setFormData(prev => ({ ...prev, specifications: specs }));
    }
    setNewSectionName('');
  };

  const removeSection = (sectionName) => {
    const specs = { ...formData.specifications };
    delete specs[sectionName];
    setFormData(prev => ({ ...prev, specifications: specs }));
  };

  const addField = (sectionName) => {
    if (!newFieldName.trim() || !newValue.trim()) return;
    const specs = { ...formData.specifications };
    if (!specs[sectionName]) {
      specs[sectionName] = {};
    }
    specs[sectionName][newFieldName] = newValue;
    setFormData(prev => ({ ...prev, specifications: specs }));
    setNewFieldName('');
    setNewValue('');
  };

  const updateFieldValue = (sectionName, fieldName, value) => {
    const specs = { ...formData.specifications };
    if (specs[sectionName]) {
      specs[sectionName][fieldName] = value;
      setFormData(prev => ({ ...prev, specifications: specs }));
    }
  };

  const validateCustomSpecValue = (rawValue, fieldName) => {
    const value = rawValue.trim().replace(/\s+/g, ' ');

    if (!value) {
      toast.error(`Поле «${fieldName}» не может быть пустым`);
      return null;
    }

    if (value.length < 2) {
      toast.error(`Значение поля «${fieldName}» должно быть не короче 2 символов`);
      return null;
    }

    if (value.length > 60) {
      toast.error(`Значение поля «${fieldName}» не должно превышать 60 символов`);
      return null;
    }

    if (/__/.test(value)) {
      toast.error('Значение не должно содержать служебные символы «__»');
      return null;
    }

    if (/[<>`{}[\]\\]/.test(value)) {
      toast.error('Значение содержит недопустимые символы: < > ` { } [ ] \\');
      return null;
    }

    if (!/^[а-яёa-z0-9\s.,:+\-/()%№"'°×²³]+$/iu.test(value)) {
      toast.error('Используйте только буквы, цифры и безопасные знаки пунктуации');
      return null;
    }

    return value;
  };

  const handleTemplateFieldChange = (sectionName, fieldName, value) => {
    if (value === '__custom__') {
      const customValue = window.prompt(`Введите своё значение для поля «${fieldName}»`);

      if (customValue === null) {
        return;
      }

      const validatedValue = validateCustomSpecValue(customValue, fieldName);
      if (!validatedValue) {
        return;
      }

      updateFieldValue(sectionName, fieldName, validatedValue);
      return;
    }

    if (value === '__current_custom__') {
      return;
    }

    updateFieldValue(sectionName, fieldName, value);
  };

  const removeField = (sectionName, fieldName) => {
    const specs = { ...formData.specifications };
    if (specs[sectionName]) {
      delete specs[sectionName][fieldName];
      if (Object.keys(specs[sectionName]).length === 0) {
        delete specs[sectionName];
      }
      setFormData(prev => ({ ...prev, specifications: specs }));
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Введите название товара');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Введите корректную цену');
      return;
    }
    if (formData.stock && parseInt(formData.stock, 10) < 0) {
      toast.error('Количество товара не может быть отрицательным');
      return;
    }
    if (!formData.category) {
      toast.error('Выберите категорию');
      return;
    }
    if (!existingImages.some(Boolean) && !formData.images.some(Boolean)) {
      toast.error('Загрузите изображения товара');
      return;
    }

    const selectedWeeklySpecials = weeklySpecials.filter(product => product._id !== id);
    if (formData.isWeeklySpecial && selectedWeeklySpecials.length >= 4) {
      toast.error('Нельзя сохранить больше 4 товаров недели. Сначала снимите отметку с другого товара.');
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('stock', formData.stock || '0');
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('specifications', JSON.stringify(formData.specifications));
      formDataToSend.append('isWeeklySpecial', formData.isWeeklySpecial);
      
      // Добавляем новые изображения
      formData.images.forEach((image, index) => {
        if (image) {
          formDataToSend.append(`image${index + 1}`, image);
        }
      });

      // Добавляем информацию о существующих изображениях.
      // API товара для редактирования может вернуть полный URL, а backend хранит относительный путь.
      // Поэтому перед отправкой нормализуем localhost-ссылки обратно в /uploads/...
      const normalizedExistingImages = existingImages.flatMap((image) => {
        if (typeof image !== 'string') return [image];

        try {
          const imageUrl = new URL(image);
          return [image, imageUrl.pathname];
        } catch {
          return [image];
        }
      });
      formDataToSend.append('existingImages', JSON.stringify([...new Set(normalizedExistingImages)]));

      const url = id
        ? `http://localhost:3002/api/admin/products/${id}`
        : 'http://localhost:3002/api/admin/products';

      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formDataToSend
      });

      const data = await response.json();
      if (data.success) {
        toast.success(id ? 'Товар обновлён!' : 'Товар создан!');
        navigate('/admin/products');
      } else {
        toast.error(data.message || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const getImagePreview = (index) => {
    if (formData.images[index]) {
      return URL.createObjectURL(formData.images[index]);
    }
    if (existingImages[index]) {
      const img = existingImages[index];
      return img.startsWith('http') ? img : `http://localhost:3002${img}`;
    }
    return null;
  };

  const selectedWeeklySpecials = weeklySpecials.filter(product => product._id !== id).slice(0, 4);

  return (
    <div className="product-editor-page">
      {weeklyLimitModalOpen && (
        <div className="weekly-limit-modal-overlay" role="dialog" aria-modal="true">
          <div className="weekly-limit-modal">
            <div className="weekly-limit-modal-header">
              <div>
                <span className="weekly-limit-icon">★</span>
                <h2>Лимит товаров недели</h2>
              </div>
              <button
                type="button"
                className="weekly-limit-close"
                onClick={() => setWeeklyLimitModalOpen(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <p className="weekly-limit-text">
              Уже выбрано 4 товара недели. Чтобы добавить текущий товар, сначала снимите отметку с одного из выбранных товаров.
            </p>

            <div className="weekly-limit-list">
              {selectedWeeklySpecials.map((product, index) => (
                <button
                  key={product._id}
                  type="button"
                  className="weekly-limit-item"
                  onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                >
                  <span>{index + 1}</span>
                  <p>{product.name}</p>
                </button>
              ))}
            </div>

            <div className="weekly-limit-actions">
              <button
                type="button"
                className="weekly-limit-secondary"
                onClick={() => setWeeklyLimitModalOpen(false)}
              >
                Остаться здесь
              </button>
              <button
                type="button"
                className="weekly-limit-primary"
                onClick={() => navigate('/admin/products')}
              >
                Перейти к товарам
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Хедер */}
      <div className="product-editor-header">
        <button className="editor-back-btn" onClick={() => navigate('/admin/products')}>
          ← Назад к товарам
        </button>
        <div className="editor-header-right">
          <button
            className="editor-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : id ? 'Сохранить изменения' : 'Создать товар'}
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="product-editor-body">
        <div className="product-editor-container">
          <h1 className="product-editor-title">
            {id ? 'Редактирование товара' : 'Новый товар'}
          </h1>

          {/* Основная информация */}
          <div className="editor-section">
            <h2 className="editor-section-title">Основная информация</h2>
            
            <div className="editor-field">
              <label>Название товара</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Введите название товара"
              />
            </div>

            <div className="editor-row">
              <div className="editor-field">
                <label>Цена (₽)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="editor-field">
                <label>Количество на складе</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="editor-checkbox">
              <input
                type="checkbox"
                id="isWeeklySpecial"
                name="isWeeklySpecial"
                checked={formData.isWeeklySpecial}
                onChange={handleInputChange}
              />
              <label htmlFor="isWeeklySpecial">Товар недели</label>
            </div>

            <div className="editor-row">
              <div className="editor-field">
                <label>Тип устройства</label>
                <select
                  name="deviceType"
                  value={formData.deviceType}
                  onChange={handleDeviceTypeChange}
                >
                  <option value="">Выберите тип</option>
                  <option value="Игровое">Игровое</option>
                  <option value="Офисное">Офисное</option>
                </select>
              </div>
              <div className="editor-field">
                <label>Категория</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                >
                  <option value="">
                    {formData.deviceType ? 'Выберите категорию' : 'Сначала выберите тип'}
                  </option>
                  {getFilteredCategories().map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="editor-field">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Описание товара"
              />
            </div>
          </div>

          {/* Изображения */}
          <div className="editor-section">
            <h2 className="editor-section-title">Изображения</h2>
            <div className="images-grid">
              {[0, 1, 2].map((index) => {
                const preview = getImagePreview(index);
                const inputId = `image-upload-${index}`;

                return (
                  <div
                    key={index}
                    className="image-upload-card"
                    tabIndex={0}
                    onPaste={(event) => handlePasteImage(index, event)}
                    title="Кликните для загрузки или вставьте изображение (Ctrl+V)"
                  >
                    <input
                      id={inputId}
                      type="file"
                      name={`image-${index}`}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleInputChange}
                      className="image-upload-input"
                    />

                    {preview ? (
                      <div className="image-preview">
                        <img src={preview} alt={`Изображение ${index + 1}`} />
                        <button
                          type="button"
                          className="image-remove-btn"
                          onClick={() => {
                            if (formData.images[index]) {
                              const newImages = [...formData.images];
                              newImages[index] = null;
                              setFormData(prev => ({ ...prev, images: newImages }));
                            } else {
                              removeExistingImage(index);
                            }
                          }}
                        >
                          ✕
                        </button>

                        <label htmlFor={inputId} className="image-replace-btn">
                          Заменить
                        </label>
                      </div>
                    ) : (
                      <label htmlFor={inputId} className="image-upload-placeholder">
                        <span className="upload-icon">📷</span>
                        <span className="upload-text">Добавить фото</span>
                        <span className="upload-hint">или Ctrl + V</span>
                      </label>
                    )}

                    <button
                      type="button"
                      className="image-paste-btn"
                      onClick={() => pasteImageFromClipboard(index)}
                    >
                      Вставить
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Характеристики */}
          <div className="editor-section">
            <h2 className="editor-section-title">Характеристики</h2>
            
            {Object.entries(formData.specifications).map(([sectionName, fields]) => (
              <div key={sectionName} className="specs-section">
                <div className="specs-section-header">
                  <span className="specs-section-title">{sectionName}</span>
                  <button 
                    type="button"
                    className="specs-remove-btn"
                    onClick={() => removeSection(sectionName)}
                  >
                    ✕
                  </button>
                </div>
                <div className="specs-fields">
                  {Object.entries(fields).map(([fieldName, value]) => {
                    const templateOptions = getTemplateForCategory()?.[sectionName]?.[fieldName];

                    return (
                      <div key={fieldName} className="specs-field-row">
                        <span className="specs-field-name">{fieldName}</span>
                        {Array.isArray(templateOptions) ? (
                          <select
                            value={templateOptions.includes(value) ? value : '__current_custom__'}
                            onChange={(e) => handleTemplateFieldChange(sectionName, fieldName, e.target.value)}
                            className="specs-field-input"
                          >
                            {!templateOptions.includes(value) && (
                              <option value="__current_custom__">{value}</option>
                            )}
                            {templateOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                            <option value="__custom__">Указать своё...</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateFieldValue(sectionName, fieldName, e.target.value)}
                            className="specs-field-input"
                          />
                        )}
                        <button 
                          type="button"
                          className="specs-remove-btn small"
                          onClick={() => removeField(sectionName, fieldName)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="specs-add-field">
                  <input
                    type="text"
                    placeholder="Название поля"
                    value={activeSection === sectionName ? newFieldName : ''}
                    onChange={(e) => {
                      setActiveSection(sectionName);
                      setNewFieldName(e.target.value);
                    }}
                    className="specs-small-input"
                  />
                  <input
                    type="text"
                    placeholder="Значение"
                    value={activeSection === sectionName ? newValue : ''}
                    onChange={(e) => {
                      setActiveSection(sectionName);
                      setNewValue(e.target.value);
                    }}
                    className="specs-small-input"
                  />
                  <button 
                    type="button"
                    className="specs-add-btn"
                    onClick={() => addField(sectionName)}
                    disabled={!newFieldName.trim() || !newValue.trim()}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            
            <div className="specs-add-section">
              <input
                type="text"
                placeholder="Название новой секции (например: Общие)"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="specs-input"
              />
              <button 
                type="button"
                className="specs-add-btn"
                onClick={addSection}
                disabled={!newSectionName.trim()}
              >
                Добавить секцию
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditor;
