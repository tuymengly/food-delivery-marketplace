<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a restaurant owner that one of their orders has just been paid via
 * KHQR and is ready to prepare. Fired once, right after
 * PaymentController::markKhqrPaidIfValid() confirms the PAID transition -
 * never on QR creation, never speculatively.
 *
 * Queued (unlike OtpCodeNotification) because this fires inline during a
 * customer's payment-status poll; the customer's response must not wait on
 * an SMTP round trip.
 */
class OrderPaidNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $total = (float) ($this->order->total_price ?? $this->order->total ?? 0);

        return (new MailMessage)
            ->subject("Order #{$this->order->id} paid - please start preparing")
            ->greeting('New paid order')
            ->line("Order #{$this->order->id} has just been paid via KHQR.")
            ->line('Type: '.ucfirst((string) $this->order->order_type))
            ->line('Total: $'.number_format($total, 2))
            ->action('View orders', rtrim((string) config('marketplace.admin_app_url'), '/').'/restaurant/orders')
            ->line('Please begin preparing this order.');
    }
}
