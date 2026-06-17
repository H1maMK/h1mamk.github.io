import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div className="footer-wrapper">
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <p>+79964715211</p>
            <p>Бесплатно по России</p>
            <p>support@dslk.ru</p>
          </div>

          <div className="footer-column">
            <p><strong>Магазин</strong></p>
            <Link to="/catalog">Каталог</Link>
            <Link to="/about">О Компании</Link>
            <Link to="/policy">Политика Компании</Link>
          </div>

          <div className="footer-column">
            <p><strong>Дополнительно</strong></p>
            <Link to="/articles">Статьи</Link>
            <Link to="/vacancies">Вакансии</Link>
          </div>

          <div className="footer-column support">
            <p><strong>Поддержка</strong></p>
            <Link to="/support">Техническая поддержка</Link>
            <Link to="/privacy">Персональные данные</Link>
          </div>

          <div className="footer-column payment">
            <p><strong>Оплата</strong></p>
            <div className="payment-icons">
              <img src="/body/pay.svg" alt="pay" />
              <img src="/body/visa.svg" alt="visa" />
              <img src="/body/mir.svg" alt="mir" />
            </div>
          </div>

          <div className="footer-column social">
            <p><strong>Соцсети</strong></p>
            <div className="social-links">
              <a href="#" target="_blank" rel="noopener noreferrer">
                <img src="/body/vk.svg" alt="VK" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <img src="/body/tg.svg" alt="Telegram" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <img src="/body/ws.svg" alt="WhatsApp" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;