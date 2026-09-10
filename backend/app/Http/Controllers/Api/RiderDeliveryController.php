<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Rider;
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
            ->with(['order.address', 'order.items.food'])
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
            'data' => $delivery->load(['order.address', 'order.items.food']),
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

        return response()->json([
            'success' => true,
            'message' => 'Delivery accepted successfully.',
            'data' => $delivery->load(['order.address', 'order.items.food']),
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
            'data' => $delivery->refresh()->load(['order.address', 'order.items.food']),
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
            'data' => $delivery->refresh()->load(['order.address', 'order.items.food']),
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
            $rider->update(['is_available' => true]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Delivery completed successfully.',
            'data' => $delivery->refresh()->load(['order.address', 'order.items.food']),
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
