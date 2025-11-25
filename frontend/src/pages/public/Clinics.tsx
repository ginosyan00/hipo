import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Spinner } from '../../components/common';
import { useClinics, useCities } from '../../hooks/usePublic';
import { Clinic } from '../../types/api.types';

// Import icons
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';
import searchIcon from '../../assets/icons/search.svg';

/**
 * Clinics Page - Figma Design Style
 * Каталог клиник в стиле медицинского дашборда
 */
export const ClinicsPage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('');

  const { data: citiesData } = useCities();
  const { data, isLoading, error } = useClinics({ city: selectedCity || undefined });

  const cities = citiesData || [];
  const clinics = data?.data || [];

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
          <Link to="/login">
            <Button className="text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white">
              Вход для клиник
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-text-100 mb-3">Стоматологические клиники</h1>
          <p className="text-lg text-text-50">Найдите клинику рядом с вами и запишитесь онлайн</p>
        </div>

        {/* Filter Card */}
        <Card padding="md" className="mb-8 max-w-md">
          <label className="block text-sm font-normal text-text-10 mb-2">Фильтр по городу</label>
          <div className="relative">
            <img 
              src={searchIcon} 
              alt="Search" 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
            >
              <option value="">Все города</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">Ошибка загрузки клиник. Попробуйте позже.</p>
          </Card>
        )}

        {/* Clinics Grid */}
        {!isLoading && !error && (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-text-10">
                Найдено клиник: <span className="font-medium text-text-100">{clinics.length}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinics.length === 0 ? (
                <div className="col-span-full">
                  <Card padding="lg">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-main-10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-text-50 text-lg">Клиники не найдены</p>
                      <p className="text-text-10 text-sm mt-2">Попробуйте изменить фильтр</p>
                    </div>
                  </Card>
                </div>
              ) : (
                clinics.map((clinic: Clinic) => (
                  <Card key={clinic.id} padding="none" className="overflow-hidden hover:shadow-figma-md transition-smooth">
                    <div className="p-6 space-y-4">
                      {/* Clinic Name */}
                      <h3 className="text-lg font-medium text-text-100">{clinic.name}</h3>

                      {/* Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-text-50">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{clinic.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-50">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{clinic.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-50">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{clinic.email || ''}</span>
                        </div>
                      </div>

                      {/* About */}
                      {clinic.about && (
                        <p className="text-sm text-text-10 line-clamp-2 leading-relaxed">
                          {clinic.about}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="px-6 pb-6">
                      <Link to={`/clinic/${clinic.slug}`}>
                        <Button 
                          className="w-full text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white"
                          size="md"
                        >
                          Записаться на приём
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-bg-white border-t border-stroke py-8 mt-20">
        <div className="container mx-auto px-8 text-center">
          <p className="text-text-10 text-sm">
            © 2025 Hippocrates Dental. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};
