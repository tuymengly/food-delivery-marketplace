<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\Delivery;
use App\Models\Rider;
use App\Services\RiderMatchingService;
use App\Support\OrderStatuses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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
            // Map markers for the rider dashboard - the restaurant's own
            // saved coordinates (RestaurantController::updateProfile) and
            // this specific order's delivery address (not the generic,
            // rarely-set User::location string, which is unrelated to any
            // one order and was never the right source for a dropoff pin).
            'restaurant_lat' => $order->restaurant?->latitude !== null ? (float) $order->restaurant->latitude : null,
            'restaurant_lng' => $order->restaurant?->longitude !== null ? (float) $order->restaurant->longitude : null,
            'dropoff_lat' => $order->address?->latitude !== null ? (float) $order->address->latitude : null,
            'dropoff_lng' => $order->address?->longitude !== null ? (float) $order->address->longitude : null,
            'customer'    => $order->user->name ?? 'Guest Customer',
            'phone'       => $order->user->phone ?? 'N/A',
            'dropoff'     => $order->address->address ?? $order->user->location ?? 'N/A',
            'items'       => $itemsFormatted ?: 'No items',
            'time'        => $order->created_at ? $order->created_at->diffForHumans() : 'Just now',
            'status'      => ucfirst($order->status),
            // orders.status collapses picked_up/delivering into one value
            // (see OrderStatuses aliases), so the driver UI needs the
            // delivery's own finer-grained status to drive its 3-step flow.
            'delivery_status' => $order->delivery->status ?? null,
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

        $driver = DB::transaction(function () use ($validated, $temporaryPassword): User {
            $driver = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'phone'    => $validated['phone'] ?? null,
                'vehicle'  => $validated['vehicle'],
                'status'   => $validated['status'] ?? 'Online',
                'role'     => 'rider',
                'password' => Hash::make($temporaryPassword),
            ]);

            // Every rider needs a riders row to use the delivery APIs (see
            // RiderProfileController/RiderDeliveryController, which key off
            // $user->rider). Without this, a freshly admin-created rider
            // would 500 the first time they open the driver dashboard.
            Rider::create([
                'user_id' => $driver->id,
                'vehicle_type' => $this->mapVehicleType($validated['vehicle']),
                'vehicle_number' => 'PENDING',
                'phone' => $validated['phone'] ?? 'N/A',
                'status' => 'active',
                'is_available' => true,
            ]);

            return $driver;
        });

        return response()->json([
            'success' => true,
            'message' => 'Rider account created successfully.',
            'data'    => [
                ...$driver->toArray(),
                'temporary_password' => $temporaryPassword,
            ],
        ], 201);
    }

    private function mapVehicleType(string $vehicle): string
    {
        return match (strtolower($vehicle)) {
            'car' => 'car',
            'bike', 'bicycle' => 'bicycle',
            default => 'motorcycle',
        };
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

        $rider = $request->user()->rider;
        $orders = Order::with(['user', 'restaurant', 'address', 'items.food', 'delivery'])->latest()->get();

        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();
        $startOfWeekInCurrentMonth = $startOfWeek->greaterThan($startOfMonth) ? $startOfWeek : $startOfMonth;

        // Open pool: ONLY orders the restaurant has already accepted, prepared
        // and marked READY_FOR_PICKUP whose delivery has no rider yet (either
        // nobody was eligible when it became ready, or the previous rider
        // released it). A rider must never see - let alone accept - an order
        // that is still with the restaurant.
        $availableRequests = $orders
            ->filter(fn ($order) => $order->order_type !== 'pickup'
                && OrderStatuses::isReadyForPickup($order->status)
                && $order->delivery
                && $order->delivery->rider_id === null
                && $order->delivery->status === 'pending')
            ->map(fn ($order) => $this->formatOrderForDriver($order))
            ->values();

        // This rider's own delivery - both the ones Laravel assigned
        // automatically and the ones they claimed from the pool above. Keyed
        // on deliveries.status, not orders.status, because an order stays
        // READY_FOR_PICKUP until the rider actually collects it.
        $activeOrder = $orders
            ->first(fn ($order) => $order->delivery?->rider_id === $rider->id
                && in_array($order->delivery->status, ['assigned', 'picked_up', 'delivering'], true));

        $deliveredToThisRider = $orders
            ->filter(fn ($order) => $order->delivery?->rider_id === $rider->id
                && $order->delivery->status === 'delivered');

        $history = $deliveredToThisRider
            ->map(fn ($order) => $this->formatOrderForDriver($order))
            ->values();

        $completedToday = $deliveredToThisRider->filter(fn ($order) => $order->updated_at && $order->updated_at->isToday());

        return response()->json([
            'success' => true,
            'data' => [
                'available_requests' => $availableRequests,
                'active_order' => $activeOrder ? $this->formatOrderForDriver($activeOrder) : null,
                'history' => $history,
                'summary' => [
                    'today_deliveries' => $completedToday->count(),
                    // Rider earnings are the rider's actual delivery-fee share
                    // (order.rider_amount), never the full order total.
                    'today_earnings' => '$' . number_format($completedToday->sum('rider_amount'), 2),
                    'week_earnings' => '$' . number_format(
                        $orders
                            ->filter(fn ($order) => $order->delivery?->rider_id === $rider->id && $order->delivery->status === 'delivered' && $order->updated_at && $order->updated_at->greaterThanOrEqualTo($startOfWeekInCurrentMonth))
                            ->sum('rider_amount'),
                        2
                    ),
                    'month_earnings' => '$' . number_format(
                        $orders
                            ->filter(fn ($order) => $order->delivery?->rider_id === $rider->id && $order->delivery->status === 'delivered' && $order->updated_at && $order->updated_at->greaterThanOrEqualTo($startOfMonth))
                            ->sum('rider_amount'),
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
        $order = Order::with(['user', 'restaurant', 'address', 'items.food', 'delivery'])->findOrFail($cleanId);
        $rider = $request->user()->rider;
        $status = strtolower($validated['status']);

        DB::transaction(function () use ($order, $rider, $status): void {
            $delivery = $order->delivery;

            if ($status === 'accepted') {
                abort_if($order->order_type === 'pickup', 422, 'Pickup orders are collected in person and cannot be claimed by a rider.');

                // A rider may ONLY take an order the restaurant has already
                // accepted, prepared and marked READY_FOR_PICKUP. While the
                // restaurant is still deciding or cooking there is nothing to
                // claim, and the driver dashboard never lists such an order.
                abort_unless(
                    OrderStatuses::isReadyForPickup($order->status),
                    422,
                    'This order is not ready for pickup yet.'
                );

                // Two riders tapping "Accept" on the same pool order at
                // nearly the same moment must not both win it: lock the row
                // (creating it first if this is its very first claim) and
                // re-check status against the locked read, not the copy
                // loaded before this transaction opened.
                $delivery = $delivery
                    ? Delivery::whereKey($delivery->id)->lockForUpdate()->first()
                    : Delivery::create(['order_id' => $order->id, 'status' => 'pending']);

                if ($delivery->rider_id !== null || $delivery->status !== 'pending') {
                    abort(422, 'This delivery is no longer available.');
                }

                $rider = Rider::whereKey($rider->id)->lockForUpdate()->first();
                if (!$rider->is_available) {
                    abort(422, 'You are no longer available to accept deliveries.');
                }

                $delivery->update(['rider_id' => $rider->id, 'status' => 'assigned']);
                $rider->update(['is_available' => false]);
                // The order deliberately stays READY_FOR_PICKUP: claiming the
                // delivery is RIDER_ASSIGNED, and the order only moves to
                // 'delivering' once the rider actually picks the food up.
                return;
            }

            if ($status === 'cancelled') {
                // The rider can no longer complete this one: release it back
                // to the open pool (still READY_FOR_PICKUP, no rider) instead
                // of leaving it stuck to them.
                abort_unless($delivery && $delivery->rider_id === $rider->id, 403, 'You can only release your assigned delivery.');
                abort_if(
                    in_array($delivery->status, ['picked_up', 'delivering', 'delivered'], true),
                    422,
                    'A delivery that has already been picked up cannot be released.'
                );

                $locked = Delivery::whereKey($delivery->id)->lockForUpdate()->first();
                abort_unless($locked, 422, 'This delivery is no longer available.');
                $locked->update(['rider_id' => null, 'status' => 'pending']);
                // Query-based: the same staleness caveat as the completion path.
                Rider::whereKey($rider->id)->update(['is_available' => true]);

                return;
            }

            abort_unless($delivery && $delivery->rider_id === $rider->id, 403, 'You can only update your assigned delivery.');

            $updates = ['status' => $status];
            if ($status === 'picked_up') {
                abort_unless($delivery->status === 'assigned', 422, 'Only assigned deliveries can be picked up.');
                $updates['picked_up_at'] = now();
                // The food has left the restaurant - the order is now out for
                // delivery. (Previously this incorrectly set order.status back
                // to 'preparing', a backward transition from 'ready'.)
                if (OrderStatuses::isForwardOrSame($order->status, OrderStatuses::DELIVERING)) {
                    $order->update(['status' => OrderStatuses::DELIVERING]);
                }
            } elseif ($status === 'delivering') {
                abort_unless($delivery->status === 'picked_up', 422, 'Only picked up deliveries can be started.');
                if (OrderStatuses::isForwardOrSame($order->status, OrderStatuses::DELIVERING)) {
                    $order->update(['status' => OrderStatuses::DELIVERING]);
                }
            } elseif (in_array($status, ['completed', 'delivered'], true)) {
                abort_unless($delivery->status === 'delivering', 422, 'Only delivering deliveries can be completed.');
                $updates['status'] = 'delivered';
                $updates['delivered_at'] = now();
                $order->update(['status' => 'delivered']);
                // Query-based on purpose - see RiderDeliveryController::deliver().
                Rider::whereKey($rider->id)->update(['is_available' => true]);
            }

            $delivery->update($updates);
        });

        // Finishing a delivery makes the rider available again, which is exactly
        // the trigger for the "no rider was eligible" retry: any OTHER order
        // still waiting in READY_FOR_PICKUP can now be matched to them.
        //
        // A rider who just RELEASED a delivery (status 'cancelled') is
        // deliberately excluded: retrying there would hand the very order they
        // just gave up straight back to them, because it is still ready and
        // still unassigned.
        if (in_array($status, ['completed', 'delivered'], true)) {
            app(RiderMatchingService::class)->assignWaitingDeliveryToRider($rider->refresh());
        }

        return response()->json([
            'success' => true,
            'message' => 'Driver order status updated successfully.',
            'data' => $this->formatOrderForDriver($order->refresh()->load(['user', 'restaurant', 'address', 'items.food'])),
        ], 200);
    }
}
