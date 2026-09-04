<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // 1. Get All Users
    public function index()
    {
        $users = User::latest()->get();
        return response()->json($users, 200);
    }

    // 2. Create New User
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'role'     => 'nullable|string',
            'status'   => 'nullable|string',
            'location' => 'nullable|string',
            'password' => 'nullable|string|min:6',
        ]);

        $validated['password'] = Hash::make($request->password ?? '12345678');
        $validated['role']     = $request->role ?? 'Customer';
        $validated['status']   = $request->status ?? 'Active';

        $user = User::create($validated);

        return response()->json([
            'message' => 'User created successfully',
            'data'    => $user
        ], 201);
    }

    // 3. Update User
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'     => 'nullable|string',
            'status'   => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        if ($request->filled('password')) {
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'data'    => $user
        ], 200);
    }

    // 4. Delete User
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ], 200);
    }
    // 5. Get Admin Profile (សម្រាប់ Super Admin កំពុង Login)
    public function getProfile(Request $request)
    {
        return response()->json([
            'status' => true,
            'data' => $request->user()
        ], 200);
    }

    // 6. Update Admin Profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'data'    => $user
        ], 200);
    }

    // 7. Update Admin Password
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|string|min:6',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ!'
        ], 200);
    }
}
