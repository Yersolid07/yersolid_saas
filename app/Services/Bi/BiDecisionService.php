<?php

namespace App\Services\Bi;

use App\Models\BiDecision;

/**
 * BiDecisionService — Siklus keputusan: data → insight → hipotesis → tindakan → ukur.
 * Status: direncanakan / berjalan / terbukti / tidak_berhasil.
 */
class BiDecisionService
{
    public function create(array $data): BiDecision
    {
        return BiDecision::create([
            'title' => $data['title'],
            'hypothesis' => $data['hypothesis'] ?? null,
            'metric' => $data['metric'] ?? null,
            'target' => $data['target'] ?? null,
            'evaluate_at' => $data['evaluate_at'] ?? null,
            'status' => $data['status'] ?? 'direncanakan',
            'created_by' => auth()->id(),
        ]);
    }

    public function updateStatus(BiDecision $decision, string $status): BiDecision
    {
        $decision->update(['status' => $status]);

        return $decision;
    }
}
