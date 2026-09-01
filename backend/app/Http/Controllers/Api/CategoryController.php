<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('foods')->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Categories retrieved successfully.',
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $category = Category::create($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully.',
            'data' => $category,
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Category retrieved successfully.',
            'data' => $category->load('foods.restaurant'),
        ]);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $this->ensureAdmin($request);
        $category->update($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->ensureAdmin($request);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
            'data' => null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }

    private function ensureAdmin(Request $request): void
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Only administrators can modify categories.');
        }
    }
}
