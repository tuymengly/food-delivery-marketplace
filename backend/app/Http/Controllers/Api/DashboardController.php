<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private string $timezone = 'Asia/Phnom_Penh';

    public function stats(): JsonResponse
    {
        $totalUsers = User::count();
        $totalRestaurants = Restaurant::count();
        $totalOrders = Order::count();

        $totalRevenue = Order::whereIn('status', ['completed', 'Completed', 'delivered', 'Delivered'])->sum('total');
        // Platform profit (what actually belongs to the admin wallet), kept
        // distinct from total_revenue above which is gross customer sales.
        $totalPlatformProfit = Order::whereIn('status', ['completed', 'Completed', 'delivered', 'Delivered'])->sum('platform_profit');

        $pendingRestaurants = Restaurant::where('status', 'pending')
            ->with('user:id,name,email')
            ->latest()
            ->get(['id', 'name', 'user_id', 'created_at']);

        $pendingReviews = 0;
        $avgRating = 5.0;
        if (class_exists(\App\Models\Review::class)) {
            $pendingReviews = \App\Models\Review::where('status', 'pending')->count();
            $avgRating = round(\App\Models\Review::avg('rating') ?? 5.0, 1);
        }

        $currentYear = Carbon::now($this->timezone)->year;
        $monthExpression = DB::getDriverName() === 'pgsql'
            ? 'EXTRACT(MONTH FROM created_at)::int'
            : 'MONTH(created_at)';

        $monthlyRevenue = Order::whereIn('status', ['completed', 'Completed', 'delivered', 'Delivered'])
            ->whereYear('created_at', $currentYear)
            ->select(
                DB::raw($monthExpression . ' as month'),
                DB::raw('SUM(total) as total')
            )
            ->groupByRaw($monthExpression)
            ->pluck('total', 'month');

        $monthsMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $chartData = [];

        for ($m = 1; $m <= 12; $m++) {
            $chartData[] = [
                'month' => $monthsMap[$m - 1],
                'revenue' => (float) ($monthlyRevenue[$m] ?? 0)
            ];
        }

        // Recent Orders សម្រាប់ Admin
        $recentOrdersRaw = Order::with(['user:id,name', 'items.food:id,name,restaurant_id', 'items.food.restaurant:id,name'])
            ->latest()
            ->take(10)
            ->get();

        $recentOrders = $recentOrdersRaw->map(function ($order) {
            $restaurantName = $order->items->first()->food->restaurant->name ?? 'N/A';

            return [
                'id' => '#ORD-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                'customer' => $order->user->name ?? 'Guest Customer',
                'restaurant' => $restaurantName,
                'total' => '$' . number_format((float)($order->total ?? 0), 2),
                'time' => $order->created_at ? Carbon::parse($order->created_at)->setTimezone($this->timezone)->diffForHumans() : 'Just now',
                'status' => ucfirst($order->status ?? 'New')
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_restaurants' => $totalRestaurants,
                'total_orders' => $totalOrders,
                'total_revenue' => (float) $totalRevenue,
                'platform_profit' => (float) $totalPlatformProfit,
                'pending_reviews' => $pendingReviews,
                'avg_rating' => $avgRating,
                'pending_restaurants' => $pendingRestaurants,
                'chart_data' => $chartData,
                'recent_orders' => $recentOrders,
            ]
        ]);
    }

    public function restaurantStats(Request $request): JsonResponse
    {
        $restaurantId = $this->resolveRestaurantId($request);

        if (!$restaurantId || !Restaurant::whereKey($restaurantId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'រកមិនឃើញទិន្នន័យហាងឡើយ!'
            ], 404);
        }

        $today = Carbon::today($this->timezone);
        $yesterday = Carbon::yesterday($this->timezone);

        $baseOrderQuery = Order::whereHas('items.food', fn($q) => $q->where('restaurant_id', $restaurantId));

        $todayOrdersQuery = (clone $baseOrderQuery)->whereDate('created_at', $today);
        $yesterdayOrdersQuery = (clone $baseOrderQuery)->whereDate('created_at', $yesterday);

        $validStatuses = ['completed', 'Completed', 'delivered', 'Delivered', 'accepted', 'Accepted'];

        $todayRevenue = (clone $todayOrdersQuery)
            ->whereIn('status', $validStatuses)
            ->sum('total');

        $yesterdayRevenue = (clone $yesterdayOrdersQuery)
            ->whereIn('status', $validStatuses)
            ->sum('total');

        $revenueGrowth = 0;
        $revenueGrowthAmount = (float) $todayRevenue - (float) $yesterdayRevenue;
        if ($yesterdayRevenue > 0) {
            $revenueGrowth = round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100);
        } elseif ($todayRevenue > 0) {
            $revenueGrowth = 100;
        }

        $todayOrdersCount = (clone $todayOrdersQuery)->count();

        $newOrdersThisHour = (clone $baseOrderQuery)
            ->where('created_at', '>=', Carbon::now($this->timezone)->subHour())
            ->count();

        $pendingOrdersCount = (clone $baseOrderQuery)
            ->whereIn('status', ['pending', 'Pending', 'new', 'New', 'preparing', 'Preparing', 'processing', 'Processing', 'accepted', 'Accepted', 'ready', 'Ready'])
            ->count();

        $completedTodayCount = (clone $todayOrdersQuery)
            ->whereIn('status', ['completed', 'Completed', 'delivered', 'Delivered'])
            ->count();

        // Weekly Revenue Chart (Mon-Sun)
        $startOfWeek = Carbon::now($this->timezone)->startOfWeek();
        $endOfWeek = Carbon::now($this->timezone)->endOfWeek();

        $weeklyRevenues = (clone $baseOrderQuery)
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as total')
            )
            ->groupBy('date')
            ->pluck('total', 'date');

        $daysMap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $revenueData = [];

        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $dateStr = $date->format('Y-m-d');

            $revenueData[] = [
                'day' => $daysMap[$i],
                'revenue' => (float) ($weeklyRevenues[$dateStr] ?? 0)
            ];
        }

        // Recent Orders សម្រាប់ Restaurant
        $recentOrdersRaw = (clone $baseOrderQuery)
            ->with(['user:id,name', 'items.food:id,name'])
            ->latest()
            ->take(10)
            ->get();

        $recentOrders = $recentOrdersRaw->map(function ($order) {
            $itemsSummary = 'No items';
            if (isset($order->items) && count($order->items) > 0) {
                $itemsSummary = $order->items->map(function ($item) {
                    $foodName = $item->food->name ?? $item->food_name ?? 'Item';
                    $qty = $item->quantity ?? 1;
                    return "{$foodName} × {$qty}";
                })->implode(', ');
            }

            return [
                'id' => '#BR-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                'customer' => $order->user->name ?? 'Guest Customer',
                'items' => $itemsSummary,
                'total' => '$' . number_format((float)($order->total ?? 0), 2),
                'time' => $order->created_at ? Carbon::parse($order->created_at)->setTimezone($this->timezone)->diffForHumans() : 'Just now',
                'status' => ucfirst($order->status ?? 'New')
            ];
        });

        return response()->json([
            'success' => true,
            'restaurant_id' => (int) $restaurantId,
            'stats' => [
                'todayRevenue' => (float) $todayRevenue,
                'revenueGrowth' => $revenueGrowth,
                'revenueGrowthAmount' => $revenueGrowthAmount,
                'todayOrders' => $todayOrdersCount,
                'newOrdersThisHour' => $newOrdersThisHour,
                'pendingOrders' => $pendingOrdersCount,
                'completedToday' => $completedTodayCount,
            ],
            'revenueData' => $revenueData,
            'recentOrders' => $recentOrders,
        ]);
    }

    public function restaurantSales(Request $request): JsonResponse
    {
        $restaurantId = $this->resolveRestaurantId($request);

        if (!$restaurantId || !Restaurant::whereKey($restaurantId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Not Found Rastaurant Data!'
            ], 404);
        }

        [$startDate, $endDate, $previousStartDate, $previousEndDate] = $this->salesDateRange(
            $request->query('range', 'This Month')
        );

        $paidStatuses = ['completed', 'Completed', 'delivered', 'Delivered'];

        $periodOrders = Order::whereHas('items.food', fn($q) => $q->where('restaurant_id', $restaurantId))
            ->whereBetween('created_at', [$startDate, $endDate]);

        $previousOrders = Order::whereHas('items.food', fn($q) => $q->where('restaurant_id', $restaurantId))
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate]);

        $totalRevenue = (clone $periodOrders)->whereIn('status', $paidStatuses)->sum('total');
        $previousRevenue = (clone $previousOrders)->whereIn('status', $paidStatuses)->sum('total');
        $totalOrders = (clone $periodOrders)->count();
        $previousTotalOrders = (clone $previousOrders)->count();
        $avgOrderValue = $totalOrders > 0 ? (float) $totalRevenue / $totalOrders : 0;
        $previousAvgOrderValue = $previousTotalOrders > 0 ? (float) $previousRevenue / $previousTotalOrders : 0;
        // The restaurant's actual earnings, not a flat 90% guess: their stored
        // per-order share after the platform commission (see OrderFinanceCalculator).
        $netEarnings = (float) (clone $periodOrders)->whereIn('status', $paidStatuses)->sum('restaurant_amount');
        $previousNetEarnings = (float) (clone $previousOrders)->whereIn('status', $paidStatuses)->sum('restaurant_amount');

        $transactions = (clone $periodOrders)
            ->with('user:id,name')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => '#ORD-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                    'date' => $order->created_at
                        ? Carbon::parse($order->created_at)->setTimezone($this->timezone)->format('Y-m-d')
                        : null,
                    'customer' => $order->user->name ?? 'Guest Customer',
                    'amount' => (float) ($order->total ?? 0),
                    'payment' => $order->payment_method ?? 'Online Order',
                    'status' => ucfirst($order->status ?? 'Pending'),
                ];
            });

        $paymentMethods = $this->restaurantPaymentMethods($restaurantId, $startDate, $endDate, $paidStatuses);

        return response()->json([
            'success' => true,
            'restaurant_id' => (int) $restaurantId,
            'range' => $request->query('range', 'This Month'),
            'stats' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalRevenueChange' => $this->percentageChange((float) $totalRevenue, (float) $previousRevenue),
                'netEarnings' => $netEarnings,
                'netEarningsChange' => $this->percentageChange($netEarnings, $previousNetEarnings),
                'totalOrders' => $totalOrders,
                'totalOrdersChange' => $this->percentageChange($totalOrders, $previousTotalOrders),
                'avgOrderValue' => $avgOrderValue,
                'avgOrderValueChange' => $this->percentageChange($avgOrderValue, $previousAvgOrderValue),
                'availableForPayout' => $netEarnings,
                'nextPayoutDate' => Carbon::now($this->timezone)->endOfDay()->format('M d'),
            ],
            'paymentMethods' => $paymentMethods,
            'transactions' => $transactions,
        ]);
    }

    private function resolveRestaurantId(Request $request): ?int
    {
        $user = $request->user() ?: auth('sanctum')->user();
        $role = strtolower((string) $user?->role);

        if (in_array($role, ['restaurant', 'restaurant admin'], true)) {
            return Restaurant::where('user_id', $user->id)->value('id');
        }

        abort_unless(in_array($role, ['admin', 'super_admin', 'super admin'], true), 403, 'Only restaurant owners and administrators can access restaurant analytics.');

        $restaurantId = $request->query('restaurant_id');

        if ($restaurantId) {
            return (int) $restaurantId;
        }

        if ($user) {
            $ownedRestaurantIds = Restaurant::where('user_id', $user->id)->pluck('id');

            if ($ownedRestaurantIds->isNotEmpty()) {
                $firstOwned = $ownedRestaurantIds->first();

                $latestOrderRestaurantId = Order::whereHas('items.food', fn($q) => $q->whereIn('restaurant_id', $ownedRestaurantIds))
                    ->latest()
                    ->with('items.food')
                    ->first()?->items->first()?->food->restaurant_id;

                return (int) ($latestOrderRestaurantId ?? $firstOwned);
            }
        }

        return (int) (Restaurant::query()->value('id'));
    }

    private function salesDateRange(string $range): array
    {
        $now = Carbon::now($this->timezone);

        return match ($range) {
            'Today' => [
                $now->copy()->startOfDay(),
                $now->copy()->endOfDay(),
                $now->copy()->subDay()->startOfDay(),
                $now->copy()->subDay()->endOfDay(),
            ],
            'This Week' => [
                $now->copy()->startOfWeek(),
                $now->copy()->endOfWeek(),
                $now->copy()->subWeek()->startOfWeek(),
                $now->copy()->subWeek()->endOfWeek(),
            ],
            'This Year' => [
                $now->copy()->startOfYear(),
                $now->copy()->endOfYear(),
                $now->copy()->subYear()->startOfYear(),
                $now->copy()->subYear()->endOfYear(),
            ],
            default => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
                $now->copy()->subMonth()->startOfMonth(),
                $now->copy()->subMonth()->endOfMonth(),
            ],
        };
    }

    private function percentageChange(float $current, float $previous): float
    {
        if ($previous > 0) {
            return round((($current - $previous) / $previous) * 100, 1);
        }

        return $current > 0 ? 100.0 : 0.0;
    }

    private function restaurantPaymentMethods(int $restaurantId, Carbon $startDate, Carbon $endDate, array $paidStatuses): array
    {
        $baseQuery = Order::whereHas('items.food', fn($q) => $q->where('restaurant_id', $restaurantId))
            ->whereIn('status', $paidStatuses)
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (Schema::hasColumn('orders', 'payment_method')) {
            return (clone $baseQuery)
                ->select('payment_method', DB::raw('SUM(total) as total'))
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($item) => [
                    'name' => $item->payment_method ?: 'Online Order',
                    'amount' => (float) $item->total,
                ])
                ->values()
                ->all();
        }

        $total = (clone $baseQuery)->sum('total');

        return [
            [
                'name' => 'Online Order',
                'amount' => (float) $total,
            ],
        ];
    }
}
