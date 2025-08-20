<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\{Survey, SurveyService, SurveyQuestion};
use App\Models\Response as SurveyResponse;
use App\Models\ResponseAnswer as SurveyAnswer;

class AdminSurveyController extends Controller
{
    // GET /api/admin/surveys
    public function index()
    {
        // Mengembalikan semua survei, diurutkan dari yang terbaru
        return Survey::orderByDesc('year')->orderByDesc('semester')->get();
    }

    // GET /api/admin/surveys/{id}
    public function show($id)
    {
        $s = Survey::findOrFail($id);
        return [
            'survey' => [
                'id' => $s->id,
                'title' => $s->title,
                'year' => $s->year,
                'semester' => $s->semester,
                'is_active' => (bool)$s->is_active,
            ],
            'services'  => SurveyService::where('survey_id', $s->id)->orderBy('order_idx')->get(),
            'questions' => SurveyQuestion::where('survey_id', $s->id)->orderBy('order_idx')->get(),
        ];
    }

    // PATCH /api/admin/surveys/{id}
    public function update($id, Request $r)
    {
        $survey = Survey::findOrFail($id);
        $data = $r->validate([
            'title' => 'sometimes|string|max:255',
            'year' => 'sometimes|integer',
            'semester' => 'sometimes|integer|in:1,2',
            'is_active' => 'sometimes|boolean',
        ]);
        $survey->update($data);
        return response()->json($survey);
    }

    // POST /api/admin/surveys/{id}/services
    public function upsertServices($id, Request $r)
    {
        $data = $r->validate([
            'items' => 'required|array',
            'items.*.id'        => 'nullable|integer',
            'items.*.name'      => 'required|string',
            'items.*.order_idx' => 'required|integer',
        ]);

        $keepIds = [];
        foreach ($data['items'] as $item) {
            $svc = isset($item['id'])
              ? SurveyService::where('survey_id',$id)->where('id',$item['id'])->first()
              : new SurveyService(['survey_id' => $id]);

            if (!$svc) $svc = new SurveyService(['survey_id'=>$id]); // id tak valid → create

            $svc->name = $item['name'];
            $svc->order_idx = $item['order_idx'];
            $svc->save();
            $keepIds[] = $svc->id;
        }
        // hapus yang tidak dikirim (sinkron)
        SurveyService::where('survey_id',$id)->whereNotIn('id',$keepIds)->delete();

        return ['ok'=>true, 'services'=>SurveyService::where('survey_id',$id)->orderBy('order_idx')->get()];
    }

    // POST /api/admin/surveys/{id}/questions
    public function upsertQuestions($id, Request $r)
    {
        $data = $r->validate([
            'items' => 'required|array',
            'items.*.code'      => 'required|string',      // U1..U9 atau 'saran'
            'items.*.label'     => 'required|string',
            'items.*.type'      => 'required|in:scale,text',
            'items.*.min'       => 'nullable|integer',
            'items.*.max'       => 'nullable|integer',
            'items.*.required'  => 'nullable|boolean',
            'items.*.order_idx' => 'required|integer',
        ]);

        $keepCodes = [];
        foreach ($data['items'] as $item) {
            $q = SurveyQuestion::updateOrCreate(
                ['survey_id'=>$id, 'code'=>$item['code']],
                [
                    'label'=>$item['label'],
                    'type'=>$item['type'],
                    'min'=>$item['min'] ?? 1,
                    'max'=>$item['max'] ?? 4,
                    'required'=>$item['required'] ?? ($item['type'] !== 'text'),
                    'order_idx'=>$item['order_idx'],
                ]
            );
            $keepCodes[] = $q->code;
        }
        SurveyQuestion::where('survey_id',$id)->whereNotIn('code',$keepCodes)->delete();

        return ['ok'=>true,'questions'=>SurveyQuestion::where('survey_id',$id)->orderBy('order_idx')->get()];
    }

    // --- METHOD YANG HILANG SUDAH SAYA TAMBAHKAN DI BAWAH INI ---

    // GET /api/admin/surveys/{id}/summary
    public function summary($id)
    {
        $survey = Survey::with('questions:id,survey_id,code,label')->findOrFail($id);

        // Kumpulkan response
        $responses = SurveyResponse::where('survey_id', $id)->get();
        $respIds = $responses->pluck('id');
        $totalResponses = $responses->count();

        // Helper untuk menghitung demografi
        $groupCount = function (string $col) use ($responses) {
            return $responses->pluck($col)->filter()->countBy()->sortKeys();
        };
        
        // Hitung IKM per unsur
        $unsur = [];
        $kodesSkala = $survey->questions->where('type', 'scale')->pluck('code');
        $sumAllValues = 0;
        
        if ($respIds->isNotEmpty()) {
            $sumAllValues = SurveyAnswer::whereIn('response_id', $respIds)
                            ->whereIn('question_code', $kodesSkala)
                            ->sum('value');

            foreach ($kodesSkala as $code) {
                $avg = SurveyAnswer::whereIn('response_id', $respIds)
                        ->where('question_code', $code)
                        ->avg('value') ?? 0;
                
                $unsur[] = [
                    'code'  => $code,
                    'label' => optional($survey->questions->firstWhere('code', $code))->label,
                    'avg'   => round($avg, 4),
                    'ikm'   => round($avg * 25, 2),
                ];
            }
        }
        
        // Hitung IKM total
        $countAllCells = $totalResponses * $kodesSkala->count();
        $nrr = ($countAllCells > 0) ? ($sumAllValues / $countAllCells) : 0.0;
        $ikm = round($nrr * 25, 2);

        $mutu = '-';
        if     ($ikm >= 88.31) $mutu = 'A (Sangat Baik)';
        elseif ($ikm >= 76.61) $mutu = 'B (Baik)';
        elseif ($ikm >= 65.00) $mutu = 'C (Kurang Baik)';
        elseif ($ikm >= 25.00) $mutu = 'D (Tidak Baik)';

        return response()->json([
            'totalResponses' => $totalResponses,
            'ikm'            => $ikm,
            'mutu'           => $mutu,
            'demografi'      => [
                'gender'     => $groupCount('gender'),
                'status'     => $groupCount('status'),
                'usia'       => $groupCount('usia'),
                'pendidikan' => $groupCount('pendidikan'),
            ],
            'unsur' => $unsur,
        ]);
    }

    // GET /api/admin/surveys/{id}/export
    public function export($id)
    {
        // TODO: Tambahkan logika untuk ekspor data (misalnya ke CSV)
        return response()->json(['message' => 'Fitur ekspor belum diimplementasikan.']);
    }

    // GET /api/admin/surveys/{id}/responses
    public function responses($id)
    {
        // TODO: Tambahkan logika untuk menampilkan daftar jawaban dengan paginasi
        return response()->json(['message' => 'Fitur daftar respons belum diimplementasikan.']);
    }

    // PATCH /api/admin/responses/{id}
    public function updateResponse($id)
    {
        // TODO: Tambahkan logika untuk mengedit satu jawaban
        return response()->json(['message' => 'Fitur update respons belum diimplementasikan.']);
    }

    // DELETE /api/admin/responses/{id}
    public function deleteResponse($id)
    {
        // TODO: Tambahkan logika untuk menghapus satu jawaban
        return response()->json(['message' => 'Fitur hapus respons belum diimplementasikan.']);
    }
}