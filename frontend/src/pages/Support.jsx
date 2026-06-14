import { Link } from 'react-router-dom';
import './InfoPage.css';

const Support = () => {
  return (
    <div className="page-wrapper">
      <main>
        <div className="info-container">
          <Link to="/" className="back-link">← Вернуться на главную</Link>
          
          <div className="info-content">
            <h1 className="info-title">Техническая поддержка</h1>
            
            <div className="info-text">
              <div className="info-section">
                <h2>Как связаться с нами</h2>
                <p>
                  Наша служба поддержки работает ежедневно с 9:00 до 21:00 по московскому времени.
                </p>
              </div>

              <div className="contact-info">
                <h3>Контакты поддержки</h3>
                <div className="contact-item">📧 Email: support@dslk.ru</div>
                <div className="contact-item">📞 Телефон: 8 (800) 123-45-68</div>
                <div className="contact-item">💬 Telegram: @dslk_support</div>
              </div>

              <div className="info-section">
                <h2>Часто задаваемые вопросы</h2>
                
                <h3>Как отследить заказ?</h3>
                <p>
                  После оформления заказа вам на почту придёт письмо с номером отслеживания. 
                  Также вы можете проверить статус заказа в личном кабинете в разделе "Мои заказы".
                </p>

                <h3>Как вернуть товар?</h3>
                <p>
                  Для возврата товара свяжитесь с нашей службой поддержки. 
                  Мы поможем оформить возврат и ответим на все вопросы.
                </p>

                <h3>Товар пришёл повреждённым, что делать?</h3>
                <p>
                  Сфотографируйте повреждения и упаковку, затем свяжитесь с нами. 
                  Мы оперативно решим вопрос с заменой или возвратом средств.
                </p>

                <h3>Как получить гарантийное обслуживание?</h3>
                <p>
                  Для гарантийного обслуживания обратитесь в нашу поддержку с описанием проблемы 
                  и номером заказа. Мы направим вас в ближайший сервисный центр или организуем 
                  замену товара.
                </p>
              </div>

              <div className="info-section">
                <h2>Время ответа</h2>
                <ul>
                  <li>Email — в течение 24 часов</li>
                  <li>Телефон — мгновенно в рабочее время</li>
                  <li>Telegram — в течение 1 часа</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;
