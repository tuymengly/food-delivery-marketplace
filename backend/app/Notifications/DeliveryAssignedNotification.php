<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a rider they've just been assigned a delivery order. Sent by
 * RiderMatchingService the moment it actually assigns this specific rider to
 * this specific order - either automatically (the restaurant marked the order
 * READY_FOR_PICKUP and this rider was the nearest eligible one) or through the
 * rider claiming a ready order from the open pool - never speculatively, and
 * never to every rider.
 *
 * Queued (ShouldQueue) so a slow mail server can never delay the
 * restaurant/rider request that triggered the assignment.
 */
class DeliveryAssignedNotification extends Notification implements ShouldQueue
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
        return (new MailMessage)
            ->subject("New delivery - Order #{$this->order->id} ready for pickup")
            ->greeting('You have a new delivery')
            ->line("Order #{$this->order->id} is ready for pickup and has been assigned to you.")
            ->line('Restaurant: '.($this->order->restaurant->name ?? 'N/A'))
            ->line('Pickup address: '.($this->order->restaurant->address ?? 'N/A'))
            ->action('View delivery', rtrim((string) config('marketplace.admin_app_url'), '/').'/driver/dashboard')
            ->line('Please head to the restaurant to pick up this order.');
    }
}
