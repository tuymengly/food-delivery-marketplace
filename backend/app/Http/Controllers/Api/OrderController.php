<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Category;
use App\Models\Food;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        if ($request->filled('restaurant_id')) {
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
                'price'           => '$' . number_format($order->total_price ?? 0, 2),
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
            'items.*.food_id'  => 'required|integer',
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

            $restaurantId = $request->restaurant_id;
            $restaurant = Restaurant::find($restaurantId);
            if (!$restaurant) {
                $restaurant = Restaurant::create([
                    'user_id' => $user->id,
                    'name'    => 'Burger Joint',
                    'address' => 'Phnom Penh',
                    'phone'   => '012345678',
                ]);
            }

            $foodMap = [];
            foreach ($request->items as $item) {
                $food = Food::find($item['food_id']);

                if (!$food) {
                    $categoryName = $item['category'] ?? 'General';
                    $category = Category::firstOrCreate(
                        ['name' => $categoryName],
                        ['description' => $categoryName . ' Food Category']
                    );

                    $foodName = $item['name'] ?? ('Food Item #' . $item['food_id']);
                    $food = Food::where('restaurant_id', $restaurant->id)
                        ->where('name', $foodName)
                        ->first();
                }

                if (!$food) {
                    $food = Food::create([
                        'restaurant_id' => $restaurant->id,
                        'category_id'   => $category->id,
                        'name'          => $foodName,
                        'price'         => $item['price'],
                        'status'        => 'available',
                    ]);
                }
                
                $foodMap[$item['food_id']] = $food->id;
            }

            $order = Order::create([
                'restaurant_id' => $restaurant->id,
                'user_id'       => $user->id,
                'total_price'   => $request->total_price,
                'status'        => strtolower($request->status ?? 'new'),
            ]);

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'food_id'  => $foodMap[$item['food_id']],
                    'quantity' => $item['quantity'],
                    'price'    => $item['price'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully!',
                'order'   => $order->load('items')
            ], 201);
        });
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

        $order->status = strtolower($request->status);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'status'  => ucfirst($order->status) // ត្រឡប់ Capitalized format ដូច index (e.g. "Accepted")
        ]);
    }
}
