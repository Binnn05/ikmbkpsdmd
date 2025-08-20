<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('responses', function (Blueprint $table) {
            // demografi (nullable supaya kompatibel dengan data lama)
            $table->string('gender', 20)->nullable()->after('user_agent');
            $table->string('status', 20)->nullable()->after('gender');
            $table->string('usia', 20)->nullable()->after('status');
            $table->string('pendidikan', 50)->nullable()->after('usia');
        });

        Schema::table('response_answers', function (Blueprint $table) {
            $table->text('text_value')->nullable()->after('value'); // untuk "saran"
        });
    }

    public function down(): void
    {
        Schema::table('responses', function (Blueprint $table) {
            $table->dropColumn(['gender','status','usia','pendidikan']);
        });

        Schema::table('response_answers', function (Blueprint $table) {
            $table->dropColumn('text_value');
        });
    }
};
