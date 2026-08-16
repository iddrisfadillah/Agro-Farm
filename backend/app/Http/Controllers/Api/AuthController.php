<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AuthController extends Controller
{
    // ====================== REGISTER ======================
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'nullable|email|unique:users,email',
            'phone'    => 'required|string|unique:users,phone',
            'password' => 'required|string|min:6|confirmed',
            'role'     => 'required|in:buyer,seller',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        // Generate OTP (simulated)
        $otp = rand(100000, 999999);

        $user = User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'phone'          => $request->phone,
            'password'       => Hash::make($request->password),
            'role'           => $request->role,
            'otp'            => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(10),
            'is_verified'    => false,
            'phone_verified' => false,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Registration successful. Please verify your phone number with the OTP.',
            'otp'     => $otp, // Only for testing (remove later when real SMS is added)
            'user'    => $user
        ], 201);
    }

    // ====================== VERIFY OTP ======================
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'otp'   => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::where('phone', $request->phone)->first();

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User not found'
            ], 404);
        }

        if ($user->otp !== $request->otp) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid OTP'
            ], 400);
        }

        if (Carbon::now()->gt($user->otp_expires_at)) {
            return response()->json([
                'status'  => false,
                'message' => 'OTP has expired'
            ], 400);
        }

        $user->update([
            'phone_verified' => true,
            'otp'            => null,
            'otp_expires_at' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Phone verified successfully',
            'token'   => $token,
            'user'    => $user
        ]);
    }

    // ====================== LOGIN ======================
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone'    => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::where('phone', $request->phone)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid phone number or password'
            ], 401);
        }

        if (!$user->phone_verified) {
            return response()->json([
                'status'  => false,
                'message' => 'Please verify your phone number first'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => $user
        ]);
    }

    // ====================== FORGOT PASSWORD (Send OTP) ======================
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|exists:users,phone',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::where('phone', $request->phone)->first();

        $otp = rand(100000, 999999);

        $user->update([
            'otp'            => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(10),
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'OTP sent successfully (simulated)',
            'otp'     => $otp // Only for testing
        ]);
    }

    // ====================== RESET PASSWORD ======================
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone'                 => 'required|string|exists:users,phone',
            'otp'                   => 'required|string',
            'password'              => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::where('phone', $request->phone)->first();

        if ($user->otp !== $request->otp || Carbon::now()->gt($user->otp_expires_at)) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid or expired OTP'
            ], 400);
        }

        $user->update([
            'password'       => Hash::make($request->password),
            'otp'            => null,
            'otp_expires_at' => null,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Password reset successfully'
        ]);
    }

    // ====================== LOGOUT ======================
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Logged out successfully'
        ]);
    }

    // ====================== GET PROFILE ======================
    public function profile(Request $request)
    {
        return response()->json([
            'status' => true,
            'user'   => $request->user()
        ]);
    }
        // ====================== UPDATE PROFILE ======================
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'            => 'sometimes|string|max:255',
            'email'           => 'sometimes|email|unique:users,email,' . $user->id,
            'bio'             => 'nullable|string',
            'farm_latitude'   => 'nullable|numeric',
            'farm_longitude'  => 'nullable|numeric',
            'farm_size'       => 'nullable|numeric',
            'crops_grown'     => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user->update($request->only([
            'name', 'email', 'bio', 'farm_latitude', 'farm_longitude', 'farm_size', 'crops_grown'
        ]));

        return response()->json([
            'status'  => true,
            'message' => 'Profile updated successfully',
            'user'    => $user
        ]);
    }

    // ====================== UPLOAD NATIONAL ID (Seller Verification) ======================
    public function uploadNationalId(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'seller') {
            return response()->json([
                'status'  => false,
                'message' => 'Only sellers can upload National ID'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'national_id'          => 'required|string|max:50',
            'national_id_document' => 'required|image|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors()
            ], 422);
        }

        // Store the document
        $path = $request->file('national_id_document')->store('national_ids', 'public');

        $user->update([
            'national_id'          => $request->national_id,
            'national_id_document' => $path,
            'is_verified'          => false, // Admin will approve later
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'National ID uploaded successfully. Waiting for admin approval.',
            'user'    => $user
        ]);
    }
}