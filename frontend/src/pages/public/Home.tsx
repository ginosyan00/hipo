import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common';

// Import icons
import searchIcon from '../../assets/icons/search.svg';
import calendarIcon from '../../assets/icons/calendar.svg';
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';

/**
 * Home Page - Figma Design Style
 * Главная страница в стиле медицинского дашборда Figma
 */
export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Figma Style Header */}
      <header className="bg-bg-white border-b border-stroke sticky top-0 z-50 shadow-sm">
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
              <Button className="text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white">
                Вход для клиник
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Figma Style */}
      <section className="container mx-auto px-8 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Badge - Figma Style */}
          <div className="inline-flex items-center gap-2 bg-main-10 border border-stroke rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 bg-main-100 rounded-full"></span>
            <span className="text-sm font-normal text-text-50">Современная платформа для записи онлайн</span>
          </div>
          
          {/* Main Headline - Figma Style */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-text-100 mb-6 leading-tight">
            Ваша улыбка —<br />
            <span className="text-main-100">наша забота</span>
          </h2>
          
          {/* Subheadline - Figma Style */}
          <p className="text-lg md:text-xl text-text-50 mb-12 max-w-3xl mx-auto leading-relaxed">
            Найдите лучшую стоматологическую клинику в вашем городе и запишитесь на приём за 2 минуты
          </p>
          
          {/* CTA Buttons - Figma Style */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/clinics">
              <Button 
                size="lg" 
                className="bg-main-10 text-main-100 hover:bg-main-100 hover:text-white text-sm font-normal px-8 py-3"
              >
                <img src={searchIcon} alt="Search" className="w-5 h-5 mr-2" />
                Найти клинику
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-sm font-normal px-8 py-3 border border-stroke hover:bg-bg-primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Для клиник
              </Button>
            </Link>
          </div>

          {/* Stats - Figma Style */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-bg-white border border-stroke rounded-lg p-6 text-center">
              <div className="text-2xl font-medium text-text-100 mb-1">1000+</div>
              <div className="text-sm text-text-10">Пациентов</div>
            </div>
            <div className="bg-bg-white border border-stroke rounded-lg p-6 text-center">
              <div className="text-2xl font-medium text-text-100 mb-1">50+</div>
              <div className="text-sm text-text-10">Клиник</div>
            </div>
            <div className="bg-bg-white border border-stroke rounded-lg p-6 text-center">
              <div className="text-2xl font-medium text-text-100 mb-1">24/7</div>
              <div className="text-sm text-text-10">Поддержка</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Figma Style */}
      <section className="container mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-medium text-text-50 mb-4">Как это работает</h3>
          <p className="text-lg text-text-10 max-w-2xl mx-auto">
            Простой и быстрый способ записаться к стоматологу онлайн
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="bg-bg-white border border-stroke rounded-lg p-8 text-center hover:shadow-figma transition-smooth">
            <div className="bg-main-10 w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-6">
              <img src={searchIcon} alt="Search" className="w-8 h-8" />
            </div>
            <div className="text-3xl font-semibold text-text-10 mb-3">01</div>
            <h3 className="text-lg font-medium text-text-100 mb-3">Найдите клинику</h3>
            <p className="text-sm text-text-10 leading-relaxed">
              Выбирайте из каталога проверенных стоматологических клиник в вашем городе
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-bg-white border border-stroke rounded-lg p-8 text-center hover:shadow-figma transition-smooth">
            <div className="bg-secondary-10 w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-6">
              <img src={calendarIcon} alt="Calendar" className="w-8 h-8" />
            </div>
            <div className="text-3xl font-semibold text-text-10 mb-3">02</div>
            <h3 className="text-lg font-medium text-text-100 mb-3">Запишитесь онлайн</h3>
            <p className="text-sm text-text-10 leading-relaxed">
              Выберите удобное время и запишитесь на приём за пару кликов без звонков
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-bg-white border border-stroke rounded-lg p-8 text-center hover:shadow-figma transition-smooth">
            <div className="bg-main-10 w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-semibold text-text-10 mb-3">03</div>
            <h3 className="text-lg font-medium text-text-100 mb-3">Получите подтверждение</h3>
            <p className="text-sm text-text-10 leading-relaxed">
              Клиника свяжется с вами для подтверждения приёма и уточнения деталей
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Figma Style */}
      <section className="bg-main-100 text-white py-24 my-20">
        <div className="container mx-auto px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-medium mb-6 leading-tight">
              Готовы к здоровой улыбке?
            </h2>
            <p className="text-lg mb-10 opacity-90">
              Присоединяйтесь к тысячам довольных пациентов. Запишитесь на приём прямо сейчас!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/clinics">
                <Button 
                  size="lg" 
                  className="bg-white text-main-100 hover:bg-bg-primary text-sm font-normal px-8 py-3"
                >
                  Начать сейчас
                </Button>
              </Link>
              <Link to="/register">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="border-2 border-white bg-transparent text-white hover:bg-white/10 text-sm font-normal px-8 py-3"
                >
                  Узнать больше
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Figma Style */}
      <footer className="bg-bg-white border-t border-stroke py-12">
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
