<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    // Get current user's cart
    public function index(Request $request)
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        $cart->load(['items.product.images', 'items.product.category']);

        $subtotal = $cart->items->sum(function ($item) {
            return $item->quantity * $item->price;
        });

        return response()->json([
            'status' => true,
            'cart' => $cart,
            'subtotal' => $subtotal,
            'items_count' => $cart->items->count()
        ]);
    }

    // Add item to cart
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|numeric|min:0.1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::where('id', $request->product_id)
                          ->where('status', 'approved')
                          ->where('is_active', true)
                          ->first();

        if (!$product) {
            return response()->json([
                'status' => false,
                'message' => 'Product not available'
            ], 404);
        }

        if ($request->quantity > $product->quantity_available) {
            return response()->json([
                'status' => false,
                'message' => 'Not enough stock available'
            ], 400);
        }

        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        // Check if product already exists in cart
        $cartItem = CartItem::where('cart_id', $cart->id)
                            ->where('product_id', $product->id)
                            ->first();

        if ($cartItem) {
            $cartItem->quantity += $request->quantity;
            $cartItem->save();
        } else {
            CartItem::create([
                'cart_id'    => $cart->id,
                'product_id' => $product->id,
                'quantity'   => $request->quantity,
                'price'      => $product->price,
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Product added to cart successfully'
        ]);
    }

    // Update cart item quantity
    public function update(Request $request, $itemId)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|numeric|min:0.1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $cart = Cart::where('user_id', $request->user()->id)->first();

        if (!$cart) {
            return response()->json([
                'status' => false,
                'message' => 'Cart not found'
            ], 404);
        }

        $cartItem = CartItem::where('id', $itemId)
                            ->where('cart_id', $cart->id)
                            ->first();

        if (!$cartItem) {
            return response()->json([
                'status' => false,
                'message' => 'Cart item not found'
            ], 404);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json([
            'status' => true,
            'message' => 'Cart updated successfully'
        ]);
    }

    // Remove item from cart
    public function destroy(Request $request, $itemId)
    {
        $cart = Cart::where('user_id', $request->user()->id)->first();

        if (!$cart) {
            return response()->json([
                'status' => false,
                'message' => 'Cart not found'
            ], 404);
        }

        $cartItem = CartItem::where('id', $itemId)
                            ->where('cart_id', $cart->id)
                            ->first();

        if (!$cartItem) {
            return response()->json([
                'status' => false,
                'message' => 'Cart item not found'
            ], 404);
        }

        $cartItem->delete();

        return response()->json([
            'status' => true,
            'message' => 'Item removed from cart'
        ]);
    }

    // Clear entire cart
    public function clear(Request $request)
    {
        $cart = Cart::where('user_id', $request->user()->id)->first();

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json([
            'status' => true,
            'message' => 'Cart cleared successfully'
        ]);
    }
}