<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
class DriverController extends Controller
{
    private function formatOrderForDriver(Order $order): array
    {
        $itemsFormatted = $order->items->map(function ($item) {
            return ($item->food->name ?? 'Item') . ' x ' . $item->quantity;
        })->implode(', ');

        return [
            'id'          => '#BR-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
            'real_id'     => $order->id,
            'price'       => '$' . number_format($order->total_price ?? 0, 2),
            'restaurant'  => $order->restaurant->name ?? 'N/A',
            'pickup'      => $order->restaurant->address ?? 'N/A',
            'customer'    => $order->user->name ?? 'Guest Customer',
            'phone'       => $order->user->phone ?? 'N/A',
            'dropoff'     => $order->user->location ?? 'N/A',
            'items'       => $itemsFormatted ?: 'No items',
            'time'        => $order->created_at ? $order->created_at->diffForHumans() : 'Just now',
            'status'      => ucfirst($order->status),
        ];
    }

    /**
     * Both the legacy admin-created 'Driver' role and the self-registered
     * lowercase 'rider' role represent the same delivery-partner concept.
     */
    private const DRIVER_ROLES = ['Driver', 'rider'];

    public function index()
    {
        $drivers = User::whereIn('role', self::DRIVER_ROLES)->latest()->get();
        return response()->json([
            'success' => true,
            'data' => $drivers
        ], 200);
    }

    /**
     * Admin-only: create a rider account after an off-platform interview.
     * Riders can never self-register (see AuthController::register), so
     * this is the sole path that produces a rider-role account. A random
     * temporary password is generated and returned once in the response
     * so the admin can hand it to the rider — it is never stored or
     * shown again after this call.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string',
            'vehicle'  => 'required|string',
            'status'   => 'nullable|string',
        ]);

        $temporaryPassword = Str::password(12);

        $driver = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'phone'    => $validated['phone'] ?? null,
            'vehicle'  => $validated['vehicle'],
            'status'   => $validated['status'] ?? 'Online',
            'role'     => 'rider',
            'password' => Hash::make($temporaryPassword),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rider account created successfully.',
            'data'    => [
                ...$driver->toArray(),
                'temporary_password' => $temporaryPassword,
            ],
        ], 201);
    }

    public function show($id)
    {
        $driver = User::whereIn('role', self::DRIVER_ROLES)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $driver
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $driver = User::whereIn('role', self::DRIVER_ROLES)->findOrFail($id);

        $validated = $request->validate([
            'name'    => 'sometimes|required|string|max:255',
            'email'   => 'sometimes|required|email|unique:users,email,' . $id,
            'phone'   => 'nullable|string',
            'vehicle' => 'sometimes|required|string',
            'status'  => 'sometimes|required|string',
        ]);

        $driver->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Driver updated successfully',
            'data'    => $driver
        ], 200);
    }
    public function destroy($id)
    {
        $driver = User::whereIn('role', self::DRIVER_ROLES)->findOrFail($id);
        $driver->delete();

        return response()->json([
            'success' => true,
            'message' => 'Driver deleted successfully'
        ], 200);
    }

    /**
     * Reject the request unless the caller is an approved rider/driver.
     * Riders self-registered with status 'Pending' cannot use delivery
     * functionality until an admin approves them (see ManageDrivers "Verify").
     */
    private function ensureApprovedDriver(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $role = strtolower((string) $user?->role);

        if (! in_array($role, ['driver', 'rider'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only riders can access this endpoint.',
            ], 403);
        }

        if (strtolower((string) $user->status) === 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Your rider application is still pending admin approval.',
            ], 403);
        }

        return null;
    }

    public function orders(Request $request)
    {
        if ($response = $this->ensureApprovedDriver($request)) {
            return $response;
        }

        $orders = Order::with(['user', 'restaurant', 'items.food'])->latest()->get();

        $availableStatuses = ['pending', 'new', 'preparing', 'ready'];
        $activeStatuses = ['accepted', 'picked_up', 'delivering', 'out_for_delivery'];
        $historyStatuses = ['completed', 'delivered'];
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();
        $startOfWeekInCurrentMonth = $startOfWeek->greaterThan($startOfMonth) ? $startOfWeek : $startOfMonth;

        $availableRequests = $orders
            ->filter(fn ($order) => in_array(strtolower($order->status), $availableStatuses, true))
            ->map(fn ($order) => $this->formatOrderForDriver($order))
            ->values();

        $activeOrder = $orders
            ->first(fn ($order) => in_array(strtolower($order->status), $activeStatuses, true));

        $history = $orders
            ->filter(fn ($order) => in_array(strtolower($order->status), $historyStatuses, true))
            ->map(fn ($order) => $this->formatOrderForDriver($order))
            ->values();

        $completedToday = $orders->filter(function ($order) use ($historyStatuses) {
            return in_array(strtolower($order->status), $historyStatuses, true)
                && $order->updated_at
                && $order->updated_at->isToday();
        });

        return response()->json([
            'success' => true,
            'data' => [
                'available_requests' => $availableRequests,
                'active_order' => $activeOrder ? $this->formatOrderForDriver($activeOrder) : null,
                'history' => $history,
                'summary' => [
                    'today_deliveries' => $completedToday->count(),
                    'today_earnings' => '$' . number_format($completedToday->sum('total_price'), 2),
                    'week_earnings' => '$' . number_format(
                        $orders
                            ->filter(fn ($order) => in_array(strtolower($order->status), $historyStatuses, true) && $order->updated_at && $order->updated_at->greaterThanOrEqualTo($startOfWeekInCurrentMonth))
                            ->sum('total_price'),
                        2
                    ),
                    'month_earnings' => '$' . number_format(
                        $orders
                            ->filter(fn ($order) => in_array(strtolower($order->status), $historyStatuses, true) && $order->updated_at && $order->updated_at->greaterThanOrEqualTo($startOfMonth))
                            ->sum('total_price'),
                        2
                    ),
                ],
            ],
        ], 200);
    }

    public function updateOrderStatus(Request $request, $id)
    {
        if ($response = $this->ensureApprovedDriver($request)) {
            return $response;
        }

        $validated = $request->validate([
            'status' => 'required|string|in:accepted,picked_up,delivering,completed,delivered,cancelled',
        ]);

        $cleanId = preg_replace('/[^0-9]/', '', $id);
        $order = Order::with(['user', 'restaurant', 'items.food'])->findOrFail($cleanId);

        $order->update([
            'status' => strtolower($validated['status']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver order status updated successfully.',
            'data' => $this->formatOrderForDriver($order->refresh()->load(['user', 'restaurant', 'items.food'])),
        ], 200);
    }
}
