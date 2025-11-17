import React, { useState, useEffect } from 'react';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Button, Card, Input, Spinner, Modal } from '../../components/common';
import { useMedications, useMedicationStats, useCreateMedication, useUpdateMedication, useDeleteMedication } from '../../hooks/useMedications';
import { Medication } from '../../types/api.types';

// Import pharmacy icon
import pharmacyIcon from '../../assets/icons/pharmacy.svg';
import searchIcon from '../../assets/icons/search.svg';

/**
 * Pharmacy Page - Figma Design
 * Управление медикаментами и аптекой
 */
export const PharmacyPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  // Debounce search input - increased delay to prevent too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 2000); // Increased from 300ms to 500ms

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch medications from API
  const { 
    data: medicationsData, 
    isLoading: isLoadingMedications, 
    isFetching: isFetchingMedications,
    error: medicationsError 
  } = useMedications({
    search: debouncedSearch || undefined,
    limit: 100,
  });

  // Fetch stats from API
  const { data: stats, isLoading: isLoadingStats } = useMedicationStats();

  // Mutations
  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();

  // Use previous data if available while fetching to prevent flickering
  const medications = (medicationsData as any)?.data || [];
  const filteredMedications = medications; // Search is handled by API
  
  // Show loading only on initial load, not when refetching
  const isInitialLoading = isLoadingMedications || isLoadingStats;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    quantity: 0,
    price: 0,
    expiryDate: '',
    manufacturer: '',
  });

  const handleOpenModal = (medication?: Medication) => {
    if (medication) {
      setEditingMedication(medication);
      setFormData({
        name: medication.name,
        dosage: medication.dosage,
        quantity: medication.quantity,
        price: medication.price,
        expiryDate: medication.expiryDate ? new Date(medication.expiryDate).toISOString().split('T')[0] : '',
        manufacturer: medication.manufacturer,
      });
    } else {
      setEditingMedication(null);
      setFormData({
        name: '',
        dosage: '',
        quantity: 0,
        price: 0,
        expiryDate: '',
        manufacturer: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMedication) {
        await updateMutation.mutateAsync({
          id: editingMedication.id,
          data: formData,
        });
      } else {
        console.log('Creating medication with data:', formData);
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving medication:', err);
      alert(err?.response?.data?.error?.message || err?.message || 'Ошибка при сохранении медикамента');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Удалить медикамент ${name}?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting medication:', err);
      }
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity > 100) {
      return { label: 'В наличии', style: 'bg-secondary-10 text-secondary-100 border-secondary-100/20' };
    } else if (quantity > 50) {
      return { label: 'Заканчивается', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    } else {
      return { label: 'Мало', style: 'bg-red-50 text-red-600 border-red-200' };
    }
  };

  // Use stats from API or calculate from medications
  const totalValue = stats?.totalValue || medications.reduce((sum: number, med: Medication) => sum + med.price * med.quantity, 0);
  const lowStockCount = stats?.lowStockCount || medications.filter((med: Medication) => med.quantity <= 50).length;
  const totalMedications = stats?.totalMedications || medications.length;

  // Loading state - only show spinner on initial load
  if (isInitialLoading) {
    return (
      <NewDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      </NewDashboardLayout>
    );
  }

  // Error state
  if (medicationsError) {
    return (
      <NewDashboardLayout>
        <div className="text-center py-8 text-red-600">
          Ошибка загрузки медикаментов. Попробуйте обновить страницу.
        </div>
      </NewDashboardLayout>
    );
  }

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-text-100">Аптека</h1>
          <p className="text-text-10 text-sm mt-1">Всего медикаментов: {totalMedications}</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>➕ Добавить медикамент</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Medications */}
        <Card padding="none" className="p-5 transition-opacity duration-200">
          <div className="space-y-4">
            <div className="w-10 h-10 bg-main-10 rounded-sm flex items-center justify-center">
              <img src={pharmacyIcon} alt="Pharmacy" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-normal text-text-10 mb-1">Всего медикаментов</p>
              <p className="text-2xl font-medium text-text-100 transition-all duration-200">{totalMedications}</p>
            </div>
          </div>
        </Card>

        {/* Total Value */}
        <Card padding="none" className="p-5 transition-opacity duration-200">
          <div className="space-y-4">
            <div className="w-10 h-10 bg-secondary-10 rounded-sm flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-sm font-normal text-text-10 mb-1">Общая стоимость</p>
              <p className="text-2xl font-medium text-text-100 transition-all duration-200">{totalValue.toLocaleString()} ֏</p>
            </div>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card padding="none" className="p-5 transition-opacity duration-200">
          <div className="space-y-4">
            <div className="w-10 h-10 bg-red-50 rounded-sm flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-normal text-text-10 mb-1">Малый запас</p>
              <p className="text-2xl font-medium text-red-600 transition-all duration-200">{lowStockCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card padding="md">
        <div className="relative">
          <Input
            type="text"
            placeholder="Поиск медикаментов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            icon={<img src={searchIcon} alt="Search" className="w-4 h-4" />}
          />
          {/* Subtle loading indicator when fetching */}
          {isFetchingMedications && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-main-100 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </Card>

      {/* Medications Table - with min-height and will-change to prevent jumps */}
      <div
        style={{ 
          willChange: isFetchingMedications ? 'contents' : 'auto',
          contain: 'layout style paint'
        }}
      >
        <Card 
          padding="none" 
          className="p-5 transition-opacity duration-300 min-h-[400px]"
        >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-text-50">Список медикаментов</h3>
          {isFetchingMedications && (
            <div className="flex items-center gap-2 text-xs text-text-10 animate-pulse">
              <div className="w-3 h-3 border-2 border-main-100 border-t-transparent rounded-full animate-spin"></div>
              <span>Обновление...</span>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-stroke mb-4">
          <div className="col-span-3 text-sm font-normal text-text-10">Название</div>
          <div className="col-span-2 text-sm font-normal text-text-10">Дозировка</div>
          <div className="col-span-2 text-sm font-normal text-text-10">Количество</div>
          <div className="col-span-2 text-sm font-normal text-text-10">Цена</div>
          <div className="col-span-2 text-sm font-normal text-text-10">Срок годности</div>
          <div className="col-span-1 text-sm font-normal text-text-10">Статус</div>
        </div>

        {/* Table Rows - with will-change for smooth transitions */}
        <div 
          className={`space-y-4 transition-opacity duration-300 ${isFetchingMedications ? 'opacity-60' : 'opacity-100'}`}
          style={{ willChange: isFetchingMedications ? 'opacity' : 'auto' }}
        >
          {filteredMedications.length === 0 ? (
            <div className="text-center py-8 text-text-10 text-sm">
              Медикаменты не найдены
            </div>
          ) : (
            filteredMedications.map((medication: Medication) => {
              const stockStatus = getStockStatus(medication.quantity);
              return (
                <div key={medication.id} className="hover:bg-bg-primary transition-all duration-200 rounded-sm p-2 -mx-2">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-main-10 rounded-sm flex items-center justify-center">
                          <img src={pharmacyIcon} alt="Med" className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-100">{medication.name}</p>
                          <p className="text-[10px] text-text-10">{medication.manufacturer}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs font-medium text-text-50">
                      {medication.dosage}
                    </div>
                    <div className="col-span-2 text-xs font-medium text-text-100">
                      {medication.quantity} шт
                    </div>
                    <div className="col-span-2 text-xs font-medium text-text-100">
                      {medication.price.toLocaleString()} ֏
                    </div>
                    <div className="col-span-2 text-xs font-normal text-text-50">
                      {new Date(medication.expiryDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 border rounded-sm text-[10px] font-normal ${stockStatus.style}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-stroke">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenModal(medication)}>
                      Редактировать
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(medication.id, medication.name)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMedication ? 'Редактировать медикамент' : 'Добавить медикамент'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Парацетамол"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Дозировка"
              value={formData.dosage}
              onChange={e => setFormData({ ...formData, dosage: e.target.value })}
              required
              placeholder="500mg"
            />
            <Input
              label="Производитель"
              value={formData.manufacturer}
              onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
              required
              placeholder="PharmaCorp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Количество"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Цена (֏)"
              type="number"
              min="0"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <Input
            label="Срок годности"
            type="date"
            value={formData.expiryDate}
            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingMedication ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </NewDashboardLayout>
  );
};





