import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaStore } from 'react-icons/fa';
import { registerUser, saveOtpChallenge } from '../api/app';
import GoogleButton from '../components/GoogleButton';
import brandLogo from '../assets/icon/logo_no_bg.png';

const getGoogleErrorMessages = (t) => ({
  auth_failed: t('authExtra.googleAuthFailed'),
  no_email: t('authExtra.googleNoEmail'),
  not_configured: t('authExtra.googleNotConfiguredSignUp'),
  oauth_exchange_failed: t('authExtra.googleExchangeFailedSignUp'),
  account_error: t('authExtra.googleAccountError'),
  role_not_supported: t('authExtra.googleRoleUnsupportedSignUp'),
});

const readGoogleErrorFromUrl = (t) => {
  const googleError = new URLSearchParams(window.location.search).get('google_error');
  return googleError ? (getGoogleErrorMessages(t)[googleError] || t('authExtra.googleDefaultError')) : '';
};

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'customer', // តម្លៃលំនាំដើមសម្រាប់ customer
    restaurant_name: '',
    restaurant_address: '',
    restaurant_phone: '',
  });
  const [error, setError] = useState(() => readGoogleErrorFromUrl(t));
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
    setError('');

    if (formData.password.length < 8) {
      setError(t('authExtra.passwordMinError'));
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: formData.role,
        ...(formData.role === 'restaurant' && {
          restaurant_name: formData.restaurant_name,
          restaurant_address: formData.restaurant_address,
          restaurant_phone: formData.restaurant_phone,
        }),
      });
      const challenge = saveOtpChallenge(response);
      navigate('/verify-otp', { state: { challenge } });
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors;
      setError(
        validationErrors
          ? Object.values(validationErrors).flat().join(' ')
          : requestError.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="w-50 h-35  rounded-md flex items-center justify-center mx-auto  ">
            <img src={brandLogo} alt="24-Hour Food logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-[#0B1F3A] mb-2">
            {t('authExtra.welcome')}
          </h1>
          <h1 className="text-4xl font-bold text-[#0B1F3A] mb-2">
            {t('authExtra.createAccountTitle')}
          </h1>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-md shadow-sm p-8 border border-[#D1D5DB]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Account type */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.accountType')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-semibold transition ${
                    formData.role === 'customer'
                      ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                      : 'border-[#D1D5DB] bg-white text-gray-600 hover:border-[#0B1F3A]'
                  }`}
                >
                  <FaUser /> {t('authExtra.customer')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'restaurant' })}
                  className={`flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-semibold transition ${
                    formData.role === 'restaurant'
                      ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                      : 'border-[#D1D5DB] bg-white text-gray-600 hover:border-[#0B1F3A]'
                  }`}
                >
                  <FaStore /> {t('authExtra.restaurantOwner')}
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.fullName')}</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-4 py-3 outline-none transition-all text-sm"
                  placeholder={t('authExtra.yourName')}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.emailAddress')}</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-4 py-3 outline-none transition-all text-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Restaurant details (restaurant owner only) */}
            {formData.role === 'restaurant' && (
              <>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.restaurantName')}</label>
                  <div className="relative">
                    <FaStore className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="restaurant_name"
                      value={formData.restaurant_name}
                      onChange={handleChange}
                      className="app-input w-full pl-12 pr-4 py-3 outline-none transition-all text-sm"
                      placeholder={t('authExtra.yourRestaurantName')}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.restaurantAddress')}</label>
                  <input
                    type="text"
                    name="restaurant_address"
                    value={formData.restaurant_address}
                    onChange={handleChange}
                    className="app-input w-full px-4 py-3 outline-none transition-all text-sm"
                    placeholder={t('authExtra.streetCity')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.restaurantPhone')}</label>
                  <input
                    type="text"
                    name="restaurant_phone"
                    value={formData.restaurant_phone}
                    onChange={handleChange}
                    className="app-input w-full px-4 py-3 outline-none transition-all text-sm"
                    placeholder="012 345 678"
                    required
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.password')}</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-12 py-3 outline-none transition-all text-sm"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">{t('authExtra.confirmPassword')}</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-4 py-3 outline-none transition-all text-sm"
                  placeholder={t('authExtra.confirmPasswordPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="app-button-primary w-full py-3 font-bold text-base disabled:opacity-50 mt-2"
            >
              {loading ? t('authExtra.creatingAccount') : t('authExtra.signUp')}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('authExtra.or')}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <GoogleButton role={formData.role} />

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('authExtra.haveAccount')}{' '}
              <Link to="/login" className="text-black hover:text-[#163A63] font-bold">
                {t('authExtra.signUp')}
              </Link>
            </p>
          </div>

        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-gray-900 font-semibold text-sm">
            {'← '}{t('authExtra.backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
