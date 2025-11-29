import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Lock, Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, validateResetToken } = useAuth();
  const { settings } = useSettings();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // Colores de marca
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
  };

  const gradientStyle = `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`;

  // Validar token al cargar
  useEffect(() => {
    const checkToken = async () => {
      if (!token || !email) {
        setTokenValid(false);
        setValidating(false);
        return;
      }

      try {
        const isValid = await validateResetToken(token, email);
        setTokenValid(isValid);
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    checkToken();
  }, [token, email, validateResetToken]);

  // Validaciones de contraseña
  const passwordChecks = {
    length: password.length >= 6,
    match: password === confirmPassword && confirmPassword.length > 0,
  };

  const isFormValid = passwordChecks.length && passwordChecks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !token || !email) return;

    setError('');
    setLoading(true);

    try {
      await resetPassword(token, email, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Estado de carga
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validando enlace...</p>
        </div>
      </div>
    );
  }

  // Token inválido o expirado
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Enlace inválido o expirado
          </h1>
          <p className="text-gray-600 mb-6">
            El enlace de recuperación no es válido o ha expirado.
            Los enlaces expiran después de 1 hora.
          </p>
          <Link to="/">
            <Button className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Éxito
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Contraseña actualizada
          </h1>
          <p className="text-gray-600 mb-6">
            Tu contraseña ha sido cambiada exitosamente.
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Ir a Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // Formulario de reset
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: gradientStyle }}
          >
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nueva Contraseña
          </h1>
          <p className="text-gray-600 mt-2">
            Ingresa tu nueva contraseña para <strong>{email}</strong>
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Validaciones */}
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordChecks.length ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                Mínimo 6 caracteres
              </div>
              <div className={`flex items-center gap-2 ${passwordChecks.match ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordChecks.match ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                Las contraseñas coinciden
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full"
            >
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        </div>

        {/* Link de volver */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};
