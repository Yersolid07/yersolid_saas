<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BiDailySnapshot;
use App\Models\BiDecision;
use App\Services\Bi\BiInsightService;
use App\Services\Bi\BiQueryService;
use App\Services\Bi\BiSnapshotService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BiController extends Controller
{
    public function __construct(
        private BiQueryService $query,
        private BiInsightService $insight,
        private BiSnapshotService $snapshot,
    ) {}

    public function index(Request $request)
    {
        [$from, $to, $range] = $this->resolveRange($request);
        $channel = $request->query('channel', 'all');

        $fin = $this->query->financial($from, $to);
        $inv = $this->query->inventory($from, $to);
        $menu = $this->query->menu($from, $to);
        $cust = $this->query->customers($from, $to);
        $fac = $this->query->facilities($from, $to);
        $ops = $this->query->operations($from, $to);
        $risks = $this->query->risks($from, $to);
        $insights = $this->insight->generate($fin, $menu, $cust, $fac, $ops, $inv, $from, $to);

        return Inertia::render('Admin/Bi/Index', [
            'meta' => [
                'period_from' => $from->toDateString(),
                'period_to' => $to->toDateString(),
                'range' => $range,
                'channel' => $channel,
                'days' => (int) $from->diffInDays($to) + 1,
                'generated_at' => now()->toDateTimeString(),
            ],
            'financial' => $fin,
            'inventory' => $inv,
            'menu' => $menu,
            'customers' => $cust,
            'facilities' => $fac,
            'operations' => $ops,
            'risks' => $risks,
            'insights' => $insights,
            'decisions' => BiDecision::with('creator')->orderByDesc('created_at')->limit(50)->get(),
            'snapshots' => BiDailySnapshot::whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->orderBy('date')->get(),
        ]);
    }

    public function storeDecision(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'hypothesis' => 'nullable|string|max:2000',
            'metric' => 'nullable|string|max:255',
            'target' => 'nullable|string|max:255',
            'evaluate_at' => 'nullable|date',
        ]);

        $decision = BiDecision::create([
            ...$validated,
            'status' => 'direncanakan',
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Keputusan dicatat.');
    }

    public function updateDecision(Request $request, BiDecision $decision)
    {
        $validated = $request->validate([
            'status' => 'required|in:'.implode(',', BiDecision::STATUSES),
            'result_note' => 'nullable|string|max:2000',
        ]);

        $decision->update($validated);

        return back()->with('success', 'Status keputusan diperbarui.');
    }

    public function snapshot(Request $request)
    {
        $request->validate(['days' => 'nullable|integer|min:1|max:365']);
        $days = (int) ($request->query('days', 30));
        $from = now()->subDays($days - 1)->startOfDay();
        $count = $this->snapshot->generateRange($from, now());

        return back()->with('success', "Snapshot BI diperbarui: {$count} hari.");
    }

    private function resolveRange(Request $request): array
    {
        $range = $request->query('range', '30d');
        $to = now();
        switch ($range) {
            case '7d': $from = now()->subDays(6);
                break;
            case '90d': $from = now()->subDays(89);
                break;
            case 'this_month': $from = now()->startOfMonth();
                break;
            case 'this_year': $from = now()->startOfYear();
                break;
            case 'custom':
                $from = Carbon::parse($request->query('from', now()->subDays(29)))->startOfDay();
                $to = Carbon::parse($request->query('to', now()))->endOfDay();
                break;
            case '30d':
            default: $from = now()->subDays(29);
                break;
        }

        return [$from->startOfDay(), $to->endOfDay(), $range];
    }
}
