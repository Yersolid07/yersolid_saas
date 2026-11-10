<?php

use App\Models\User;

$users = User::doesntHave('roles')->get();
foreach ($users as $user) {
    $user->assignRole('customer');
}
echo $users->count().' users updated.';
