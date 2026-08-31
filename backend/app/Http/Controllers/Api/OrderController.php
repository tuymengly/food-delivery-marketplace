<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with(['address', 'items.food'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Orders retrieved successfully.',
            'data' => $orders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'address_id' => ['required', 'integer', 'exists:addresses,id'],
        ]);

        $address = $request->user()->addresses()->whereKey($validated['address_id'])->first();

        if (! $address) {
            return response()->json([
                'success' => false,
                'message' => 'The selected address does not belong to this user.',
                'errors' => [
                    'address_id' => ['The selected address is invalid.'],
                ],
            ], 422);
        }

        $cart = $request->user()->cart()->with('items.food')->first();

        if (! $cart || $cart->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot create an order from an empty cart.',
                'errors' => [
                    'cart' => ['The cart is empty.'],
                ],
            ], 422);
        }

        $unavailableItem = $cart->items->first(
            fn (CartItem $item): bool => $item->food === null || $item->food->status !== 'available'
        );

        if ($unavailableItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot create an order with unavailable food.',
                'errors' => [
                    'cart' => ['Please remove unavailable food from the cart.'],
                ],
            ], 422);
        }

        $order = DB::transaction(function () use ($request, $address, $cart): Order {
            $subtotal = round($cart->items->sum(
                fn (CartItem $item): float => (float) $item->food->price * $item->quantity
            ), 2);
            $deliveryFee = Order::DELIVERY_FEE;
            $total = round($subtotal + $deliveryFee, 2);

            $order = $request->user()->orders()->create([
                'address_id' => $address->id,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
            ]);

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'food_id' => $item->food_id,
                    'food_name' => $item->food->name,
                    'price' => $item->food->price,
                    'quantity' => $item->quantity,
                    'subtotal' => round((float) $item->food->price * $item->quantity, 2),
                ]);
            }

            $order->delivery()->create([
                'status' => 'pending',
            ]);

            $cart->items()->delete();

            return $order;
        });

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully.',
            'data' => $order->refresh()->load(['address', 'items.food', 'delivery']),
        ], 201);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $order = $this->findUserOrder($request, $order);

        return response()->json([
            'success' => true,
            'message' => 'Order retrieved successfully.',
            'data' => $order->load(['address', 'items.food', 'delivery.rider.user:id,name,email,role']),
        ]);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        $order = $this->findUserOrder($request, $order);

        if (! in_array($order->status, ['pending', 'confirmed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'This order cannot be cancelled.',
                'errors' => [
                    'status' => ['Only pending or confirmed orders can be cancelled.'],
                ],
            ], 422);
        }

        DB::transaction(function () use ($order): void {
            $order->update(['status' => 'cancelled']);

            if ($order->delivery && in_array($order->delivery->status, ['pending', 'assigned'], true)) {
                $rider = $order->delivery->rider;
                $order->delivery->update(['status' => 'cancelled']);

                if ($rider) {
                    $rider->update(['is_available' => true]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully.',
            'data' => $order->refresh()->load(['address', 'items.food', 'delivery']),
        ]);
    }

    public function assignRider(Request $request, Order $order): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'restaurant'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only authorized users can assign riders.',
                'errors' => [
                    'role' => ['Customers and riders cannot assign riders.'],
                ],
            ], 403);
        }

        $validated = $request->validate([
            'rider_id' => ['required', 'integer', 'exists:riders,id'],
        ]);

        $rider = Rider::findOrFail($validated['rider_id']);

        if ($rider->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'The selected rider is not active.',
                'errors' => [
                    'rider_id' => ['The selected rider must be active.'],
                ],
            ], 422);
        }

        if (! $rider->is_available) {
            return response()->json([
                'success' => false,
                'message' => 'The selected rider is not available.',
                'errors' => [
                    'rider_id' => ['The selected rider must be available.'],
                ],
            ], 422);
        }

        $delivery = $order->delivery()->firstOrCreate([
            'order_id' => $order->id,
        ], [
            'status' => 'pending',
        ]);

        if (in_array($order->status, ['delivered', 'cancelled'], true)
            || ! in_array($delivery->status, ['pending', 'assigned'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'This order cannot be assigned to a rider.',
                'errors' => [
                    'order' => ['Only pending or assigned deliveries can be assigned.'],
                ],
            ], 422);
        }

        DB::transaction(function () use ($delivery, $rider): void {
            if ($delivery->rider && $delivery->rider->isNot($rider)) {
                $delivery->rider->update(['is_available' => true]);
            }

            $delivery->update([
                'rider_id' => $rider->id,
                'status' => 'assigned',
            ]);
            $rider->update(['is_available' => false]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Rider assigned successfully.',
            'data' => $order->refresh()->load(['address', 'items.food', 'delivery.rider.user:id,name,email,role']),
        ]);
    }

    private function findUserOrder(Request $request, Order $order): Order
    {
        return $request->user()->orders()->whereKey($order->id)->firstOrFail();
    }
}
