import { Link } from 'react-router-dom';
import './InfoPage.css';

const Vacancies = () => {
  const vacancies = [
    {
      title: 'Менеджер по продажам',
      salary: 'от 60 000 ₽',
      description: 'Консультирование клиентов, обработка заказов, работа с CRM-системой.',
      requirements: 'Опыт работы в продажах от 1 года, знание компьютерной техники приветствуется.'
    },
    {
      title: 'Контент-менеджер',
      salary: 'от 50 000 ₽',
      description: 'Наполнение сайта товарами, написание описаний, работа с изображениями.',
      requirements: 'Грамотная письменная речь, внимательность к деталям, базовые навыки работы с графикой.'
    },
    {
      title: 'Frontend-разработчик',
      salary: 'от 120 000 ₽',
      description: 'Разработка и поддержка веб-интерфейсов, работа с React.',
      requirements: 'Опыт работы с React от 2 лет, знание TypeScript, опыт работы с REST API.'
    },
    {
      title: 'Специалист технической поддержки',
      salary: 'от 45 000 ₽',
      description: 'Консультирование клиентов по техническим вопросам, решение проблем.',
      requirements: 'Знание компьютерной техники, коммуникабельность, стрессоустойчивость.'
    }
  ];

  return (
    <div className="page-wrapper">
      <main>
        <div className="info-container">
          <Link to="/" className="back-link">← Вернуться на главную</Link>
          
          <div className="info-content">
            <h1 className="info-title">Вакансии</h1>
            
            <div className="info-text">
              <p>
                Мы всегда рады талантливым специалистам! Присоединяйтесь к нашей команде 
                и развивайтесь вместе с DSLK.
              </p>

              <div className="info-section">
                <h2>Открытые позиции</h2>
                
                {vacancies.map((vacancy, index) => (
                  <div key={index} className="vacancy-card">
                    <h3 className="vacancy-title">{vacancy.title}</h3>
                    <div className="vacancy-salary">{vacancy.salary}</div>
                    <p className="vacancy-description">{vacancy.description}</p>
                    <p className="vacancy-requirements">
                      <strong>Требования:</strong> {vacancy.requirements}
                    </p>
                  </div>
                ))}
              </div>

              <div className="contact-info">
                <h3>Как откликнуться</h3>
                <p>
                  Отправьте ваше резюме на почту <a href="mailto:hr@dslk.ru">hr@dslk.ru</a> 
                  с указанием желаемой позиции в теме письма.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Vacancies;
