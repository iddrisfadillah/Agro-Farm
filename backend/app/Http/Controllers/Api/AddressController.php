<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = Address::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'addresses' => $addresses
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'label' => 'required|string|max:50',
            'address' => 'required|string|max:255',
            'city' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'is_default' => 'nullable|boolean',
        ]);

        if ($request->is_default) {
            Address::where('user_id', $request->user()->id)
                ->update(['is_default' => false]);
        }

        $address = Address::create([
            'user_id' => $request->user()->id,
            'label' => $request->label,
            'address' => $request->address,
            'city' => $request->city,
            'region' => $request->region,
            'is_default' => $request->boolean('is_default'),
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Address saved',
            'address' => $address
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $address = Address::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$address) {
            return response()->json([
                'status' => false,
                'message' => 'Address not found'
            ], 404);
        }

        $address->delete();

        return response()->json([
            'status' => true,
            'message' => 'Address removed'
        ]);
    }
}