/**
 * Hamming Code Simülatörü - Durum Yönetimi
 * BLM230 Bilgisayar Mimarisi
 *
 * Bellek simülasyonu, encode/decode akışı ve geçmiş kaydı.
 */

const Simulator = (() => {

    const MAX_SLOTS = 8;

    const state = {
        memory:        [],   // { address, original, encoded, ... }
        selectedSlot:  -1,
        currentResult: null, // son encode sonucu
        lastSyndrome:  null,
        history:       []
    };

    // ─── Durum okuyucular ──────────────────────────────────────

    function getMemory()       { return [...state.memory]; }
    function getSelectedSlot() { return state.selectedSlot >= 0 ? state.memory[state.selectedSlot] : null; }
    function getHistory()      { return [...state.history]; }
    function getLastSyndrome() { return state.lastSyndrome; }

    // ─── Encode ────────────────────────────────────────────────

    function encode(dataBits, bitLength) {
        const err = validateInput(dataBits, bitLength);
        if (err) return { error: err };

        const result = HammingCode.encode(dataBits);
        state.currentResult = result;
        _log('ENCODE', `${bitLength}-bit → encode: ${dataBits} ▸ ${result.encoded}`);
        return result;
    }

    // ─── Memory ────────────────────────────────────────────────

    function writeToMemory(encodedResult) {
        if (!encodedResult || encodedResult.error) return null;

        // Doluysa en eskiyi sil
        if (state.memory.length >= MAX_SLOTS) {
            state.memory.shift();
            // Seçili slot kayabilir, düzelt
            if (state.selectedSlot > 0) state.selectedSlot--;
            else state.selectedSlot = -1;
        }

        const addrNum = state.memory.length;
        const slot = {
            addressNum:    addrNum,
            address:       `0x${addrNum.toString(16).toUpperCase().padStart(4, '0')}`,
            original:      encodedResult.original,
            encoded:       encodedResult.encoded,
            dataLength:    encodedResult.dataLength,
            totalLength:   encodedResult.totalLength,
            parityBitCount: encodedResult.parityBitCount,
            parityPositions: encodedResult.parityPositions,
            dataPositions:  encodedResult.dataPositions,
            timestamp:     new Date().toLocaleTimeString('tr-TR'),
            hasError:      false,
            injectedPos:   null
        };

        state.memory.push(slot);
        state.selectedSlot = state.memory.length - 1;
        _log('WRITE', `Adres ${slot.address} belleğe yazıldı (${slot.totalLength} bit)`);
        return slot;
    }

    function selectSlot(index) {
        if (index >= 0 && index < state.memory.length) {
            state.selectedSlot = index;
            _log('SELECT', `Adres ${state.memory[index].address} seçildi`);
            return state.memory[index];
        }
        return null;
    }

    function clearMemory() {
        state.memory      = [];
        state.selectedSlot = -1;
        state.currentResult = null;
        state.lastSyndrome  = null;
        _log('CLEAR', 'Bellek temizlendi');
    }

    // ─── Error Injection ───────────────────────────────────────

    function injectError(position) {
        const slot = getSelectedSlot();
        if (!slot) return { error: 'Önce bir bellek hücresi seçin.' };

        const pos = parseInt(position);
        if (isNaN(pos) || pos < 1 || pos > slot.totalLength) {
            return { error: `Pozisyon 1–${slot.totalLength} arasında olmalıdır.` };
        }

        const faultyCode = HammingCode.injectError(slot.encoded, pos);
        state.memory[state.selectedSlot] = {
            ...slot,
            encoded:     faultyCode,
            hasError:    true,
            injectedPos: pos
        };

        _log('INJECT', `Pozisyon ${pos} bit flip edildi (${slot.address})`);
        return {
            code:     faultyCode,
            position: pos,
            slot:     state.memory[state.selectedSlot]
        };
    }

    // ─── Syndrome & Correction ─────────────────────────────────

    function detectAndCorrect() {
        const slot = getSelectedSlot();
        if (!slot) return { error: 'Önce bir bellek hücresi seçin.' };

        const syndromeResult = HammingCode.calculateSyndrome(slot.encoded);
        let correctedCode    = slot.encoded;

        if (syndromeResult.hasError) {
            correctedCode = HammingCode.correctError(slot.encoded, syndromeResult.errorPosition);
            state.memory[state.selectedSlot] = {
                ...slot,
                encoded:          correctedCode,
                hasError:         false,
                correctedPos:     syndromeResult.errorPosition,
                injectedPos:      null
            };
            _log('CORRECT', `Hata pozisyon ${syndromeResult.errorPosition}'de bulundu ve düzeltildi`);
        } else {
            _log('OK', 'Sendrom = 0 — hata tespit edilmedi');
        }

        state.lastSyndrome = syndromeResult;

        return {
            ...syndromeResult,
            originalCode:  slot.encoded,
            correctedCode,
            extractedData: HammingCode.extractData(correctedCode)
        };
    }

    // ─── Yardımcı ──────────────────────────────────────────────

    function validateInput(dataBits, bitLength) {
        if (typeof dataBits !== 'string' || !/^[01]+$/.test(dataBits))
            return 'Yalnızca 0 ve 1 karakterleri girin.';
        if (![8, 16, 32].includes(parseInt(bitLength)))
            return '8, 16 veya 32 bit seçmelisiniz.';
        if (dataBits.length !== parseInt(bitLength))
            return `${bitLength} adet bit girilmelidir (şu an ${dataBits.length}).`;
        return null;
    }

    function _log(type, message) {
        state.history.unshift({
            type,
            message,
            time: new Date().toLocaleTimeString('tr-TR')
        });
        if (state.history.length > 30) state.history.pop();
    }

    // ─── Public API ────────────────────────────────────────────

    return {
        encode,
        writeToMemory,
        selectSlot,
        clearMemory,
        injectError,
        detectAndCorrect,
        getMemory,
        getSelectedSlot,
        getHistory,
        getLastSyndrome,
        validateInput
    };
})();
