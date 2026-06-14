import { Link } from 'react-router-dom';
import './InfoPage.css';

const Privacy = () => {
  return (
    <div className="page-wrapper">
      <main>
        <div className="info-container">
          <Link to="/" className="back-link">← Вернуться на главную</Link>
          
          <div className="info-content">
            <h1 className="info-title">Персональные данные</h1>
            
            <div className="info-text">
              <div className="info-section">
                <h2>Политика конфиденциальности</h2>
                <p>
                  Настоящая Политика конфиденциальности определяет порядок обработки 
                  и защиты персональных данных пользователей сайта DSLK.
                </p>
              </div>

              <div className="info-section">
                <h2>Какие данные мы собираем</h2>
                <ul>
                  <li>Имя и фамилия</li>
                  <li>Адрес электронной почты</li>
                  <li>Номер телефона</li>
                  <li>Адрес доставки</li>
                  <li>История заказов</li>
                </ul>
              </div>

              <div className="info-section">
                <h2>Цели обработки данных</h2>
                <p>Мы используем ваши персональные данные для:</p>
                <ul>
                  <li>Обработки и доставки заказов</li>
                  <li>Связи с вами по вопросам заказа</li>
                  <li>Отправки информации о статусе заказа</li>
                  <li>Улучшения качества обслуживания</li>
                  <li>Отправки рекламных материалов (с вашего согласия)</li>
                </ul>
              </div>

              <div className="info-section">
                <h2>Защита данных</h2>
                <p>
                  Мы принимаем все необходимые меры для защиты ваших персональных данных:
                </p>
                <ul>
                  <li>Шифрование данных при передаче (SSL/TLS)</li>
                  <li>Ограниченный доступ к персональным данным</li>
                  <li>Регулярное обновление систем безопасности</li>
                  <li>Обучение сотрудников правилам работы с данными</li>
                </ul>
              </div>

              <div className="info-section">
                <h2>Ваши права</h2>
                <p>Вы имеете право:</p>
                <ul>
                  <li>Получить информацию о хранящихся данных</li>
                  <li>Потребовать исправления неточных данных</li>
                  <li>Потребовать удаления ваших данных</li>
                  <li>Отозвать согласие на обработку данных</li>
                  <li>Отказаться от рекламной рассылки</li>
                </ul>
              </div>

              <div className="info-section">
                <h2>Cookies</h2>
                <p>
                  Наш сайт использует файлы cookies для улучшения работы сайта 
                  и персонализации контента. Вы можете отключить cookies в настройках браузера.
                </p>
              </div>

              <div className="info-section">
                <h2>Контакты</h2>
                <p>
                  По вопросам обработки персональных данных обращайтесь: 
                  <a href="mailto:privacy@dslk.ru"> privacy@dslk.ru</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
