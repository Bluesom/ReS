<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;

class ProgramApiController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Program::query()->orderBy('id')->get()->map(
                fn (Program $program) => $this->programData($program)
            ),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);
        $program = Program::query()->create(['name' => trim($data['name'])]);

        return response()->json(['data' => $this->programData($program)], 201);
    }

    public function update(Request $request, Program $program)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);
        $program->update(['name' => trim($data['name'])]);

        return response()->json(['data' => $this->programData($program->fresh())]);
    }

    public function destroy(Program $program)
    {
        $program->delete();

        return response()->json(['message' => 'Program deleted.']);
    }

    private function programData(Program $program): array
    {
        return [
            'id' => $program->id,
            'name' => $program->name,
        ];
    }
}
