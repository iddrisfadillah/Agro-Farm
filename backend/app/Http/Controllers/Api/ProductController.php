<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
        // Public: List approved products (with search, filters & sorting)
    public function index(Request $request)
    {
        $query = Product::with(['seller:id,name,phone', 'category:id,name', 'images'])
                        ->where('status', 'approved')
                        ->where('is_active', true);

        // 1. Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // 2. Filter by Category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // 3. Filter by Certification
        if ($request->filled('certification')) {
            $query->where('certification', $request->certification);
        }

        // 4. Filter by Price Range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // 5. Basic Location Filter (within X km) - simple version
        if ($request->filled('lat') && $request->filled('lng') && $request->filled('radius')) {
            $lat = $request->lat;
            $lng = $request->lng;
            $radius = $request->radius; // in kilometers

            // Haversine formula (approximate)
            $query->selectRaw("*, 
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance", 
                [$lat, $lng, $lat])
                ->having('distance', '<=', $radius)
                ->orderBy('distance');
        }

        // 6. Sorting
        switch ($request->sort) {
            case 'price_low':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('price', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            default:
                $query->latest();
        }

        $products = $query->paginate(12);

        return response()->json([
            'status' => true,
            'products' => $products
        ]);
    }

    // Public: Single product details
    public function show($id)
    {
        $product = Product::with(['seller:id,name,phone,farm_latitude,farm_longitude,bio', 'category', 'images'])
                          ->where('status', 'approved')
                          ->findOrFail($id);

        return response()->json([
            'status' => true,
            'product' => $product
        ]);
    }

    // Seller: Add new product
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'seller') {
            return response()->json([
                'status' => false,
                'message' => 'Only sellers can add products'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'category_id'        => 'required|exists:categories,id',
            'name'               => 'required|string|max:255',
            'description'        => 'nullable|string',
            'price'              => 'required|numeric|min:0',
            'unit'               => 'required|string',
            'quantity_available' => 'required|numeric|min:0',
            'harvest_date'       => 'nullable|date',
            'certification'      => 'nullable|string',
            'images'             => 'required|array|min:1|max:5',
            'images.*'           => 'image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::create([
            'user_id'            => $user->id,
            'category_id'        => $request->category_id,
            'name'               => $request->name,
            'slug'               => Str::slug($request->name) . '-' . time(),
            'description'        => $request->description,
            'price'              => $request->price,
            'unit'               => $request->unit,
            'quantity_available' => $request->quantity_available,
            'harvest_date'       => $request->harvest_date,
            'certification'      => $request->certification,
            'status'             => 'pending',
            'batch_id'           => 'BATCH-' . strtoupper(Str::random(8)),
            'latitude'           => $user->farm_latitude,
            'longitude'          => $user->farm_longitude,
        ]);

        // Upload images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('products', 'public');

                ProductImage::create([
                    'product_id'  => $product->id,
                    'image_path'  => $path,
                    'is_primary'  => $index === 0,
                    'sort_order'  => $index,
                ]);
            }
        }

        $product->load('images', 'category');

        return response()->json([
            'status'  => true,
            'message' => 'Product submitted successfully. Waiting for admin approval.',
            'product' => $product
        ], 201);
    }

    // Seller: My products
    public function myProducts(Request $request)
    {
        $products = Product::with(['category', 'images'])
                           ->where('user_id', $request->user()->id)
                           ->latest()
                           ->get();

        return response()->json([
            'status' => true,
            'products' => $products
        ]);
    }

    // ====================== ADMIN: Get Pending Products ======================
    public function pendingProducts(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized. Admins only.'
            ], 403);
        }

        $products = Product::with(['seller:id,name,phone', 'category:id,name', 'images'])
                           ->where('status', 'pending')
                           ->latest()
                           ->get();

        return response()->json([
            'status' => true,
            'products' => $products
        ]);
    }

    // ====================== ADMIN: Approve Product ======================
    public function approve($id, Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized. Admins only.'
            ], 403);
        }

        $product = Product::findOrFail($id);

        $product->update([
            'status' => 'approved',
            'rejection_reason' => null
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Product approved successfully',
            'product' => $product
        ]);
    }

    // ====================== ADMIN: Reject Product ======================
    public function reject($id, Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized. Admins only.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::findOrFail($id);

        $product->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Product rejected successfully',
            'product' => $product
        ]);
    }

}