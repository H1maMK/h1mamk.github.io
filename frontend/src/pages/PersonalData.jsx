import { Link, useLocation } from 'react-router-dom';
import './InfoPage.css';

const PersonalData = () => {
  const location = useLocation();
  const backTarget = location.state?.from || '/';

  return (
    <div className="page-wrapper">
      <main>
        <div className="info-container">
          <Link to={backTarget} className="back-link">← Вернуться назад</Link>

          <div className="info-content">
            <h1 className="info-title">Обработка персональных данных</h1>

            <div className="info-text">
              <div className="info-section">
                <h2>Согласие на обработку данных</h2>
                <p>
                  Отправляя форму регистрации, пользователь даёт согласие на обработку
                  персональных данных в объёме, необходимом для создания аккаунта,
                  оформления заказов и обратной связи.
                </p>
              </div>

              <div className="info-section">
                <h2>Какие данные обрабатываются</h2>
                <ul>
                  <li>Имя пользователя</li>
                  <li>Адрес электронной почты</li>
                  <li>Адрес доставки по Астрахани</li>
                  <li>История заказов и действий в аккаунте</li>
                </ul>
              </div>

              <div className="info-section">
                <h2>Для чего это нужно</h2>
                <ul>
                  <li>Регистрация и авторизация пользователя</li>
                  <li>Оформление, подтверждение и доставка заказов</li>
                  <li>Связь по вопросам заказа и поддержки</li>
                  <li>Хранение истории покупок в личном кабинете</li>
                </ul>
              </div>

              <div className="info-section">
                <h2>Срок и порядок обработки</h2>
                <p>
                  Данные обрабатываются с использованием средств автоматизации и хранятся
                  только в течение срока, необходимого для работы магазина и исполнения
                  обязательств перед пользователем.
                </p>
              </div>

              <div className="info-section">
                <h2>Отзыв согласия</h2>
                <p>
                  Пользователь может отозвать согласие на обработку персональных данных,
                  обратившись на почту <a href="mailto:support@dslk.ru">support@dslk.ru</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PersonalData;
