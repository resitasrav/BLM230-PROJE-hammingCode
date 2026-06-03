# Hamming Code Simülatörü – SEC (Single Error Correction)

Bu proje, Bursa Teknik Üniversitesi **Bilgisayar Mimarisi BLM230** dersi kapsamında hazırlanmıştır.

---

## Proje Hakkında

Hamming Hata Düzeltme Kodu (Hamming SEC) kullanarak **8, 16 ve 32 bit** veriler üzerinde:
- Parity bitlerini otomatik hesaplayan,
- Bellekte simüle saklayan,
- Yapay hata inject edebilen,
- Sendrom hesaplaması ile hatalı biti tespit ve düzelten

bir web tabanlı simülatördür.

---

## Dosya Yapısı

```
mimari_proje2/
├── index.html      ← Ana simülatör sayfası
├── styles.css      ← Responsive tasarım (açık + koyu tema)
├── hamming.js      ← Hamming Code temel matematik
├── simulator.js    ← Bellek simülasyonu ve durum yönetimi
├── ui.js           ← Arayüz ve animasyon kontrolü
├── test.html       ← Otomatik test senaryoları (15 test)
└── README.md       ← Bu dosya
```

---

## Hamming Code Matematiği

### Parity Bit Sayısı
Veri uzunluğu `n` için `r` parity biti gerekir:

```
2^r ≥ n + r + 1
```

| Veri (M) | Parity (K) | Toplam (M+K) |
|----------|-----------|--------------|
| 8 bit    | 4 bit     | 12 bit       |
| 16 bit   | 5 bit     | 21 bit       |
| 32 bit   | 6 bit     | 38 bit       |

### Parity Bit Pozisyonları
Parity bitleri 2'nin kuvveti olan pozisyonlara yerleştirilir: **1, 2, 4, 8, 16, 32...**

Veri bitleri geri kalan pozisyonlara yerleştirilir: 3, 5, 6, 7, 9, 10, 11, 12...

### Parity Hesaplama

`P_{2^k}` parity biti, binary gösteriminde `k`. biti `1` olan tüm pozisyonların XOR'udur:

```
P1 (pos 1) = XOR(pos 1,3,5,7,9,11,...)
P2 (pos 2) = XOR(pos 2,3,6,7,10,11,...)
P4 (pos 4) = XOR(pos 4,5,6,7,12,...)
P8 (pos 8) = XOR(pos 8,9,10,11,12,...)
```

### Sendrom Hesaplama
Her parity grubu yeniden hesaplanır. Uyumsuzluk olan bit pozisyonlarının toplamı **sendromu** verir:

```
Sendrom = 0           → Hata yok
Sendrom = N (N > 0)   → N. pozisyonda hata var
```

---

## Kullanım Adımları

```
1️⃣  Bit uzunluğunu seç (8 / 16 / 32)
2️⃣  Veriyi gir (binary, decimal veya hex)
3️⃣  "Encode Et" butonuna bas
4️⃣  Parity bitleri hesaplanıp görüntülenir
5️⃣  "Belleğe Yaz" ile veriyi belleğe kaydet
6️⃣  Bellekteki hücreye tıklayarak seç
7️⃣  "Hata Inject Et" ile bir biti boz
8️⃣  "Sendromu Hesapla" ile hata tespiti yap
9️⃣  Sistem hatalı biti bulur ve düzeltir
🔟  Düzeltilmiş veri "Data Out" olarak gösterilir
```

---

## Teknik Özellikler

- **Dil / Platform:** Vanilla HTML5 + CSS3 + JavaScript (sıfır bağımlılık)
- **Renk Kodlaması:**
  - 🔵 Mavi → Veri bitleri
  - 🟢 Yeşil → Parity bitleri
  - 🔴 Kırmızı → Hatalı bit
  - 🟠 Turuncu → Düzeltilmiş bit
- **Responsive:** Masaüstü ve mobil uyumlu
- **Tema:** Açık / Koyu mod desteği (localStorage'da saklanır)
- **Bellek Simülasyonu:** 8 hücreye kadar aynı anda saklama

---

## Test Senaryoları

`test.html` sayfasında 15 önceden tanımlanmış test senaryosu bulunmaktadır:

| Test | Açıklama |
|------|----------|
| TC-01 | 8-bit, hata yok → sendrom 0 |
| TC-02 | 8-bit, pozisyon 3 hata → sendrom 3 |
| TC-03..05 | Parity bit hataları |
| TC-06..07 | Sınır değerleri (0x00, 0xFF) |
| TC-08..10 | 16-bit senaryolar |
| TC-11..13 | 32-bit senaryolar |
| TC-14..15 | Düzeltme doğruluk testleri |

---

## Çalıştırma

Tüm dosyaları aynı klasöre koyun ve `index.html` dosyasını modern bir tarayıcıda açın.  
Herhangi bir sunucuya veya kuruluma gerek yoktur.

```
Dosya Gezgini → mimari_proje2 → index.html → Çift tıkla
```

---

## Referans

- Patterson & Hennessy, *Computer Organization and Design*, Bölüm 5  
- R. W. Hamming, "Error Detecting and Error Correcting Codes", *Bell System Technical Journal*, 1950
