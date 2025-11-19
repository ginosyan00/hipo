import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card, Input, Modal, Spinner, BackButton, Calendar } from '../../components/common';
import { useClinic, useClinicDoctors, useCreatePublicAppointment } from '../../hooks/usePublic';

// Import icons
import brainLogo from '../../assets/icons/brain-logo.svg';
import doctorIcon from '../../assets/icons/doctor.svg';

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
  const createMutation = useCreatePublicAppointment();

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

  const handleOpenModal = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setIsModalOpen(true);
    setSuccessMessage('');
    // Сброс календаря при открытии модального окна
    setSelectedDate(null);
    setSelectedTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка выбранной даты и времени
    if (!selectedDate || !selectedTime) {
      alert('Пожалуйста, выберите дату и время приёма');
      return;
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

      await createMutation.mutateAsync({
        clinicSlug: slug!,
        doctorId: selectedDoctor,
        patient: {
          name: formData.patientName,
          phone: formData.patientPhone,
          email: formData.patientEmail || undefined,
        },
        appointmentDate: appointmentDateTimeUTC,
        reason: formData.reason || undefined,
        registeredAt: registeredAt,
      });

      setSuccessMessage('✅ Ваша заявка принята! Клиника свяжется с вами в ближайшее время.');
      setFormData({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        reason: '',
      });
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

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Figma Style Header */}
      <header className="bg-bg-white border-b border-stroke sticky top-0 z-50">
        <div className="container mx-auto px-8 py-5 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={brainLogo} alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-[21px] font-semibold text-main-100">Hippocrates</h1>
              <p className="text-[10px] text-text-10">Dental Platform</p>
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
        </Card>

        {/* Doctors Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-text-100 mb-6">Наши врачи</h2>
          {!doctors || doctors.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-text-10">Список врачей пока пуст</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map(doctor => (
                <Card key={doctor.id} padding="md">
                  <div className="text-center space-y-4">
                    <div className="bg-main-10 w-20 h-20 rounded-lg flex items-center justify-center mx-auto">
                      <img src={doctorIcon} alt="Doctor" className="w-10 h-10" />
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
      </main>

      {/* Appointment Modal - Figma Style */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSuccessMessage('');
        }}
        title="Онлайн-запись на приём"
        size="lg"
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
