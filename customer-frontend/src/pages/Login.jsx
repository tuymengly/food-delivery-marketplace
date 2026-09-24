import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { completeLogin, loginUser } from '../api/app';
import GoogleButton from '../components/GoogleButton';
import brandLogo from '../assets/icon/logo_no_bg.png';

const getGoogleErrorMessages = (t) => ({
  auth_failed: t('authExtra.googleAuthFailed'),
  no_email: t('authExtra.googleNoEmail'),
  not_configured: t('authExtra.googleNotConfiguredSignIn'),
  oauth_exchange_failed: t('authExtra.googleExchangeFailedSignIn'),
  account_error: t('authExtra.googleAccountError'),
  role_not_supported: t('authExtra.googleRoleUnsupportedSignIn'),
});

const readGoogleErrorFromUrl = (t) => {
  const googleError = new URLSearchParams(window.location.search).get('google_error');
  return googleError ? (getGoogleErrorMessages(t)[googleError] || t('authExtra.googleDefaultError')) : '';
};

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(() => readGoogleErrorFromUrl(t));
  const [successMessage] = useState(() =>
    location.state?.passwordResetSuccess
      ? t('authExtra.passwordResetSuccess')
      : ''
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('google_error')) {
      params.delete('google_error');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Laravel authenticates the credentials and answers with the user and
      // its role. completeLogin() re-confirms that user via GET /api/user
      // before redirecting, so the dashboard is chosen by the database role -
      // never by anything a previous session left in localStorage.
      await completeLogin(await loginUser(formData), navigate);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-md flex items-center justify-center mx-auto mb-4">
            <img src={brandLogo} alt="24-Hour Food logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">
            {t('authExtra.welcomeBack')}
          </h1>
          <p className="text-gray-600 text-sm">{t('authExtra.signInContinue')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-[#E5E7EB]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">{t('authExtra.emailAddress')}</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-4 py-3 rounded-lg border border-[#D1D5DB] outline-none transition-all focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">{t('authExtra.password')}</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-12 py-3 rounded-lg border border-[#D1D5DB] outline-none transition-all focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10"
                  placeholder={t('authExtra.enterPassword')}
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
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-[#2563EB] hover:text-[#163A63]">
                  {t('authExtra.forgotPassword')}
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="app-button-primary w-full py-3 rounded-lg font-bold text-base transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('authExtra.signingIn') : t('authExtra.signIn')}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('authExtra.or')}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <GoogleButton role="customer" />

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('authExtra.noAccount')}{' '}
              <Link to="/register" className="text-black hover:text-[#163A63] font-bold">
                {t('authExtra.signUp')}
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-gray-900 font-semibold">
            {'← '}{t('authExtra.backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;