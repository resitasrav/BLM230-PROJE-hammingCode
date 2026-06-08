/* ════════════════════════════════════════════════════════════════
   HAMMING SEC — ÇEKİRDEK ALGORİTMA   (BLM230 Bilgisayar Mimarisi)
   ────────────────────────────────────────────────────────────────


   Çalıştırmak için:   node hamming-cekirdek.js
   ════════════════════════════════════════════════════════════════ */

// Bir sayı 2'nin kuvveti mi? (parity bitleri 1,2,4,8,16... pozisyonlarına gelir)
const ikininKuvveti = x => x > 0 && (x & (x - 1)) === 0;     // Sayı 2'nin kuvveti mi kontrol eder: 1, 2, 4, 8 gibi

// ── 1) ENCODE: ham veriyi Hamming koduna çevir ──────────────────
function encode(veri) {                                      // Girilen ham binary veriyi Hamming koduna çeviren fonksiyon
    const m = veri.length;                                   // Veri bitlerinin uzunluğunu alır
    let r = 0;                                               // Kaç tane parity/kontrol biti gerektiğini tutar

    while ((1 << r) < m + r + 1) r++;                        // 2^r >= m + r + 1 şartını sağlayana kadar parity sayısını artırır

    const n = m + r;                                         // Toplam Hamming kod uzunluğu: veri bitleri + parity bitleri
    const kod = new Array(n + 1).fill(0);                    // 1-indexli dizi oluşturulur, kod[0] kullanılmaz

    let d = 0;                                               // Veri bitlerini sırayla okumak için sayaç

    for (let i = 1; i <= n; i++)                             // Hamming kodundaki tüm pozisyonları gezer
        if (!ikininKuvveti(i)) kod[i] = +veri[d++];           // 1,2,4,8 dışındaki yerlere veri bitlerini yerleştirir

    for (let k = 0; k < r; k++) {                            // Her parity biti için hesaplama yapılır
        const p = 1 << k;                                    // Parity bitinin pozisyonunu belirler: 1, 2, 4, 8...
        let x = 0;                                           // XOR sonucunu tutacak değişken

        for (let i = 1; i <= n; i++)                         // Tüm kod pozisyonları gezilir
            if (i !== p && ((i >> k) & 1)) x ^= kod[i];       // İlgili parity bitinin kontrol ettiği pozisyonları XOR'lar

        kod[p] = x;                                          // Hesaplanan XOR sonucu parity bitine yazılır
    }

    return kod.slice(1).join('');                            // kod[0] atılır ve Hamming kodu string olarak döndürülür
}

// ── 2) SENDROM: uyumsuz parity'lerin toplamı = hatalı bitin pozisyonu ──
function sendrom(kod) {                                      // Gelen Hamming kodunda hata var mı kontrol eder
    const n = kod.length;                                    // Gelen kodun uzunluğunu alır
    let r = 0;                                               // Kaç parity kontrolü yapılacağını bulmak için sayaç

    while ((1 << r) < n) r++;                                // Kod uzunluğuna göre gerekli parity bit sayısını hesaplar

    let s = 0;                                               // Sendrom değeri, yani hatalı bitin pozisyonu burada tutulur

    for (let k = 0; k < r; k++) {                            // Her parity grubu tek tek kontrol edilir
        let x = 0;                                           // O parity grubunun XOR sonucunu tutar

        for (let i = 1; i <= n; i++)                         // Kodun tüm bit pozisyonları gezilir
            if ((i >> k) & 1) x ^= +kod[i - 1];              // Bu parity grubuna giren bitler XOR işlemine alınır

        if (x) s += 1 << k;                                  // XOR sonucu 1 ise ilgili parity bozuk demektir, sendroma eklenir
    }

    return s;                                                // 0 ise hata yok, 0'dan farklıysa hatalı bitin pozisyonudur
}

// ── 3) DÜZELT: hatalı bitin pozisyonunu tersine çevir ───────────
function duzelt(kod, poz) {                                  // Hatalı biti düzelten fonksiyon
    if (poz < 1 || poz > kod.length) return kod;              // Pozisyon geçersizse kodu değiştirmeden döndürür

    const a = kod.split('');                                 // String olan kodu karakter dizisine çevirir

    a[poz - 1] = a[poz - 1] === '0' ? '1' : '0';              // Hatalı biti tersine çevirir: 0 ise 1, 1 ise 0 yapar

    return a.join('');                                       // Düzeltilmiş diziyi tekrar stringe çevirip döndürür
}
// ── 2) SENDROM: uyumsuz parity'lerin toplamı = hatalı bitin pozisyonu (0 → hata yok)
function sendrom(kod) {
    const n = kod.length;
    let r = 0;
    while ((1 << r) < n) r++;
    let s = 0;
    for (let k = 0; k < r; k++) {
        let x = 0;
        for (let i = 1; i <= n; i++)
            if ((i >> k) & 1) x ^= +kod[i - 1];
        if (x) s += 1 << k;                     // bu parity uyumsuzsa pozisyonunu sendroma ekle
    }
    return s;
}

// ── 3) DÜZELT: hatalı bitin pozisyonunu tersine çevir ───────────
function duzelt(kod, poz) {
    if (poz < 1 || poz > kod.length) return kod;
    const a = kod.split('');
    a[poz - 1] = a[poz - 1] === '0' ? '1' : '0';
    return a.join('');
}

/* ── DEMO: tüm döngüyü göster (node ile çalıştırınca yazdırılır) ── */
if (typeof require !== 'undefined' && require.main === module) {
    const veri = '10110101';
    const k1 = encode(veri);
    const bozuk = duzelt(k1, 6);                // 6. biti kasten boz (= hata enjekte et)
    const s = sendrom(bozuk);
    const k2 = duzelt(bozuk, s);                // sendromun gösterdiği biti düzelt

    console.log('Veri        :', veri);
    console.log('Encode      :', k1);
    console.log('Bozuk (poz6):', bozuk);
    console.log('Sendrom     :', s, '→ hata ' + (s ? 'pozisyon ' + s : 'yok'));
    console.log('Düzeltilmiş :', k2);
    console.log('Sonuç       :', k2 === k1 ? '✓ orijinal kod geri geldi' : '✗ HATA');
}

// Tarayıcıda da, node'da da kullanılabilsin
if (typeof module !== 'undefined') module.exports = { encode, sendrom, duzelt };
