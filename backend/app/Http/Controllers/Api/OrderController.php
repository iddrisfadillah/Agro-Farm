<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    // Place an order (Checkout)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'delivery_method'    => 'required|in:delivery,pickup',
            'delivery_address'   => 'required_if:delivery_method,delivery|string',
            'delivery_latitude'  => 'nullable|numeric',
            'delivery_longitude' => 'nullable|numeric',
            'notes'              => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $cart = Cart::with('items.product')->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json([
                'status'  => false,
                'message' => 'Your cart is empty'
            ], 400);
        }

        // Calculate totals
        $subtotal = 0;
        foreach ($cart->items as $item) {
            if ($item->quantity > $item->product->quantity_available) {
                return response()->json([
                    'status'  => false,
                    'message' => "Not enough stock for {$item->product->name}"
                ], 400);
            }
            $subtotal += $item->quantity * $item->price;
        }

        // Simple delivery fee (you can improve this later with Google Maps)
        $deliveryFee = $request->delivery_method === 'delivery' ? 20.00 : 0;
        $total = $subtotal + $deliveryFee;

        DB::beginTransaction();

        try {
            // Create Order
            $order = Order::create([
                'order_number'       => 'ORD-' . strtoupper(Str::random(8)),
                'user_id'            => $user->id,
                'subtotal'           => $subtotal,
                'delivery_fee'       => $deliveryFee,
                'total'              => $total,
                'status'             => 'pending',
                'payment_status'     => 'pending',
                'delivery_method'    => $request->delivery_method,
                'delivery_address'   => $request->delivery_address,
                'delivery_latitude'  => $request->delivery_latitude,
                'delivery_longitude' => $request->delivery_longitude,
                'notes'              => $request->notes,
            ]);

            // Create Order Items + Reduce stock
            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $item->product_id,
                    'seller_id'    => $item->product->user_id,
                    'product_name' => $item->product->name,
                    'quantity'     => $item->quantity,
                    'unit'         => $item->product->unit,
                    'price'        => $item->price,
                    'total'        => $item->quantity * $item->price,
                ]);

                // Reduce product stock
                $item->product->decrement('quantity_available', $item->quantity);
            }

            // Clear the cart
            $cart->items()->delete();

            DB::commit();

            $order->load('items');

            return response()->json([
                'status'  => true,
                'message' => 'Order placed successfully',
                'order'   => $order
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status'  => false,
                'message' => 'Failed to place order',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Get my orders (Buyer)
    public function myOrders(Request $request)
    {
        $orders = Order::with('items')
                       ->where('user_id', $request->user()->id)
                       ->latest()
                       ->get();

        return response()->json([
            'status' => true,
            'orders' => $orders
        ]);
    }

    // Get single order
    public function show(Request $request, $id)
    {
        $order = Order::with('items.product')
                      ->where('user_id', $request->user()->id)
                      ->findOrFail($id);

        return response()->json([
            'status' => true,
            'order'  => $order
        ]);
    }

    // Seller: Get orders that contain their products
    public function sellerOrders(Request $request)
    {
        $orders = Order::whereHas('items', function ($query) use ($request) {
                        $query->where('seller_id', $request->user()->id);
                    })
                    ->with(['items' => function ($query) use ($request) {
                        $query->where('seller_id', $request->user()->id);
                    }])
                    ->latest()
                    ->get();

        return response()->json([
            'status' => true,
            'orders' => $orders
        ]);
    }

    // Update order status (Seller or Admin)
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:confirmed,processing,packed,shipped,delivered,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $order = Order::findOrFail($id);

        // Simple permission check (can be improved later)
        $order->update(['status' => $request->status]);

        return response()->json([
            'status'  => true,
            'message' => 'Order status updated successfully',
            'order'   => $order
        ]);
    }
}