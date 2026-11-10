<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;

class ReservationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view all reservations') || $user->hasPermissionTo('view own reservations');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, Reservation $reservation): bool
    {
        if ($user && $user->hasPermissionTo('view all reservations')) {
            return true;
        }

        if ($user && $user->hasPermissionTo('view own reservations')) {
            return $user->id === $reservation->user_id;
        }

        // For guest reservations, knowing the UUID is sufficient authorization
        // because UUIDs are practically impossible to guess.
        return $reservation->user_id === null;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create reservations');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Reservation $reservation): bool
    {
        if ($user->hasPermissionTo('edit reservations')) {
            return true;
        }

        // Custom logic: customers can edit if pending? Or no edit, just cancel.
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Reservation $reservation): bool
    {
        return $user->hasPermissionTo('cancel reservations');
    }

    public function cancel(User $user, Reservation $reservation): bool
    {
        if ($user->hasPermissionTo('cancel reservations')) {
            // Admins/managers can cancel anything
            if ($user->hasPermissionTo('edit reservations')) {
                return true;
            }

            // Customer can only cancel their own
            return $user->id === $reservation->user_id;
        }

        return false;
    }
}
