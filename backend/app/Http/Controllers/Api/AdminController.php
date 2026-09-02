<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    // ====================== DASHBOARD STATS ======================
    public function dashboard(Request $request)
    {
        $totalUsers = User::count();
        $totalBuyers = User::where('role', 'buyer')->count();
        $totalSellers = User::where('role', 'seller')->count();
        $pendingSellers = User::where('role', 'seller')->where('is_verified', false)->count();

        $totalProducts = Product::count();
        $pendingProducts = Product::where('status', 'pending')->count();
        $approvedProducts = Product::where('status', 'approved')->count();

        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $totalRevenue = Order::where('payment_status', 'paid')->sum('total');

        return response()->json([
            'status' => true,
            'stats' => [
                'total_users'       => $totalUsers,
                'total_buyers'      => $totalBuyers,
                'total_sellers'     => $totalSellers,
                'pending_sellers'   => $pendingSellers,
                'total_products'    => $totalProducts,
                'pending_products'  => $pendingProducts,
                'approved_products' => $approvedProducts,
                'total_orders'      => $totalOrders,
                'pending_orders'    => $pendingOrders,
                'total_revenue'     => $totalRevenue,
            ]
        ]);
    }

    // ====================== USER MANAGEMENT ======================
    public function users(Request $request)
    {
        $query = User::query();

        // Optional filters
        if ($request->role) {
            $query->where('role', $request->role);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'status' => true,
            'users'  => $users
        ]);
    }

    // Verify a seller (approve their National ID)
    public function verifySeller(Request $request, $id)
    {
        $user = User::where('id', $id)->where('role', 'seller')->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Seller not found'
            ], 404);
        }

        $user->update(['is_verified' => true]);

        return response()->json([
            'status'  => true,
            'message' => 'Seller verified successfully',
            'user'    => $user
        ]);
    }

    // Change user role
    public function updateUserRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:buyer,seller,admin'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'User not found'
            ], 404);
        }

        $user->update(['role' => $request->role]);

        return response()->json([
            'status'  => true,
            'message' => 'User role updated successfully',
            'user'    => $user
        ]);
    }

    // ====================== GLOBAL ORDERS ======================
    public function orders(Request $request)
    {
        $query = Order::with(['user:id,name,phone', 'items']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'status' => true,
            'orders' => $orders
        ]);
    }

    // Update any order status (admin override)
    public function updateOrderStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,processing,packed,shipped,delivered,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'status' => false,
                'message' => 'Order not found'
            ], 404);
        }

        $order->update(['status' => $request->status]);

        return response()->json([
            'status'  => true,
            'message' => 'Order status updated',
            'order'   => $order
        ]);
    }
}