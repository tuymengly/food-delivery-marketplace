<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Addresses retrieved successfully.',
            'data' => $addresses,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        if ($validated['is_default'] ?? false) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address = $request->user()->addresses()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Address created successfully.',
            'data' => $address,
        ], 201);
    }

    public function show(Request $request, Address $address): JsonResponse
    {
        $address = $this->findUserAddress($request, $address);

        return response()->json([
            'success' => true,
            'message' => 'Address retrieved successfully.',
            'data' => $address,
        ]);
    }

    public function update(Request $request, Address $address): JsonResponse
    {
        $address = $this->findUserAddress($request, $address);
        $validated = $request->validate($this->rules());

        if ($validated['is_default'] ?? false) {
            $request->user()->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Address updated successfully.',
            'data' => $address,
        ]);
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $address = $this->findUserAddress($request, $address);
        $address->delete();

        return response()->json([
            'success' => true,
            'message' => 'Address deleted successfully.',
            'data' => null,
        ]);
    }

    private function findUserAddress(Request $request, Address $address): Address
    {
        return $request->user()->addresses()->whereKey($address->id)->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:255'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'address' => ['required', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
