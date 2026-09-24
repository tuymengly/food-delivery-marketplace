import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaQrcode,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaArrowLeft,
  FaDollarSign,
} from 'react-icons/fa';

import {
  createKhqrPayment,
  getPaymentStatus,
} from '../api/app';

// Bakong's transaction-check API enforces its own daily request quota per
// token; a single QR's full lifetime at a 3s interval could burn through an
// entire day's quota in one customer's payment attempt. 5s keeps status
// checks responsive while using noticeably fewer requests.
const POLL_INTERVAL_MS = 5000;
const DEFAULT_EXPIRES_IN_SECONDS = 60;

const bankApps = [
  {
    name: 'ABA',
    className: 'bg-[#005baa] text-white',
    markClassName: 'bg-[#ed1c24]',
  },
  {
    name: 'ACLEDA',
    className: 'bg-[#083b7a] text-white',
    markClassName: 'bg-[#f5c542]',
  },
  {
    name: 'Wing',
    className: 'bg-[#77bc1f] text-white',
    markClassName: 'bg-[#005bac]',
  },
];

const getRemainingSeconds = (expiresAt) => {
  if (!expiresAt) return DEFAULT_EXPIRES_IN_SECONDS;

  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
};

const formatRemainingTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const formatKhqrAmount = (amount) => {
  const value = Number(amount) || 0;

  // Whole-riel style amounts (e.g. 1,300,000) show with no decimals;
  // dollar amounts with cents keep two decimal places.
  const hasCents = Math.round(value * 100) % 100 !== 0;

  return value.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
};

const KhqrPayment = () => {
  const { t } = useTranslation();
  const { paymentId: paymentIdParam } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const [payment, setPayment] = useState(
    location.state?.payment || null
  );

  const [order] = useState(
    location.state?.order || null
  );

  const [loading, setLoading] = useState(
    !location.state?.payment
  );

  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(location.state?.payment?.expires_at)
  );

  const pollRef = useRef(null);

  const paymentId =
    payment?.id || paymentIdParam;

  const status =
    payment?.status || 'pending';

  /*
  |--------------------------------------------------------------------------
  | Stop polling
  |--------------------------------------------------------------------------
  */

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Check payment status
  |--------------------------------------------------------------------------
  */

  const refreshStatus = useCallback(async () => {
    if (!paymentId) return;

    try {
      const response =
        await getPaymentStatus(paymentId);

      const data = response.data;

      setPayment(data);
      setRemainingSeconds(getRemainingSeconds(data.expires_at));
      setError('');

      /*
       * Payment successful
       */
      if (data.status === 'paid') {
        stopPolling();

        setTimeout(() => {
          navigate('/order-success', {
            state: {
              order,
            },
          });
        }, 1200);
      }

      /*
       * Payment failed or expired
       */
      else if (
        data.status === 'failed' ||
        data.status === 'expired'
      ) {
        stopPolling();
      }
    } catch (err) {
      console.error(
        'Error checking payment status:',
        err
      );

      setError(
        err.response?.data?.message ||
          t('khqrPayment.checkError')
      );
    } finally {
      setLoading(false);
    }
  }, [
    paymentId,
    navigate,
    order,
    stopPolling,
    t,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Start polling
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!paymentId) {
      navigate('/cart', {
        replace: true,
      });

      return undefined;
    }

    /*
     * Check immediately after the effect subscribes.
     */
    const initialCheck = setTimeout(() => {
      refreshStatus();
    }, 0);

    /*
     * Then check every 3 seconds
     */
    pollRef.current = setInterval(
      refreshStatus,
      POLL_INTERVAL_MS
    );

    /*
     * Cleanup
     */
    return () => {
      clearTimeout(initialCheck);
      stopPolling();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  /*
  |--------------------------------------------------------------------------
  | Countdown
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (status !== 'pending') return undefined;

    const updateRemainingTime = () => {
      const nextRemainingSeconds =
        getRemainingSeconds(payment?.expires_at);

      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0) {
        setPayment((currentPayment) => ({
          ...currentPayment,
          status: 'expired',
        }));
        stopPolling();
      }
    };

    updateRemainingTime();

    const countdown = setInterval(
      updateRemainingTime,
      1000
    );

    return () => {
      clearInterval(countdown);
    };
  }, [payment?.expires_at, status, stopPolling]);

  /*
  |--------------------------------------------------------------------------
  | Retry payment
  |--------------------------------------------------------------------------
  */

  const handleRetry = async () => {
    if (!order?.remoteId) {
      navigate('/cart');
      return;
    }

    setRetrying(true);
    setError('');

    try {
      const response =
        await createKhqrPayment(
          order.remoteId
        );

      setPayment(response.data);
      setRemainingSeconds(
        getRemainingSeconds(response.data?.expires_at)
      );

      /*
       * Make sure old interval is removed
       */
      stopPolling();

      /*
       * Start new polling
       */
      pollRef.current = setInterval(
        refreshStatus,
        POLL_INTERVAL_MS
      );
    } catch (err) {
      console.error(
        'Error creating KHQR payment:',
        err
      );

      setError(
        err.response?.data?.message ||
          t('khqrPayment.createError')
      );
    } finally {
      setRetrying(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center px-4"
        style={{
          background: 'var(--canvas)',
        }}
      >
        <div className="text-center">

          <div
            className="animate-spin h-10 w-10 border-4 border-slate-200 rounded-full mx-auto"
            style={{
              borderTopColor:
                'var(--brand-navy)',
            }}
          />

          <p
            className="mt-4 text-sm"
            style={{
              color: 'var(--muted)',
            }}
          >
            {t('khqrPayment.preparing')}
          </p>

        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Amount
  |--------------------------------------------------------------------------
  */

  const amount = payment
    ? formatKhqrAmount(payment.amount)
    : '0';

  const payerName =
    payment?.payer_name ||
    payment?.merchant_name ||
    order?.customerName ||
    t('khqrPayment.payerFallback', {
      defaultValue: 'KHQR Payment',
    });

  const remainingPercent = Math.max(
    0,
    Math.min(100, (remainingSeconds / DEFAULT_EXPIRES_IN_SECONDS) * 100)
  );

  /*
  |--------------------------------------------------------------------------
  | Main UI
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="w-full min-h-screen pt-20 pb-16 px-4 sm:px-6"
      style={{
        background: 'var(--canvas)',
      }}
    >

      <div className="max-w-md mx-auto">

        {/* =========================================================
            BACK BUTTON
        ========================================================= */}

        <button
          onClick={() =>
            navigate('/cart')
          }
          className="flex items-center gap-2 text-sm font-semibold mb-5 cursor-pointer"
          style={{
            color: 'var(--muted)',
          }}
        >
          <FaArrowLeft />

          {t('khqrPayment.backCart')}
        </button>


        {/* =========================================================
            MAIN PAYMENT CONTAINER
        ========================================================= */}

        <div
          className="bg-white border rounded-2xl p-5 sm:p-7 shadow-sm"
          style={{
            borderColor: 'var(--line)',
          }}
        >

          {/* =======================================================
              TITLE
          ======================================================= */}

          <div className="text-center mb-6">

            <div className="flex items-center justify-center gap-2">

              <FaQrcode
                style={{
                  color:
                    'var(--brand-navy)',
                }}
              />

              <h1
                className="text-xl font-bold"
                style={{
                  color:
                    'var(--brand-navy)',
                }}
              >
                {t('khqrPayment.title')}
              </h1>

            </div>

            <p
              className="text-xs mt-2"
              style={{
                color: 'var(--muted)',
              }}
            >
              {t('khqrPayment.orderNumber', {
                id: payment?.order_id ?? order?.remoteId ?? t('khqrPayment.noOrderId'),
              })}
            </p>

          </div>


          {/* =======================================================
              KHQR CARD
          ======================================================= */}

          {status === 'pending' && (
            <div className="flex justify-center">

              <div
                className="w-[290px] bg-white rounded-xl overflow-hidden shadow-md border"
                style={{
                  borderColor: '#e5e7eb',
                }}
              >

                {/* -------------------------------------------------
                    KHQR RED HEADER
                ------------------------------------------------- */}

                <div
                  className="relative h-11 flex items-center justify-center"
                  style={{
                    background:
                      '#ed1c24',
                  }}
                >

                  <span className="text-white font-bold text-sm tracking-wide">
                    KHQR
                  </span>

                  {/* Folded corner */}
                  <div
                    className="absolute right-0 bottom-0"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop:
                        '18px solid transparent',
                      borderRight:
                        '18px solid white',
                    }}
                  />

                </div>


                {/* -------------------------------------------------
                    PAYMENT CONTENT
                ------------------------------------------------- */}

                <div className="px-5 pt-4 pb-5">

                  {/* --------------------------------------------
                      PAYER NAME + AMOUNT (left aligned, like
                      a real KHQR sticker)
                  -------------------------------------------- */}

                  <div className="text-left">

                    <p
                      className="text-sm font-medium truncate"
                      style={{
                        color: '#111827',
                      }}
                      title={payerName}
                    >
                      {payerName}
                    </p>

                    <p
                      className="text-3xl font-extrabold mt-1 tracking-tight"
                      style={{
                        color: '#111827',
                      }}
                    >
                      $ {amount}
                    </p>

                  </div>

                  {/* Dashed separator */}
                  <div
                    className="border-t border-dashed mt-4"
                    style={{
                      borderColor: '#d1d5db',
                    }}
                  />


                  {/* ------------------------------------------------
                      COUNTDOWN
                  ------------------------------------------------ */}

                  <div
                    className="mt-4 rounded-lg px-3 py-2"
                    style={{
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-[10px] font-semibold uppercase"
                        style={{
                          color: '#9a3412',
                        }}
                      >
                        {t('khqrPayment.expiresIn', {
                          defaultValue: 'Expires in',
                        })}
                      </span>

                      <span
                        className="font-mono text-sm font-bold tabular-nums"
                        style={{
                          color: '#c2410c',
                        }}
                      >
                        {formatRemainingTime(remainingSeconds)}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${remainingPercent}%`,
                          background: '#f97316',
                        }}
                      />
                    </div>
                  </div>


                  {/* ------------------------------------------------
                      QR CODE (with centered dollar badge)
                  ------------------------------------------------ */}

                  <div className="flex justify-center mt-4">

                    <div
                      className="relative bg-white p-2 rounded-md"
                      style={{
                        border:
                          '1px solid #f1f1f1',
                      }}
                    >

                      {payment?.qr_image ? (

                        /*
                         * Use the actual KHQR image
                         * returned by backend.
                         */
                        <img
                          src={
                            payment.qr_image
                          }
                          alt={t('khqrPayment.imageAlt')}
                          className="w-[190px] h-[190px] object-contain"
                        />

                      ) : payment?.qr_string ? (

                        /*
                         * Fallback:
                         * Generate QR from qr_string.
                         */
                        <QRCodeSVG
                          value={
                            payment.qr_string
                          }
                          size={190}
                          level="H"
                          includeMargin={
                            false
                          }
                        />

                      ) : (

                        <div
                          className="w-[190px] h-[190px] flex items-center justify-center text-xs text-center"
                          style={{
                            color:
                              '#9ca3af',
                          }}
                        >
                          {t('khqrPayment.noQr')}
                        </div>

                      )}

                      {/* Center dollar badge overlay, like the
                          reference KHQR sticker. Only shown once
                          a QR is actually rendered. */}
                      {(payment?.qr_image || payment?.qr_string) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center"
                            style={{
                              background: '#111827',
                              border: '3px solid white',
                            }}
                          >
                            <FaDollarSign className="text-white text-sm" />
                          </div>
                        </div>
                      )}

                    </div>

                  </div>


                  {/* ------------------------------------------------
                      INSTRUCTION
                  ------------------------------------------------ */}

                  <div className="text-center mt-4">

                    <p
                      className="text-[11px] font-semibold"
                      style={{
                        color: '#4b5563',
                      }}
                    >
                      {t('khqrPayment.scanToPay')}
                    </p>

                    <p
                      className="text-[9px] mt-1 leading-relaxed"
                      style={{
                        color: '#9ca3af',
                      }}
                    >
                      {t('khqrPayment.instruction')}
                    </p>

                  </div>


                  {/* ------------------------------------------------
                      BANK LOGOS / SUPPORTED APPS
                  ------------------------------------------------ */}

                  

                </div>

              </div>

            </div>
          )}


          {/* =======================================================
              PAID STATE
          ======================================================= */}

          {status === 'paid' && (

            <div className="text-center py-8">

              <div className="flex justify-center mb-5">

                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      '#dcfce7',
                  }}
                >

                  <FaCheckCircle
                    className="text-6xl"
                    style={{
                      color:
                        '#16a34a',
                    }}
                  />

                </div>

              </div>

              <h2
                className="text-xl font-bold"
                style={{
                  color: '#16a34a',
                }}
              >
                {t('khqrPayment.success')}
              </h2>

              <p
                className="text-sm mt-2"
                style={{
                  color: 'var(--muted)',
                }}
              >
                {t('khqrPayment.thankYou')}
              </p>

              <p
                className="text-2xl font-bold mt-4"
                style={{
                  color: 'var(--ink)',
                }}
              >
                ${amount}
              </p>

              <p
                className="text-xs mt-2"
                style={{
                  color: 'var(--muted)',
                }}
              >
                {t('khqrPayment.redirecting')}
              </p>

            </div>

          )}


          {/* =======================================================
              FAILED STATE
          ======================================================= */}

          {status === 'failed' && (

            <div className="text-center py-8">

              <div className="flex justify-center mb-5">

                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      '#fee2e2',
                  }}
                >

                  <FaTimesCircle
                    className="text-6xl"
                    style={{
                      color:
                        '#dc2626',
                    }}
                  />

                </div>

              </div>

              <h2
                className="text-xl font-bold"
                style={{
                  color: '#dc2626',
                }}
              >
                {t('khqrPayment.failed')}
              </h2>

              {payment?.failed_reason && (
                <p
                  className="text-xs mt-3"
                  style={{
                    color: '#dc2626',
                  }}
                >
                  {payment.failed_reason}
                </p>
              )}

            </div>

          )}


          {/* =======================================================
              EXPIRED STATE
          ======================================================= */}

          {status === 'expired' && (

            <div className="text-center py-8">

              <div className="flex justify-center mb-5">

                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      '#fef3c7',
                  }}
                >

                  <FaHourglassHalf
                    className="text-6xl"
                    style={{
                      color:
                        '#b45309',
                    }}
                  />

                </div>

              </div>

              <h2
                className="text-xl font-bold"
                style={{
                  color: '#b45309',
                }}
              >
                {t('khqrPayment.expired')}
              </h2>

              <p
                className="text-sm mt-2"
                style={{
                  color: 'var(--muted)',
                }}
              >
                {t('khqrPayment.createNew')}
              </p>

            </div>

          )}


          {/* =======================================================
              STATUS MESSAGE
          ======================================================= */}

          {status === 'pending' && (

            <div
              className="mt-6 rounded-lg px-4 py-3"
              style={{
                background:
                  '#f8fafc',
                border:
                  '1px solid #e5e7eb',
              }}
            >

              <div className="flex items-center justify-center gap-2">

                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{
                    background:
                      'var(--brand-navy)',
                  }}
                />

                <p
                  className="text-xs font-semibold"
                  style={{
                    color:
                      'var(--brand-navy)',
                  }}
                >
                  {t('khqrPayment.waiting')}
                </p>

              </div>

              <p
                className="text-[10px] text-center mt-2 leading-relaxed"
                style={{
                  color:
                    'var(--muted)',
                }}
              >
                {t('khqrPayment.waitingHelp')}
              </p>

              {payment?.verification_notice && (
                <p
                  className="text-[10px] text-center mt-2 leading-relaxed font-semibold"
                  style={{
                    color: '#b45309',
                  }}
                >
                  {payment.verification_notice}
                </p>
              )}

            </div>

          )}


          {/* =======================================================
              ERROR
          ======================================================= */}

          {error && (

            <div
              className="mt-4 p-3 rounded-lg"
              style={{
                background:
                  '#fef2f2',
                border:
                  '1px solid #fecaca',
              }}
            >

              <p
                className="text-xs text-center"
                style={{
                  color:
                    '#dc2626',
                }}
              >
                {error}
              </p>

            </div>

          )}


          {/* =======================================================
              RETRY BUTTONS
          ======================================================= */}

          {(status === 'failed' ||
            status === 'expired') && (

            <div className="mt-6 flex flex-col gap-3">

              <button
                onClick={handleRetry}
                disabled={retrying}
                className="app-button-primary w-full py-3 font-bold text-sm rounded-lg disabled:opacity-60"
              >

                {retrying
                  ? t('khqrPayment.creating')
                  : t('khqrPayment.retry')}

              </button>


              <button
                onClick={() =>
                  navigate('/cart')
                }
                className="w-full py-3 font-semibold text-sm border rounded-lg cursor-pointer"
                style={{
                  color:
                    'var(--muted)',
                  borderColor:
                    'var(--line)',
                }}
              >
                {t('khqrPayment.chooseDifferent')}
              </button>

            </div>

          )}

        </div>


        {/* =========================================================
            FOOTER
        ========================================================= */}

        <p
          className="text-center text-[10px] mt-5"
          style={{
            color: 'var(--muted)',
          }}
        >
          {t('khqrPayment.secured')}
        </p>

      </div>

    </div>
  );
};

export default KhqrPayment;