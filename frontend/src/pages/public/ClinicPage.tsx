import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card, Input, Modal, Spinner, BackButton, Calendar } from '../../components/common';
import { CertificateGallery } from '../../components/public/CertificateGallery';
import { ClinicSearchFilterModal, ClinicFilters } from '../../components/public/ClinicSearchFilterModal';
import { useClinic, useClinicDoctors, useCreatePublicAppointment, useClinicPatients } from '../../hooks/usePublic';
import { useAuthStore } from '../../store/useAuthStore';

// Import icons
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';
import doctorIcon from '../../assets/icons/doctor.svg';
import searchIcon from '../../assets/icons/search.svg';

/**
 * Clinic Page - Figma Design Style
 * Страница клиники в стиле медицинского дашборда
 */
export const ClinicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { data: clinic, isLoading: clinicLoading } = useClinic(slug!);
  const { data: doctors, isLoading: doctorsLoading } = useClinicDoctors(slug!);
  const { data: patientsData, isLoading: patientsLoading } = useClinicPatients(slug!, { limit: 100 });
  const createMutation = useCreatePublicAppointment();
  
  // Auth state
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);

  // Search filter state
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ClinicFilters>({
    doctor: '',
    status: '',
    date: '',
    time: '',
    week: '',
    category: '',
    searchText: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    reason: '',
  });
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Автозаполнение формы для авторизованных пользователей
  useEffect(() => {
    if (isModalOpen && isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        patientName: user.name || '',
        patientPhone: user.phone || '',
        patientEmail: user.email || '',
      }));
    } else if (isModalOpen && !isAuthenticated) {
      // Сброс формы для неавторизованных
      setFormData({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        reason: '',
      });
    }
  }, [isModalOpen, isAuthenticated, user]);

  const handleOpenModal = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setIsModalOpen(true);
    setSuccessMessage('');
    // Сброс календаря при открытии модального окна
    setSelectedDate(null);
    setSelectedTime('');
  };
  
  const handleLogoutAndReset = () => {
    logout();
    setFormData({
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      reason: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка выбранной даты и времени
    if (!selectedDate || !selectedTime) {
      alert('Пожалуйста, выберите дату и время приёма');
      return;
    }

    // Валидация для неавторизованных пользователей
    if (!isAuthenticated) {
      if (!formData.patientName.trim()) {
        alert('Пожалуйста, укажите ваше ФИО');
        return;
      }
      if (!formData.patientPhone.trim()) {
        alert('Пожалуйста, укажите ваш телефон');
        return;
      }
    } else if (isAuthenticated && user) {
      // Валидация для авторизованных пользователей
      if (!user.phone && !formData.patientPhone.trim()) {
        alert('Пожалуйста, укажите ваш телефон для записи');
        return;
      }
    }

    try {
      // Создаем дату и время из выбранных значений
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
      
      // Конвертируем в UTC для сохранения в БД
      const appointmentDateTimeUTC = appointmentDateTime.toISOString();
      
      // Записываем локальное время пользователя в момент отправки формы
      const now = new Date();
      const timezoneOffset = -now.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? '+' : '-';
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
      
      const registeredAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}${offsetString}`;

      // Используем данные пользователя, если авторизован, иначе данные из формы
      // Если у пользователя нет телефона, используем телефон из формы
      const patientData = isAuthenticated && user
        ? {
            name: user.name,
            phone: user.phone || formData.patientPhone || '',
            email: user.email || formData.patientEmail || undefined,
          }
        : {
            name: formData.patientName,
            phone: formData.patientPhone,
            email: formData.patientEmail || undefined,
          };

      await createMutation.mutateAsync({
        clinicSlug: slug!,
        doctorId: selectedDoctor,
        patient: patientData,
        appointmentDate: appointmentDateTimeUTC,
        reason: formData.reason || undefined,
        registeredAt: registeredAt,
      });

      setSuccessMessage('✅ Ваша заявка принята! Клиника свяжется с вами в ближайшее время.');
      
      // Сброс формы только для неавторизованных пользователей
      if (!isAuthenticated) {
        setFormData({
          patientName: '',
          patientPhone: '',
          patientEmail: '',
          reason: '',
        });
      } else {
        // Для авторизованных сбрасываем только причину визита
        setFormData(prev => ({
          ...prev,
          reason: '',
        }));
      }
      
      setSelectedDate(null);
      setSelectedTime('');
    } catch (err: any) {
      alert(err.message || 'Ошибка создания заявки');
    }
  };

  if (clinicLoading || doctorsLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-text-100 mb-4">Клиника не найдена</h2>
            <Link to="/clinics">
              <Button className="text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white">
                ← Вернуться к каталогу
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const workingHours = clinic.workingHours || {};

  // Filter doctors based on filters
  const filteredDoctors = useMemo(() => {
    if (!doctors || doctors.length === 0) return [];

    return doctors.filter(doctor => {
      // Filter by doctor ID
      if (filters.doctor && doctor.id !== filters.doctor) {
        return false;
      }

      // Filter by search text (name or specialization)
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const nameMatch = doctor.name?.toLowerCase().includes(searchLower);
        const specializationMatch = doctor.specialization?.toLowerCase().includes(searchLower);
        if (!nameMatch && !specializationMatch) {
          return false;
        }
      }

      // Filter by category (specialization)
      if (filters.category) {
        const categoryLower = filters.category.toLowerCase();
        if (!doctor.specialization?.toLowerCase().includes(categoryLower)) {
          return false;
        }
      }

      // Note: Status, date, time, week filters would require additional data
      // about doctor availability, which is not currently available in the doctor object
      // These filters are kept for future implementation

      return true;
    });
  }, [doctors, filters]);

  const handleApplyFilters = (newFilters: ClinicFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      doctor: '',
      status: '',
      date: '',
      time: '',
      week: '',
      category: '',
      searchText: '',
    });
  };

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
          <Link to="/clinics">
            <Button 
              variant="secondary" 
              className="text-sm font-normal"
            >
              ← Все клиники
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton fallback="/clinics" />
        </div>

        {/* Hero Image Section */}
        {clinic.heroImage && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={clinic.heroImage}
              alt={clinic.name}
              className="w-full h-[400px] object-cover"
            />
          </div>
        )}

        {/* Clinic Info Card */}
        <Card padding="lg" className="mb-8">
          <h1 className="text-4xl font-semibold text-text-100 mb-6">{clinic.name}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contacts */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-50">Контакты</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-text-10 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-normal text-text-50">{clinic.city}</p>
                    {clinic.address && <p className="text-sm text-text-10">{clinic.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-text-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p className="text-sm font-normal text-text-50">{clinic.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-text-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-normal text-text-50">{clinic.email}</p>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-50">График работы</h3>
              <div className="space-y-2">
                {Object.entries(workingHours).length > 0 ? (
                  Object.entries(workingHours).map(([day, schedule]: [string, any]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-text-10 font-normal">{getDayName(day)}:</span>
                      <span className="text-text-50 font-normal">
                        {schedule.isOpen ? `${schedule.open} - ${schedule.close}` : 'Выходной'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-10">График не указан</p>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          {clinic.about && (
            <div className="mt-8 pt-8 border-t border-stroke">
              <h3 className="text-lg font-medium text-text-50 mb-3">О клинике</h3>
              <p className="text-sm text-text-10 leading-relaxed">{clinic.about}</p>
            </div>
          )}

          {/* Certificates - Only images visible to patients */}
          {clinic.certificates && clinic.certificates.length > 0 && (
            <div className="mt-8 pt-8 border-t border-stroke">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-text-50 mb-2">Сертификаты и лицензии</h3>
                <p className="text-sm text-text-10">
                  Нажмите на изображение, чтобы просмотреть в полном размере
                </p>
              </div>
              <CertificateGallery certificates={clinic.certificates} />
            </div>
          )}
        </Card>

        {/* Doctors Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-medium text-text-100">Наши врачи</h2>
            
            {/* Search Button */}
            <button
              type="button"
              onClick={() => {
                console.log('🔍 [CLINIC PAGE] Search button clicked, opening modal');
                setIsSearchFilterOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-50 hover:bg-bg-primary hover:border-main-100 transition-smooth cursor-pointer"
            >
              <img src={searchIcon} alt="Search" className="w-5 h-5" />
              <span>Поиск и фильтры</span>
              {(filters.doctor || filters.status || filters.date || filters.time || filters.week || filters.category || filters.searchText) && (
                <span className="ml-1 px-2 py-0.5 bg-main-100 text-white text-xs rounded-full">
                  {(filters.doctor ? 1 : 0) + (filters.status ? 1 : 0) + (filters.date ? 1 : 0) + (filters.time ? 1 : 0) + (filters.week ? 1 : 0) + (filters.category ? 1 : 0) + (filters.searchText ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {!doctors || doctors.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-text-10">Список врачей пока пуст</p>
              </div>
            </Card>
          ) : filteredDoctors.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-text-10 mb-4">Врачи не найдены по выбранным фильтрам</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-sm font-normal"
                >
                  Сбросить фильтры
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map(doctor => (
                <Card key={doctor.id} padding="md">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-stroke bg-main-10 flex items-center justify-center">
                      {doctor.avatar ? (
                        <img 
                          src={doctor.avatar} 
                          alt={doctor.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <img src={doctorIcon} alt="Doctor" className="w-10 h-10" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-text-100">{doctor.name}</h3>
                      <p className="text-sm text-text-50 mt-1">{doctor.specialization}</p>
                    </div>
                    <Button
                      className="w-full text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white"
                      onClick={() => handleOpenModal(doctor.id)}
                      size="md"
                    >
                      Записаться
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Patients Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-text-100 mb-6">Պացիենտներ</h2>

          {patientsLoading ? (
            <Card>
              <div className="text-center py-12">
                <Spinner size="md" />
              </div>
            </Card>
          ) : !patientsData || patientsData.data.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-text-10">Գրանցված պացիենտներ դեռ չկան</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientsData.data.map((patient) => (
                <Card key={patient.id} padding="md">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-main-10 flex items-center justify-center">
                        <span className="text-main-100 font-medium text-lg">
                          {patient.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-text-100">{patient.name}</h3>
                        {patient.phone && (
                          <p className="text-sm text-text-50">{patient.phone}</p>
                        )}
                      </div>
                    </div>
                    {patient._count && patient._count.appointments > 0 && (
                      <div className="pt-2 border-t border-stroke">
                        <p className="text-xs text-text-10">
                          Վիզիտներ: <span className="text-text-50 font-medium">{patient._count.appointments}</span>
                        </p>
                      </div>
                    )}
                    {patient.createdAt && (
                      <p className="text-xs text-text-10">
                        Գրանցվել է: {new Date(patient.createdAt).toLocaleDateString('hy-AM', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {patientsData && patientsData.meta.total > patientsData.data.length && (
            <div className="mt-4 text-center">
              <p className="text-sm text-text-50">
                Ցուցադրվում է {patientsData.data.length} {patientsData.meta.total}-ից
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Appointment Modal - Figma Style */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSuccessMessage('');
        }}
        title="Онлайн-запись на приём"
        size="xl"
      >
        {successMessage ? (
          <div className="text-center py-8">
            <div className="bg-secondary-10 w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-secondary-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-text-100 mb-2">Заявка отправлена!</h3>
            <p className="text-sm text-text-50 mb-6">{successMessage}</p>
            <Button 
              onClick={() => setIsModalOpen(false)}
              className="text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white"
            >
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-main-10 border border-stroke px-4 py-3 rounded-sm">
              <p className="text-sm text-text-50">
                Врач: <strong className="text-text-100">{doctors?.find(d => d.id === selectedDoctor)?.name}</strong>
              </p>
            </div>

            {/* Информация об авторизованном пользователе */}
            {isAuthenticated && user && (
              <div className="bg-secondary-10 border border-secondary-50 px-4 py-3 rounded-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-text-10 mb-1">Вы записываетесь как:</p>
                    <p className="text-sm font-medium text-text-100">{user.name}</p>
                    <p className="text-xs text-text-50 mt-1">{user.email}</p>
                    {user.phone && (
                      <p className="text-xs text-text-50">{user.phone}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleLogoutAndReset}
                    className="text-xs font-normal whitespace-nowrap"
                  >
                    Выйти
                  </Button>
                </div>
                <p className="text-xs text-text-10 mt-2">
                  ✓ Ваши данные автоматически заполнены.{user.phone ? ' Вам нужно только выбрать дату, время и указать причину визита.' : ' Пожалуйста, укажите ваш телефон для записи, выберите дату, время и причину визита.'}
                </p>
              </div>
            )}

            {/* Поля для неавторизованных пользователей */}
            {!isAuthenticated && (
              <>
                <Input
                  label="Ваше ФИО"
                  placeholder="Иван Иванов"
                  value={formData.patientName}
                  onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Телефон"
                    type="tel"
                    placeholder="+374 98 123456"
                    value={formData.patientPhone}
                    onChange={e => setFormData({ ...formData, patientPhone: e.target.value })}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="example@mail.com"
                    value={formData.patientEmail}
                    onChange={e => setFormData({ ...formData, patientEmail: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Поле телефона для авторизованных пользователей, если у них нет телефона */}
            {isAuthenticated && user && !user.phone && (
              <Input
                label="Телефон"
                type="tel"
                placeholder="+374 98 123456"
                value={formData.patientPhone}
                onChange={e => setFormData({ ...formData, patientPhone: e.target.value })}
                required
              />
            )}

            {/* Ссылка на регистрацию для неавторизованных */}
            {!isAuthenticated && (
              <div className="bg-main-10 border border-stroke px-4 py-2 rounded-sm">
                <p className="text-xs text-text-50">
                  💡 <Link to="/register-user" className="text-main-100 hover:underline font-medium">
                    Зарегистрируйтесь
                  </Link> или <Link to="/login" className="text-main-100 hover:underline font-medium">
                    войдите
                  </Link>, чтобы не вводить данные каждый раз
                </p>
              </div>
            )}

            {/* Calendar Component */}
            <div>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(''); // Сбрасываем время при выборе новой даты
                }}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
                minDate={new Date()}
              />
              {(!selectedDate || !selectedTime) && (
                <p className="mt-2 text-xs text-text-10">
                  {!selectedDate ? 'Выберите дату' : 'Выберите время'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">
                Причина визита
              </label>
              <textarea
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 placeholder-text-10 focus:outline-none focus:border-main-100 transition-smooth resize-none"
                placeholder="Опишите вашу проблему..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsModalOpen(false)}
                className="text-sm font-normal"
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                isLoading={createMutation.isPending}
                className="text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white"
              >
                Отправить заявку
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Search Filter Modal */}
      <ClinicSearchFilterModal
        isOpen={isSearchFilterOpen}
        onClose={() => setIsSearchFilterOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={filters}
        doctors={doctors || []}
      />

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

// Helper для перевода дней недели
function getDayName(day: string): string {
  const names: Record<string, string> = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
  };
  return names[day] || day;
}
