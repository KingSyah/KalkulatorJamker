const $   = id => document.getElementById(id);
const num = id => parseFloat($(id).value) || 0;
const int = id => parseInt($(id).value)   || 0;
const rp  = v  => 'Rp ' + Math.round(v).toLocaleString('id-ID');

// ── TAB SWITCH ────────────────────────────────────────────────────────────────
function switchTab(el, name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    $('tab-' + name).classList.add('active');
}

// ── MODE ASISTEN ──────────────────────────────────────────────────────────────
let mode = 'auto';
function setMode(m) {
    mode = m;
    $('btn-auto').classList.toggle('on', m === 'auto');
    $('btn-manual').classList.toggle('on', m === 'manual');
    $('panel-auto').classList.toggle('hidden', m !== 'auto');
    $('panel-manual').classList.toggle('hidden', m !== 'manual');
    syncPreview();
}

// ── SYNC PREVIEW (live update formula box & kelas badges) ─────────────────────
function syncPreview() {
    const M      = num('hM');
    const nK     = int('hKelas') || 1;
    const jm     = num('hJm')   || 0;
    const apk    = int('hApK')  || 1;
    const tarMin = num('hTarMin');
    const tarMax = num('hTarMax');
    const mSKS   = num('hMenit') || 45;

    const base = Math.floor(M / nK), sisa = M % nK;

    // Kelas badges (max 20 tampil)
    let badges = '';
    for (let i = 1; i <= Math.min(nK, 20); i++) {
        const isi = (i <= sisa) ? base + 1 : base;
        badges += `<span style="background:#e8f4fd;border:1px solid #90caf9;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:#0d47a1;">Kelas ${i}: <span style="color:var(--accent);">${isi} mhs</span></span>`;
    }
    if (nK > 20) badges += `<span style="font-size:12px;color:var(--muted);align-self:center;"> +${nK-20} kelas lainnya</span>`;
    $('kelas-badges').innerHTML = badges;

    const A = (mode === 'auto') ? nK * apk : int('hAmanual');
    $('kelas-info').innerHTML =
        (sisa > 0
            ? `<strong>${M} mhs</strong> ÷ <strong>${nK} kelas</strong> → ${sisa} kelas (${base+1} mhs) + ${nK-sisa} kelas (${base} mhs)<br>`
            : `<strong>${M} mhs</strong> ÷ <strong>${nK} kelas</strong> → setiap kelas ${base} mhs<br>`) +
        `Dengan <strong>${apk} asisten/kelas</strong> → dibutuhkan <strong style="color:var(--accent);">${A} asisten</strong>`;

    $('rumus-auto').innerHTML = `${nK} × ${apk} = <span style="color:var(--accent);">${nK*apk} asisten</span>`;

    // Formula preview — TA = (M/a)*Jm, honor/asisten = anggaran / TA
    const a  = M / nK;
    const TA = (M / (M / nK)) * jm;
    const TAreal = A * jm;
    const paMin  = TAreal > 0 ? tarMin / TAreal : 0;
    const paMax  = TAreal > 0 ? tarMax / TAreal : 0;
    $('prev-ta').textContent = `TA = (M÷a)×Jm = (${M}÷${(M/nK).toFixed(1)})×${jm} = ${TAreal.toFixed(2)} → dibulatkan ${Math.round(TAreal)}`;
    $('prev-min').innerHTML  = `Batas Bawah = Rp${tarMin.toLocaleString('id-ID')} ÷ ${Math.round(TAreal)} = <span class="fr">${rp(paMin)}</span> / asisten`;
    $('prev-max').innerHTML  = `Batas Atas &nbsp;= Rp${tarMax.toLocaleString('id-ID')} ÷ ${Math.round(TAreal)} = <span class="fr">${rp(paMax)}</span> / asisten`;

    if (!$('hasil-honor').classList.contains('hidden')) hitungHonor();
}

// ── JAM KERJA ─────────────────────────────────────────────────────────────────
function hitungJam() {
    const jpm = num('jpm'), sph = int('sph'), hpm = int('hpm');
    const jm  = int('jJm'), maxP = int('maxP');
    const jA  = int('jA'),  jD  = int('jD');
    const jB  = num('jBuat'), jPr = num('jPeriksa');

    const pm  = Math.min(sph * hpm, maxP);
    const tp  = pm * jm;
    const tja = tp * jpm, jpa = tja / jA;
    const tm  = tp * jpm, bm = jm * jB, perm = jm * jPr;
    const tjd = tm + bm + perm, jpd = tjd / jD;

    $('r-pm').textContent  = pm  + ' kali';
    $('r-tp').textContent  = tp  + ' kali';
    $('r-tja').textContent = tja.toFixed(2) + ' jam';
    $('r-jpa').textContent = jpa.toFixed(2) + ' jam';
    $('r-tm').textContent  = tm.toFixed(2)  + ' jam';
    $('r-bm').textContent  = bm.toFixed(2)  + ' jam';
    $('r-pmx').textContent = perm.toFixed(2) + ' jam';
    $('r-tjd').textContent = tjd.toFixed(2) + ' jam';
    $('r-jpd').textContent = jpd.toFixed(2) + ' jam';

    $('hasil-jam').classList.remove('hidden');
    $('hasil-jam').scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ── HONORARIUM ────────────────────────────────────────────────────────────────
function hitungHonor() {
    const M        = num('hM');
    const nK       = int('hKelas') || 1;
    const jm       = num('hJm');
    const apk      = int('hApK')  || 1;
    const angMin   = num('hTarMin');
    const angMax   = num('hTarMax');
    const mSKS     = 45;

    const base = Math.floor(M / nK), sisa = M % nK;
    const A    = (mode === 'auto') ? nK * apk : int('hAmanual');

    // ── FORMULA INTI ──
    const a        = M / nK;
    const TA_raw   = (M / a) * jm;
    const TA       = Math.round(TA_raw);
    const paMin    = TA > 0 ? angMin / TA : 0;
    const paMax    = TA > 0 ? angMax / TA : 0;

    // ── Alur langkah demi langkah ──
    const steps = [
        {
            t: 'Pembagian Mahasiswa ke Kelas  (menentukan a)',
            c: `${M} mhs ÷ ${nK} kelas`,
            r: sisa > 0
                ? `= ${sisa} kelas (${base+1} mhs) + ${nK-sisa} kelas (${base} mhs)  →  a ≈ ${a.toFixed(2)} mhs/kelas`
                : `= ${nK} kelas × ${base} mhs/kelas  →  a = ${a} mhs/kelas`
        },
        {
            t: 'Jumlah Asisten (A)',
            c: mode === 'auto' ? `${nK} kelas × ${apk} asisten/kelas` : '(diisi manual)',
            r: `= ${A} asisten`
        },
        {
            t: 'Hitung TA = (M ÷ a) × Jm',
            c: `(${M} ÷ ${a.toFixed(2)}) × ${jm}`,
            r: `= ${TA_raw.toFixed(4)} → dibulatkan = ${TA}`
        },
        {
            t: 'Honor per Asisten — Batas Bawah  (Anggaran Min ÷ TA)',
            c: `Rp ${angMin.toLocaleString('id-ID')} ÷ ${TA}`,
            r: `= ${rp(paMin)} / asisten`
        },
        {
            t: 'Honor per Asisten — Batas Atas  (Anggaran Maks ÷ TA)',
            c: `Rp ${angMax.toLocaleString('id-ID')} ÷ ${TA}`,
            r: `= ${rp(paMax)} / asisten`
        }
    ];

    $('alur').innerHTML = steps.map((s, i) => `
        <div class="step">
            <div class="snum">${i+1}</div>
            <div>
                <div class="stitle">${s.t}</div>
                <div class="scalc">${s.c}</div>
                <div class="sres">${s.r}</div>
            </div>
        </div>`).join('');

    // ── Kartu angka besar ──
    $('lbl-tMin').textContent    = angMin.toLocaleString('id-ID');
    $('lbl-tMax').textContent    = angMax.toLocaleString('id-ID');
    $('big-totMin').textContent  = rp(paMin);
    $('big-totMax').textContent  = rp(paMax);
    $('big-totMin-f').textContent= `${rp(angMin)} ÷ TA(${TA})`;
    $('big-totMax-f').textContent= `${rp(angMax)} ÷ TA(${TA})`;
    $('big-paMin').textContent   = rp(angMin);
    $('big-paMax').textContent   = rp(angMax);
    $('big-pa-f').textContent    = `Total anggaran MK praktikum`;

    // ── Tabel rincian ──
    const mhsKelas = base + (sisa > 0 ? ` – ${base+1}` : '') + ' mhs/kelas';
    $('hr-A').textContent       = `${A} asisten  (${nK} kelas × ${apk})`;
    $('hr-TA').textContent      = `${TA}  ← (${M}÷${a.toFixed(2)})×${jm}${TA_raw !== TA ? ' dibulatkan' : ''}`;
    $('hr-menit').textContent   = `${TA} × 45 = ${(TA*45).toLocaleString('id-ID')} menit (info)`;
    $('hr-jam').textContent     = (TA * 45 / 60).toFixed(2) + ' jam total (info)';
    $('hr-totMin').textContent  = rp(angMin);
    $('hr-totMax').textContent  = rp(angMax);
    $('hr-mhsKelas').textContent= mhsKelas;
    $('hr-modPerA').textContent = jm + ' modul';
    $('hr-jamPA').textContent   = (jm * 45 / 60).toFixed(2) + ' jam';
    $('hr-formula').textContent = `Anggaran ÷ TA`;
    $('hr-paMin').textContent   = rp(paMin);
    $('hr-paMax').textContent   = rp(paMax);

    // ── Summary bar ──
    $('hs-A').textContent      = A + ' orang';
    $('hs-TA').textContent     = TA + '';
    $('hs-totMin').textContent = rp(angMin);
    $('hs-perA').textContent   = rp(paMin) + ' – ' + rp(paMax);

    // ── Rekomendasi ──
    const mhsPerK = Math.ceil(M / nK);
    let statusHTML = '';
    if      (mhsPerK <= 20) statusHTML = `<div class="rek-ok">✅ Ukuran kelas ideal (${mhsPerK} mhs/kelas). 1 asisten per kelas sudah sangat cukup.</div>`;
    else if (mhsPerK <= 35) statusHTML = `<div class="rek-ok">👍 Ukuran kelas wajar (${mhsPerK} mhs/kelas). 1 asisten per kelas dapat ditangani.</div>`;
    else if (mhsPerK <= 50) statusHTML = `<div class="rek-warn">⚠️ Kelas cukup besar (${mhsPerK} mhs/kelas). Pertimbangkan menambah asisten atau memecah kelas.</div>`;
    else                     statusHTML = `<div class="rek-err">🔴 Kelas terlalu besar (${mhsPerK} mhs/kelas). Sangat disarankan menambah kelas atau asisten.</div>`;

    const skenario = [
        {label:'✅ Saat Ini',              k:nK,               apk:apk,   curr:true},
        {label:'➖ Kurangi 1 Kelas',       k:Math.max(1,nK-1), apk:apk,   curr:false},
        {label:'➕ Tambah 1 Kelas',        k:nK+1,             apk:apk,   curr:false},
        {label:'➕ Tambah Asisten/Kelas',  k:nK,               apk:apk+1, curr:false},
    ].map(s => {
        const sA      = s.k * s.apk;
        const sa      = M / s.k;
        const sTA     = Math.round((M / sa) * jm);
        const sPaMin  = sTA > 0 ? angMin / sTA : 0;
        const sPaMax  = sTA > 0 ? angMax / sTA : 0;
        const mk      = Math.ceil(M / s.k);
        return `<div class="sce${s.curr ? ' current' : ''}">
            <div class="sce-title">${s.label}</div>
            <div style="line-height:2;font-size:13px;">
                <strong>${s.k} kelas</strong> × <strong>${s.apk} asisten</strong> = <strong style="color:var(--accent);">${sA} asisten</strong><br>
                Mhs/kelas: <strong>${mk}</strong> &nbsp;|&nbsp; TA: <strong>${sTA}</strong><br>
                Honor/asisten: <strong>${rp(sPaMin)}</strong> – <strong>${rp(sPaMax)}</strong>
            </div>
        </div>`;
    }).join('');

    $('rekomendasi').innerHTML =
        statusHTML +
        `<div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:10px;">📊 Perbandingan Skenario</div>
         <div class="sce-grid">${skenario}</div>`;

    $('hasil-honor').classList.remove('hidden');
    $('hasil-honor').scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ── SETTING ───────────────────────────────────────────────────────────────────
function terapkanSetting() {
    $('hTarMin').value = num('s-tMin');
    $('hTarMax').value = num('s-tMax');
    $('hMenit').value  = num('s-menit');
    syncPreview();
    $('setting-ok').classList.remove('hidden');
    setTimeout(() => $('setting-ok').classList.add('hidden'), 2500);
}

// ── AUTO RECALC ───────────────────────────────────────────────────────────────
document.querySelectorAll('#tab-jam input').forEach(inp =>
    inp.addEventListener('input', () => {
        if (!$('hasil-jam').classList.contains('hidden')) hitungJam();
    })
);

// ── FOOTER: TAHUN OTOMATIS ────────────────────────────────────────────────────
document.getElementById('footer-year').textContent = new Date().getFullYear();

// init
syncPreview();
