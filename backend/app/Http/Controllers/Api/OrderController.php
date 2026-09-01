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
            'total_price'      => 'required|numeric',
            'status'           => 'nullable|string',
            'items'            => 'required|array|min:1',
            'items.*.food_id'  => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price'    => 'required|numeric',
        ]);

        return DB::transaction(function () use ($request) {
            $userId = $request->user_id ?? 1;
            $user = User::find($userId);
            if (!$user) {
                $user = User::create([
                    'name'     => 'Customer Test',
                    'email'    => 'customer' . rand(100, 999) . '@example.com',
                    'password' => bcrypt('password')
                ]);
            }

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

            $category = Category::firstOrCreate(
                ['name' => 'General'],
                ['description' => 'General Food Category']
            );

            $foodMap = [];
            foreach ($request->items as $item) {
                $food = Food::find($item['food_id']);
                
                if (!$food) {
                    $food = Food::create([
                        'restaurant_id' => $restaurant->id,
                        'category_id'   => $category->id,
                        'name'          => 'Food Item #' . $item['food_id'],
                        'price'         => $item['price']
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
