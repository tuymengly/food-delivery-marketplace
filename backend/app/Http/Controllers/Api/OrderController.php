<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Category;
use App\Models\Food;
use App\Models\Address;
use App\Models\Delivery;
use App\Models\Rider;
use App\Models\Voucher;
use App\Notifications\OrderRejectedNotification;
use App\Services\OrderFinanceCalculator;
use App\Services\RiderMatchingService;
use App\Support\OrderStatuses;
use App\Support\PaymentStatuses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class OrderController extends Controller
{
    /**
     * Get List of Orders
     */
   /**
     * Get List of Orders
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'restaurant', 'items.food.category', 'delivery.rider.user'])->latest();

        $user = $request->user() ?: auth('sanctum')->user();

        $role = strtolower((string) $user?->role);

        if ($request->is('api/restaurant/orders') && !in_array($role, ['admin', 'super_admin', 'super admin', 'restaurant', 'restaurant admin'], true)) {
            abort(403, 'Only restaurant owners and administrators can access restaurant orders.');
        }

        if (in_array($role, ['admin', 'super_admin', 'super admin'], true)) {
            // Administrators may review all orders.
        } elseif (in_array($role, ['restaurant', 'restaurant admin'], true)) {
            $ownedRestaurantIds = Restaurant::where('user_id', $user->id)->pluck('id');
            $query->whereIn('restaurant_id', $ownedRestaurantIds);
        } else {
            $query->where('user_id', $user->id);
        }

        $orders = $query->get()->map(function ($order) {
            $itemsFormatted = $order->items->map(function ($item) {
                return ($item->food->name ?? 'Item') . ' × ' . $item->quantity;
            })->implode(', ');

            $isPickup = $order->order_type === 'pickup';

            // Structured breakdown for the customer's order-detail view, which
            // needs real numbers/images rather than the display-only strings
            // ('items', 'price') used by the admin/restaurant order lists.
            $itemsDetail = $order->items->map(function ($item) {
                return [
                    'id'       => $item->id,
                    'food_id'  => $item->food_id,
                    'name'     => $item->food_name ?? $item->food->name ?? 'Item',
                    'category' => $item->food->category->name ?? null,
                    'image'    => $item->food->image ?? null,
                    'price'    => (float) $item->price,
                    'quantity' => (int) $item->quantity,
                ];
            })->values();

            return [
                'id'                 => '#BR-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'real_id'            => $order->id,
                'customer'           => $order->user->name ?? 'Guest Customer',
                'phone'              => $order->user->phone ?? null,
                // A pickup order has no delivery address - the customer
                // collects it at the restaurant, so surface that location
                // instead of the (irrelevant) customer address.
                'address'            => $isPickup ? null : ($order->user->location ?? null),
                'order_type'         => $order->order_type ?? 'delivery',
                'pickup_location'    => $isPickup ? ($order->restaurant->address ?? null) : null,
                'restaurant_name'    => $order->restaurant->name ?? 'N/A',
                'items'              => $itemsFormatted ?: 'No items',
                'items_detail'       => $itemsDetail,
                'subtotal'           => (float) $order->subtotal,
                'delivery_fee'       => (float) $order->delivery_fee,
                'service_fee'        => (float) $order->service_fee,
                'discount_amount'    => (float) $order->discount_amount,
                'payment_method'     => $order->payment_method,
                'created_at'         => $order->created_at,
                'price'              => '$' . number_format($order->total_price ?? $order->total ?? 0, 2),
                'time'               => $order->created_at ? $order->created_at->diffForHumans() : 'Just now',
                'status'             => ucfirst($order->status),
                // Delivery progress is tracked on the delivery row, not on
                // orders.status: while the order sits at READY_FOR_PICKUP the
                // delivery may already be 'assigned' to a rider (RIDER_ASSIGNED).
                // The restaurant list needs both to show the rider it was given.
                'delivery_status'    => $order->delivery->status ?? null,
                'rider'              => $order->delivery?->rider?->user?->name,
                'rider_phone'        => $order->delivery?->rider?->phone ?? $order->delivery?->rider?->user?->phone,
            ];
        });

        return response()->json([
            'success' => true,
            'orders'  => $orders
        ]);
    }

    /**
     * Create New Order
     */
   /**
     * Create New Order
     */
   public function store(Request $request)
    {
        if (!$request->has('items')) {
            return $this->storeFromCart($request);
        }

        abort_unless($request->user(), 401, 'Authentication is required to place an order.');

        $request->validate([
            'restaurant_id'    => 'required|integer',
            'user_id'          => 'nullable|integer',
            'address_id'       => 'nullable|integer|exists:addresses,id',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
            'customer_name'    => 'nullable|string|max:255',
            'customer_email'   => 'nullable|email|max:255',
            'customer_phone'   => 'nullable|string|max:50',
            'delivery_address' => 'nullable|string|max:500',
            'city'             => 'nullable|string|max:255',
            'notes'            => 'nullable|string|max:1000',
            'payment_method'   => 'nullable|string|max:50',
            'total_price'      => 'required|numeric',
            'status'           => 'nullable|string',
            'items'            => 'required|array|min:1',
            'items.*.food_id'  => 'required|integer|exists:food,id',
            'items.*.name'     => 'nullable|string|max:255',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price'    => 'required|numeric',
        ]);

        return DB::transaction(function () use ($request) {
            $user = null;

            $user = $request->user();

            $user->update([
                'name'     => $request->customer_name ?: $user->name,
                'phone'    => $request->customer_phone ?: $user->phone,
                'location' => trim(($request->delivery_address ?? '') . ' ' . ($request->city ?? '')) ?: $user->location,
            ]);

            $foodIds = collect($request->items)->pluck('food_id')->unique()->values();
            $foods = Food::whereIn('id', $foodIds)->get()->keyBy('id');
            if ($foods->count() !== $foodIds->count() || $foods->contains(fn (Food $food): bool => $food->status !== null && strtolower((string) $food->status) !== 'available')) {
                throw ValidationException::withMessages([
                    'items' => ['One or more selected foods are unavailable.'],
                ]);
            }
            $restaurantIds = $foods->pluck('restaurant_id')->unique()->values();

            if ($restaurantIds->count() !== 1) {
                throw ValidationException::withMessages([
                    'items' => ['An order can only contain food from one restaurant.'],
                ]);
            }

            // Resolve the restaurant from the food owner, not from client input.
            $restaurant = Restaurant::find($restaurantIds->first());
            if (!$restaurant) {
                throw ValidationException::withMessages([
                    'items' => ['The selected food does not belong to an active restaurant.'],
                ]);
            }

            $address = $request->filled('address_id')
                ? $user->addresses()->whereKey($request->address_id)->first()
                : null;

            if (!$address) {
                $address = Address::create([
                    'user_id' => $user->id,
                    'label' => 'Order delivery',
                    'recipient_name' => $request->customer_name ?: $user->name,
                    'phone' => $request->customer_phone ?: ($user->phone ?: 'N/A'),
                    'address' => trim(($request->delivery_address ?? '') . ' ' . ($request->city ?? '')) ?: 'N/A',
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'is_default' => false,
                ]);
            }

            $subtotal = collect($request->items)->sum(
                fn (array $item): float => (float) $foods->get($item['food_id'])->price * (int) $item['quantity']
            );
            $deliveryFee = 1.50;
            $total = $subtotal + $deliveryFee;

            $foodMap = [];
            foreach ($request->items as $item) {
                $food = $foods->get($item['food_id']);
                $categoryName = $item['category'] ?? 'General';
                
                $category = Category::firstOrCreate(
                    ['name' => $categoryName],
                    ['description' => $categoryName . ' Food Category']
                );

                $foodName = $item['name'] ?? ('Food Item #' . $item['food_id']);
                
                $foodMap[$item['food_id']] = $food->id;
            }

            $breakdown = OrderFinanceCalculator::breakdown($subtotal, $deliveryFee, $total);

            // កំណត់ Status ឱ្យចេញជា Placed ពេលបញ្ជាទិញថ្មី (ត្រូវជាមួយ Tab ใน Frontend)
            $order = Order::create([
                'restaurant_id' => $restaurant->id,
                'user_id'       => $user->id,
                'address_id'    => $address->id,
                'subtotal'      => $subtotal,
                'delivery_fee'  => $deliveryFee,
                'total'         => $total,
                'total_price'   => $total,
                'status'        => OrderStatuses::PENDING,
                ...$breakdown,
            ]);

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'food_id'  => $foodMap[$item['food_id']],
                    'food_name' => $foods->get($item['food_id'])->name,
                    'quantity' => $item['quantity'],
                    'price'    => $foods->get($item['food_id'])->price,
                    'subtotal' => (float) $foods->get($item['food_id'])->price * (int) $item['quantity'],
                ]);
            }

            Delivery::create([
                'order_id' => $order->id,
                'status' => 'pending',
            ]);

            // No rider is matched here: riders may only be assigned once the
            // restaurant has accepted, prepared and marked the order
            // READY_FOR_PICKUP (see updateStatus()). $delivery stays pending
            // until then.

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully!',
                'order'   => $order->refresh()->load(['items', 'delivery.rider'])
            ], 201);
        });
    }

    private const DELIVERY_FEE = 1.50;
    private const SERVICE_FEE = 0.30;

    private function storeFromCart(Request $request)
    {
        $validated = $request->validate([
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'order_type' => ['nullable', 'string', 'in:delivery,pickup'],
            'payment_method' => ['nullable', 'string', 'in:cash,khqr'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user();
        $orderType = $validated['order_type'] ?? 'delivery';

        $address = null;
        if ($orderType === 'delivery') {
            if (empty($validated['address_id'])) {
                throw ValidationException::withMessages([
                    'address_id' => ['A delivery address is required.'],
                ]);
            }

            $address = $user->addresses()->whereKey($validated['address_id'])->first();
            if (!$address) {
                throw ValidationException::withMessages([
                    'address_id' => ['The selected address is invalid.'],
                ]);
            }
        }

        $cart = $user->cart()->with('items.food')->first();
        if (!$cart || $cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => ['Your cart is empty.'],
            ]);
        }

        $restaurantIds = $cart->items->pluck('food.restaurant_id')->unique()->values();
        if ($restaurantIds->count() !== 1) {
            throw ValidationException::withMessages([
                'cart' => ['An order can only contain food from one restaurant.'],
            ]);
        }

        $subtotal = (float) $cart->items->sum(fn ($item) => (float) $item->food->price * $item->quantity);
        $deliveryFee = $orderType === 'pickup' ? 0.0 : self::DELIVERY_FEE;
        $serviceFee = $orderType === 'pickup' ? 0.0 : self::SERVICE_FEE;

        $voucher = null;
        $discountAmount = 0.0;
        if (!empty($validated['voucher_code'])) {
            $voucher = Voucher::whereRaw('UPPER(code) = ?', [strtoupper($validated['voucher_code'])])->first();
            $result = $voucher
                ? $voucher->evaluate($subtotal)
                : ['valid' => false, 'message' => 'This voucher code does not exist.'];

            if (!$result['valid']) {
                throw ValidationException::withMessages([
                    'voucher_code' => [$result['message']],
                ]);
            }

            $discountAmount = $result['discount'];
        }

        $total = max(0, $subtotal + $deliveryFee + $serviceFee - $discountAmount);
        $breakdown = OrderFinanceCalculator::breakdown($subtotal, $deliveryFee, $total);
        $paymentMethod = $validated['payment_method'] ?? null;
        $requiresVerifiedPayment = $paymentMethod === 'khqr';

        return DB::transaction(function () use (
            $cart, $user, $address, $restaurantIds, $subtotal, $deliveryFee, $serviceFee,
            $discountAmount, $total, $orderType, $paymentMethod, $requiresVerifiedPayment, $validated, $voucher, $breakdown
        ) {
            $order = Order::create([
                'restaurant_id' => $restaurantIds->first(),
                'user_id' => $user->id,
                'address_id' => $address?->id,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'service_fee' => $serviceFee,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'total_price' => $total,
                'status' => OrderStatuses::PENDING,
                'order_type' => $orderType,
                'payment_method' => $paymentMethod,
                'payment_status' => $requiresVerifiedPayment ? PaymentStatuses::PENDING : null,
                'notes' => $validated['notes'] ?? null,
                'voucher_id' => $voucher?->id,
                'voucher_code' => $voucher?->code,
                ...$breakdown,
            ]);

            foreach ($cart->items as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'food_id' => $cartItem->food_id,
                    'food_name' => $cartItem->food->name,
                    'quantity' => $cartItem->quantity,
                    'price' => $cartItem->food->price,
                    'subtotal' => (float) $cartItem->food->price * $cartItem->quantity,
                ]);
            }

            // Pickup orders are collected in person and must never enter the
            // rider pool, so - unlike delivery orders - they get no Delivery
            // row at all (DriverController::orders() also excludes them
            // explicitly, but not creating the row is the primary guard).
            if ($orderType === 'delivery') {
                Delivery::create(['order_id' => $order->id, 'status' => 'pending']);
            }

            $cart->items()->delete();

            if ($voucher) {
                $voucher->increment('times_used');
            }

            // No rider is assigned here. The order is PENDING_RESTAURANT: the
            // restaurant has to accept, prepare and mark it READY_FOR_PICKUP
            // before RiderMatchingService may match a rider (see updateStatus()).
            return response()->json([
                'success' => true,
                'message' => 'Order created successfully.',
                'data' => $order->refresh()->load(['items', 'delivery.rider', 'address', 'restaurant']),
            ], 201);
        });
    }

    public function show(Request $request, Order $order)
    {
        $user = $request->user();
        $isOwner = $order->user_id === $user->id;
        $isRestaurantOwner = Restaurant::where('user_id', $user->id)->whereKey($order->restaurant_id)->exists();
        $isAdmin = in_array(strtolower((string) $user->role), ['admin', 'super_admin', 'super admin'], true);

        abort_unless($isOwner || $isRestaurantOwner || $isAdmin, 404);

        return response()->json([
            'success' => true,
            'message' => 'Order retrieved successfully.',
            // delivery.rider.user is included so the customer's tracking page
            // can show WHO was assigned (name/phone) once the restaurant has
            // marked the order ready and the backend matched a rider.
            'data' => $order->load(['user', 'restaurant', 'address', 'items.food', 'delivery.rider.user']),
        ]);
    }

    public function cancel(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        if (!OrderStatuses::canTransition($order->status, OrderStatuses::CANCELLED)) {
            throw ValidationException::withMessages(['status' => ['This order cannot be cancelled.']]);
        }

        $order->update(['status' => OrderStatuses::CANCELLED]);

        // The order must not keep a rider attached to it. If one was already
        // assigned (the order was READY_FOR_PICKUP or already on the road),
        // the delivery is cancelled and the rider is freed up again. The
        // customer cancelling their own order does not need an email about it.
        $this->releaseOrderDelivery($order);

        return response()->json(['success' => true, 'message' => 'Order cancelled successfully.', 'data' => $order->refresh()]);
    }

    public function assignRider(Request $request, Order $order)
    {
        if ($order->order_type === 'pickup') {
            throw ValidationException::withMessages([
                'order_type' => ['Pickup orders are collected in person and do not require a rider.'],
            ]);
        }

        $user = $request->user();
        $role = strtolower((string) $user?->role);
        $isAdmin = in_array($role, ['admin', 'super_admin', 'super admin'], true);

        if (!$isAdmin) {
            $ownsOrderRestaurant = $order->restaurant_id
                && Restaurant::where('user_id', $user->id)->whereKey($order->restaurant_id)->exists();

            abort_unless($ownsOrderRestaurant, 403, 'You can only assign riders for your own restaurant orders.');
        }

        $request->validate(['rider_id' => ['required', 'integer', 'exists:riders,id']]);

        // Restaurant acceptance must happen before rider assignment: an order
        // that is still pending/accepted/preparing is not collectable yet, so
        // there is nothing to hand to a rider.
        if (!OrderStatuses::isReadyForPickup($order->status)) {
            throw ValidationException::withMessages([
                'status' => ['Riders can only be assigned once the restaurant marks the order ready for pickup.'],
            ]);
        }

        $rider = DB::transaction(function () use ($order, $request): Rider {
            $delivery = $order->delivery()->firstOrCreate([], ['status' => 'pending']);

            // Locked reads: two assignments racing for the same order (or for
            // the same rider) must not both succeed - the second request blocks
            // here until the first transaction finishes, then sees the real
            // state (delivery already assigned / rider already busy).
            $lockedDelivery = Delivery::whereKey($delivery->id)->lockForUpdate()->first();

            if (! $lockedDelivery || $lockedDelivery->rider_id !== null || $lockedDelivery->status !== 'pending') {
                throw ValidationException::withMessages(['rider_id' => ['This order already has a rider assigned.']]);
            }

            $rider = Rider::lockForUpdate()->findOrFail($request->rider_id);

            // Same eligibility rules as automatic matching: approved, online,
            // not already busy, and with a valid, fresh location fix.
            if (! app(RiderMatchingService::class)->isEligible($rider)) {
                throw ValidationException::withMessages(['rider_id' => ['The selected rider is not available for a new delivery right now.']]);
            }

            $lockedDelivery->update(['rider_id' => $rider->id, 'status' => 'assigned']);
            $rider->update(['is_available' => false]);

            app(RiderMatchingService::class)->notifyAssignedRider($order->fresh());

            return $rider;
        });

        return response()->json([
            'success' => true,
            'message' => 'Rider assigned successfully.',
            'data' => $order->refresh()->load(['delivery.rider', 'items.food', 'address']),
            'rider_id' => $rider->id,
        ]);
    }

    /**
     * Update Order Status
     */
   /**
     * Update Order Status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string'
        ]);

        $cleanId = preg_replace('/[^0-9]/', '', $id);

        $order = Order::find($cleanId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.'
            ], 404);
        }

        $role = strtolower((string) $request->user()?->role);
        $isAdmin = in_array($role, ['admin', 'super_admin', 'super admin'], true);

        if ($request->is('api/restaurant/orders/*') && !in_array($role, ['restaurant', 'restaurant admin', 'admin', 'super_admin', 'super admin'], true)) {
            abort(403, 'Only restaurant owners and administrators can update restaurant orders.');
        }

        if (in_array($role, ['restaurant', 'restaurant admin'], true)) {
            $isOwned = Restaurant::where('user_id', $request->user()->id)
                ->whereKey($order->restaurant_id)
                ->exists();

            abort_unless($isOwned, 403, 'You can only update orders for your own restaurant.');
        }

        $requestedStatus = OrderStatuses::normalize((string) $request->status);

        if (!OrderStatuses::isValid($requestedStatus)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid order status.',
                'errors' => ['status' => ['The selected status is invalid.']],
            ], 422);
        }

        // Admins may override the normal sequence for support/dispute cases;
        // restaurant owners must follow the forward-only workflow.
        if (!$isAdmin && !OrderStatuses::canTransition($order->status, $requestedStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Cannot change order status from \"{$order->status}\" to \"{$requestedStatus}\".",
                'errors' => ['status' => ['Invalid order status transition.']],
            ], 422);
        }

        $order->status = $requestedStatus;
        $order->save();

        // The restaurant just finished preparing: READY_FOR_PICKUP is the one
        // and only trigger for rider assignment. Laravel picks the nearest
        // eligible rider itself - if none exists the order simply stays ready
        // and unassigned until one becomes available.
        $assignedRiderId = null;

        if ($requestedStatus === OrderStatuses::READY) {
            $assignedRiderId = $this->dispatchReadyOrderToNearestRider($order);
        }

        // The restaurant rejected the order (or an admin cancelled it before
        // it was collected): never assign a rider, tear down any delivery that
        // may exist, free the rider if one had already been attached, and tell
        // the customer. The payment record is left untouched for the existing
        // refund follow-up.
        if ($requestedStatus === OrderStatuses::CANCELLED) {
            $this->releaseOrderDelivery($order, notifyCustomer: true);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'status'  => ucfirst($order->status), // ត្រឡប់ Capitalized format ដូច index (e.g. "Accepted")
            'assigned_rider_id' => $assignedRiderId,
        ]);
    }

    /**
     * Assigns the nearest eligible rider the moment the restaurant marks an
     * order READY_FOR_PICKUP. Returns the assigned rider's id (or null when
     * the order isn't an assignable delivery order or nobody is eligible).
     *
     * All of the decision-making lives in RiderMatchingService - this method
     * only supplies the order context.
     */
    private function dispatchReadyOrderToNearestRider(Order $order): ?int
    {
        if ($order->order_type !== 'delivery') {
            return null; // pickup orders are collected in person
        }

        $order->loadMissing(['delivery', 'restaurant', 'address']);

        if (! $order->delivery || $order->delivery->rider_id || ! $order->restaurant) {
            return null;
        }

        $delivery = app(RiderMatchingService::class)->assignBestRider(
            $order,
            $order->delivery,
            $order->restaurant,
            $order->address
        );

        return $delivery?->rider_id;
    }

    /**
     * Cancels/rejects an order's delivery: the delivery row is marked
     * cancelled, and a rider that had already been assigned to it is put back
     * on the available list so they can take another delivery instead.
     *
     * When $notifyCustomer is true (restaurant/admin rejection) the customer
     * is emailed that the order was cancelled - the customer cancelling their
     * own order obviously doesn't need that mail.
     */
    private function releaseOrderDelivery(Order $order, bool $notifyCustomer = false): void
    {
        DB::transaction(function () use ($order): void {
            $delivery = $order->delivery()->first();

            if (! $delivery) {
                return;
            }

            $locked = Delivery::whereKey($delivery->id)->lockForUpdate()->first();

            // A delivery already handed to the customer stays delivered; only
            // an open delivery can be cancelled at this point.
            if (! $locked || $locked->status === 'delivered') {
                return;
            }

            if ($locked->rider_id) {
                Rider::whereKey($locked->rider_id)->lockForUpdate()->first()?->update(['is_available' => true]);
            }

            $locked->update(['status' => 'cancelled']);
        });

        if (! $notifyCustomer) {
            return;
        }

        $order->loadMissing(['user', 'restaurant']);

        if (! $order->user) {
            return;
        }

        try {
            $order->user->notify(new OrderRejectedNotification($order));
        } catch (Throwable $exception) {
            Log::warning('Failed to notify the customer of a rejected order.', [
                'order_id' => $order->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
