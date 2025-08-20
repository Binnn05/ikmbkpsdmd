<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache; // Impor Cache facade
use App\Models\{Survey, SurveyService, SurveyQuestion};
use App\Models\Response as SurveyResponse;
use App\Models\ResponseAnswer as SurveyAnswer;

class PublicController extends Controller
{
    public function active(Request $r)
    {
        $q = Survey::query();
        if ($r->filled('year') && $r->filled('semester')) {
            $q->where('year', (int) $r->year)->where('semester', (int) $r->semester);
        } else {
            $q->where('is_active', 1);
        }
        $survey = $q->with([
            'services:id,survey_id,name,order_idx',
            'questions:id,survey_id,code,label,type,min,max,order_idx,required'
        ])->orderByDesc('year')->orderByDesc('semester')->firstOrFail();
        return response()->json($survey);
    }

    public function analytics(Request $req)
    {
        try {
            $surveyId = (int)$req->query('survey_id');
            $year     = $req->query('year');
            $semester = $req->query('semester');

            if (!$surveyId && $year && $semester) {
                $surveyId = Survey::where('year', (int)$year)
                            ->where('semester', (int)$semester)
                            ->value('id');
            }
            if (!$surveyId) {
                return response()->json(['message' => 'Survey not found for the given period.'], 404);
            }

            // Buat Kunci Cache yang Unik untuk setiap filter
            $serviceIdForCache = $req->query('service_id', 'all');
            $cacheKey = "analytics:survey:{$surveyId}:service:{$serviceIdForCache}";
            $cacheDuration = 3600; // Simpan selama 1 jam

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($req, $surveyId) {
                $serviceId = $req->query('service_id');
                $survey = Survey::with(['questions' => fn($q) => $q->orderBy('order_idx')])->find($surveyId);
                if (!$survey) return null;

                $services = SurveyService::where('survey_id', $surveyId)->orderBy('order_idx')->get(['id', 'name']);
                $respQ = SurveyResponse::where('survey_id', $surveyId);
                if ($serviceId) {
                    $respQ->where('service_id', (int)$serviceId);
                }
                $responses = $respQ->get(['id','gender','status','usia','pendidikan']);
                $respIds = $responses->pluck('id');
                $total = $responses->count();
                $groupCount = fn(string $col) => $responses->pluck($col)->filter(fn($v) => $v !== null && $v !== '')->countBy()->sortKeys();

                $unsur = [];
                $kodesSkala = $survey->questions->where('type', 'scale')->pluck('code');
                $sumAllValues = 0;

                foreach ($kodesSkala as $code) {
                    $avg = 0.0;
                    $counts = [1 => 0, 2 => 0, 3 => 0, 4 => 0];
                    if ($total > 0 && $respIds->isNotEmpty()) {
                        $answersForUnsur = SurveyAnswer::whereIn('response_id', $respIds)->where('question_code', $code);
                        $avg = $answersForUnsur->clone()->avg('value') ?? 0.0;
                        $sumAllValues += $answersForUnsur->clone()->sum('value');
                        $distribution = $answersForUnsur->clone()->toBase()->select('value', DB::raw('count(*) as total'))->groupBy('value')->pluck('total', 'value');
                        foreach ($distribution as $value => $count) {
                            if (isset($counts[$value])) $counts[$value] = $count;
                        }
                    }
                    $unsur[] = ['code' => $code, 'label' => optional($survey->questions->firstWhere('code', $code))->label, 'avg' => round($avg, 4), 'ikm' => round($avg * 25, 2), 'counts' => array_values($counts)];
                }

                $countAllCells = $total * $kodesSkala->count();
                $nrr = ($countAllCells > 0) ? ($sumAllValues / $countAllCells) : 0.0;
                $ikm = round($nrr * 25, 2);
                $mutu = $this->mutu($ikm);

                $saran = $respIds->isNotEmpty() ? SurveyAnswer::whereIn('response_id', $respIds)->where('question_code', 'saran')->whereNotNull('text_value')->where('text_value', '<>', '')->orderByDesc('id')->limit(200)->pluck('text_value')->toArray() : [];

                return [
                    'survey_id' => $surveyId, 'services' => $services, 'totalResponses' => $total, 'ikm' => $ikm, 'mutu' => $mutu,
                    'demografi' => ['gender' => $groupCount('gender'), 'status' => $groupCount('status'), 'usia' => $groupCount('usia'), 'pendidikan' => $groupCount('pendidikan')],
                    'unsur' => $unsur, 'saran' => $saran,
                ];
            });

            if ($data === null) return response()->json(['message' => 'Survey not found'], 404);
            return response()->json($data);

        } catch (\Throwable $e) {
            Log::error('analytics failed: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Server error while processing analytics'], 500);
        }
    }

    public function storeResponse(Request $request)
    {
        $data = $request->validate([
            'survey_id'  => 'required|integer|exists:surveys,id',
            'service_id' => 'required|integer|exists:survey_services,id',
            'gender'     => 'nullable|string|max:20',
            'status'     => 'nullable|string|max:20',
            'usia'       => 'nullable|string|max:20',
            'pendidikan' => 'nullable|string|max:50',
            'answers'    => 'required|array|min:1',
            'answers.*.code' => 'required|string',
            'answers.*.value' => 'nullable|integer',
            'answers.*.text' => 'nullable|string',
        ]);

        $resp = SurveyResponse::create(['survey_id' => $data['survey_id'], 'service_id' => $data['service_id'], 'client_ip' => $request->ip(), 'user_agent' => $request->userAgent(), 'gender' => $data['gender'] ?? null, 'status' => $data['status'] ?? null, 'usia' => $data['usia'] ?? null, 'pendidikan' => $data['pendidikan'] ?? null]);

        foreach ($data['answers'] as $a) {
            SurveyAnswer::create(['response_id' => $resp->id, 'question_code' => $a['code'], 'value' => $a['code'] === 'saran' ? null : ($a['value'] ?? null), 'text_value' => $a['code'] === 'saran' ? ($a['text'] ?? null) : null]);
        }
        return response()->json(['ok' => true, 'id' => $resp->id]);
    }

    private function mutu($ikm)
    {
        if ($ikm >= 88.31) return 'A (Sangat Baik)';
        if ($ikm >= 76.61) return 'B (Baik)';
        if ($ikm >= 65.00) return 'C (Kurang Baik)';
        if ($ikm >= 25.00) return 'D (Tidak Baik)';
        return '-';
    }
}