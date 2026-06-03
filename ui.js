/**
 * Hamming Code Simülatörü - Arayüz Yönetimi
 * BLM230 Bilgisayar Mimarisi
 *
 * DOM güncellemeleri, event handler'lar ve animasyonlar.
 */

/* ════════════════════════════════════════════════════════════
   Durum
   ════════════════════════════════════════════════════════════ */
const UI = (() => {

    let currentBitLength   = 8;
    let currentFormat      = 'binary';   // binary | decimal | hex
    let currentEncodeResult = null;

    /* ── DOM Referansları ── */
    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);

    /* ── Process Flow adımları (sıralı) ── */
    const FLOW_STEPS = ['flow-input','flow-encoder','flow-memory','flow-error','flow-compare','flow-corrector','flow-output'];

    /* ════════════════════════════════════════════════════════
       Init
       ════════════════════════════════════════════════════════ */
    function init() {
        _bindBitSelector();
        _bindFormatSelector();
        _bindInputEvents();
        _bindMemoryEvents();
        _bindErrorEvents();
        _bindResultEvents();
        _bindThemeToggle();

        _setFlowStep(-1);     // tümünü pasif yap
        _renderMemoryGrid();
        _renderHistory();

        // İpucu
        _updateInputPlaceholder();
    }

    /* ════════════════════════════════════════════════════════
       Bit Uzunluğu Seçimi
       ════════════════════════════════════════════════════════ */
    function _bindBitSelector() {
        $$('.bit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.bit-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentBitLength = parseInt(btn.dataset.bits);
                _updateInputPlaceholder();
                _updateErrorPosHint();
                $('dataInput').value = '';
                _hideEl('encodeResult');
            });
        });
    }

    /* ════════════════════════════════════════════════════════
       Format Seçimi (binary / decimal / hex)
       ════════════════════════════════════════════════════════ */
    function _bindFormatSelector() {
        $$('.fmt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.fmt-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFormat = btn.dataset.fmt;
                _updateInputPlaceholder();
                $('dataInput').value = '';
            });
        });
    }

    /* ════════════════════════════════════════════════════════
       Input Bölümü
       ════════════════════════════════════════════════════════ */
    function _bindInputEvents() {
        $('dataInput').addEventListener('input', _validateLiveInput);

        $('randomBtn').addEventListener('click', () => {
            const bits = Array.from({length: currentBitLength}, () => Math.round(Math.random())).join('');
            $('dataInput').value = currentFormat === 'binary' ? bits
                : currentFormat === 'decimal' ? parseInt(bits, 2).toString()
                : parseInt(bits, 2).toString(16).toUpperCase();
            _validateLiveInput();
        });

        $('encodeBtn').addEventListener('click', _doEncode);

        $('writeMemBtn').addEventListener('click', _doWriteMemory);

        $('dataInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') _doEncode();
        });
    }

    function _validateLiveInput() {
        const raw = $('dataInput').value.trim();
        const binary = _toBinary(raw);
        const ok = binary && binary.length === currentBitLength;
        $('dataInput').classList.toggle('invalid', raw.length > 0 && !ok);
        $('encodeBtn').disabled = !ok;
        if (ok) $('dataInput').classList.remove('invalid');
    }

    function _doEncode() {
        const raw    = $('dataInput').value.trim();
        const binary = _toBinary(raw);
        if (!binary) return _showToast('Geçerli bir veri girin.', 'error');

        const result = Simulator.encode(binary, currentBitLength);
        if (result.error) return _showToast(result.error, 'error');

        currentEncodeResult = result;

        // Sonuç kutusu
        $('dataLenDisplay').textContent    = result.dataLength + ' bit';
        $('parityCountDisplay').textContent = result.parityBitCount + ' bit (pozisyonlar: ' +
            result.parityPositions.join(', ') + ')';
        $('totalLenDisplay').textContent   = result.totalLength + ' bit';

        _renderBitRow('encodedBitDisplay', result.encoded, result.parityPositions, [], []);
        _showEl('encodeResult');

        $('writeMemBtn').disabled = false;
        _setFlowStep(0); // Data In aktif
        _animateFlow(0, 1, 600); // encoder aktif

        _renderHistory();
        _showToast('Encoding tamamlandı!', 'success');
    }

    function _doWriteMemory() {
        if (!currentEncodeResult) return;
        const slot = Simulator.writeToMemory(currentEncodeResult);
        if (!slot) return _showToast('Bellek dolu!', 'warning');

        _renderMemoryGrid();
        _updateErrorPosHint();
        _showSelectedInfo(slot);
        _updateBitViz(null);
        _animateFlow(1, 2, 600); // memory aktif
        _renderHistory();
        _showToast(`Adres ${slot.address} belleğe yazıldı.`, 'success');
        $('writeMemBtn').disabled = true;
    }

    /* ════════════════════════════════════════════════════════
       Memory Grid
       ════════════════════════════════════════════════════════ */
    function _bindMemoryEvents() {
        $('clearMemBtn').addEventListener('click', () => {
            if (!confirm('Bellek temizlensin mi?')) return;
            Simulator.clearMemory();
            currentEncodeResult = null;
            _renderMemoryGrid();
            _hideEl('encodeResult');
            _hideEl('syndromeDisplay');
            _showEl('noResultMsg');
            $('writeMemBtn').disabled = true;
            _setFlowStep(-1);
            _renderHistory();
        });
    }

    function _renderMemoryGrid() {
        const grid    = $('memoryGrid');
        const memory  = Simulator.getMemory();
        const selIdx  = Simulator.getSelectedSlot() ?
            memory.findIndex(s => s.address === Simulator.getSelectedSlot().address) : -1;

        if (memory.length === 0) {
            grid.innerHTML = '<div class="memory-empty">Henüz veri yok</div>';
            return;
        }

        grid.innerHTML = memory.map((slot, idx) => `
            <div class="memory-row ${idx === selIdx ? 'selected' : ''} ${slot.hasError ? 'has-error' : ''}"
                 data-idx="${idx}" title="Seçmek için tıkla">
                <span class="mem-addr">${slot.address}</span>
                <span class="mem-len">${slot.dataLength}b+${slot.parityBitCount}p</span>
                <span class="mem-code">${_formatCode(slot.encoded, slot.parityPositions, slot.injectedPos)}</span>
                <span class="mem-time">${slot.timestamp}</span>
            </div>
        `).join('');

        grid.querySelectorAll('.memory-row').forEach(row => {
            row.addEventListener('click', () => {
                const idx  = parseInt(row.dataset.idx);
                const slot = Simulator.selectSlot(idx);
                if (!slot) return;
                _renderMemoryGrid();
                _showSelectedInfo(slot);
                _updateErrorPosHint();
                _renderHistory();
            });
        });
    }

    function _formatCode(encoded, parityPositions, errorPos) {
        return encoded.split('').map((bit, i) => {
            const pos   = i + 1;
            const isPar = parityPositions && parityPositions.includes(pos);
            const isErr = errorPos && errorPos === pos;
            const cls   = isErr ? 'bit-err' : isPar ? 'bit-par' : 'bit-dat';
            return `<span class="mem-bit ${cls}">${bit}</span>`;
        }).join('');
    }

    /* ════════════════════════════════════════════════════════
       Hata Ekleme
       ════════════════════════════════════════════════════════ */
    function _bindErrorEvents() {
        $('injectBtn').addEventListener('click', _doInjectError);
        $('detectBtn').addEventListener('click', _doDetectAndCorrect);
    }

    function _showSelectedInfo(slot) {
        $('selectedSlotAddress').textContent = slot.address + ` (${slot.totalLength} bit)`;
        _showEl('selectedSlotInfo');
        $('errorPos').max = slot.totalLength;
        _renderClickableBits(slot);
    }

    function _renderClickableBits(slot) {
        const container = $('bitSelector');
        container.innerHTML = slot.encoded.split('').map((bit, i) => {
            const pos = i + 1;
            const isPar = slot.parityPositions.includes(pos);
            const isErr = slot.injectedPos === pos;
            return `<button class="cbit ${isPar ? 'cbit-par' : 'cbit-dat'} ${isErr ? 'cbit-err' : ''}"
                            data-pos="${pos}" title="Pozisyon ${pos}">
                        <span class="cbit-pos">${pos}</span>
                        <span class="cbit-val">${bit}</span>
                    </button>`;
        }).join('');
        _showEl('bitSelector');

        container.querySelectorAll('.cbit').forEach(btn => {
            btn.addEventListener('click', () => {
                $('errorPos').value = btn.dataset.pos;
            });
        });
    }

    function _doInjectError() {
        const pos = $('errorPos').value;
        if (!pos) return _showToast('Hata pozisyonu girin.', 'warning');

        const result = Simulator.injectError(pos);
        if (result.error) return _showToast(result.error, 'error');

        _renderMemoryGrid();
        _renderClickableBits(result.slot);
        _updateBitViz(null);
        _animateFlow(2, 3, 600); // error step
        _renderHistory();
        _showToast(`Pozisyon ${result.position} bit flip edildi.`, 'warning');
    }

    /* ════════════════════════════════════════════════════════
       Sendrom & Düzeltme
       ════════════════════════════════════════════════════════ */
    function _bindResultEvents() {}

    function _doDetectAndCorrect() {
        const result = Simulator.detectAndCorrect();
        if (result.error) return _showToast(result.error, 'error');

        _renderSyndrome(result);
        _renderMemoryGrid();
        _updateBitViz(result);

        // Compare aktif → eğer hata varsa Corrector → Output
        _setFlowStep(4);
        if (result.hasError) {
            setTimeout(() => _setFlowStep(5), 600);
            setTimeout(() => _setFlowStep(6), 1200);
        } else {
            setTimeout(() => _setFlowStep(6), 600);
        }
        _renderHistory();
        _showToast(result.hasError
            ? `Hata pozisyon ${result.errorPosition}'de düzeltildi!`
            : 'Sendrom = 0: Hata tespit edilmedi.', result.hasError ? 'warning' : 'success');
    }

    function _renderSyndrome(result) {
        // Sendrom değeri
        $('syndromeValue').textContent = result.syndrome;
        $('syndromeValue').className   = 'syndrome-value ' + (result.hasError ? 'error' : 'ok');

        const badge = $('syndromeStatus');
        badge.textContent  = result.hasError ? `Hata! Pozisyon: ${result.errorPosition}` : 'Hata Yok';
        badge.className    = 'status-badge ' + (result.hasError ? 'badge-error' : 'badge-ok');

        // Parity check detayları
        $('parityChecks').innerHTML = result.parityChecks.map(pc => `
            <div class="parity-check ${pc.computedParity === 1 ? 'pc-mismatch' : 'pc-ok'}">
                <span class="pc-label">P${pc.parityBit}</span>
                <span class="pc-positions">[${pc.coveredPositions.join(',')}]</span>
                <span class="pc-result">${pc.computedParity === 1 ? '✗ Uyumsuz' : '✓ Tamam'}</span>
            </div>
        `).join('');

        // Hata bilgisi
        if (result.hasError) {
            $('errorPosDisplay').textContent = result.errorPosition;
            _showEl('errorInfo');
        } else {
            _hideEl('errorInfo');
        }

        // Düzeltilmiş veri
        const slot = Simulator.getSelectedSlot();
        const parPosArr = slot ? slot.parityPositions : [];
        _renderBitRow('correctedBitDisplay', result.correctedCode, parPosArr,
            [], result.hasError ? [result.errorPosition] : []);

        $('dataOutBinary').textContent  = result.extractedData;
        $('dataOutDecimal').textContent = HammingCode.binaryToDecimal(result.extractedData);
        $('dataOutHex').textContent     = HammingCode.binaryToDecimal(result.extractedData)
            .toString(16).toUpperCase().padStart(Math.ceil(result.extractedData.length / 4), '0');

        _showEl('correctionResult');
        _hideEl('noResultMsg');
        _showEl('syndromeDisplay');
    }

    /* ════════════════════════════════════════════════════════
       Bit Satırı Render
       ════════════════════════════════════════════════════════ */
    /**
     * container: element id
     * encoded: binary string
     * parityPositions: 1-indexed array
     * errorPositions: 1-indexed array (kırmızı)
     * correctedPositions: 1-indexed array (turuncu)
     */
    function _renderBitRow(containerId, encoded, parityPositions, errorPositions, correctedPositions) {
        const container = $(containerId);
        container.innerHTML = encoded.split('').map((bit, i) => {
            const pos = i + 1;
            let cls = 'bit-box';
            if (correctedPositions.includes(pos))   cls += ' bit-corrected';
            else if (errorPositions.includes(pos))  cls += ' bit-error';
            else if (parityPositions.includes(pos)) cls += ' bit-parity';
            else                                    cls += ' bit-data';

            return `<div class="${cls}">
                        <span class="bit-pos">${pos}</span>
                        <span class="bit-val">${bit}</span>
                    </div>`;
        }).join('');
    }

    /* ════════════════════════════════════════════════════════
       Bit Görselleştirme (tam genişlik)
       ════════════════════════════════════════════════════════ */
    function _updateBitViz(synResult) {
        const container = $('bitVizContainer');
        if (!container) return;

        const slot = Simulator.getSelectedSlot();
        if (!slot) return;

        const code   = synResult ? synResult.correctedCode : slot.encoded;
        const parPos = slot.parityPositions || [];
        // Düzeltme olduysa turuncu, sadece hata inject edildiyse kırmızı
        const corrPos = synResult && synResult.hasError ? [synResult.errorPosition] : [];
        const errPos  = (!synResult && slot.injectedPos) ? [slot.injectedPos] : [];

        container.innerHTML = code.split('').map((bit, i) => {
            const pos = i + 1;
            let cls = 'bit-box';
            if (corrPos.includes(pos))   cls += ' bit-corrected';
            else if (errPos.includes(pos)) cls += ' bit-error';
            else if (parPos.includes(pos)) cls += ' bit-parity';
            else                           cls += ' bit-data';
            return `<div class="${cls}"><span class="bit-pos">${pos}</span><span class="bit-val">${bit}</span></div>`;
        }).join('');
    }

    /* ════════════════════════════════════════════════════════
       Process Flow Animasyonu
       ════════════════════════════════════════════════════════ */
    function _setFlowStep(activeIndex) {
        FLOW_STEPS.forEach((id, idx) => {
            const el = $(id);
            if (!el) return;
            el.classList.remove('active', 'done');
            if (idx < activeIndex)  el.classList.add('done');
            if (idx === activeIndex) el.classList.add('active');
        });
    }

    function _animateFlow(from, to, delay) {
        _setFlowStep(from);
        setTimeout(() => _setFlowStep(to), delay);
    }

    /* ════════════════════════════════════════════════════════
       Geçmiş Kaydı
       ════════════════════════════════════════════════════════ */
    function _renderHistory() {
        const log     = $('historyLog');
        const history = Simulator.getHistory();

        if (history.length === 0) {
            log.innerHTML = '<div class="log-empty">İşlem geçmişi burada görüntülenir</div>';
            return;
        }

        const typeIcon = { ENCODE:'⚙', WRITE:'💾', SELECT:'👆', INJECT:'⚠', CORRECT:'✓', OK:'✓', CLEAR:'🗑', ERROR:'✗' };
        log.innerHTML = history.map(e =>
            `<div class="log-entry log-${e.type.toLowerCase()}">
                <span class="log-icon">${typeIcon[e.type] || '•'}</span>
                <span class="log-msg">${e.message}</span>
                <span class="log-time">${e.time}</span>
             </div>`
        ).join('');
    }

    /* ════════════════════════════════════════════════════════
       Dark Mode
       ════════════════════════════════════════════════════════ */
    function _bindThemeToggle() {
        const btn = $('darkModeToggle');
        if (!btn) return;
        // Önceki tercih
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            btn.textContent = '☀ Açık Mod';
        }
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            btn.textContent = isDark ? '🌙 Koyu Mod' : '☀ Açık Mod';
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });
    }

    /* ════════════════════════════════════════════════════════
       Yardımcılar
       ════════════════════════════════════════════════════════ */
    function _showEl(id)  { const el = $(id); if (el) el.classList.remove('hidden'); }
    function _hideEl(id)  { const el = $(id); if (el) el.classList.add('hidden'); }

    function _updateInputPlaceholder() {
        const hint = $('inputHint');
        if (!hint) return;
        if (currentFormat === 'binary')
            hint.textContent = `${currentBitLength} adet bit (0 ve 1)`;
        else if (currentFormat === 'decimal')
            hint.textContent = `0 – ${Math.pow(2, currentBitLength) - 1} arası ondalık`;
        else
            hint.textContent = `0 – ${(Math.pow(2, currentBitLength) - 1).toString(16).toUpperCase()} arası hex`;

        $('dataInput').placeholder = currentFormat === 'binary'
            ? '0'.repeat(currentBitLength)
            : currentFormat === 'decimal' ? '0'
            : '00';

        $('dataInput').maxLength = currentFormat === 'binary' ? currentBitLength : 12;
    }

    function _updateErrorPosHint() {
        const slot = Simulator.getSelectedSlot();
        const hint = $('errorPosHint');
        if (!hint) return;
        hint.textContent = slot ? `Toplam pozisyon: ${slot.totalLength}` : 'Toplam pozisyon: -';
    }

    function _toBinary(raw) {
        if (!raw) return null;
        if (currentFormat === 'binary') {
            if (!/^[01]+$/.test(raw)) return null;
            return raw.padStart(currentBitLength, '0');
        }
        if (currentFormat === 'decimal') {
            const n = parseInt(raw, 10);
            if (isNaN(n) || n < 0) return null;
            return HammingCode.decimalToBinary(n, currentBitLength);
        }
        if (currentFormat === 'hex') {
            const b = HammingCode.hexToBinary(raw, currentBitLength);
            return b;
        }
        return null;
    }

    /* Toast bildirimi */
    function _showToast(message, type = 'info') {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent  = message;
        toast.className    = `toast toast-${type} toast-show`;
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('toast-show'), 3000);
    }

    /* ── Public API ── */
    return { init };
})();

document.addEventListener('DOMContentLoaded', UI.init);
