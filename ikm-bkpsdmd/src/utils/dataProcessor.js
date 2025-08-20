export const CHART_LABELS = {
    1: 'Kesesuaian Persyaratan',
    2: 'Kemudahan Prosedur',
    3: 'Kecepatan Pelayanan',
    4: 'Kewajaran Tarif',
    5: 'Kesesuaian Hasil',
    6: 'Kompetensi Petugas',
    7: 'Perilaku Petugas',
    8: 'Kualitas Sarpras',
    9: 'Penanganan Pengaduan'
};

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } 
            else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim()); current = '';
        } else { current += char; }
    }
    result.push(current.trim());
    return result;
}

function csvToJSON(csvText, headers) {
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    return lines.slice(1).map(line => {
        const row = parseCSVLine(line);
        if (row.length === headers.length) {
            const obj = {};
            headers.forEach((h, i) => {
                let value = (row[i] || '').trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                obj[h.trim()] = value;
            });
            return obj;
        }
        return null;
    }).filter(Boolean);
}

export const processCsvData = (csvText) => {
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    const headers = parseCSVLine(lines[0]);
    const allData = csvToJSON(csvText, headers);

    const penggunaLayananKey = headers.find(h => h.includes('Apakah Saudara pernah menggunakan layanan'));
    const allRespondentsData = allData.filter(row => (row[penggunaLayananKey] || '').trim() === 'Ya');

    const layananKey = headers.find(k => k && k.toLowerCase().includes('jenis layanan'));
    const saranKey = headers.find(h => h.toLowerCase().includes('10. saran'));

    const layananMap = {};
    allRespondentsData.forEach(row => {
        const layanan = (row[layananKey] || '').normalize("NFKC").trim();
        if (!layanan) return;
        let match = layanan.match(/^(\d+)[.\s-]*\s*(.*)$/);
        const keyToUse = match ? `${match[1]}. ${match[2].trim()}`.trim() : layanan;
        if (!layananMap[keyToUse]) layananMap[keyToUse] = [];
        layananMap[keyToUse].push(row);
    });
    
    const getDemographicData = (keyName) => {
        const key = headers.find(h => h.toLowerCase().includes(keyName));
        if(!key) return {};
        return allRespondentsData.reduce((acc, row) => {
            const item = row[key] || 'N/A';
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});
    }

    const demographicData = {
        gender: getDemographicData('jenis kelamin'),
        pendidikan: getDemographicData('pendidikan terakhir'),
        status: getDemographicData('status'),
    };

    const getIKM = (data) => {
        if (!data || data.length === 0) return { ikm: 0, mutuLayanan: '-' };
        let totalNilai = 0;
        const jumlahUnsur = Object.keys(CHART_LABELS).length;
        data.forEach(row => {
            for (let i = 1; i <= jumlahUnsur; i++) {
                const pertanyaanKey = headers.find(k => k && k.trim().startsWith(i + '. '));
                if (pertanyaanKey) {
                    const jawaban = (row[pertanyaanKey] || '').trim();
                    const match = jawaban.match(/^(\d+)/);
                    if (match) totalNilai += parseInt(match[1]);
                }
            }
        });
        const nrrTertimbang = totalNilai / (data.length * jumlahUnsur);
        const ikm = nrrTertimbang * 25;
        let mutuLayanan = '-';
        if (ikm >= 88.31) mutuLayanan = 'A (Sangat Baik)';
        else if (ikm >= 76.61) mutuLayanan = 'B (Baik)';
        else if (ikm >= 65.00) mutuLayanan = 'C (Kurang Baik)';
        else if (ikm >= 25) mutuLayanan = 'D (Tidak Baik)';
        return { ikm, mutuLayanan };
    };

    const getUnsurData = (data, unsurKey) => {
        const pertanyaanKey = headers.find(k => k && k.trim().startsWith(unsurKey + '. '));
        if (!pertanyaanKey) return { nilai: [], counts: [0,0,0,0] };
        const nilai = data.map(r => (r[pertanyaanKey] || '').trim().match(/^(\d+)/)).filter(Boolean).map(match => parseInt(match[1]));
        const counts = [1, 2, 3, 4].map(k => nilai.filter(n => n === k).length);
        return { nilai, counts };
    };
    
    const getUnsurIKM = (data, unsurKey) => {
        const { nilai } = getUnsurData(data, unsurKey);
        if (!nilai || nilai.length === 0) return 0;
        const totalNilai = nilai.reduce((sum, val) => sum + val, 0);
        const nrr = totalNilai / nilai.length;
        return nrr * 25;
    };

    const extractNumber = (str) => {
        const match = str.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 9999;
    }

    return {
        headers, allRespondentsData, layananKey, saranKey, layananMap, demographicData,
        getIKM, getUnsurIKM, getUnsurData, extractNumber
    };
};