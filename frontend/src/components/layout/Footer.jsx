import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div className="footer-wrapper">
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <p><strong>Контакты</strong></p>
            <p>support@dslk.ru</p>
            <p>г. Астрахань</p>
            <p>ул. Максима Горькова, д. 8</p>
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

        </div>
      </footer>
    </div>
  );
};

export default Footer;
