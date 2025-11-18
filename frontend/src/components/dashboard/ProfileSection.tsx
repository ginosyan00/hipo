import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Clinic } from '../../types/api.types';

interface ProfileSectionProps {
  clinic: Clinic | undefined;
  onUpdate: (data: Partial<Clinic>) => Promise<void>;
  isLoading?: boolean;
}

/**
 * ProfileSection Component
 * Секция для редактирования профиля клиники
 */
export const ProfileSection: React.FC<ProfileSectionProps> = ({ clinic, onUpdate, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    about: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        slug: clinic.slug || '',
        email: clinic.email || '',
        phone: clinic.phone || '',
        address: clinic.address || '',
        city: clinic.city || '',
        about: clinic.about || '',
      });
    }
  }, [clinic]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку для этого поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название клиники обязательно';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug обязателен';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug может содержать только строчные буквы, цифры и дефисы';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Город обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onUpdate(formData);
    } catch (err: any) {
      // Ошибки обрабатываются в родительском компоненте
      console.error('Ошибка обновления профиля:', err);
    }
  };

  return (
    <Card title="Профиль клиники" padding="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Название клиники"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Input
            label="Slug (URL)"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            error={errors.slug}
            helperText="Используется в URL клиники (например: my-clinic)"
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Input
            label="Телефон"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />

          <Input
            label="Город"
            name="city"
            value={formData.city}
            onChange={handleChange}
            error={errors.city}
            required
          />

          <Input
            label="Адрес"
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
          />
        </div>

        <div>
          <label className="block text-sm font-normal text-text-10 mb-2">
            Описание
          </label>
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            rows={4}
            className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm font-normal placeholder-text-10 focus:outline-none focus:border-main-100 transition-smooth"
            placeholder="Расскажите о вашей клинике..."
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-stroke">
          <Button type="submit" variant="primary" size="md" isLoading={isLoading} disabled={isLoading}>
            Сохранить изменения
          </Button>
        </div>
      </form>
    </Card>
  );
};

