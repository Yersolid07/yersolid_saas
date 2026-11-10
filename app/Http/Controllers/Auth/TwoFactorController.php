<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    // Show enable form (generate secret + QR if not confirmed)
    public function show(Request $request)
    {
        $user = $request->user();
        if ($user->two_factor_confirmed_at) {
            return redirect()->back()->with('flash.success', '2FA sudah aktif.');
        }
        if (! $user->two_factor_secret) {
            $google2fa = new Google2FA;
            $secret = $google2fa->generateSecretKey();
            $user->forceFill(['two_factor_secret' => Crypt::encryptString($secret)])->save();
        }
        $secret = Crypt::decryptString($user->two_factor_secret);
        $qrUrl = (new Google2FA)->getQRCodeUrl(config('app.name'), $user->email, $secret);
        // Use a public QR image service URL (no key stored server-side beyond encrypted secret)
        $qrImage = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='.urlencode($qrUrl);

        return inertia('Profile/TwoFactor', [
            'qr_image' => $qrImage,
            'secret' => $secret,
            'confirmed' => false,
        ]);
    }

    // Confirm the code and enable 2FA
    public function confirm(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        $user = $request->user();
        if ($user->two_factor_confirmed_at) {
            return redirect()->back()->with('flash.success', '2FA sudah aktif.');
        }
        $secret = Crypt::decryptString($user->two_factor_secret);
        $valid = (new Google2FA)->verifyKey($secret, $request->code);
        if (! $valid) {
            return redirect()->back()->with('flash.error', 'Kode tidak valid.');
        }
        $codes = collect(range(1, 8))->map(fn () => substr(str_replace(['+', '/', '='], ['x', 'y', 'z'], base64_encode(random_bytes(6))), 0, 10))->implode("\n");
        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => Crypt::encryptString($codes),
        ])->save();

        return redirect()->back()->with('flash.success', '2FA aktif! Simpan kode pemulihan: '.$codes);
    }

    // Disable 2FA (requires password confirmation in real app; simplified here)
    public function disable(Request $request)
    {
        $request->user()->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return redirect()->back()->with('flash.success', '2FA dinonaktifkan.');
    }
}
