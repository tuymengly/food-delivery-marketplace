import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { clearOtpChallenge, resetPassword } from '../api/app';
import brandLogo from '../assets/icon/logo_no_bg.png';

const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const challengeToken = location.state?.challengeToken;

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState(() =>
    challengeToken ? '' : t('authExtra.resetMissing')
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!challengeToken) return;

    if (password.length < 8) {
      setError(t('authExtra.passwordMinError'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword({
        challenge_token: challengeToken,
        password,
        password_confirmation: passwordConfirmation,
      });
      clearOtpChallenge();
      navigate('/login', { state: { passwordResetSuccess: true } });
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors;
      setError(
        validationErrors
          ? Object.values(validationErrors).flat().join(' ')
          : requestError.response?.data?.message || requestError.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-40 h-40 rounded-md flex items-center justify-center mx-auto mb-4">
            <img src={brandLogo} alt="24-Hour Food logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-[#0B1F3A] mb-2">{t('authExtra.resetTitle')}</h1>
          <p className="text-gray-600">{t('authExtra.resetIntro')}</p>
        </div>

        <div className="bg-white rounded-md shadow-sm p-8 border border-[#D1D5DB]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          {challengeToken ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('authExtra.newPassword')}</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="app-input w-full pl-12 pr-12 py-3 outline-none transition-all"
                    placeholder={t('authExtra.passwordMin')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('authExtra.confirmNewPassword')}</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    className="app-input w-full pl-12 pr-4 py-3 outline-none transition-all"
                    placeholder={t('authExtra.confirmNewPasswordPlaceholder')}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="app-button-primary w-full py-3 font-bold text-lg disabled:opacity-50"
              >
                {loading ? t('authExtra.saving') : t('authExtra.resetPassword')}
              </button>
            </form>
          ) : null}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-semibold">
              {'← '}{t('authExtra.backSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
