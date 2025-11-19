import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Modal, Spinner, BackButton } from '../../components/common';
import { useClinicDoctor, useCreatePublicAppointment } from '../../hooks/usePublic';

// Import icons
import brainLogo from '../../assets/icons/brain-logo.svg';
import doctorIcon from '../../assets/icons/doctor.svg';

/**
 * Doctor Page - Public Landing
 * Страница врача в публичной секции
 */
export const DoctorPage: React.FC = () => {
  const { slug, doctorId } = useParams<{ slug: string; doctorId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { data: doctor, isLoading: doctorLoading } = useClinicDoctor(slug!, doctorId!);
  const createMutation = useCreatePublicAppointment();

  // Form state
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const appointmentDateTimeString = `${formData.appointmentDate}T${formData.appointmentTime}:00`;
      const appointmentDateTime = new Date(appointmentDateTimeString);
      const appointmentDateTimeUTC = appointmentDateTime.toISOString();
      
      const now = new Date();
      const timezoneOffset = -now.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? '+' : '-';
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
      
      const registeredAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}${offsetString}`;

      await createMutation.mutateAsync({
        clinicSlug: slug!,
        doctorId: doctorId!,
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
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка создания заявки');
    }
  };

  if (doctorLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-text-100 mb-4">Врач не найден</h2>
            <Link to={`/clinic/${slug}`}>
              <Button className="text-sm font-normal bg-main-10 text-main-100 hover:bg-main-100 hover:text-white">
                ← Вернуться к клинике
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-white border-b border-stroke sticky top-0 z-50">
        <div className="container mx-auto px-8 py-5 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={brainLogo} alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-[21px] font-semibold text-main-100">Hippocrates</h1>
              <p className="text-[10px] text-text-10">Dental Platform</p>
            </div>
          </Link>
          <div className="flex gap-3">
            <Link to={`/clinic/${slug}`}>
              <Button 
                variant="secondary" 
                className="text-sm font-normal"
              >
                ← К клинике
              </Button>
            </Link>
            <Link to="/clinics">
              <Button 
                variant="secondary" 
                className="text-sm font-normal"
              >
                Все клиники
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton fallback={`/clinic/${slug}`} />
        </div>

        {/* Doctor Info Card */}
        <Card padding="lg" className="mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Doctor Photo/Icon */}
            <div className="flex-shrink-0">
              <div className="bg-main-10 w-32 h-32 rounded-lg flex items-center justify-center">
                <img src={doctorIcon} alt="Doctor" className="w-16 h-16" />
              </div>
            </div>

            {/* Doctor Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-semibold text-text-100 mb-4">{doctor.name}</h1>
              <p className="text-xl text-main-100 font-medium mb-6">{doctor.specialization}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctor.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-text-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-sm font-normal text-text-50">{doctor.phone}</p>
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-text-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-normal text-text-50">{doctor.email}</p>
                  </div>
                )}
                {doctor.experience && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-text-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-normal text-text-50">
                      Опыт работы: {doctor.experience} {doctor.experience === 1 ? 'год' : doctor.experience < 5 ? 'года' : 'лет'}
                    </p>
                  </div>
                )}
                {doctor.licenseNumber && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-text-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-normal text-text-50 font-mono">Лицензия: {doctor.licenseNumber}</p>
                  </div>
                )}
              </div>

              {/* Clinic Info */}
              <div className="mt-6 pt-6 border-t border-stroke">
                <p className="text-sm text-text-10 mb-2">Клиника:</p>
                <Link to={`/clinic/${doctor.clinic.slug}`} className="text-base font-medium text-main-100 hover:text-main-100/80">
                  {doctor.clinic.name}
                </Link>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <Button
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-main-10 text-main-100 hover:bg-main-100 hover:text-white text-sm font-normal px-8 py-3"
                >
                  📅 Записаться на приём
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* Appointment Modal */}
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
                Врач: <strong className="text-text-100">{doctor.name}</strong>
              </p>
              <p className="text-xs text-text-10 mt-1">{doctor.specialization}</p>
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Дата"
                type="date"
                value={formData.appointmentDate}
                onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Время"
                type="time"
                value={formData.appointmentTime}
                onChange={e => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
              />
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



