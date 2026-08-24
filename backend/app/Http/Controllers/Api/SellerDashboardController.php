<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SellerDashboardController extends Controller
{
    public function index(Request $request)
    {
        $sellerId = $request->user()->id;

        // 1. Total Earnings (from delivered orders)
        $totalEarnings = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function ($q) {
                $q->where('status', 'delivered')
                  ->where('payment_status', 'paid'); // later when payment is ready
            })
            ->sum('total');

        // Temporary: Also count confirmed/processing as potential earnings
        $pendingEarnings = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function ($q) {
                $q->whereIn('status', ['confirmed', 'processing', 'packed', 'shipped']);
            })
            ->sum('total');

        // 2. Total Orders
        $totalOrders = Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })->count();

        // 3. Pending Orders (need action)
        $pendingOrders = Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })
        ->whereIn('status', ['pending', 'confirmed'])
        ->count();

        // 4. Total Products
        $totalProducts = Product::where('user_id', $sellerId)->count();

        // 5. Low Stock Products (less than 10)
        $lowStockProducts = Product::where('user_id', $sellerId)
            ->where('quantity_available', '<', 10)
            ->where('status', 'approved')
            ->get(['id', 'name', 'quantity_available', 'unit']);

        // 6. Recent Orders
        $recentOrders = Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })
        ->with(['items' => function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        }])
        ->latest()
        ->take(5)
        ->get();

        // 7. Top Selling Products
        $topProducts = OrderItem::where('seller_id', $sellerId)
            ->select('product_id', 'product_name', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(total) as revenue'))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get();

        return response()->json([
            'status' => true,
            'dashboard' => [
                'total_earnings'     => round($totalEarnings, 2),
                'pending_earnings'   => round($pendingEarnings, 2),
                'total_orders'       => $totalOrders,
                'pending_orders'     => $pendingOrders,
                'total_products'     => $totalProducts,
                'low_stock_products' => $lowStockProducts,
                'recent_orders'      => $recentOrders,
                'top_products'       => $topProducts,
            ]
        ]);
    }
}