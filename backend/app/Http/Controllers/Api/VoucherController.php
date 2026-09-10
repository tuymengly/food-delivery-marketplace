<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    public function validateCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $voucher = Voucher::whereRaw('UPPER(code) = ?', [strtoupper($validated['code'])])->first();

        if (! $voucher) {
            return response()->json([
                'success' => false,
                'message' => 'This voucher code does not exist.',
            ], 422);
        }

        $result = $voucher->evaluate((float) $validated['subtotal']);

        if (! $result['valid']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Voucher applied successfully.',
            'data' => [
                'code' => $voucher->code,
                'discount_amount' => $result['discount'],
                'discount_type' => $voucher->discount_type,
                'discount_value' => (float) $voucher->discount_value,
            ],
        ]);
    }
}
