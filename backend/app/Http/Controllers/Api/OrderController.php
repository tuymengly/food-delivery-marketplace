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
use App\Services\OrderFinanceCalculator;
use App\Services\RiderMatchingService;
use App\Support\OrderStatuses;
use App\Support\PaymentStatuses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
        $query = Order::with(['user', 'restaurant', 'items.food'])->latest();

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
                'price'              => '$' . number_format($order->total_price ?? $order->total ?? 0, 2),
                'time'               => $order->created_at ? $order->created_at->diffForHumans() : 'Just now',
                'status'             => ucfirst($order->status),
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

            $delivery = Delivery::create([
                'order_id' => $order->id,
                'status' => 'pending',
            ]);

            app(RiderMatchingService::class)->assignBestRider($order, $delivery, $restaurant, $address);

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
            'payment_method' => ['nullable', 'string', 'in:cash,aba,khqr,card'],
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
        $requiresVerifiedPayment = in_array($paymentMethod, ['khqr', 'card'], true);

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
            $delivery = $orderType === 'delivery'
                ? Delivery::create(['order_id' => $order->id, 'status' => 'pending'])
                : null;
            $cart->items()->delete();

            if ($voucher) {
                $voucher->increment('times_used');
            }

            if ($orderType === 'delivery' && $delivery && $address && ! $requiresVerifiedPayment) {
                $restaurant = Restaurant::find($restaurantIds->first());
                if ($restaurant) {
                    app(RiderMatchingService::class)->assignBestRider($order, $delivery, $restaurant, $address);
                }
            }

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
            'data' => $order->load(['user', 'restaurant', 'address', 'items.food', 'delivery.rider']),
        ]);
    }

    public function cancel(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        if (!OrderStatuses::canTransition($order->status, OrderStatuses::CANCELLED)) {
            throw ValidationException::withMessages(['status' => ['This order cannot be cancelled.']]);
        }

        $order->update(['status' => OrderStatuses::CANCELLED]);

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
        $rider = Rider::findOrFail($request->rider_id);

        if (!$rider->is_available) {
            throw ValidationException::withMessages(['rider_id' => ['The selected rider is unavailable.']]);
        }

        $delivery = $order->delivery()->firstOrCreate([], ['status' => 'pending']);
        $delivery->update(['rider_id' => $rider->id, 'status' => 'assigned']);
        $rider->update(['is_available' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Rider assigned successfully.',
            'data' => $order->refresh()->load(['delivery.rider', 'items.food', 'address']),
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

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'status'  => ucfirst($order->status) // ត្រឡប់ Capitalized format ដូច index (e.g. "Accepted")
        ]);
    }
}
