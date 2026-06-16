const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');


const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'strela79',
  database: 'praktik',
  charset: 'utf8mb4'
};


const connectMySQL = async () => {
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Подключение к MySQL успешно');
    return connection;
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error);
    process.exit(1);
  }
};


const exportCategories = async (mysqlConnection) => {
  try {
    console.log('📦 Экспортируем категории...');
    
    const [categories] = await mysqlConnection.execute('SELECT * FROM categories');
    
    const mongoCategories = categories.map(category => ({
      name: category.category_name,
      deviceType: category.device_type,
      mysqlId: category.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await fs.writeFile(
      path.join(__dirname, '../data/categories.json'),
      JSON.stringify(mongoCategories, null, 2),
      'utf8'
    );
    
    console.log(`✅ Экспортировано ${mongoCategories.length} категорий`);
    return mongoCategories;
  } catch (error) {
    console.error('❌ Ошибка экспорта категорий:', error);
    return [];
  }
};


const exportUsers = async (mysqlConnection) => {
  try {
    console.log('👥 Экспортируем пользователей...');
    
    const [users] = await mysqlConnection.execute(`
      SELECT u.*, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
    `);
    
    const mongoUsers = users.map(user => ({
      username: user.username,
      email: user.email,
      password: '$2a$12$defaulthashedpassword',
      role: user.role_name === 'admin' ? 'admin' : 'user',
      profile: {
        yearBirth: user.yearbirth ? parseInt(user.yearbirth) : null,
        gender: user.gender,
        avatar: user.img
      },
      favorites: [],
      cart: [],
      mysqlId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await fs.writeFile(
      path.join(__dirname, '../data/users.json'),
      JSON.stringify(mongoUsers, null, 2),
      'utf8'
    );
    
    console.log(`✅ Экспортировано ${mongoUsers.length} пользователей`);
    return mongoUsers;
  } catch (error) {
    console.error('❌ Ошибка экспорта пользователей:', error);
    return [];
  }
};


const exportProducts = async (mysqlConnection, categories) => {
  try {
    console.log('🛍️ Экспортируем товары...');
    
    const [products] = await mysqlConnection.execute(`
      SELECT p.*, c.category_name, c.device_type 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    
    const mongoProducts = products.map(product => {

      const category = categories.find(cat => cat.mysqlId === product.category_id);
      

      let specifications = {};
      if (product.properties) {
        try {

          const parsedProps = JSON.parse(product.properties);
          specifications = parsedProps;
        } catch (e) {

          const props = product.properties.split(';');
          props.forEach(prop => {
            const [key, value] = prop.split(':').map(s => s.trim());
            if (key && value) {
              specifications[key] = value;
            }
          });
        }
      }
      

      const images = [];
      if (product.image_url1) images.push(product.image_url1);
      if (product.image_url2) images.push(product.image_url2);
      if (product.image_url3) images.push(product.image_url3);
      
      return {
        name: product.product_name,
        description: product.description,
        price: parseFloat(product.price),
        images: images,
        specifications: specifications,
        categoryId: category ? category._id : null,
        stock: product.availability || 0,
        isActive: true,
        reviews: [],
        viewCount: 0,
        mysqlId: product.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    await fs.writeFile(
      path.join(__dirname, '../data/products.json'),
      JSON.stringify(mongoProducts, null, 2),
      'utf8'
    );
    
    console.log(`✅ Экспортировано ${mongoProducts.length} товаров`);
    return mongoProducts;
  } catch (error) {
    console.error('❌ Ошибка экспорта товаров:', error);
    return [];
  }
};


const exportArticles = async (mysqlConnection) => {
  try {
    console.log('📰 Экспортируем статьи...');
    
    const [articles] = await mysqlConnection.execute('SELECT * FROM articles');
    
    const mongoArticles = articles.map(article => ({
      title: article.title,
      content: article.content,
      imageUrl: article.image_url,
      isPublished: true,
      publishedAt: article.created_at,
      mysqlId: article.id,
      createdAt: article.created_at,
      updatedAt: article.created_at
    }));
    
    await fs.writeFile(
      path.join(__dirname, '../data/articles.json'),
      JSON.stringify(mongoArticles, null, 2),
      'utf8'
    );
    
    console.log(`✅ Экспортировано ${mongoArticles.length} статей`);
    return mongoArticles;
  } catch (error) {
    console.error('❌ Ошибка экспорта статей:', error);
    return [];
  }
};


const exportOrders = async (mysqlConnection) => {
  try {
    console.log('🛒 Экспортируем заказы...');
    
    const [orders] = await mysqlConnection.execute(`
      SELECT o.*, u.username 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
    `);
    
    const mongoOrders = [];
    
    for (const order of orders) {

      const [orderItems] = await mysqlConnection.execute(`
        SELECT oi.*, p.product_name, p.price 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `, [order.id]);
      
      const items = orderItems.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.price || 0)
      }));
      
      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += item.quantity * item.price;
      });
      
      mongoOrders.push({
        userId: order.user_id,
        items: items,
        totalAmount: totalAmount,
        status: order.status,
        mysqlId: order.id,
        createdAt: order.order_date,
        updatedAt: order.order_date
      });
    }
    
    await fs.writeFile(
      path.join(__dirname, '../data/orders.json'),
      JSON.stringify(mongoOrders, null, 2),
      'utf8'
    );
    
    console.log(`✅ Экспортировано ${mongoOrders.length} заказов`);
    return mongoOrders;
  } catch (error) {
    console.error('❌ Ошибка экспорта заказов:', error);
    return [];
  }
};


const exportReviews = async (mysqlConnection) => {
  try {
    console.log('⭐ Экспортируем отзывы...');
    
    const [reviews] = await mysqlConnection.execute(`
      SELECT r.*, u.username, p.product_name 
      FROM reviews r 
      LEFT JOIN users u ON r.user_id = u.id 
      LEFT JOIN products p ON r.product_id = p.id
    `);
    
    const mongoReviews = reviews.map(review => ({
      productId: review.product_id,
      userId: review.user_id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at
    }));
    
    await fs.writeFile(
      path.join(__dirname, '../data/reviews.json'),
      JSON.stringify(mongoReviews, null, 2),
      'utf8'
    );
    
    console.log(`✅ Экспортировано ${mongoReviews.length} отзывов`);
    return mongoReviews;
  } catch (error) {
    console.error('❌ Ошибка экспорта отзывов:', error);
    return [];
  }
};


const runExport = async () => {
  console.log('🚀 Начинаем экспорт данных из MySQL...\n');
  
  let mysqlConnection;
  
  try {

    await fs.mkdir(path.join(__dirname, '../data'), { recursive: true });
    

    mysqlConnection = await connectMySQL();
    

    const categories = await exportCategories(mysqlConnection);
    console.log('');
    
    const users = await exportUsers(mysqlConnection);
    console.log('');
    
    const products = await exportProducts(mysqlConnection, categories);
    console.log('');
    
    const articles = await exportArticles(mysqlConnection);
    console.log('');
    
    const orders = await exportOrders(mysqlConnection);
    console.log('');
    
    const reviews = await exportReviews(mysqlConnection);
    console.log('');
    
    console.log('🎉 Экспорт данных успешно завершен!');
    

    console.log('\n📊 Статистика экспорта:');
    console.log(`- Категории: ${categories.length}`);
    console.log(`- Пользователи: ${users.length}`);
    console.log(`- Товары: ${products.length}`);
    console.log(`- Статьи: ${articles.length}`);
    console.log(`- Заказы: ${orders.length}`);
    console.log(`- Отзывы: ${reviews.length}`);
    
    console.log('\n📁 Файлы сохранены в папке: devicemaster-react/backend/data/');
    console.log('- categories.json');
    console.log('- users.json');
    console.log('- products.json');
    console.log('- articles.json');
    console.log('- orders.json');
    console.log('- reviews.json');
    
  } catch (error) {
    console.error('❌ Критическая ошибка экспорта:', error);
  } finally {

    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('✅ Соединение с MySQL закрыто');
    }
    
    process.exit(0);
  }
};


if (require.main === module) {
  runExport();
}

module.exports = { runExport };