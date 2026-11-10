<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->with('roles')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->when($request->role, fn ($q) => $q->role($request->role))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => Role::all(['id', 'name']),
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Form', [
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'role' => 'required|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('admin.users.index')
            ->with('success', 'Pengguna berhasil dibuat.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/Form', [
            'user' => $user->load('roles'),
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|unique:users,email,{$user->id}",
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'role' => 'nullable|exists:roles,name',
        ]);

        // Guard: manager cannot touch admin roles; nobody can change their own role here
        if (! empty($validated['role'])) {
            if (auth()->user()->hasRole('manager')) {
                if ($user->hasRole('admin') || $validated['role'] === 'admin') {
                    abort(403, 'Manager tidak diizinkan mengubah role Admin.');
                }
            }
            if ($user->id === auth()->id()) {
                return back()->with('error', 'Tidak dapat mengubah role Anda sendiri.');
            }
        }

        if (isset($validated['password']) && $validated['password'] !== '') {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $role = $validated['role'] ?? null;
        unset($validated['role']);

        $user->update($validated);

        if ($role) {
            $user->syncRoles([$role]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function updateRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => 'required|exists:roles,name',
        ]);

        if (auth()->user()->hasRole('manager')) {
            if ($user->hasRole('admin') || $validated['role'] === 'admin') {
                abort(403, 'Manager tidak diizinkan mengubah role Admin.');
            }
        }

        // Prevent changing own admin role
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak dapat mengubah role Anda sendiri.');
        }

        $user->syncRoles([$validated['role']]);

        return back()->with('success', 'Role pengguna berhasil diubah.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak dapat menghapus akun Anda sendiri.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'Pengguna berhasil dihapus.');
    }
}
