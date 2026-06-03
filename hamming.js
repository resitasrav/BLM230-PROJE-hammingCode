/**
 * Hamming SEC (Single Error Correction) Code - Temel Matematik
 * BLM230 Bilgisayar Mimarisi
 *
 * Parity bit pozisyonları: 1, 2, 4, 8, ... (2^n)
 * P_i, binary gösteriminde i. biti 1 olan tüm pozisyonları kapsar.
 */

const HammingCode = (() => {

    // ─── Yardımcı ──────────────────────────────────────────────

    function isPowerOfTwo(x) {
        return x > 0 && (x & (x - 1)) === 0;
    }

    /**
     * n veri biti için kaç parity bitine ihtiyaç var?
     * Koşul: 2^r >= n + r + 1
     */
    function getParityBitCount(dataLength) {
        let r = 0;
        while (Math.pow(2, r) < dataLength + r + 1) r++;
        return r;
    }

    // ─── Encode ────────────────────────────────────────────────

    /**
     * dataBits: '0'/'1' karakterlerinden oluşan string (8, 16 veya 32 uzunluğunda)
     * Dönüş: encode metadata objesi
     */
    function encode(dataBits) {
        const dataLength = dataBits.length;
        const r = getParityBitCount(dataLength);
        const totalLength = dataLength + r;

        // 1-indexed çalışıyoruz; code[0] kullanılmaz
        const code = new Array(totalLength + 1).fill(0);

        // 1) Veri bitlerini parity olmayan pozisyonlara yerleştir
        let dataIdx = 0;
        for (let i = 1; i <= totalLength; i++) {
            if (!isPowerOfTwo(i)) {
                code[i] = parseInt(dataBits[dataIdx++]);
            }
        }

        // 2) Her parity bitini hesapla
        //    P_{2^k} → binary gösteriminde k. biti 1 olan tüm pozisyonların XOR'u
        for (let k = 0; k < r; k++) {
            const parityPos = Math.pow(2, k);
            let parity = 0;
            for (let pos = 1; pos <= totalLength; pos++) {
                if (((pos >> k) & 1) === 1 && pos !== parityPos) {
                    parity ^= code[pos];
                }
            }
            code[parityPos] = parity;
        }

        const encodedArray = code.slice(1); // 0-indexed

        // Görselleştirme için metadata
        const parityPositions = [];
        const dataPositions = [];
        for (let i = 1; i <= totalLength; i++) {
            if (isPowerOfTwo(i)) parityPositions.push(i);
            else dataPositions.push(i);
        }

        return {
            original:       dataBits,
            encoded:        encodedArray.join(''),
            encodedArray,
            dataLength,
            totalLength,
            parityBitCount: r,
            parityPositions,   // 1-indexed
            dataPositions      // 1-indexed
        };
    }

    // ─── Error Injection ───────────────────────────────────────

    /**
     * position: 1-indexed
     * Belirtilen pozisyondaki biti tersine çevirir.
     */
    function injectError(encodedString, position) {
        if (position < 1 || position > encodedString.length) return encodedString;
        const arr = encodedString.split('');
        arr[position - 1] = arr[position - 1] === '0' ? '1' : '0';
        return arr.join('');
    }

    // ─── Syndrome & Detection ──────────────────────────────────

    /**
     * Sendrom hesaplaması:
     *   Her parity grubunu yeniden hesapla.
     *   Uyumsuz parity konumlarının toplamı = hatalı bit pozisyonu.
     *   Sendrom 0 ise hata yok.
     */
    function calculateSyndrome(code) {
        const n = code.length;

        // Kaç parity biti var? 2^r >= n koşulundan bul
        let r = 0;
        while (Math.pow(2, r) < n) r++;

        let syndrome = 0;
        const parityChecks = [];

        for (let k = 0; k < r; k++) {
            let parity = 0;
            const covered = [];
            for (let pos = 1; pos <= n; pos++) {
                if (((pos >> k) & 1) === 1) {
                    parity ^= parseInt(code[pos - 1]);
                    covered.push(pos);
                }
            }

            const parityPos = Math.pow(2, k);
            parityChecks.push({
                parityBit:        parityPos,
                computedParity:   parity,
                coveredPositions: covered
            });

            if (parity === 1) syndrome += parityPos;
        }

        return {
            syndrome,
            errorPosition: syndrome,   // 1-indexed; 0 → hata yok
            hasError:      syndrome !== 0,
            parityChecks
        };
    }

    // ─── Correction ────────────────────────────────────────────

    function correctError(code, errorPosition) {
        if (errorPosition === 0 || errorPosition > code.length) return code;
        return injectError(code, errorPosition);
    }

    // ─── Yardımcı dönüşümler ───────────────────────────────────

    /** Encode edilmiş koddan yalnızca veri bitlerini çıkar */
    function extractData(code) {
        let data = '';
        for (let i = 1; i <= code.length; i++) {
            if (!isPowerOfTwo(i)) data += code[i - 1];
        }
        return data;
    }

    function binaryToDecimal(binary) {
        return parseInt(binary, 2);
    }

    function decimalToBinary(decimal, bitLength) {
        const clamped = Math.max(0, Math.min(decimal, Math.pow(2, bitLength) - 1));
        return clamped.toString(2).padStart(bitLength, '0');
    }

    function hexToBinary(hex, bitLength) {
        const dec = parseInt(hex, 16);
        return isNaN(dec) ? null : dec.toString(2).padStart(bitLength, '0').slice(-bitLength);
    }

    // ─── Public API ────────────────────────────────────────────

    return {
        isPowerOfTwo,
        getParityBitCount,
        encode,
        injectError,
        calculateSyndrome,
        correctError,
        extractData,
        binaryToDecimal,
        decimalToBinary,
        hexToBinary
    };
})();
