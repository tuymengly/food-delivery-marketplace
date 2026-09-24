<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells the customer their order was rejected/cancelled by the restaurant (or
 * an admin) before any rider was assigned. The order status is already
 * CANCELLED when this fires, no rider ever saw the order, and the existing
 * payment record (payments.status / orders.payment_status) is left intact so
 * the platform's own refund follow-up still has its source of truth.
 *
 * Queued (ShouldQueue), like the other marketplace mails, so the
 * restaurant's reject request never waits on SMTP.
 */
class OrderRejectedNotification extends Notification implements ShouldQueue
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
            ->subject("Order #{$this->order->id} was cancelled")
            ->greeting('Your order was cancelled')
            ->line("Order #{$this->order->id} at ".($this->order->restaurant->name ?? 'the restaurant').' was cancelled.')
            ->line('Total: $'.number_format($total, 2))
            ->line('No rider was assigned and this order will not be delivered.')
            ->action('View your orders', rtrim((string) config('marketplace.admin_app_url'), '/'))
            ->line('If you already paid for this order, your payment record has been kept so our team can follow up with the refund.');
    }
}
