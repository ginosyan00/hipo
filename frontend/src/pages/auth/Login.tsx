import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../components/common';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';
import { getRoleRedirectPath } from '../../utils/roleRedirect';

// Import logo
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';

/**
 * Login Page - Figma Design
 * Страница авторизации в новом стиле
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔵 [LOGIN] Попытка входа:', email);
      const response = await authService.login({ email, password });
      
      console.log('✅ [LOGIN] Вход успешен:', { role: response.user.role, status: response.user.status });
      
      setAuth(response.user, response.token);

      // Централизованный редирект на основе роли и статуса
      const redirectPath = getRoleRedirectPath({
        role: response.user.role,
        status: response.user.status,
        clinicId: response.user.clinicId,
      });

      console.log('🔄 [LOGIN] Редирект на:', redirectPath);
      navigate(redirectPath);
    } catch (err: any) {
      console.log('🔴 [LOGIN] Ошибка:', err.message);
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 group">
            <div className="relative">
              <img 
                src={hippocratesLogo} 
                alt="Logo" 
                className="w-48 h-28 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg object-contain" 
              />
            </div>
          </div>
          <p className="text-text-10 text-sm">Войдите в панель управления</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="admin@clinic.am"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <Card className="bg-red-50 border-red-200" padding="sm">
                <p className="text-red-600 text-xs">{error}</p>
              </Card>
            )}

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} size="lg">
              Войти
            </Button>

            <div className="text-center text-xs text-text-10">
              Нет аккаунта?{' '}
              <Link to="/register-user" className="text-main-100 hover:underline font-medium">
                Зарегистрироваться
              </Link>
              {' • '}
              <Link to="/register" className="text-text-10 hover:underline">
                Клиника
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-stroke">
              <p className="text-[10px] text-text-10 text-center">
                Тестовые данные:
                <br />
                admin@dentalux.am / Admin123!
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
