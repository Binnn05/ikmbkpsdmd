<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{Survey, SurveyService, SurveyQuestion};

class Ikm2025S1Seeder extends Seeder
{
    public function run(): void
    {
        // 1) Buat / perbarui survei periode
        $survey = Survey::updateOrCreate(
            ['year' => 2025, 'semester' => 1],
            ['title' => 'IKM 2025 Semester 1', 'is_active' => true]
        );

        // 2) 40 Unit Layanan
        $services = [
            "1. Unit Layanan Pemakaian Ruang CAT",
            "2. Unit Layanan Pemakaian Ruang Aula/Kelas",
            "3. Unit Layanan Pemakaian Kamar Asrama",
            "4. Unit Layanan Pengangkatan Pertama dalam Jabatan Fungsional Tertentu",
            "5. Unit Layanan Penyesuaian Gelar Pendidikan",
            "6. Unit Layanan Kenaikan dalam jabatan Fungsional Tertentu",
            "7. Unit Layanan Kenaikan Pangkat",
            "8. Unit Layanan Mutasi antar Perangkat Daerah (antar OPD)",
            "9. Unit Layanan Mutasi PNS antar Kabupaten/Kota dalam satu Provinsi",
            "10. Unit Layanan Mutasi PNS Provinsi ke Kabupaten / Kota dalam Satu Provinsi",
            "11. Unit Layanan Mutasi PNS dari Provinsi, Kabupaten/Kota ke Kabupaten/Kota Provinsi Lain",
            "12. Unit Layanan Mutasi PNS Provinsi, Kabupaten/Kota ke Kabupaten/Kota Provinsi Lain",
            "13. Unit Layanan Mutasi Provinsi, Kabupaten/Kota ke Instansi Pusat",
            "14. Unit Layanan Mutasi dari Instansi Pusat ke Provinsi, Kabupaten/Kota",
            "15. Unit Layanan Penerbitan Surat Rekomendasi Usulan Pejabat Struktural, Urusan  Kependudukan Dan Pencatatan Sipil, Urusan Pengawasan Dan Urusan Administrasi Lain Dari Kabupaten/Kota",
            "16. Unit Layanan Pengusulan Tanda Kehormatan Satyalancana Karya Satya 10, 20 Dan 30 Tahun",
            "17. Unit Layanan Proses Cuti Besar, Cuti Sakit Diatas 14 Hari Dan Pengusulan Cuti Di Luar Tanggungan Negara",
            "18. Unit Layanan Kegiatan Pelatihan Kepemimpinan Nasional (PKN II)",
            "19. Unit Layanan Kegiatan Pelatihan Kepemimpinan Administrator",
            "20. Unit Layanan Kegaiatan Pelatihan Dasar",
            "21. Unit Layanan Kegiatan Pelatihan Kepemimpinan Pengawas",
            "22. Unit Layanan Penyelenggaraan Diklat Teknis",
            "23. Unit Layanan Pelatihan Kompetensi PBJP Level-1 (Model Pembelajaran e-learning) dan Uji Sertifikasi PBJ Tingkat Dasar",
            "24. Unit Layanan Rekomendasi / Fasilitasi Pelatihan",
            "25. Unit Layanan Fasilitasi Penulisan Karya Tulis Ilmiah melalui Publikasi Jurnal Andragogi",
            "26. Unit Layanan Pelayanan Sertifikasi Kelembagaan dan Pemberian Rekomendasi Penyelenggaraan Pelatihan kepada Kabupaten/Kota",
            "27. Unit Layanan Kegiatan Peningkatan Mutu Pengembangan Kompetensi SDM Aparatur melalui Perangkat SIM-Diklat",
            "28. Unit Layanan Pembuatan Kartu Identitas ASN (ID Card)",
            "29. Unit Layanan Pemutakhiran Data ASN pada MySAPK, SiMADIG, dan E-Kinerja",
            "30. Unit Layanan Pemberian Layanan Pembayaran Dana Iuran KORPRI",
            "31. Unit Layanan Pengusulan Pembuatan Kartu Pegawai, Kartu Istri dan Kartu Suami",
            "32. Unit Layanan Pembuatan SK Pensiun ASN",
            "33. Unit Layanan Pangujuan Usulan Formasi Fungsional ASN",
            "34. Unit Layanan Penerbitan SK Tugas Belajar (Tubel)",
            "35. Unit Layanan Penerbitan Surat Keterangan Tidak Sedang Tubel",
            "36. Unit Layanan Pelaksanaan Ujian Dinas / Penyesuaian Ijazah",
            "37. Unit Layanan Penerbitan Surat Rekomendasi Uji Kompetensi",
            "38. Unit Layanan Penerbitan Surat Rekomendasi mengikuti Diklat",
            "39. Unit Layanan Penerbitan Rekomendasi Seleksi Tugas Belajar",
            "40. Unit Layanan Penerbitan Surat Rekomendasi Ujian Dinas / Penyesuian Ijazah",
        ];

        foreach ($services as $i => $name) {
            SurveyService::updateOrCreate(
                ['survey_id' => $survey->id, 'name' => $name],
                ['order_idx' => $i + 1]
            );
        }

        // 3) 9 Pertanyaan IKM (skala 1..4)
        $questions = [
            'U1' => "1. Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya",
            'U2' => "2. Bagaimana pemahaman Saudara tentang kemudahan prosedur pelayanan di unit ini.",
            'U3' => "3. Bagaimana pendapat Saudara tentang kecepatan waktu dalam memberikan pelayanan.",
            'U4' => "4. Bagaimana pendapat Saudara tentang kewajaran biaya/tarif dalam pelayanan ?",
            'U5' => "5. Bagaimana pendapat Saudara tentang kesesuaian produk pelayanan antara yang tercantum dalam standar pelayanan dengan hasil yang diberikan.",
            'U6' => "6. Bagaimana pendapat Saudara tentang kompetensi/ kemampuan petugas dalam pelayanan ?",
            'U7' => "7. Bagamana pendapat saudara perilaku petugas dalam  pelayanan terkait kesopanan dan keramahan ?",
            'U8' => "8. Bagaimana pendapat Saudara tentang kualitas sarana dan prasarana ?",
            'U9' => "9. Bagaimana pendapat Saudara tentang penanganan pengaduan pengguna layanan",
        ];

        $order = 1;
        foreach ($questions as $code => $label) {
            SurveyQuestion::updateOrCreate(
                ['survey_id' => $survey->id, 'code' => $code],
                ['label' => $label, 'type' => 'scale', 'min' => 1, 'max' => 4, 'order_idx' => $order++, 'required' => true]
            );
        }

        // (Opsional) tambahkan kolom saran bebas
        SurveyQuestion::updateOrCreate(
            ['survey_id' => $survey->id, 'code' => 'saran'],
            ['label' => '10. Saran & Masukan', 'type' => 'text', 'required' => false, 'order_idx' => 10]
        );
    }
}
