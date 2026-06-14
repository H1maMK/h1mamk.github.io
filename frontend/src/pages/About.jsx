import { Link } from 'react-router-dom';
import './InfoPage.css';

const About = () => {
  return (
    <div className="page-wrapper">
      <main>
        <div className="info-container">
          <Link to="/" className="back-link">← Вернуться на главную</Link>
          
          <div className="info-content">
            <h1 className="info-title">О компании</h1>
            
            <div className="info-text">
              <div className="info-section">
                <h2>Кто мы</h2>
                <p>
                  DSLK — ведущий интернет-магазин компьютерной периферии и аксессуаров. 
                  Мы работаем на рынке с 2020 года и за это время завоевали доверие тысяч клиентов 
                  по всей России.
                </p>
                <p>
                  Наша миссия — предоставить геймерам и профессионалам доступ к лучшему оборудованию 
                  по честным ценам с гарантией качества и быстрой доставкой.
                </p>
              </div>

              <div className="info-section">
                <h2>Наши преимущества</h2>
                <ul>
                  <li>Только оригинальная продукция от официальных поставщиков</li>
                  <li>Гарантия на все товары от 12 месяцев</li>
                  <li>Быстрая доставка по всей России</li>
                  <li>Профессиональная консультация по подбору оборудования</li>
                  <li>Удобные способы оплаты</li>
                  <li>Программа лояльности для постоянных клиентов</li>
                </ul>
              </div>

              <div className="info-section">
                <h2>Наш ассортимент</h2>
                <p>
                  В нашем каталоге представлены:
                </p>
                <ul>
                  <li>Игровые и офисные мыши</li>
                  <li>Механические и мембранные клавиатуры</li>
                  <li>Игровые наушники и гарнитуры</li>
                  <li>Мониторы для игр и работы</li>
                  <li>Микрофоны и веб-камеры</li>
                  <li>Аксессуары и комплектующие</li>
                </ul>
              </div>

              <div className="contact-info">
                <h3>Контакты</h3>
                <div className="contact-item">📧 Email: info@dslk.ru</div>
                <div className="contact-item">📞 Телефон: 8 (800) 123-45-67</div>
                <div className="contact-item">📍 Адрес: г. Москва, ул. Примерная, д. 1</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
