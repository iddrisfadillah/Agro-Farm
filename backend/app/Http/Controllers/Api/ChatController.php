<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    // Get all conversations for the logged-in user
    public function conversations(Request $request)
    {
        $user = $request->user();

        $conversations = Conversation::with(['buyer:id,name,phone', 'seller:id,name,phone', 'lastMessage', 'product:id,name'])
            ->where('buyer_id', $user->id)
            ->orWhere('seller_id', $user->id)
            ->orderByDesc('last_message_at')
            ->get();

        return response()->json([
            'status' => true,
            'conversations' => $conversations
        ]);
    }

    // Get messages in a conversation
    public function messages(Request $request, $conversationId)
    {
        $user = $request->user();

        $conversation = Conversation::where('id', $conversationId)
            ->where(function ($q) use ($user) {
                $q->where('buyer_id', $user->id)
                  ->orWhere('seller_id', $user->id);
            })
            ->first();

        if (!$conversation) {
            return response()->json([
                'status' => false,
                'message' => 'Conversation not found'
            ], 404);
        }

        // Mark messages as read
        Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = Message::with('sender:id,name')
            ->where('conversation_id', $conversationId)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'status' => true,
            'messages' => $messages
        ]);
    }

    // Start a new conversation or get existing one
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'seller_id'  => 'required|exists:users,id',
            'product_id' => 'nullable|exists:products,id',
            'message'    => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $buyer = $request->user();

        // Find existing conversation or create new one
        $conversation = Conversation::firstOrCreate(
            [
                'buyer_id'  => $buyer->id,
                'seller_id' => $request->seller_id,
            ],
            [
                'product_id' => $request->product_id,
                'last_message_at' => now(),
            ]
        );

        // Create the first message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $buyer->id,
            'message'         => $request->message,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'status' => true,
            'message' => 'Conversation started',
            'conversation' => $conversation->load('messages')
        ], 201);
    }

    // Send a message in an existing conversation
    public function send(Request $request, $conversationId)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        $conversation = Conversation::where('id', $conversationId)
            ->where(function ($q) use ($user) {
                $q->where('buyer_id', $user->id)
                  ->orWhere('seller_id', $user->id);
            })
            ->first();

        if (!$conversation) {
            return response()->json([
                'status' => false,
                'message' => 'Conversation not found'
            ], 404);
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'message'         => $request->message,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'status'  => true,
            'message' => 'Message sent',
            'data'    => $message->load('sender:id,name')
        ], 201);
    }
}