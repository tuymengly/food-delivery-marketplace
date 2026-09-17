import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { FaQrcode, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaArrowLeft, FaCreditCard } from 'react-icons/fa';
import { createPayWayPayment, getPaymentStatus } from '../api/app';

const POLL_INTERVAL_MS = 3000;

const STATUS_META = {
  pending: { label: 'Waiting for payment...', color: 'var(--brand-navy)' },
  paid: { label: 'Payment received!', color: '#16a34a' },
  failed: { label: 'Payment failed', color: '#dc2626' },
  expired: { label: 'QR code expired', color: '#b45309' },
};

const KhqrPayment = () => {
  const { paymentId: paymentIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [payment, setPayment] = useState(location.state?.payment || null);
  const [order] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.payment);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef(null);

  const paymentId = payment?.id || paymentIdParam;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!paymentId) return;
    try {
      const response = await getPaymentStatus(paymentId);
      const data = response.data;
      setPayment(data);
      setError('');

      if (data.status === 'paid') {
        stopPolling();
        setTimeout(() => navigate('/order-success', { state: { order } }), 1200);
      } else if (data.status === 'failed' || data.status === 'expired') {
        stopPolling();
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError(err.response?.data?.message || 'Unable to check payment status.');
    } finally {
      setLoading(false);
    }
  }, [paymentId, navigate, order, stopPolling]);

  useEffect(() => {
    if (!paymentId) {
      navigate('/cart', { replace: true });
      return undefined;
    }

    refreshStatus();
    pollRef.current = setInterval(refreshStatus, POLL_INTERVAL_MS);

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const handleRetry = async () => {
    if (!order?.remoteId) {
      navigate('/cart');
      return;
    }
    setRetrying(true);
    setError('');
    try {
      const response = await createPayWayPayment(order.remoteId, payment?.payment_method || 'khqr');
      setPayment(response.data);
      pollRef.current = setInterval(refreshStatus, POLL_INTERVAL_MS);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start a new PayWay payment.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--canvas)' }}>
        <div className="animate-spin h-12 w-12 border-4 border-slate-200 rounded-full" style={{ borderTopColor: 'var(--brand-navy)' }} />
      </div>
    );
  }

  const status = payment?.status || 'pending';
  const meta = STATUS_META[status] || STATUS_META.pending;
  const isCard = payment?.payment_method === 'card';

  return (
    <div className="w-full min-h-screen pt-20 pb-16 px-4 sm:px-6 md:px-14" style={{ background: 'var(--canvas)' }}>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-sm font-semibold mb-4 cursor-pointer"
          style={{ color: 'var(--muted)' }}
        >
          <FaArrowLeft /> Back to cart
        </button>

        <div className="bg-white border p-6 sm:p-8 text-center" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {isCard ? <FaCreditCard style={{ color: 'var(--brand-navy)' }} /> : <FaQrcode style={{ color: 'var(--brand-navy)' }} />}
            <h1 className="text-xl font-bold" style={{ color: 'var(--brand-navy)' }}>
              {isCard ? 'Pay with Card' : 'Pay with ABA KHQR'}
            </h1>
          </div>
          <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>
            Order #{payment?.order_id ?? order?.remoteId ?? '—'}
          </p>

          {status === 'pending' && payment?.qr_image && (
            <div className="flex justify-center mb-6">
              <img src={payment.qr_image} alt="ABA KHQR payment code" className="w-[240px] max-w-full border" style={{ borderColor: 'var(--line)' }} />
            </div>
          )}

          {status === 'pending' && !payment?.qr_image && payment?.qr_string && (
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border-2" style={{ borderColor: 'var(--line)' }}>
                <QRCodeSVG value={payment.qr_string} size={220} level="M" includeMargin={false} />
              </div>
            </div>
          )}

          {status === 'pending' && payment?.deeplink && (
            <a href={payment.deeplink} className="app-button-primary inline-block w-full py-3 mb-3 font-bold text-sm">
              Open ABA Mobile
            </a>
          )}

          {status === 'pending' && payment?.checkout_url && (
            <a href={payment.checkout_url} target="_blank" rel="noreferrer" className="app-button-primary inline-block w-full py-3 mb-3 font-bold text-sm">
              Open PayWay Checkout
            </a>
          )}

          {status === 'pending' && isCard && payment?.checkout_html && (
            <div className="mb-6 overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
              <iframe
                title="ABA PayWay card checkout"
                srcDoc={payment.checkout_html}
                className="w-full h-[520px] bg-white"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
              />
            </div>
          )}

          {status === 'paid' && (
            <div className="flex justify-center mb-6">
              <FaCheckCircle className="text-7xl" style={{ color: '#16a34a' }} />
            </div>
          )}

          {status === 'failed' && (
            <div className="flex justify-center mb-6">
              <FaTimesCircle className="text-7xl" style={{ color: '#dc2626' }} />
            </div>
          )}

          {status === 'expired' && (
            <div className="flex justify-center mb-6">
              <FaHourglassHalf className="text-7xl" style={{ color: '#b45309' }} />
            </div>
          )}

          <div className="mb-4">
            <p className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>
              {payment ? `$${Number(payment.amount).toFixed(2)}` : '—'}
              <span className="text-sm font-semibold ml-1" style={{ color: 'var(--muted)' }}>{payment?.currency}</span>
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-sm mb-2 border-l-2"
            style={{ background: `${meta.color}15`, color: meta.color, borderColor: meta.color }}
          >
            {status === 'pending' && (
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: meta.color }} />
            )}
            {meta.label}
          </div>

          {status === 'pending' && (
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              {isCard
                ? 'Complete the secure PayWay checkout. This page updates after Laravel verifies the transaction.'
                : 'Open your bank or payment app, scan this code, and confirm the payment. This page updates automatically.'}
            </p>
          )}

          {payment?.failed_reason && (
            <p className="text-xs mt-3" style={{ color: '#dc2626' }}>{payment.failed_reason}</p>
          )}

          {error && <p className="text-xs mt-3" style={{ color: '#dc2626' }}>{error}</p>}

          {(status === 'failed' || status === 'expired') && (
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="app-button-primary w-full py-3 font-bold text-sm disabled:opacity-60"
              >
                {retrying ? 'Starting payment...' : 'Start a new PayWay payment'}
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="w-full py-3 font-semibold text-sm border cursor-pointer"
                style={{ color: 'var(--muted)', borderColor: 'var(--line)' }}
              >
                Choose another payment method
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KhqrPayment;