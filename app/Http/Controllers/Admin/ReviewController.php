<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $reviews = Review::with(['user', 'reservation.facility'])
            ->when($request->rating, fn ($q) => $q->where('rating', $request->rating))
            ->when($request->visibility !== null, fn ($q) => $q->where('is_public', $request->visibility === 'public'))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'filters' => $request->only(['rating', 'visibility']),
            'stats' => [
                'avg_rating' => Review::avg('rating'),
                'total' => Review::count(),
                'public' => Review::where('is_public', true)->count(),
            ],
        ]);
    }

    public function toggleVisibility(Review $review)
    {
        $review->update(['is_public' => ! $review->is_public]);

        return back()->with('success', $review->is_public ? 'Ulasan disembunyikan.' : 'Ulasan dipublish.');
    }

    public function destroy(Review $review)
    {
        $review->delete();

        return back()->with('success', 'Ulasan berhasil dihapus.');
    }
}
