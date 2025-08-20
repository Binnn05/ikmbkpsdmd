<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->integer('year');
            $t->tinyInteger('semester'); // 1/2
            $t->boolean('is_active')->default(false);
            $t->date('open_from')->nullable();
            $t->date('open_until')->nullable();
            $t->timestamps();
        });

        Schema::create('survey_services', function (Blueprint $t) {
            $t->id();
            $t->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $t->string('name');               // "1. Nama Layanan"
            $t->integer('order_idx')->default(0);
            $t->timestamps();
        });

        Schema::create('survey_questions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $t->string('code');               // U1..U9 atau 'saran'
            $t->string('label');
            $t->enum('type', ['scale','text'])->default('scale');
            $t->integer('min')->nullable();   // 1
            $t->integer('max')->nullable();   // 4
            $t->boolean('required')->default(true);
            $t->integer('order_idx')->default(0);
            $t->timestamps();
        });

        Schema::create('responses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $t->foreignId('service_id')->constrained('survey_services')->cascadeOnDelete();
            $t->string('client_ip', 64)->nullable();
            $t->string('user_agent', 255)->nullable();
            $t->timestamps();
        });

        Schema::create('response_answers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('response_id')->constrained('responses')->cascadeOnDelete();
            $t->string('question_code');      // U1..U9 / saran
            $t->text('value')->nullable();    // 1..4 (scale) atau teks
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('response_answers');
        Schema::dropIfExists('responses');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('survey_services');
        Schema::dropIfExists('surveys');
    }
};
