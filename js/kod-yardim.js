/**
 * Kod Yardımı — Simülatör içi açıklamalar
 * BLM230 Bilgisayar Mimarisi
 *
 * Simülatörün kendi bölümlerindeki sarı "!" rozetlerine tıklanınca,
 * o adımı anlatan bir pencere açılır. Pencerenin içinde "Kod parçası"
 * akordeonu vardır: ok + "!" rozetine basınca ilgili kod görünür,
 * böylece doğrudan kod üzerinden anlatılabilir.
 */
(() => {

/* ── Her rozet (data-help) için: başlık + açıklama + açılır kod ── */
const HELP = {

    veri: {
        t:"Veri girişi & encode",
        d:"Girdiğin ham bitler (veya decimal/hex karşılığı) <b>encode</b> fonksiyonuna gider. Önce veri uzunluğu <b>m</b> alınır, sonra kaç <b>parity</b> bitine ihtiyaç olduğu hesaplanır: <code>2^r ≥ m + r + 1</code>. Toplam uzunluk <code>m + r</code> olur.",
        code:"function encode(veri) {\n    const m = veri.length;       // veri biti sayısı\n    let r = 0;\n    while ((1 << r) < m + r + 1) r++;  // parity sayısı\n    const n = m + r;             // toplam uzunluk\n    // ...\n}\n\n// m = 8  → r = 4  (toplam 12 bit)"
    },

    "parity-sec": {
        t:"★ Parity bitleri nasıl SEÇİLİR? (pozisyon)",
        d:"Parity bitleri kodun <b>2'nin kuvveti</b> olan pozisyonlarına (<b>1, 2, 4, 8, 16...</b>) yerleşir. Çünkü bu pozisyonların ikilik karşılığı tek bir <code>1</code> içerir. Geri kalan tüm pozisyonlara (3,5,6,7...) sırayla veri bitleri konur.",
        code:"const ikininKuvveti = x =>\n    x > 0 && (x & (x - 1)) === 0;\n\nfor (let i = 1; i <= n; i++)\n    if (!ikininKuvveti(i))\n        kod[i] = +veri[d++];   // veri biti buraya\n\n// poz: 1  2  3  4  5  6  7\n//      P  P  D  P  D  D  D   (P=parity, D=veri)"
    },

    "parity-deger": {
        t:"★ Parity bitinin DEĞERİ nasıl belirlenir?",
        d:"Her parity biti, pozisyon numarasının <b>k. biti 1 olan</b> tüm hücreleri kapsar (<code>(i&gt;&gt;k)&amp;1</code>). Kapsadığı bitlerin <b>XOR</b>'u (<code>^</code>) alınır → grupta 1'lerin sayısını çift yapan değer parity'ye yazılır.",
        code:"const p = 1 << k;            // parity pozisyonu\nlet x = 0;\nfor (let i = 1; i <= n; i++)\n    if (i !== p && ((i >> k) & 1))\n        x ^= kod[i];         // gruptaki bitleri XOR'la\nkod[p] = x;                  // sonucu parity'ye yaz\n\n// P1 → 1,3,5,7...   P2 → 2,3,6,7...\n// P4 → 4,5,6,7...   P8 → 8,9,10..."
    },

    bellek: {
        t:"Belleğe yazma",
        d:"Encode edilen Hamming kodu bir bellek <b>hücresine</b> yazılır: adres, uzunluk, kodun kendisi ve bir saat (clock) değeri tutulur. Hata enjeksiyonu ve düzeltme hep bu kayıtlı kod üzerinde çalışır.",
        code:"// Her hücre bir kayıttır:\nbellek.push({\n    adres:  '0x' + (slot * 4).toString(16),\n    uzunluk: kod.length,\n    kod:     kod,          // Hamming kodu (string)\n    saat:    saatSayaci++  // yazma sırası\n});"
    },

    hata: {
        t:"Hata ekleme (bit flip)",
        d:"Bir bellek hücresi ve bir <b>pozisyon</b> seçilir; o pozisyondaki bit ters çevrilir (<code>0↔1</code>). Bu, bellekte oluşan gerçek bir <b>tek-bit hatasını</b> taklit eder. Hamming SEC tam olarak bu tek hatayı bulup düzeltebilir.",
        code:"function injectError(kod, poz) {\n    const a = kod.split('');\n    a[poz - 1] = a[poz - 1] === '0' ? '1' : '0';\n    return a.join('');   // o bit artık bozuk\n}\n\n// örn. 6. biti boz → bellekte hata var"
    },

    sendrom: {
        t:"★ Sendrom: hata var mı, nerede?",
        d:"Her parity grubu <b>yeniden</b> XOR'lanır (parity bitinin kendisi dahil). Sonuç <code>1</code> ise o grupta bozulma var demektir. Uyumsuz her parity, kendi pozisyon değerini (<code>2^k</code>) sendroma ekler. Bu değerlerin <b>toplamı doğrudan hatalı bitin pozisyonudur</b> (0 → hata yok).",
        code:"let s = 0;\nfor (let k = 0; k < r; k++) {\n    let x = 0;\n    for (let i = 1; i <= n; i++)\n        if ((i >> k) & 1) x ^= +kod[i - 1];\n    if (x) s += 1 << k;   // uyumsuzsa 2^k ekle\n}\nreturn s;\n\n// P1 ve P4 uyumsuz → s = 1 + 4 = 5\n// → 5. bit hatalı"
    },

    duzelt: {
        t:"★ Düzeltme",
        d:"Sendrom bize <b>tam adresi</b> verdi; ekstra bilgiye gerek yok. O tek bit ters çevrilir ve kod orijinal haline döner. Hamming SEC'in gücü budur: <b>tek geçişte</b> hatayı hem bulur hem düzeltir.",
        code:"function duzelt(kod, poz) {\n    const a = kod.split('');\n    a[poz - 1] = a[poz - 1] === '0' ? '1' : '0';\n    return a.join('');\n}\n\n// poz = sendrom (örn. 5)\n// a[4]: '1' → '0'  → kod orijinaliyle aynı"
    }
};

/* ── Basit syntax highlight ── */
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function hl(src){
    if(src.trim().startsWith('//')) return '<span class="kl-com">'+esc(src)+'</span>';
    let comment='', code=src;
    const ci=src.indexOf('//');
    if(ci>=0){ comment='<span class="kl-com">'+esc(src.slice(ci))+'</span>'; code=src.slice(0,ci); }
    code=esc(code)
        .replace(/('[^']*')/g,'<span class="kl-str">$1</span>')
        .replace(/\b(const|let|function|return|if|while|for|new|push)\b/g,'<span class="kl-kw">$1</span>')
        .replace(/\b(\d+)\b/g,'<span class="kl-num">$1</span>')
        .replace(/\b(encode|sendrom|duzelt|injectError|ikininKuvveti)\b/g,'<span class="kl-fn">$1</span>');
    return code+comment;
}
function hlBlock(src){
    return src.split('\n').map(l => l.length ? hl(l) : '&nbsp;').join('\n');
}

document.addEventListener('DOMContentLoaded', () => {
    const pop=document.getElementById('klPop');
    if(!pop) return;
    const popTitle=document.getElementById('klPopTitle');
    const popBody=document.getElementById('klPopBody');
    let anchor=null;   // o an açık olan rozet

    function position(){
        if(!anchor) return;
        const b=anchor.getBoundingClientRect();
        const pw=Math.min(420, window.innerWidth*0.92);
        let left=b.right+14;
        if(left+pw>window.innerWidth-12) left=Math.max(12, b.left-pw-14);
        pop.style.left=left+'px';
        pop.style.top=(b.top-10)+'px';
        const ph=pop.getBoundingClientRect().height;
        if(b.top-10+ph>window.innerHeight-12)
            pop.style.top=Math.max(12, window.innerHeight-ph-12)+'px';
    }

    function openAt(btn){
        const rec=HELP[btn.dataset.help];
        if(!rec) return;
        anchor=btn;
        document.querySelectorAll('.kl-help.active').forEach(e=>e.classList.remove('active'));
        btn.classList.add('active');
        popTitle.textContent=rec.t;
        let html=rec.d;
        if(rec.code){
            html+=`<div class="kl-acc">`+
                  `<button type="button" class="kl-acc-tog">`+
                  `<span class="kl-acc-arrow">▶</span>`+
                  `<span class="kl-acc-bang">!</span>`+
                  `<span>Kod parçası — incele</span></button>`+
                  `<pre class="kl-acc-code">${hlBlock(rec.code)}</pre></div>`;
        }
        popBody.innerHTML=html;
        const tog=popBody.querySelector('.kl-acc-tog');
        if(tog) tog.addEventListener('click',e=>{
            e.stopPropagation();
            tog.parentElement.classList.toggle('open');
            requestAnimationFrame(position);
        });
        pop.classList.add('show');
        position();
        requestAnimationFrame(position);
    }

    function closePop(){
        pop.classList.remove('show');
        anchor=null;
        document.querySelectorAll('.kl-help.active').forEach(e=>e.classList.remove('active'));
    }

    document.querySelectorAll('.kl-help').forEach(btn=>{
        btn.addEventListener('click',e=>{
            e.stopPropagation();
            if(anchor===btn) { closePop(); return; }   // aynı rozete tekrar bas → kapat
            openAt(btn);
        });
    });

    document.getElementById('klPopClose').addEventListener('click',e=>{e.stopPropagation(); closePop();});
    document.addEventListener('click',e=>{
        if(!pop.contains(e.target) && !e.target.closest('.kl-help')) closePop();
    });
    document.addEventListener('keydown',e=>{
        if(pop.classList.contains('show') && e.key==='Escape') closePop();
    });
    window.addEventListener('resize',position);
    window.addEventListener('scroll',position,true);
});
})();
