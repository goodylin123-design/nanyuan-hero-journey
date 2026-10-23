// 南園各關解鎖：GPS 通過之後，掃描 QR 或拍下建築。
const UNLOCK_CODES = {
    wave: 'NY01',
    rain: 'NY02',
    dawn: 'NY03',
    mission4: 'NY04',
    mission5: 'NY05',
    mission6: 'NY06',
    mission7: 'NY07',
    mission8: 'NY08',
    mission9: 'NY09',
    mission10: 'NY10'
};

const UNLOCK_PAGES = {
    'wave.html': 'wave',
    'rain.html': 'rain',
    'dawn.html': 'dawn',
    'mission4.html': 'mission4',
    'mission5.html': 'mission5',
    'mission6.html': 'mission6',
    'mission7.html': 'mission7',
    'mission8.html': 'mission8',
    'mission9.html': 'mission9',
    'mission10.html': 'mission10'
};

function unlockTaskKey() {
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    return UNLOCK_PAGES[file] || null;
}

function readUnlock(taskKey) {
    try {
        return localStorage.getItem('unlock_' + taskKey);
    } catch (e) {
        return null;
    }
}

function writeUnlock(taskKey, method) {
    try {
        localStorage.setItem('unlock_' + taskKey, method);
    } catch (e) {}
}

function unlockCodeFromText(text) {
    const raw = String(text || '');
    try {
        const url = new URL(raw, location.origin);
        const code = url.searchParams.get('unlock');
        if (code) return code;
    } catch (e) {}
    const matched = raw.match(/unlock=([A-Za-z0-9]+)/);
    return matched ? matched[1] : '';
}

function isUnlockTestMode(taskKey) {
    try {
        if (sessionStorage.getItem('test_mode_' + taskKey) === 'true') return true;
        const raw = sessionStorage.getItem('location_verified_' + taskKey);
        if (!raw) return false;
        return JSON.parse(raw).isTestMode === true;
    } catch (e) {
        return false;
    }
}

function dictText(key) {
    try {
        const lang = window.I18n ? window.I18n.getCurrentLanguage() : 'zh-TW';
        const dict = window.I18n ? window.I18n.getTranslation(lang) : {};
        const value = dict[key];
        if (value && value !== key) return value;
    } catch (e) {}
    return '';
}

function showMissionExtras(taskKey) {
    const question = dictText(taskKey + 'NoteQuestion');
    const textPanel = document.getElementById('text-input-panel');
    if (question && textPanel && !document.getElementById('note-question')) {
        const line = document.createElement('p');
        line.id = 'note-question';
        line.textContent = question;
        line.style.cssText = 'color:#0F172A;font-weight:600;line-height:1.6;margin:0 0 10px;';
        textPanel.insertBefore(line, textPanel.firstChild);
    }

    const saveArea = document.getElementById('recording-save-area');
    if (question && saveArea && !document.getElementById('note-question-save')) {
        const line = document.createElement('p');
        line.id = 'note-question-save';
        line.textContent = question;
        line.style.cssText = 'color:#0F172A;font-weight:600;line-height:1.6;margin:0 0 12px;';
        saveArea.insertBefore(line, saveArea.firstChild);
    }

    const subtitle = document.querySelector('header .subtitle');
    if (subtitle && window.HeroGuide && !document.getElementById('hero-transition')) {
        const transition = window.HeroGuide.getTransition(taskKey);
        if (transition) {
            const line = document.createElement('p');
            line.id = 'hero-transition';
            line.textContent = transition;
            line.style.cssText = 'color:#334155;line-height:1.6;margin-top:8px;';
            subtitle.insertAdjacentElement('afterend', line);
        }
    }

    let slot = document.getElementById('task-photo-slot');
    if (!slot) {
        const intro = document.querySelector('.whisper-intro');
        slot = document.createElement('div');
        slot.id = 'task-photo-slot';
        if (intro) intro.insertAdjacentElement('afterend', slot);
    }
    if (window.TravelerStore && window.TravelerStore.mountTaskPhoto) {
        window.TravelerStore.mountTaskPhoto(slot, taskKey);
    }
}

function finishUnlock(taskKey, method) {
    writeUnlock(taskKey, method);
    const overlay = document.getElementById('unlock-overlay');
    if (overlay) overlay.remove();
    showMissionExtras(taskKey);
}

function ensureScannerLib() {
    if (window.Html5Qrcode) return Promise.resolve();
    return new Promise(function(resolve, reject) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.onload = function() { resolve(); };
        script.onerror = function() { reject(new Error('scanner')); };
        document.head.appendChild(script);
    });
}

function shrinkPhoto(file) {
    return new Promise(function(resolve) {
        const image = new Image();
        const url = URL.createObjectURL(file);
        image.onload = function() {
            const maxSide = 1280;
            let width = image.width;
            let height = image.height;
            if (width > maxSide) {
                height = Math.round(height * maxSide / width);
                width = maxSide;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(image, 0, 0, width, height);
            URL.revokeObjectURL(url);
            canvas.toBlob(function(blob) { resolve(blob || file); }, 'image/jpeg', 0.82);
        };
        image.onerror = function() {
            URL.revokeObjectURL(url);
            resolve(file);
        };
        image.src = url;
    });
}

function showUnlockOverlay(taskKey) {
    if (document.getElementById('unlock-overlay')) return;
    const place = (window.TASK_LOCATIONS && window.TASK_LOCATIONS[taskKey] && window.TASK_LOCATIONS[taskKey].name) || '這一關';
    const hint = dictText(taskKey + 'PhotoHint');
    const overlay = document.createElement('div');
    overlay.id = 'unlock-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1000001;background:rgba(255,255,255,0.98);overflow:auto;padding:28px 20px;box-sizing:border-box;';
    overlay.innerHTML = ''
        + '<div style="max-width:460px;margin:0 auto;text-align:center;">'
        + '<p style="color:#64748B;margin:0 0 8px;">先打開這一關</p>'
        + '<h2 style="color:#0F172A;margin:0 0 8px;">' + place + '</h2>'
        + '<p style="color:#475569;line-height:1.7;margin:0 0 20px;">掃描立牌上的 QR，或拍下眼前的建築。兩種方式都可以。</p>'
        + '<div style="display:flex;flex-direction:column;gap:12px;">'
        + '<button type="button" id="unlock-scan-btn" style="padding:16px 20px;border:none;border-radius:16px;background:#1F4D3A;color:white;font-size:1.05rem;font-weight:700;cursor:pointer;">掃描 QR</button>'
        + '<button type="button" id="unlock-photo-btn" style="padding:16px 20px;border:none;border-radius:16px;background:#C4A46A;color:#1F2937;font-size:1.05rem;font-weight:700;cursor:pointer;">拍下這座建築</button>'
        + (isUnlockTestMode(taskKey) ? '<button type="button" id="unlock-skip-btn" style="padding:12px 20px;border:1px solid #CBD5E1;border-radius:16px;background:white;color:#475569;cursor:pointer;">略過</button>' : '')
        + '</div>'
        + '<p id="unlock-photo-hint" style="color:#64748B;line-height:1.6;margin:10px 0 0;">' + (hint || '') + '</p>'
        + '<p id="unlock-message" style="color:#B45309;min-height:1.4em;margin:12px 0 0;"></p>'
        + '<div id="unlock-qr-reader" style="margin-top:16px;"></div>'
        + '<input id="unlock-photo-input" type="file" accept="image/*" capture="environment" style="display:none;">'
        + '<p style="margin-top:28px;"><a href="app.html" style="color:#64748B;">返回關卡列表</a></p>'
        + '</div>';
    document.body.appendChild(overlay);

    const message = overlay.querySelector('#unlock-message');
    let scanner = null;

    overlay.querySelector('#unlock-scan-btn').onclick = function() {
        message.textContent = '正在開啟相機…';
        ensureScannerLib().then(function() {
            const reader = overlay.querySelector('#unlock-qr-reader');
            reader.innerHTML = '';
            scanner = new Html5Qrcode('unlock-qr-reader');
            return scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                function(decoded) {
                    const code = unlockCodeFromText(decoded);
                    if (code === UNLOCK_CODES[taskKey]) {
                        scanner.stop().catch(function() {}).finally(function() {
                            finishUnlock(taskKey, 'qr');
                        });
                        return;
                    }
                    message.textContent = '這不是這一關的 QR。';
                },
                function() {}
            );
        }).then(function() {
            message.textContent = '對準立牌上的 QR。';
        }).catch(function() {
            message.textContent = '無法開啟相機。你也可以用手機相機直接掃描立牌。';
        });
    };

    const input = overlay.querySelector('#unlock-photo-input');
    overlay.querySelector('#unlock-photo-btn').onclick = function() {
        input.click();
    };
    input.onchange = function() {
        const file = input.files && input.files[0];
        if (!file) return;
        message.textContent = '正在保存照片…';
        shrinkPhoto(file).then(function(blob) {
            const save = window.TravelerStore && window.TravelerStore.saveTaskPhoto
                ? window.TravelerStore.saveTaskPhoto(taskKey, blob)
                : Promise.resolve();
            return Promise.resolve(save);
        }).then(function() {
            finishUnlock(taskKey, 'photo');
        }).catch(function() {
            finishUnlock(taskKey, 'photo');
        });
    };

    const skip = overlay.querySelector('#unlock-skip-btn');
    if (skip) {
        skip.onclick = function() { finishUnlock(taskKey, 'test'); };
    }
}

function acceptUrlUnlock(taskKey) {
    try {
        const code = new URLSearchParams(location.search).get('unlock');
        if (code && code === UNLOCK_CODES[taskKey]) {
            writeUnlock(taskKey, 'qr');
            const url = new URL(location.href);
            url.searchParams.delete('unlock');
            history.replaceState(null, '', url.pathname + url.search + url.hash);
            return true;
        }
    } catch (e) {}
    return false;
}

function ensureUnlocked(taskKey) {
    if (window.GuestType && window.GuestType.isVisitBlocked(taskKey)) {
        window.GuestType.showStayOnly();
        return;
    }
    acceptUrlUnlock(taskKey);
    if (readUnlock(taskKey)) {
        showMissionExtras(taskKey);
        return;
    }
    showUnlockOverlay(taskKey);
}

function pollUntilLocationReady(taskKey) {
    if (window.GuestType && window.GuestType.isVisitBlocked(taskKey)) {
        window.GuestType.showStayOnly();
        return;
    }
    if (typeof window.isLocationVerified !== 'function') {
        setTimeout(function() { pollUntilLocationReady(taskKey); }, 300);
        return;
    }
    if (!window.isLocationVerified(taskKey)) {
        setTimeout(function() { pollUntilLocationReady(taskKey); }, 400);
        return;
    }
    ensureUnlocked(taskKey);
}

function bootUnlock() {
    const taskKey = unlockTaskKey();
    if (!taskKey) return;
    setTimeout(function() { pollUntilLocationReady(taskKey); }, 700);
}

if (typeof window !== 'undefined') {
    window.UnlockGate = {
        codes: UNLOCK_CODES,
        read: readUnlock,
        ensure: ensureUnlocked
    };
    document.addEventListener('DOMContentLoaded', bootUnlock);
}
