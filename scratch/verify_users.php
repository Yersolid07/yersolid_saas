<?php

use App\Models\User;

User::whereNull('email_verified_at')->update(['email_verified_at' => now()]);
echo 'All users verified.';
