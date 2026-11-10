<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        return Inertia::render('Notifications/Index', [
            'notifications' => auth()->user()->notifications()->paginate(20),
        ]);
    }

    public function markAsRead($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return redirect()->back();
    }

    public function markAllAsRead()
    {
        auth()->user()->unreadNotifications->markAsRead();

        return redirect()->back();
    }
}
