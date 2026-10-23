// 任務頁面專用腳本 - QR 碼掃描功能
function mountNextStationLink() {
    const section = document.querySelector('section.qr-section');
    if (!section || document.getElementById('btn-next-station')) return;

    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    const stations = window.GuestType && window.GuestType.stations ? window.GuestType.stations : [];
    const allowed = window.GuestType && window.GuestType.tasksForCurrent
        ? window.GuestType.tasksForCurrent()
        : stations.map(function(station) { return station.key; });
    const index = stations.findIndex(function(station) { return station.href === file; });
    if (index < 0) return;

    const upcoming = stations.slice(index + 1).find(function(station) {
        return allowed.indexOf(station.key) !== -1;
    });
    if (!upcoming) return;

    const codes = window.UnlockGate && window.UnlockGate.codes;
    const code = codes ? codes[upcoming.key] : '';
    const link = document.createElement('a');
    link.id = 'btn-next-station';
    link.className = 'btn-next-station';
    link.href = upcoming.href + (code ? ('?unlock=' + encodeURIComponent(code)) : '');

    function label() {
        const text = window.I18n && window.I18n.t ? window.I18n.t('goNextStation') : '到下一關';
        return text && text !== 'goNextStation' ? text : '到下一關';
    }

    link.textContent = label();
    const scanBtn = document.getElementById('btn-scan-qr');
    if (scanBtn) scanBtn.insertAdjacentElement('afterend', link);
    else section.appendChild(link);

    window.addEventListener('languageChanged', function() {
        link.textContent = label();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    mountNextStationLink();

    const btnScanQR = document.getElementById('btn-scan-qr');
    const qrReader = document.getElementById('qr-reader');
    let html5QrcodeScanner = null;

    if (!btnScanQR || !qrReader) return;

    // 獲取當前頁面類型
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const nextPages = {
        'wave': 'rain.html',
        'rain': 'dawn.html',
        'dawn': 'index.html' // 完成所有任務後返回首頁
    };

    btnScanQR.addEventListener('click', () => {
        if (html5QrcodeScanner) {
            // 如果已經開啟，則關閉
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
            qrReader.style.display = 'none';
            btnScanQR.innerHTML = '<span>📷 掃描 QR 碼</span>';
            return;
        }

        // 開啟 QR 碼掃描器
        qrReader.style.display = 'block';
        btnScanQR.innerHTML = '<span>⏹️ 停止掃描</span>';

        html5QrcodeScanner = new Html5Qrcode("qr-reader");
        
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                handleQRCodeScanned(decodedText);
            },
            (errorMessage) => {
                // 掃描錯誤（忽略，繼續掃描）
            }
        ).catch((err) => {
            console.error("無法啟動相機:", err);
            alert('無法啟動相機，請確認已授予相機權限');
            qrReader.style.display = 'none';
            btnScanQR.innerHTML = '<span>📷 掃描 QR 碼</span>';
        });
    });

    function handleQRCodeScanned(decodedText) {
        // 停止掃描
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(() => {
                html5QrcodeScanner.clear();
                html5QrcodeScanner = null;
                qrReader.style.display = 'none';
                btnScanQR.innerHTML = '<span>📷 掃描 QR 碼</span>';
            });
        }

        // 解析 QR 碼內容並導航
        try {
            // 檢查是否為下一個任務的 QR 碼
            const nextPage = nextPages[currentPage];
            
            if (decodedText.includes('rain.html') || decodedText === 'rain' || decodedText === 'RAIN') {
                if (currentPage === 'wave') {
                    window.location.href = 'rain.html';
                } else {
                    alert('這不是下一個任務的 QR 碼');
                }
            } else if (decodedText.includes('dawn.html') || decodedText === 'dawn' || decodedText === 'DAWN') {
                if (currentPage === 'rain') {
                    window.location.href = 'dawn.html';
                } else {
                    alert('這不是下一個任務的 QR 碼');
                }
            } else if (decodedText.includes('index.html') || decodedText === 'index' || decodedText === 'INDEX') {
                if (currentPage === 'dawn') {
                    window.location.href = 'index.html';
                } else {
                    alert('這不是完成任務的 QR 碼');
                }
            } else if (decodedText.startsWith('http')) {
                // 如果是完整 URL，直接跳轉
                window.location.href = decodedText;
            } else {
                alert('無法識別的 QR 碼，請確認這是正確的任務 QR 碼');
            }
        } catch (error) {
            console.error('QR 碼處理錯誤:', error);
            alert('QR 碼處理失敗，請重試');
        }
    }
});

