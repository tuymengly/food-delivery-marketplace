import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  clearOtpChallenge,
  completeLogin,
  getStoredOtpChallenge,
  resendOtp,
  saveOtpChallenge,
  verifyOtp,
} from '../api/app';
import brandLogo from '../assets/icon/logo_no_bg.png';

const challengeFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const challengeToken = params.get('challenge');
  const purpose = params.get('purpose');

  if (!challengeToken || !purpose) return null;

  return {
    challenge_token: challengeToken,
    purpose,
    masked_email: params.get('email') || '',
    expires_in: 300,
    resend_available_in: 60,
  };
};

const VerifyOtp = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(() =>
    location.state?.challenge || challengeFromUrl() || getStoredOtpChallenge()
  );
  const [code, setCode] = useState('');
  const [error, setError] = useState(() =>
    challenge ? '' : t('authExtra.verifyMissing')
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(() => challenge?.resend_available_in || 0);

  useEffect(() => {
    if (challenge) saveOtpChallenge(challenge);
  }, [challenge]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendIn]);

  const finishAuthentication = async (response) => {
    // Registration and Google sign-in complete here too: the role comes from
    // Laravel's OTP-verify response (re-confirmed via GET /api/user inside
    // completeLogin), so every login path routes the same way.
    await completeLogin(response, navigate);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!challenge) return;

    setError('');
    setLoading(true);

    try {
      const response = await verifyOtp({
        challenge_token: challenge.challenge_token,
        purpose: challenge.purpose,
        code,
      });

      if (challenge.purpose === 'password_reset') {
        // Verifying a password-reset code never issues a Sanctum token -
        // it only proves the code was correct. The next step (setting the
        // new password) still needs the challenge_token as proof of that.
        clearOtpChallenge();
        navigate('/reset-password', { state: { challengeToken: challenge.challenge_token } });
        return;
      }

      clearOtpChallenge();
      await finishAuthentication(response);
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

  const handleResend = async () => {
    if (!challenge || resendIn > 0) return;

    setError('');
    setResending(true);

    try {
      const nextChallenge = saveOtpChallenge(await resendOtp({
        challenge_token: challenge.challenge_token,
        purpose: challenge.purpose,
      }));
      setChallenge(nextChallenge);
      setCode('');
    } catch (requestError) {
      const retryAfter = requestError.response?.data?.retry_after;
      if (retryAfter) setResendIn(Number(retryAfter));
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-40 h-40 rounded-md flex items-center justify-center mx-auto mb-4">
            <img src={brandLogo} alt="24-Hour Food logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-[#0B1F3A] mb-2">
            {challenge?.purpose === 'password_reset' ? t('authExtra.verifyCodeTitle') : t('authExtra.verifyEmailTitle')}
          </h1>
          <p className="text-gray-600">
            {t('authExtra.codeSentTo', { email: challenge?.masked_email || t('authExtra.yourEmailAddress') })}
          </p>
        </div>

        <div className="bg-white rounded-md shadow-sm p-8 border border-[#D1D5DB]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          {challenge ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-gray-700 font-semibold" htmlFor="otp-code">
                {t('authExtra.verificationCode')}
              </label>
              <input
                id="otp-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                className="app-input w-full px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none"
                placeholder="000000"
                required
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="app-button-primary w-full py-3 font-bold text-lg disabled:opacity-50"
              >
                {loading ? t('authExtra.verifying') : t('authExtra.verifyCode')}
              </button>
            </form>
          ) : null}

          {challenge && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendIn > 0}
              className="w-full mt-5 text-sm font-semibold text-[#0B1F3A] disabled:text-gray-400"
            >
              {resending ? t('authExtra.sending') : resendIn > 0 ? t('authExtra.resendIn', { seconds: resendIn }) : t('authExtra.resendCode')}
            </button>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-semibold">
              {t('authExtra.backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
