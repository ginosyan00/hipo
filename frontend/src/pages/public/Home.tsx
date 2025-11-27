import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common';
import { usePatientsForTestimonials } from '../../hooks/usePublic';
import searchIcon from '../../assets/icons/search.svg';
import calendarIcon from '../../assets/icons/calendar.svg';
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';
import doctorIcon from '../../assets/icons/doctor.svg';

export const HomePage: React.FC = () => {
  const { data: patients = [], isLoading: patientsLoading } = usePatientsForTestimonials(3);

  const testimonials = [
    {
      text: "Очень удобная платформа! Записался к стоматологу за минуту, без звонков и ожидания.",
      bgColor: "bg-main-10",
      textColor: "text-main-100",
    },
    {
      text: "Отличный сервис! Нашла клинику рядом с домом, записалась онлайн, всё прошло идеально.",
      bgColor: "bg-secondary-10",
      textColor: "text-secondary-100",
    },
    {
      text: "Простота использования поражает! Рекомендую всем знакомым.",
      bgColor: "bg-main-10",
      textColor: "text-main-100",
    },
  ];

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'П';
  };

  // Функция для разделения имени и фамилии
  const getNameParts = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }
    return { firstName: fullName, lastName: '' };
  };
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-primary-200/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Figma Style Header */}
      <header className="bg-bg-white/80 backdrop-blur-md border-b border-stroke sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5 flex justify-between items-center">
          <Link to="/" className="flex items-center group transition-all duration-300 hover:opacity-90">
            <div className="relative">
              <img 
                src={hippocratesLogo} 
                alt="Logo" 
                className="w-40 h-22 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg object-contain" 
              />
            </div>
          </Link>
          
          <div className="flex gap-3">
            <Link to="/clinics">
              <Button 
                variant="secondary" 
                className="text-sm font-normal"
              >
                Каталог клиник
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                className="text-sm font-normal hover:text-white"
                style={{ 
                  backgroundColor: '#E6F7F6', 
                  color: '#00a79d'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00a79d';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E6F7F6';
                  e.currentTarget.style.color = '#00a79d';
                }}
              >
                Вход для клиник
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced */}
      <section className="container mx-auto px-8 py-20 md:py-32 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Badge - Animated */}
          <div className="inline-flex items-center gap-2 bg-main-10/80 backdrop-blur-sm border border-stroke rounded-full px-5 py-2 mb-8 animate-fade-in hover:scale-105 transition-smooth">
            <span className="w-2 h-2 bg-main-100 rounded-full animate-pulse"></span>
            <span className="text-sm font-normal text-text-50">Современная платформа для записи онлайн</span>
          </div>
          
          {/* Main Headline - Enhanced */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-text-100 mb-6 leading-tight animate-slide-up">
            Ваша улыбка —<br />
            <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              наша забота
            </span>
          </h2>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-text-50 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Найдите лучшую стоматологическую клинику в вашем городе и запишитесь на приём за 2 минуты
          </p>
          
          {/* CTA Buttons - Enhanced */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-scale-in">
            <Link to="/clinics">
              <Button 
                size="lg" 
                className="bg-main-10 text-main-100 hover:bg-main-100 hover:text-white hover:scale-105 text-sm font-normal px-8 py-3 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <img src={searchIcon} alt="Search" className="w-5 h-5 mr-2" />
                Найти клинику
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-sm font-normal px-8 py-3 border border-stroke hover:bg-bg-primary hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Для клиник
              </Button>
            </Link>
          </div>

          {/* Stats - Glassmorphism Style */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 group">
              <div className="text-3xl font-semibold text-main-100 mb-1 group-hover:scale-110 transition-transform">1000+</div>
              <div className="text-sm text-text-10">Пациентов</div>
            </div>
            <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 group">
              <div className="text-3xl font-semibold text-main-100 mb-1 group-hover:scale-110 transition-transform">50+</div>
              <div className="text-sm text-text-10">Клиник</div>
            </div>
            <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300 group">
              <div className="text-3xl font-semibold text-main-100 mb-1 group-hover:scale-110 transition-transform">24/7</div>
              <div className="text-sm text-text-10">Поддержка</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="container mx-auto px-8 py-20 relative z-10">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-semibold text-text-100 mb-4">Как это работает</h3>
          <p className="text-lg text-text-50 max-w-2xl mx-auto">
            Простой и быстрый способ записаться к стоматологу онлайн
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-8 text-center hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100/5 rounded-full -mr-10 -mt-10"></div>
            <div className="bg-main-10 w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <img src={searchIcon} alt="Search" className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-text-10 mb-3 group-hover:text-main-100 transition-colors">01</div>
            <h3 className="text-lg font-semibold text-text-100 mb-3">Найдите клинику</h3>
            <p className="text-sm text-text-50 leading-relaxed">
              Выбирайте из каталога проверенных стоматологических клиник в вашем городе
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-8 text-center hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-accent-500/5 rounded-full -mr-10 -mt-10"></div>
            <div className="bg-secondary-10 w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <img src={calendarIcon} alt="Calendar" className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-text-10 mb-3 group-hover:text-accent-500 transition-colors">02</div>
            <h3 className="text-lg font-semibold text-text-100 mb-3">Запишитесь онлайн</h3>
            <p className="text-sm text-text-50 leading-relaxed">
              Выберите удобное время и запишитесь на приём за пару кликов без звонков
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-8 text-center hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100/5 rounded-full -mr-10 -mt-10"></div>
            <div className="bg-main-10 w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <svg className="w-8 h-8 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-text-10 mb-3 group-hover:text-main-100 transition-colors">03</div>
            <h3 className="text-lg font-semibold text-text-100 mb-3">Получите подтверждение</h3>
            <p className="text-sm text-text-50 leading-relaxed">
              Клиника свяжется с вами для подтверждения приёма и уточнения деталей
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section - New */}
      <section className="container mx-auto px-8 py-20 relative z-10">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-semibold text-text-100 mb-4">Почему выбирают нас</h3>
          <p className="text-lg text-text-50 max-w-2xl mx-auto">
            Преимущества нашей платформы для пациентов и клиник
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-main-10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-text-100 mb-2">Быстрая запись</h4>
            <p className="text-sm text-text-50">Запись на приём за 2 минуты без звонков</p>
          </div>
          
          <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-secondary-10 rounded-lg flex items-center justify-center mb-4">
              <img src={doctorIcon} alt="Doctor" className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-text-100 mb-2">Проверенные врачи</h4>
            <p className="text-sm text-text-50">Только квалифицированные специалисты</p>
          </div>
          
          <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-main-10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-semibold text-text-100 mb-2">Безопасность</h4>
            <p className="text-sm text-text-50">Защита персональных данных</p>
          </div>
          
          <div className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-text-100 mb-2">Удобство</h4>
            <p className="text-sm text-text-50">Доступно 24/7 с любого устройства</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New */}
      <section className="container mx-auto px-8 py-20 relative z-10">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-semibold text-text-100 mb-4">Отзывы пациентов</h3>
          <p className="text-lg text-text-50 max-w-2xl mx-auto">
            Что говорят о нас наши пользователи
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {patientsLoading ? (
            // Loading state
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-text-10/20 rounded mb-4"></div>
                <div className="h-20 bg-text-10/20 rounded mb-4"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-text-10/20 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-text-10/20 rounded mb-2"></div>
                    <div className="h-3 bg-text-10/20 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))
          ) : patients.length > 0 ? (
            // Real patients data
            patients.map((patient, index) => {
              const { firstName, lastName } = getNameParts(patient.name);
              const testimonial = testimonials[index] || testimonials[0];
              const initial = getInitial(patient.name);
              
              return (
                <div key={patient.id} className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-text-50 mb-4 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${testimonial.bgColor} rounded-full flex items-center justify-center`}>
                      <span className={`${testimonial.textColor} font-semibold`}>{initial}</span>
                    </div>
                    <div>
                      <div className="font-medium text-text-100 text-sm">
                        {firstName} {lastName}
                      </div>
                      <div className="text-xs text-text-10">Пациент</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Fallback if no patients
            testimonials.map((testimonial, index) => {
              const fallbackNames = ['Анна Петрова', 'Мария Иванова', 'Дмитрий Соколов'];
              const { firstName, lastName } = getNameParts(fallbackNames[index]);
              const initial = getInitial(fallbackNames[index]);
              
              return (
                <div key={index} className="bg-bg-white/80 backdrop-blur-sm border border-stroke rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-text-50 mb-4 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${testimonial.bgColor} rounded-full flex items-center justify-center`}>
                      <span className={`${testimonial.textColor} font-semibold`}>{initial}</span>
                    </div>
                    <div>
                      <div className="font-medium text-text-100 text-sm">
                        {firstName} {lastName}
                      </div>
                      <div className="text-xs text-text-10">Пациент</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative bg-gradient-to-r from-primary-500 to-primary-700 text-white py-24 my-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 leading-tight">  
              Готовы к здоровой улыбке?
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-95">
              Присоединяйтесь к тысячам довольных пациентов. Запишитесь на приём прямо сейчас!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/clinics">
                <Button 
                  size="lg" 
                  className="bg-white text-main-100 hover:bg-bg-primary hover:scale-105 text-sm font-normal px-8 py-3 shadow-xl transition-all duration-300"
                >
                  Начать сейчас
                </Button>
              </Link>
              <Link to="/register">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="border-2 border-white bg-transparent text-white hover:bg-white/20 hover:scale-105 text-sm font-normal px-8 py-3 transition-all duration-300"
                >
                  Узнать больше
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-bg-white border-t border-stroke py-12 relative z-10">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-start mb-4 group">
                <div className="relative">
                  <img 
                    src={hippocratesLogo} 
                    alt="Logo" 
                    className="w-40 h-22 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg object-contain" 
                  />
                </div>
              </div>
              <p className="text-sm text-text-10 leading-relaxed max-w-md">
                Современная SaaS-платформа для стоматологических клиник. Упрощаем процесс записи и управления пациентами.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-medium text-text-100 mb-3 text-sm">Компания</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-text-10 hover:text-text-100 transition-colors">О нас</a>
                <a href="#" className="block text-sm text-text-10 hover:text-text-100 transition-colors">Контакты</a>
                <a href="#" className="block text-sm text-text-10 hover:text-text-100 transition-colors">Карьера</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-text-100 mb-3 text-sm">Поддержка</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-text-10 hover:text-text-100 transition-colors">Помощь</a>
                <a href="#" className="block text-sm text-text-10 hover:text-text-100 transition-colors">FAQ</a>
                <a href="#" className="block text-sm text-text-10 hover:text-text-100 transition-colors">Политика</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-stroke text-center">
            <p className="text-text-10 text-sm">
              © 2025 Hippocrates Dental. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
