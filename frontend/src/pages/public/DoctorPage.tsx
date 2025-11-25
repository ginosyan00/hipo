import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card, Spinner, BackButton, Input, Modal } from '../../components/common';
import { AvatarUpload } from '../../components/dashboard/AvatarUpload';
import { useClinicDoctor } from '../../hooks/usePublic';
import { useAuthStore } from '../../store/useAuthStore';
import { useUpdateUser } from '../../hooks/useUsers';
import { toast } from 'react-hot-toast';

// Import icons
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';
import doctorIcon from '../../assets/icons/doctor.svg';

/**
 * Doctor Page - Public Landing
 * Страница врача в публичной секции
 */
export const DoctorPage: React.FC = () => {
  const { slug, doctorId } = useParams<{ slug: string; doctorId: string }>();
  const currentUser = useAuthStore(state => state.user);
  const updateUserMutation = useUpdateUser();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const { data: doctor, isLoading: doctorLoading, refetch } = useClinicDoctor(slug!, doctorId!);

  // Проверка: является ли текущий пользователь владельцем клиники этого врача
  const isClinicOwner = doctor && currentUser?.role === 'CLINIC' && currentUser?.clinicId === doctor.clinic?.id;

  const handleAvatarUpload = async (avatar: string) => {
    if (!doctor) return;
    try {
      await updateUserMutation.mutateAsync({
        id: doctor.id,
        data: { avatar },
      });
      toast.success('Фото врача успешно обновлено');
      refetch();
      setIsAvatarModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении фото');
      throw error;
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
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-stroke bg-main-10 flex items-center justify-center">
                {doctor.avatar ? (
                  <img 
                    src={doctor.avatar} 
                    alt={doctor.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <img src={doctorIcon} alt="Doctor" className="w-16 h-16" />
                )}
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

              {/* Edit Button for Clinic Owner */}
              {isClinicOwner && (
                <div className="mt-8 flex gap-3">
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="bg-main-10 text-main-100 hover:bg-main-100 hover:text-white text-sm font-normal px-8 py-3"
                  >
                    📷 Изменить фото
                  </Button>
                  <Link to="/dashboard/doctors">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="text-sm font-normal px-8 py-3"
                    >
                      ← Назад к списку врачей
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>

      {/* Avatar Upload Modal for Clinic Owner */}
      {isClinicOwner && (
        <Modal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          title="Изменить фото врача"
          size="md"
        >
          <div className="space-y-4">
            <AvatarUpload
              currentAvatar={doctor?.avatar}
              onUpload={handleAvatarUpload}
              isLoading={updateUserMutation.isPending}
            />
            <div className="flex justify-end pt-4 border-t border-stroke">
              <Button
                variant="secondary"
                onClick={() => setIsAvatarModalOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </Modal>
      )}

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



