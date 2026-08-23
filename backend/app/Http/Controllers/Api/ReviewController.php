<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    // Create a review
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id'   => 'required|exists:orders,id',
            'product_id' => 'required|exists:products,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
            'image'      => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $order = Order::findOrFail($request->order_id);

        // Only the buyer of the order can review
        if ($order->user_id !== $user->id) {
            return response()->json([
                'status'  => false,
                'message' => 'You can only review your own orders'
            ], 403);
        }

        // Order must be delivered
        if ($order->status !== 'delivered') {
            return response()->json([
                'status'  => false,
                'message' => 'You can only review after the order is delivered'
            ], 400);
        }

        // Check if this product was in the order
        $orderItem = OrderItem::where('order_id', $order->id)
                              ->where('product_id', $request->product_id)
                              ->first();

        if (!$orderItem) {
            return response()->json([
                'status'  => false,
                'message' => 'This product was not in your order'
            ], 400);
        }

        // Check if already reviewed
        $existingReview = Review::where('user_id', $user->id)
                                ->where('product_id', $request->product_id)
                                ->where('order_id', $order->id)
                                ->first();

        if ($existingReview) {
            return response()->json([
                'status'  => false,
                'message' => 'You have already reviewed this product'
            ], 400);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('reviews', 'public');
        }

        $review = Review::create([
            'user_id'    => $user->id,
            'product_id' => $request->product_id,
            'seller_id'  => $orderItem->seller_id,
            'order_id'   => $order->id,
            'rating'     => $request->rating,
            'comment'    => $request->comment,
            'image'      => $imagePath,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Review submitted successfully',
            'review'  => $review
        ], 201);
    }

    // Get reviews for a product
    public function productReviews($productId)
    {
        $reviews = Review::with('buyer:id,name')
                         ->where('product_id', $productId)
                         ->latest()
                         ->get();

        $averageRating = $reviews->avg('rating');

        return response()->json([
            'status'         => true,
            'average_rating' => round($averageRating, 1),
            'total_reviews'  => $reviews->count(),
            'reviews'        => $reviews
        ]);
    }
}