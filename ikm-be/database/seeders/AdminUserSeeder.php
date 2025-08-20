<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'admin#BKPSDMD'],
            [
                'name' => 'Administrator',
                'email' => '', 
                'password' => Hash::make('BKPSDMD@123!'),
            ]
        );
    }
}
