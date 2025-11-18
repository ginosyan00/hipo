import React, { useState } from 'react';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Button, Input, Card, Modal, Spinner } from '../../components/common';
import { PatientProfileModal } from '../../components/dashboard/PatientProfileModal';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '../../hooks/usePatients';
import { usePatientVisits } from '../../hooks/usePatientVisits';
import { useDoctors } from '../../hooks/useUsers';
import { Patient, PatientVisit, AppointmentStatus } from '../../types/api.types';
import { formatAppointmentDateTime } from '../../utils/dateFormat';

// Import search icon
import searchIcon from '../../assets/icons/search.svg';

/**
 * Patients Page - Extended Version
 * Управление пациентами с отображением всех визитов
 */
export const PatientsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState<string>('');
  // По умолчанию показываем только завершенные приёмы (completed) в режиме таблицы
  // Это гарантирует, что раздел Patients показывает только пациентов с завершенными визитами
  const [statusFilter, setStatusFilter] = useState<string>('completed');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Загружаем пациентов (для cards view)
  const { data: patientsData, isLoading: isLoadingPatients } = usePatients({ search });
  
  // Загружаем все визиты (для table view)
  const { data: visitsData, isLoading: isLoadingVisits } = usePatientVisits({
    search: viewMode === 'table' ? search : undefined,
    doctorId: doctorFilter || undefined,
    status: statusFilter || undefined,
    limit: 100,
  });

  // Загружаем врачей для фильтра
  const { data: doctorsData } = useDoctors();

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    notes: '',
  });

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        name: patient.name,
        phone: patient.phone,
        email: patient.email || '',
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        gender: patient.gender || '',
        notes: patient.notes || '',
      });
    } else {
      setEditingPatient(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPatient) {
        await updateMutation.mutateAsync({
          id: editingPatient.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving patient:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Удалить пациента ${name}?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting patient:', err);
      }
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      confirmed: 'bg-main-10 text-main-100 border-main-100/20',
      completed: 'bg-secondary-10 text-secondary-100 border-secondary-100/20',
      cancelled: 'bg-bg-primary text-text-10 border-stroke',
    };
    const labels = {
      pending: 'Ожидает',
      confirmed: 'Подтвержден',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return (
      <span className={`px-2 py-1 border rounded-sm text-xs font-normal ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return `${amount.toLocaleString('ru-RU')} ֏`;
  };

  const isLoading = viewMode === 'table' ? isLoadingVisits : isLoadingPatients;
  const visits = visitsData?.visits || [];
  const patients = patientsData?.patients || [];
  const doctors = doctorsData || [];

  // Уникальные визиты по appointmentId (защита от дубликатов)
  const uniqueVisits = Array.from(
    new Map(visits.map(visit => [visit.appointmentId, visit])).values()
  );

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-100">Пациенты</h1>
            <p className="text-text-10 text-sm mt-1">
              {viewMode === 'table' 
                ? `Всего визитов: ${visitsData?.meta.total || 0}`
                : `Всего пациентов: ${patientsData?.meta.total || 0}`
              }
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
                📊 Таблица визитов
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 text-sm font-normal transition-smooth ${
                  viewMode === 'cards'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
              >
                🃏 Карточки пациентов
              </button>
            </div>
            <Button onClick={() => handleOpenModal()} variant="primary">
              ➕ Добавить пациента
            </Button>
          </div>
        </div>

        {/* Filters (только для table view) */}
        {viewMode === 'table' && (
          <Card padding="md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Поиск по имени, телефону, врачу, процедуре..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                icon={<img src={searchIcon} alt="Search" className="w-4 h-4" />}
              />
              <select
                value={doctorFilter}
                onChange={e => setDoctorFilter(e.target.value)}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
              >
                <option value="">Все врачи</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
              >
                <option value="">Все статусы</option>
                <option value="pending">Ожидает</option>
                <option value="confirmed">Подтвержден</option>
                <option value="completed">Завершен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
          </Card>
        )}

        {/* Search (только для cards view) */}
        {viewMode === 'cards' && (
          <Card padding="md">
            <Input
              placeholder="Поиск по имени или телефону..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<img src={searchIcon} alt="Search" className="w-4 h-4" />}
            />
          </Card>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Table View - Все визиты */}
        {viewMode === 'table' && !isLoading && (
          <>
            {uniqueVisits.length === 0 ? (
              <Card>
                <div className="text-center py-12 text-text-10 text-sm">
                  {search || doctorFilter || statusFilter 
                    ? 'Визиты не найдены' 
                    : 'Нет визитов. Создайте первый приём!'}
                </div>
              </Card>
            ) : (
              <Card padding="none" className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-primary border-b border-stroke">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Пациент
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Телефон
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Врач
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Процедура
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Дата и время
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-50 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-white divide-y divide-stroke">
                    {uniqueVisits.map(visit => (
                      <tr 
                        key={visit.appointmentId} 
                        className="hover:bg-bg-primary transition-smooth cursor-pointer"
                        onClick={() => setSelectedPatientId(visit.patientId)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-100">{visit.patientName}</div>
                          {visit.patientEmail && (
                            <div className="text-xs text-text-10">{visit.patientEmail}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-50">{visit.patientPhone}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-100">{visit.doctorName}</div>
                          {visit.doctorSpecialization && (
                            <div className="text-xs text-text-10">{visit.doctorSpecialization}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-text-50">
                            {visit.reason || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-50">
                            {formatAppointmentDateTime(visit.appointmentDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-100">
                            {formatAmount(visit.amount)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(visit.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}

        {/* Cards View - Список пациентов */}
        {viewMode === 'cards' && !isLoading && (
          <>
            {patients.length === 0 ? (
              <Card>
                <div className="text-center py-12 text-text-10 text-sm">
                  {search ? 'Пациенты не найдены' : 'Нет пациентов. Добавьте первого!'}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map(patient => (
                  <Card 
                    key={patient.id} 
                    padding="md"
                    className="cursor-pointer hover:border-main-100/30 transition-smooth"
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-main-10 rounded-sm flex items-center justify-center flex-shrink-0">
                          <span className="text-base text-main-100 font-medium">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-text-100 truncate">{patient.name}</h3>
                          <p className="text-xs text-text-50">{patient.phone}</p>
                          {patient.email && <p className="text-xs text-text-10 truncate">{patient.email}</p>}
                        </div>
                      </div>

                      {patient.notes && (
                        <p className="text-xs text-text-10 line-clamp-2">{patient.notes}</p>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-stroke" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenModal(patient)}>
                          Редактировать
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(patient.id, patient.name)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPatient ? 'Редактировать пациента' : 'Добавить пациента'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="ФИО"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Телефон"
                type="tel"
                placeholder="+374 98 123456"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Дата рождения"
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
              <div>
                <label className="block text-sm font-normal text-text-10 mb-2">Пол</label>
                <select
                  value={formData.gender}
                  onChange={e =>
                    setFormData({ ...formData, gender: e.target.value as any })
                  }
                  className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
                >
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другой</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Заметки</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth resize-none"
                placeholder="Аллергии, особые указания..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingPatient ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Patient Profile Modal */}
        {selectedPatientId && (
          <PatientProfileModal
            isOpen={!!selectedPatientId}
            onClose={() => setSelectedPatientId(null)}
            patientId={selectedPatientId}
          />
        )}
      </div>
    </NewDashboardLayout>
  );
};
