<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Food;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Cart retrieved successfully.',
            'data' => $this->cartData($this->getCart($request)),
        ]);
    }

    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'food_id' => ['required', 'integer', 'exists:food,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $food = Food::findOrFail($validated['food_id']);

        if ($food->status !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Unavailable food cannot be added to the cart.',
                'errors' => [
                    'food_id' => ['The selected food is unavailable.'],
                ],
            ], 422);
        }

        $cart = $this->getCart($request);
        $item = $cart->items()->where('food_id', $food->id)->first();

        if ($item) {
            $item->update([
                'quantity' => $item->quantity + $validated['quantity'],
            ]);
        } else {
            $cart->items()->create($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cart item added successfully.',
            'data' => $this->cartData($cart),
        ], 201);
    }

    public function updateItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $cartItem = $this->findUserCartItem($request, $cartItem);
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $cartItem->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cart item updated successfully.',
            'data' => $this->cartData($this->getCart($request)),
        ]);
    }

    public function removeItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $cartItem = $this->findUserCartItem($request, $cartItem);
        $cartItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cart item removed successfully.',
            'data' => $this->cartData($this->getCart($request)),
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->getCart($request);
        $cart->items()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully.',
            'data' => $this->cartData($cart),
        ]);
    }

    private function getCart(Request $request): Cart
    {
        return $request->user()->cart()->firstOrCreate();
    }

    private function findUserCartItem(Request $request, CartItem $cartItem): CartItem
    {
        return $this->getCart($request)->items()->whereKey($cartItem->id)->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function cartData(Cart $cart): array
    {
        $cart->load('items.food.restaurant', 'items.food.category');

        $subtotal = round($cart->items->sum(
            fn (CartItem $item): float => (float) $item->food->price * $item->quantity
        ), 2);

        return [
            'id' => $cart->id,
            'user_id' => $cart->user_id,
            'items' => $cart->items,
            'subtotal' => number_format($subtotal, 2, '.', ''),
        ];
    }
}
