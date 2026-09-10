<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class GeocodeRestaurants extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'geocode:restaurants {--force : Re-geocode restaurants that already have coordinates}';

    /**
     * The console command description.
     */
    protected $description = 'Backfill restaurant latitude/longitude from their address, via OpenStreetMap Nominatim.';

    public function handle(): int
    {
        $query = Restaurant::query();

        if (! $this->option('force')) {
            $query->where(function ($q) {
                $q->whereNull('latitude')->orWhereNull('longitude');
            });
        }

        $restaurants = $query->get();

        if ($restaurants->isEmpty()) {
            $this->info('No restaurants need geocoding.');
            return self::SUCCESS;
        }

        $geocoded = 0;
        $failed = 0;

        foreach ($restaurants as $restaurant) {
            $coordinates = $this->geocode($restaurant->address);

            if ($coordinates) {
                $restaurant->update($coordinates);
                $geocoded++;
                $this->line("Geocoded #{$restaurant->id} {$restaurant->name}: {$coordinates['latitude']}, {$coordinates['longitude']}");
            } else {
                $failed++;
                $this->warn("Could not geocode restaurant #{$restaurant->id}: {$restaurant->address}");
            }

            // Nominatim's usage policy caps unauthenticated use at 1 request/second.
            if (! $restaurants->last()->is($restaurant)) {
                sleep(1);
            }
        }

        $this->info("Done. {$geocoded} geocoded, {$failed} failed.");

        return self::SUCCESS;
    }

    /**
     * @return array{latitude: float, longitude: float}|null
     */
    private function geocode(string $address): ?array
    {
        $response = Http::withHeaders([
            'User-Agent' => config('app.name') . ' Restaurant Geocoding Backfill (contact: hello@angkordev.com)',
        ])->get('https://nominatim.openstreetmap.org/search', [
            'format' => 'jsonv2',
            'addressdetails' => 1,
            'limit' => 1,
            'q' => $address,
        ]);

        if (! $response->successful()) {
            return null;
        }

        $results = $response->json();

        if (empty($results)) {
            return null;
        }

        return [
            'latitude' => (float) $results[0]['lat'],
            'longitude' => (float) $results[0]['lon'],
        ];
    }
}
