<?php

namespace App\Policies;

use App\Models\FoodOrder;
use App\Models\User;

class FoodOrderPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'manager', 'staff']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, FoodOrder $foodOrder): bool
    {
        if ($user && $user->hasAnyRole(['admin', 'manager', 'staff'])) {
            return true;
        }

        if ($user) {
            return $user->id === $foodOrder->user_id;
        }

        // For guest food orders, knowing the UUID is sufficient authorization
        return $foodOrder->user_id === null;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(?User $user): bool
    {
        return true; // Anyone can create
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, FoodOrder $foodOrder): bool
    {
        return $user->hasAnyRole(['admin', 'manager', 'staff']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, FoodOrder $foodOrder): bool
    {
        return $user->hasRole('admin');
    }
}
