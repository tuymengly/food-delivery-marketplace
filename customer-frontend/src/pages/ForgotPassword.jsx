import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import { forgotPassword, saveOtpChallenge } from '../api/app';
import brandLogo from '../assets/icon/logo_no_bg.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const challenge = saveOtpChallenge(await forgotPassword(email));
      navigate('/verify-otp', { state: { challenge } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
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
          <h1 className="text-4xl font-bold text-[#0B1F3A] mb-2">Forgot Password</h1>
          <p className="text-gray-600">
            Enter your account email and we'll send you a 6-digit code to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-md shadow-sm p-8 border border-[#D1D5DB]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="app-input w-full pl-12 pr-4 py-3 outline-none transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="app-button-primary w-full py-3 font-bold text-lg disabled:opacity-50"
            >
              {loading ? 'Sending code...' : 'Send reset code'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-semibold">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
