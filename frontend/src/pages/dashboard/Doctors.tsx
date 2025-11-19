import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Button, Input, Card, Modal, Spinner } from '../../components/common';
import { useDoctors } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinic } from '../../hooks/useClinic';
import { User } from '../../types/api.types';
import { AddDoctorModal } from '../../components/dashboard/AddDoctorModal';

// Import icons
import searchIcon from '../../assets/icons/search.svg';
import doctorIcon from '../../assets/icons/doctor.svg';

/**
 * Doctors Page
 * Страница для отображения всех врачей клиники с полной информацией
 */
export const DoctorsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);

  // Загружаем врачей и клинику
  const { data: doctorsData, isLoading, refetch } = useDoctors();
  const { data: clinic } = useClinic();
  const doctors = doctorsData || [];

  // Проверка: только CLINIC может добавлять врачей
  const canAddDoctors = user?.role === 'CLINIC';

  // Обработчик клика на врача - редирект на страницу врача
  const handleDoctorClick = (doctor: User) => {
    if (clinic?.slug) {
      navigate(`/clinic/${clinic.slug}/doctor/${doctor.id}`);
    }
  };

  // Фильтрация врачей
  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors];

    // Поиск по имени, телефону, email, специальности
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        doctor =>
          doctor.name.toLowerCase().includes(searchLower) ||
          doctor.phone?.toLowerCase().includes(searchLower) ||
          doctor.email.toLowerCase().includes(searchLower) ||
          doctor.specialization?.toLowerCase().includes(searchLower) ||
          doctor.licenseNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Фильтр по специальности
    if (specializationFilter) {
      filtered = filtered.filter(
        doctor => doctor.specialization === specializationFilter
      );
    }

    // Фильтр по статусу
    if (statusFilter) {
      filtered = filtered.filter(doctor => doctor.status === statusFilter);
    }

    return filtered;
  }, [doctors, search, specializationFilter, statusFilter]);

  // Уникальные специальности для фильтра
  const specializations = useMemo(() => {
    const specs = doctors
      .map(d => d.specialization)
      .filter((spec): spec is string => !!spec);
    return Array.from(new Set(specs)).sort();
  }, [doctors]);

  const handleDoctorCreated = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-50 text-green-700 border-green-200',
      PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
      REJECTED: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    const labels = {
      ACTIVE: 'Активен',
      PENDING: 'Ожидает',
      SUSPENDED: 'Приостановлен',
      REJECTED: 'Отклонен',
    };
    return (
      <span
        className={`px-2 py-1 border rounded-sm text-xs font-normal ${
          styles[status as keyof typeof styles] || styles.ACTIVE
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-100">Врачи</h1>
            <p className="text-text-10 text-sm mt-1">
              Всего врачей: {filteredDoctors.length} из {doctors.length}
            </p>
          </div>
          <div className="flex gap-3">
            {/* Переключение вида */}
            <div className="flex border border-stroke rounded-sm overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-normal transition-smooth ${
                  viewMode === 'table'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
              >
                📊 Таблица
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 text-sm font-normal transition-smooth ${
                  viewMode === 'cards'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
              >
                🃏 Карточки
              </button>
            </div>
            {canAddDoctors && (
              <Button onClick={() => setIsModalOpen(true)} variant="primary">
                ➕ Добавить врача
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Поиск по имени, телефону, email, специальности..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<img src={searchIcon} alt="Search" className="w-4 h-4" />}
            />
            <select
              value={specializationFilter}
              onChange={e => setSpecializationFilter(e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            >
              <option value="">Все специальности</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            >
              <option value="">Все статусы</option>
              <option value="ACTIVE">Активен</option>
              <option value="PENDING">Ожидает</option>
              <option value="SUSPENDED">Приостановлен</option>
              <option value="REJECTED">Отклонен</option>
            </select>
          </div>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && !isLoading && (
          <>
            {filteredDoctors.length === 0 ? (
              <Card>
                <div className="text-center py-12 text-text-10 text-sm">
                  {search || specializationFilter || statusFilter
                    ? 'Врачи не найдены'
                    : 'Нет врачей. Добавьте первого врача!'}
                </div>
              </Card>
            ) : (
              <Card padding="none" className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-primary border-b border-stroke">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Врач
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Телефон
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Специальность
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Опыт
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Лицензия
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-white divide-y divide-stroke">
                    {filteredDoctors.map(doctor => (
                      <tr
                        key={doctor.id}
                        className="hover:bg-bg-primary transition-smooth cursor-pointer"
                        onClick={() => handleDoctorClick(doctor)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-main-10 rounded-sm flex items-center justify-center flex-shrink-0">
                              <img
                                src={doctorIcon}
                                alt="Doctor"
                                className="w-5 h-5"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-text-100">
                                {doctor.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-50">
                            {doctor.phone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-50 truncate max-w-xs">
                            {doctor.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-100 font-medium">
                            {doctor.specialization || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-50">
                            {doctor.experience
                              ? `${doctor.experience} ${doctor.experience === 1 ? 'год' : doctor.experience < 5 ? 'года' : 'лет'}`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-50 font-mono">
                            {doctor.licenseNumber || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(doctor.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDoctorClick(doctor);
                            }}
                          >
                            Подробнее
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && !isLoading && (
          <>
            {filteredDoctors.length === 0 ? (
              <Card>
                <div className="text-center py-12 text-text-10 text-sm">
                  {search || specializationFilter || statusFilter
                    ? 'Врачи не найдены'
                    : 'Нет врачей. Добавьте первого врача!'}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map(doctor => (
                  <Card
                    key={doctor.id}
                    padding="md"
                    className="cursor-pointer hover:border-main-100/30 transition-smooth"
                    onClick={() => handleDoctorClick(doctor)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 bg-main-10 rounded-sm flex items-center justify-center flex-shrink-0">
                          <img
                            src={doctorIcon}
                            alt="Doctor"
                            className="w-7 h-7"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-text-100 truncate">
                            {doctor.name}
                          </h3>
                          <p className="text-xs text-main-100 font-medium truncate">
                            {doctor.specialization || 'Специализация не указана'}
                          </p>
                          <div className="mt-2">{getStatusBadge(doctor.status)}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {doctor.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-text-10">📱</span>
                            <span className="text-text-50">{doctor.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-text-10">📧</span>
                          <span className="text-text-50 truncate">
                            {doctor.email}
                          </span>
                        </div>
                        {doctor.experience && (
                          <div className="flex items-center gap-2">
                            <span className="text-text-10">💼</span>
                            <span className="text-text-50">
                              Опыт: {doctor.experience}{' '}
                              {doctor.experience === 1
                                ? 'год'
                                : doctor.experience < 5
                                ? 'года'
                                : 'лет'}
                            </span>
                          </div>
                        )}
                        {doctor.licenseNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-text-10">📋</span>
                            <span className="text-text-50 font-mono">
                              Лицензия: {doctor.licenseNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stroke">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          onClick={e => {
                            e.stopPropagation();
                            handleDoctorClick(doctor);
                          }}
                        >
                          Подробнее
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Doctor Detail Modal - больше не используется, но оставляем для совместимости */}
        {selectedDoctor && (
          <Modal
            isOpen={!!selectedDoctor}
            onClose={() => setSelectedDoctor(null)}
            title={`Информация о враче: ${selectedDoctor.name}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-main-10 rounded-sm flex items-center justify-center flex-shrink-0">
                  <img src={doctorIcon} alt="Doctor" className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-100">
                    {selectedDoctor.name}
                  </h3>
                  <p className="text-sm text-main-100 font-medium">
                    {selectedDoctor.specialization || 'Специализация не указана'}
                  </p>
                  <div className="mt-2">{getStatusBadge(selectedDoctor.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stroke">
                <div>
                  <p className="text-xs text-text-10 mb-1">Email</p>
                  <p className="text-sm text-text-100">{selectedDoctor.email}</p>
                </div>
                <div>
                  <p className="text-xs text-text-10 mb-1">Телефон</p>
                  <p className="text-sm text-text-100">
                    {selectedDoctor.phone || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-10 mb-1">Опыт работы</p>
                  <p className="text-sm text-text-100">
                    {selectedDoctor.experience
                      ? `${selectedDoctor.experience} ${selectedDoctor.experience === 1 ? 'год' : selectedDoctor.experience < 5 ? 'года' : 'лет'}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-10 mb-1">Номер лицензии</p>
                  <p className="text-sm text-text-100 font-mono">
                    {selectedDoctor.licenseNumber || '-'}
                  </p>
                </div>
                {selectedDoctor.dateOfBirth && (
                  <div>
                    <p className="text-xs text-text-10 mb-1">Дата рождения</p>
                    <p className="text-sm text-text-100">
                      {new Date(selectedDoctor.dateOfBirth).toLocaleDateString(
                        'ru-RU'
                      )}
                    </p>
                  </div>
                )}
                {selectedDoctor.gender && (
                  <div>
                    <p className="text-xs text-text-10 mb-1">Пол</p>
                    <p className="text-sm text-text-100">
                      {selectedDoctor.gender === 'male'
                        ? 'Мужской'
                        : selectedDoctor.gender === 'female'
                        ? 'Женский'
                        : 'Другой'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stroke">
                <p className="text-xs text-text-10 mb-1">Дата регистрации</p>
                <p className="text-sm text-text-100">
                  {new Date(selectedDoctor.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedDoctor(null)}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Add Doctor Modal */}
        {canAddDoctors && (
          <AddDoctorModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleDoctorCreated}
          />
        )}
      </div>
    </NewDashboardLayout>
  );
};

