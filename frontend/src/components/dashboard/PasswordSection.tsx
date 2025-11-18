import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface PasswordSectionProps {
  onUpdate: (currentPassword: string, newPassword: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * PasswordSection Component
 * Секция для изменения пароля администратора
 */
export const PasswordSection: React.FC<PasswordSectionProps> = ({ onUpdate, isLoading = false }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибки и успех
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSuccess(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Текущий пароль обязателен';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Новый пароль обязателен';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Пароль должен содержать минимум 8 символов';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Пароль должен содержать заглавную букву, строчную букву и цифру';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!validate()) {
      return;
    }

    try {
      await onUpdate(formData.currentPassword, formData.newPassword);
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setErrors({ currentPassword: err.message || 'Ошибка при изменении пароля' });
    }
  };

  return (
    <Card title="Изменение пароля" padding="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Текущий пароль"
          name="currentPassword"
          type="password"
          value={formData.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          required
        />

        <Input
          label="Новый пароль"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          helperText="Минимум 8 символов, должна быть заглавная буква, строчная буква и цифра"
          required
        />

        <Input
          label="Подтвердите новый пароль"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />

        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
            Пароль успешно изменен!
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-stroke">
          <Button type="submit" variant="primary" size="md" isLoading={isLoading} disabled={isLoading}>
            Изменить пароль
          </Button>
        </div>
      </form>
    </Card>
  );
};

