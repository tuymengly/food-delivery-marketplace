<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Rider;
use App\Services\RiderMatchingService;
use App\Support\OrderStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RiderDeliveryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($response = $this->ensureRider($request)) {
            return $response;
        }

        $deliveries = $request->user()
            ->rider
            ->deliveries()
            ->with(['order.address', 'order.restaurant', 'order.items.food'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Rider deliveries retrieved successfully.',
            'data' => $deliveries,
        ]);
    }

    public function show(Request $request, Delivery $delivery): JsonResponse
    {
        if ($response = $this->ensureRider($request)) {
            return $response;
        }

        $delivery = $this->findRiderDelivery($request->user()->rider, $delivery);

        return response()->json([
            'success' => true,
            'message' => 'Rider delivery retrieved successfully.',
            'data' => $delivery->load(['order.address', 'order.restaurant', 'order.items.food']),
        ]);
    }

    public function accept(Request $request, Delivery $delivery): JsonResponse
    {
        if ($response = $this->ensureRider($request)) {
            return $response;
        }

        $delivery = $this->findRiderDelivery($request->user()->rider, $delivery);

        if ($delivery->status !== 'assigned') {
            return $this->invalidTransition('Only assigned deliveries can be accepted.');
        }

        // A delivery is only ever assigned once the restaurant marked the order
        // READY_FOR_PICKUP, so an order still with the restaurant can never be
        // accepted here. Re-checking it makes that rule explicit (and guards
        // against any manually edited/legacy row).
        if ($delivery->order && ! OrderStatuses::isReadyForPickup($delivery->order->status)) {
            return $this->invalidTransition('This order is not ready for pickup yet.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Delivery accepted successfully.',
            'data' => $delivery->load(['order.address', 'order.restaurant', 'order.items.food']),
        ]);
    }

    public function pickup(Request $request, Delivery $delivery): JsonResponse
    {
        if ($response = $this->ensureRider($request)) {
            return $response;
        }

        $delivery = $this->findRiderDelivery($request->user()->rider, $delivery);

        if ($delivery->status !== 'assigned') {
            return $this->invalidTransition('Only assigned deliveries can be picked up.');
        }

        $delivery->update([
            'status' => 'picked_up',
            'picked_up_at' => now(),
        ]);
        $order = $delivery->order;
        if (OrderStatuses::isForwardOrSame($order->status, OrderStatuses::DELIVERING)) {
            $order->update(['status' => OrderStatuses::DELIVERING]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Delivery picked up successfully.',
            'data' => $delivery->refresh()->load(['order.address', 'order.restaurant', 'order.items.food']),
        ]);
    }

    public function start(Request $request, Delivery $delivery): JsonResponse
    {
        if ($response = $this->ensureRider($request)) {
            return $response;
        }

        $delivery = $this->findRiderDelivery($request->user()->rider, $delivery);

        if ($delivery->status !== 'picked_up') {
            return $this->invalidTransition('Only picked up deliveries can be started.');
        }

        $delivery->update(['status' => 'delivering']);
        $delivery->order()->update(['status' => 'delivering']);

        return response()->json([
            'success' => true,
            'message' => 'Delivery started successfully.',
            'data' => $delivery->refresh()->load(['order.address', 'order.restaurant', 'order.items.food']),
        ]);
    }

    public function deliver(Request $request, Delivery $delivery): JsonResponse
    {
        if ($response = $this->ensureRider($request)) {
            return $response;
        }

        $rider = $request->user()->rider;
        $delivery = $this->findRiderDelivery($rider, $delivery);

        if ($delivery->status !== 'delivering') {
            return $this->invalidTransition('Only delivering deliveries can be completed.');
        }

        DB::transaction(function () use ($delivery, $rider): void {
            $delivery->update([
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);
            $delivery->order()->update(['status' => 'delivered']);
            // Deliberately a query-based update (not $rider->update(...)): a
            // model cached earlier in the request can be stale and Eloquent
            // skips the write when the attribute isn't dirty, silently leaving
            // the rider BUSY forever.
            Rider::whereKey($rider->id)->update(['is_available' => true]);
        });

        // Completing the delivery makes this rider available again, which is
        // the trigger for the "nobody was eligible when the restaurant marked
        // it ready" retry: a waiting READY_FOR_PICKUP order can be matched to
        // them right away instead of sitting there.
        app(RiderMatchingService::class)->assignWaitingDeliveryToRider($rider->refresh());

        return response()->json([
            'success' => true,
            'message' => 'Delivery completed successfully.',
            'data' => $delivery->refresh()->load(['order.address', 'order.restaurant', 'order.items.food']),
        ]);
    }

    private function ensureRider(Request $request): ?JsonResponse
    {
        if (strtolower((string) $request->user()->role) !== 'rider') {
            return response()->json([
                'success' => false,
                'message' => 'Only riders can access this endpoint.',
                'errors' => [
                    'role' => ['The authenticated user must have the rider role.'],
                ],
            ], 403);
        }

        if (! $request->user()->rider) {
            return response()->json([
                'success' => false,
                'message' => 'Rider profile not found.',
                'errors' => [
                    'profile' => ['Create a rider profile first.'],
                ],
            ], 404);
        }

        return null;
    }

    private function findRiderDelivery(Rider $rider, Delivery $delivery): Delivery
    {
        return $rider->deliveries()->whereKey($delivery->id)->firstOrFail();
    }

    private function invalidTransition(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Invalid delivery status transition.',
            'errors' => [
                'status' => [$message],
            ],
        ], 422);
    }
}
