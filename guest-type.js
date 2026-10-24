// 南園客別：住客走十關，遊園客走第 1 至 7 關。
const GUEST_VISIT_TASKS = ['wave', 'rain', 'dawn', 'mission4', 'mission5', 'mission6', 'mission7'];
const GUEST_STAY_ONLY = ['mission8', 'mission9', 'mission10'];
const GUEST_ALL_TASKS = GUEST_VISIT_TASKS.concat(GUEST_STAY_ONLY);

const NANYUAN_STATIONS = [
    { key: 'wave', name: '榕蔭庭', theme: '卸下', mapNo: '⑫', time: '不限', href: 'wave.html', stayOnly: false },
    { key: 'rain', name: '南樓', theme: '仰望', mapNo: '①', time: '不限', href: 'rain.html', stayOnly: false },
    { key: 'dawn', name: '延爽門', theme: '跨越', mapNo: '⑮', time: '不限', href: 'dawn.html', stayOnly: false },
    { key: 'mission4', name: '水風軒', theme: '照見', mapNo: '⑨', time: '不限', href: 'mission4.html', stayOnly: false },
    { key: 'mission5', name: '戲臺', theme: '角色', mapNo: '⑰', time: '不限', href: 'mission5.html', stayOnly: false },
    { key: 'mission6', name: '風檐', theme: '柔韌', mapNo: '⑩', time: '不限', href: 'mission6.html', stayOnly: false },
    { key: 'mission7', name: '孔雀亭', theme: '許諾', mapNo: '⑯', time: '不限', href: 'mission7.html', stayOnly: false },
    { key: 'mission8', name: '水牛望月', theme: '踏實', mapNo: 'F', time: '不限', href: 'mission8.html', stayOnly: true },
    { key: 'mission9', name: '同心樓', theme: '同心', mapNo: 'A', time: '夜間', href: 'mission9.html', stayOnly: true },
    { key: 'mission10', name: '快覽亭', theme: '歸來', mapNo: '⑱', time: '清晨', href: 'mission10.html', stayOnly: true }
];

function guestPageName() {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return file || 'index.html';
}

function guestTaskKeyFromPage() {
    const file = guestPageName();
    const found = NANYUAN_STATIONS.find(function(station) { return station.href === file; });
    return found ? found.key : null;
}

function readStoredGuestType() {
    try {
        const value = localStorage.getItem('guestType');
        if (value === 'stay' || value === 'visit') return value;
    } catch (e) {}
    return null;
}

function captureGuestTypeFromUrl() {
    try {
        const type = new URLSearchParams(location.search).get('type');
        if (type === 'stay' || type === 'visit') {
            localStorage.setItem('guestType', type);
            return type;
        }
    } catch (e) {}
    return null;
}

function getGuestType() {
    return captureGuestTypeFromUrl() || readStoredGuestType();
}

function setGuestType(type) {
    try {
        if (type === 'stay' || type === 'visit') localStorage.setItem('guestType', type);
    } catch (e) {}
}

function clearGuestType() {
    try {
        localStorage.removeItem('guestType');
    } catch (e) {}
    try {
        const url = new URL(location.href);
        url.searchParams.delete('type');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {}
}

function tasksForCurrentGuest() {
    return getGuestType() === 'visit' ? GUEST_VISIT_TASKS.slice() : GUEST_ALL_TASKS.slice();
}

function isStayOnlyTask(taskKey) {
    return GUEST_STAY_ONLY.indexOf(taskKey) !== -1;
}

function isVisitBlocked(taskKey) {
    return isStayOnlyTask(taskKey) && getGuestType() === 'visit';
}

function removeGuestOverlay() {
    const existing = document.getElementById('guest-type-overlay');
    if (existing) existing.remove();
}

function showGuestChooser(onDone) {
    removeGuestOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'guest-type-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1000002;background:rgba(255,255,255,0.98);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;';
    overlay.innerHTML = ''
        + '<div style="max-width:420px;width:100%;text-align:center;">'
        + '<p style="letter-spacing:0.12em;color:#64748B;margin:0 0 8px;">' + gt('guestBrand', '英雄之旅@南園') + '</p>'
        + '<h2 style="color:#0F172A;margin:0 0 12px;font-size:1.6rem;">' + gt('guestAsk', '你這趟是哪一種旅人？') + '</h2>'
        + '<p style="color:#475569;line-height:1.6;margin:0 0 24px;">' + gt('guestExplain', '遊園旅人走第 1 至 7 關。住宿旅人可以走完全部 10 關。') + '</p>'
        + '<div style="display:flex;flex-direction:column;gap:12px;">'
        + '<button type="button" id="guest-choose-stay" style="padding:16px 20px;border:none;border-radius:16px;background:#1F4D3A;color:white;font-size:1.05rem;font-weight:700;cursor:pointer;">' + gt('guestStay', '我是住宿旅人') + '</button>'
        + '<button type="button" id="guest-choose-visit" style="padding:16px 20px;border:none;border-radius:16px;background:#C4A46A;color:#1F2937;font-size:1.05rem;font-weight:700;cursor:pointer;">' + gt('guestVisit', '我是遊園旅人') + '</button>'
        + '</div></div>';
    document.body.appendChild(overlay);

    function choose(type) {
        setGuestType(type);
        overlay.remove();
        applyGuestSurfaces();
        if (typeof onDone === 'function') onDone(type);
    }
    overlay.querySelector('#guest-choose-stay').onclick = function() { choose('stay'); };
    overlay.querySelector('#guest-choose-visit').onclick = function() { choose('visit'); };
}

function showStayOnlyGate() {
    removeGuestOverlay();
    const gps = document.getElementById('task-block-overlay');
    if (gps) gps.remove();
    const overlay = document.createElement('div');
    overlay.id = 'guest-type-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1000002;background:rgba(255,255,255,0.98);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;';
    overlay.innerHTML = ''
        + '<div style="max-width:420px;width:100%;text-align:center;">'
        + '<div style="font-size:2.4rem;margin-bottom:8px;">🌙</div>'
        + '<h2 style="color:#0F172A;margin:0 0 12px;">' + gt('stayOnlyTitle', '此關為住宿旅人專屬') + '</h2>'
        + '<p style="color:#475569;line-height:1.7;margin:0 0 24px;">' + gt('stayOnlyBody', '第 8 至 10 關安排在住宿區、夜間與清晨。遊園旅人的旅程到第 7 關孔雀亭為止。') + '</p>'
        + '<a href="app.html" style="display:inline-block;padding:14px 28px;border-radius:16px;background:#1F4D3A;color:white;text-decoration:none;font-weight:700;">' + gt('guestBack', '返回') + '</a>'
        + '</div>';
    document.body.appendChild(overlay);
}

function applyGuestSurfaces() {
    const type = getGuestType();
    const tasks = tasksForCurrentGuest();

    document.querySelectorAll('[data-task]').forEach(function(el) {
        const key = el.getAttribute('data-task');
        if (!key || tasks.indexOf(key) !== -1) return;
        el.style.display = 'none';
    });

    document.querySelectorAll('.journey-steps li').forEach(function(li, index) {
        if (type === 'visit' && index >= GUEST_VISIT_TASKS.length) li.style.display = 'none';
    });

    document.querySelectorAll('.feature-card').forEach(function(card) {
        const link = card.querySelector('a');
        const href = link ? (link.getAttribute('href') || '') : '';
        if (type === 'visit' && /mission(?:8|9|10)\.html/.test(href)) card.style.display = 'none';
    });

    const list = document.getElementById('nanyuan-station-list');
    if (list) renderStationList(list);

    const stops = document.getElementById('route-stop-count');
    if (stops) stops.textContent = tasks.length + ' ' + gt('routeStopUnit', '關');
}

function gt(key, fallback) {
    if (window.I18n && typeof window.I18n.t === 'function') {
        const value = window.I18n.t(key);
        if (value && value !== key) return value;
    }
    return fallback;
}

const STATION_TITLE_KEYS = {
    wave: 'waveTitle',
    rain: 'rainTitle',
    dawn: 'dawnTitle',
    mission4: 'mission4Title',
    mission5: 'mission5Title',
    mission6: 'mission6Title',
    mission7: 'mission7Title',
    mission8: 'mission8Title',
    mission9: 'mission9Title',
    mission10: 'mission10Title'
};

function stationTimeLabel(time) {
    if (time === '夜間') return gt('routeTimeNight', '夜間');
    if (time === '清晨') return gt('routeTimeDawn', '清晨');
    return gt('routeTimeAny', '不限');
}

function renderStationList(list) {
    const type = getGuestType();
    const stations = NANYUAN_STATIONS.filter(function(station) {
        return type !== 'visit' || !station.stayOnly;
    });
    list.innerHTML = stations.map(function(station, index) {
        const titleKey = STATION_TITLE_KEYS[station.key];
        const title = gt(titleKey, station.name + '・' + station.theme);
        return ''
            + '<article class="route-step-card">'
            + '<div class="route-step-number">' + (index + 1) + '</div>'
            + '<div class="route-step-title">' + title + '</div>'
            + '<div class="route-step-location">' + gt('routeMapNo', '圖號') + ' ' + station.mapNo + ' · ' + gt('routeTimeLabel', '建議時段') + ' ' + stationTimeLabel(station.time) + '</div>'
            + '<div class="route-step-actions"><a class="btn-route-action btn-start-task" href="' + station.href + '">' + gt('routeEnterStation', '進入這一關') + '</a></div>'
            + '</article>';
    }).join('');
}

function ensureReselectLink() {
    if (guestPageName() !== 'app.html') return;
    if (document.getElementById('reselect-guest')) return;
    const header = document.querySelector('.header');
    if (!header) return;
    const link = document.createElement('a');
    link.id = 'reselect-guest';
    link.href = '#';
    link.textContent = gt('reselectGuest', '重新選擇身分');
    link.style.cssText = 'display:inline-block;margin-top:8px;color:#64748B;font-size:0.85rem;';
    link.addEventListener('click', function(event) {
        event.preventDefault();
        clearGuestType();
        showGuestChooser(function() {
            location.reload();
        });
    });
    header.appendChild(link);
}

const STATION_PHOTOS = {
    wave: ['images/stations/01_wave_榕蔭庭.jpg', '榕蔭庭'],
    rain: ['images/stations/02_rain_南樓.jpg', '南樓'],
    dawn: ['images/stations/03_dawn_延爽門.jpg', '延爽門'],
    mission4: ['images/stations/04_mission4_水風軒.jpg', '水風軒'],
    mission5: ['images/stations/05_mission5_戲臺.jpg', '戲臺'],
    mission6: ['images/stations/06_mission6_風檐.jpg', '風檐'],
    mission7: ['images/stations/07_mission7_孔雀亭.jpg', '孔雀亭'],
    mission8: ['images/stations/08_mission8_水牛望月.jpg', '水牛望月'],
    mission9: ['images/stations/09_mission9_同心樓.jpg', '同心樓'],
    mission10: ['images/stations/10_mission10_快覽亭.jpg', '快覽亭']
};

function renderStationPhoto(taskKey) {
    const photo = STATION_PHOTOS[taskKey];
    if (!photo || document.getElementById('station-photo')) return;
    const header = document.querySelector('header.header');
    if (!header) return;
    const figure = document.createElement('figure');
    figure.id = 'station-photo';
    figure.style.cssText = 'margin:16px auto 0;max-width:640px;';
    const image = document.createElement('img');
    image.src = photo[0];
    image.alt = photo[1];
    image.style.cssText = 'width:100%;max-height:420px;object-fit:cover;border-radius:16px;display:block;';
    figure.appendChild(image);
    header.appendChild(figure);
}

function bootGuestType() {
    captureGuestTypeFromUrl();
    const page = guestPageName();
    const taskKey = guestTaskKeyFromPage();
    if (taskKey) renderStationPhoto(taskKey);

    if (taskKey && isStayOnlyTask(taskKey) && !getGuestType()) {
        showGuestChooser(function(type) {
            if (type === 'visit') showStayOnlyGate();
        });
        return;
    }

    if (taskKey && isVisitBlocked(taskKey)) {
        showStayOnlyGate();
        return;
    }

    if ((page === 'index.html' || page === 'app.html') && !getGuestType()) {
        showGuestChooser();
    }

    ensureReselectLink();
    setTimeout(applyGuestSurfaces, 120);
}

window.addEventListener('languageChanged', function() {
    applyGuestSurfaces();
});

if (typeof window !== 'undefined') {
    window.GuestType = {
        getGuestType: getGuestType,
        setGuestType: setGuestType,
        clearGuestType: clearGuestType,
        tasksForCurrent: tasksForCurrentGuest,
        isStayOnlyTask: isStayOnlyTask,
        isVisitBlocked: isVisitBlocked,
        showChooser: showGuestChooser,
        showStayOnly: showStayOnlyGate,
        stations: NANYUAN_STATIONS,
        applyGuestSurfaces: applyGuestSurfaces
    };

    document.addEventListener('DOMContentLoaded', bootGuestType);
}
