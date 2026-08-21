<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    // List all active categories
    public function index()
    {
        $categories = Category::where('is_active', true)->get();

        return response()->json([
            'status' => true,
            'categories' => $categories
        ]);
    }

    // Admin: Create category
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'is_active' => true,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Category created successfully',
            'category' => $category
        ], 201);
    }
}