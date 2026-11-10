<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Check if user already exists
            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            if ($user) {
                // Update google_id and avatar if missing
                if (! $user->google_id) {
                    $user->google_id = $googleUser->id;
                }
                if (! $user->avatar) {
                    $user->avatar = $googleUser->avatar;
                }
                $user->save();
            } else {
                // Create new user
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'password' => null, // Password is null for OAuth users
                    'email_verified_at' => now(),
                ]);

                // Assign default role (e.g. customer)
                $user->assignRole('customer');

                $user->notify(new WelcomeNotification);
            }

            Auth::login($user, true); // login and remember

            return redirect()->intended(route('dashboard'));

        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors(['error' => 'Gagal login menggunakan Google. Silakan coba lagi.']);
        }
    }
}
