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

        if (in_array(strtolower((string) $user?->role), ['restaurant', 'restaurant admin'], true)) {
            $ownedRestaurantIds = Restaurant::where('user_id', $user->id)->pluck('id');
            $query->whereIn('restaurant_id', $ownedRestaurantIds);
        } elseif ($request->filled('restaurant_id')) {
            $query->where('restaurant_id', $request->restaurant_id);
        }

        $orders = $query->get()->map(function ($order) {
            $itemsFormatted = $order->items->map(function ($item) {
                return ($item->food->name ?? 'Item') . ' × ' . $item->quantity;
            })->implode(', ');

            return [
                'id'              => '#BR-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'real_id'         => $order->id,
                'customer'        => $order->user->name ?? 'Guest Customer',
                'phone'           => $order->user->phone ?? null,
                'address'         => $order->user->location ?? null,
                'restaurant_name' => $order->restaurant->name ?? 'N/A',
                'items'           => $itemsFormatted ?: 'No items',
                'price'           => '$' . number_format($order->total_price ?? $order->total ?? 0, 2),
                'time'            => $order->created_at ? $order->created_at->diffForHumans() : 'Just now',
                'status'          => ucfirst($order->status),
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

        $request->validate([
            'restaurant_id'    => 'required|integer',
            'user_id'          => 'nullable|integer',
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

            if ($request->filled('user_id')) {
                $user = User::find($request->user_id);
            }

            if (!$user && $request->filled('customer_email')) {
                $user = User::firstOrCreate(
                    ['email' => $request->customer_email],
                    [
                        'name'     => $request->customer_name ?: 'Guest Customer',
                        'password' => bcrypt('password'),
                        'role'     => 'customer',
                    ]
                );
            }

            if (!$user) {
                $user = User::create([
                    'name'     => $request->customer_name ?: 'Guest Customer',
                    'email'    => 'customer' . time() . rand(100, 999) . '@example.com',
                    'password' => bcrypt('password'),
                    'role'     => 'customer',
                ]);
            }

            $user->update([
                'name'     => $request->customer_name ?: $user->name,
                'phone'    => $request->customer_phone ?: $user->phone,
                'location' => trim(($request->delivery_address ?? '') . ' ' . ($request->city ?? '')) ?: $user->location,
            ]);

            $foodIds = collect($request->items)->pluck('food_id')->unique()->values();
            $foods = Food::whereIn('id', $foodIds)->get()->keyBy('id');
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

            $address = Address::create([
                'user_id' => $user->id,
                'label' => 'Order delivery',
                'recipient_name' => $request->customer_name ?: $user->name,
                'phone' => $request->customer_phone ?: ($user->phone ?: 'N/A'),
                'address' => trim(($request->delivery_address ?? '') . ' ' . ($request->city ?? '')) ?: 'N/A',
                'is_default' => false,
            ]);

            $subtotal = collect($request->items)->sum(
                fn (array $item): float => (float) $item['price'] * (int) $item['quantity']
            );
            $deliveryFee = max(0, (float) $request->total_price - $subtotal);

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

            // កំណត់ Status ឱ្យចេញជា Placed ពេលបញ្ជាទិញថ្មី (ត្រូវជាមួយ Tab ใน Frontend)
            $order = Order::create([
                'restaurant_id' => $restaurant->id,
                'user_id'       => $user->id,
                'address_id'    => $address->id,
                'subtotal'      => $subtotal,
                'delivery_fee'  => $deliveryFee,
                'total'         => $request->total_price,
                'total_price'   => $request->total_price,
                'status'        => ucfirst(strtolower($request->status ?? 'Placed')),
            ]);

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'food_id'  => $foodMap[$item['food_id']],
                    'food_name' => $item['name'] ?? 'Food Item',
                    'quantity' => $item['quantity'],
                    'price'    => $item['price'],
                    'subtotal' => (float) $item['price'] * (int) $item['quantity'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully!',
                'order'   => $order->load('items')
            ], 201);
        });
    }

    private function storeFromCart(Request $request)
    {
        $request->validate([
            'address_id' => ['required', 'integer', 'exists:addresses,id'],
        ]);

        $user = $request->user();
        $address = $user->addresses()->whereKey($request->address_id)->first();
        if (!$address) {
            throw ValidationException::withMessages([
                'address_id' => ['The selected address is invalid.'],
            ]);
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
        $deliveryFee = 1.50;

        return DB::transaction(function () use ($cart, $user, $address, $restaurantIds, $subtotal, $deliveryFee) {
            $order = Order::create([
                'restaurant_id' => $restaurantIds->first(),
                'user_id' => $user->id,
                'address_id' => $address->id,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $subtotal + $deliveryFee,
                'total_price' => $subtotal + $deliveryFee,
                'status' => 'pending',
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

            Delivery::create([
                'order_id' => $order->id,
                'status' => 'pending',
            ]);
            $cart->items()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully.',
                'data' => $order->load(['items', 'delivery', 'address']),
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

        if (in_array(strtolower((string) $order->status), ['delivered', 'completed', 'cancelled'], true)) {
            throw ValidationException::withMessages(['status' => ['This order cannot be cancelled.']]);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Order cancelled successfully.', 'data' => $order->refresh()]);
    }

    public function assignRider(Request $request, Order $order)
    {
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

        if (in_array(strtolower((string) $request->user()?->role), ['restaurant', 'restaurant admin'], true)) {
            $isOwned = Restaurant::where('user_id', $request->user()->id)
                ->whereKey($order->restaurant_id)
                ->exists();

            abort_unless($isOwned, 403, 'You can only update orders for your own restaurant.');
        }

        $order->status = strtolower($request->status);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'status'  => ucfirst($order->status) // ត្រឡប់ Capitalized format ដូច index (e.g. "Accepted")
        ]);
    }
}
