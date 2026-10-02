<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    public function initialize(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        $order = Order::where('id', $request->order_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json([
                'status' => false,
                'message' => 'Order already paid'
            ], 400);
        }

        // Paystack expects amount in pesewas (GHS * 100)
        $amount = (int) round($order->total * 100);

        $response = Http::withToken(config('services.paystack.secret_key'))
            ->post('https://api.paystack.co/transaction/initialize', [
                'email' => $request->user()->email ?? $request->user()->phone . '@agromarket.test',
                'amount' => $amount,
                'currency' => 'GHS',
                'reference' => $order->order_number . '-' . time(),
                'callback_url' => $request->callback_url ?? 'http://127.0.0.1:5500/marketplace/checkout.html',
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_id' => $request->user()->id,
                ],
            ]);

        $data = $response->json();

        if (!($data['status'] ?? false)) {
            return response()->json([
                'status' => false,
                'message' => $data['message'] ?? 'Failed to initialize payment'
            ], 400);
        }

        // Save reference on order
        $order->update([
            'payment_reference' => $data['data']['reference'],
            'payment_method' => $request->payment_method ?? 'paystack',
        ]);

        return response()->json([
            'status' => true,
            'authorization_url' => $data['data']['authorization_url'],
            'access_code' => $data['data']['access_code'],
            'reference' => $data['data']['reference'],
            'public_key' => config('services.paystack.public_key'),
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'reference' => 'required|string',
        ]);

        $response = Http::withToken(config('services.paystack.secret_key'))
            ->get('https://api.paystack.co/transaction/verify/' . $request->reference);

        $data = $response->json();

        if (!($data['status'] ?? false) || ($data['data']['status'] ?? '') !== 'success') {
            return response()->json([
                'status' => false,
                'message' => 'Payment not successful'
            ], 400);
        }

        $orderId = $data['data']['metadata']['order_id'] ?? null;
        $order = Order::find($orderId);

        if ($order) {
            $order->update([
                'payment_status' => 'paid',
                'payment_reference' => $request->reference,
                'payment_method' => $data['data']['channel'] ?? 'paystack',
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Payment verified',
            'order' => $order
        ]);
    }
}