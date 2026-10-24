// 南園英雄旁白。完成判斷依客別：遊園客七關，住客十關。

const HERO_PROFILE = {
    name: '南園',
    role: '園中的引導',
    style: {
        tone: '平實，不說教',
        speed: '偏慢、留白多',
        stance: '與旅人同行'
    },
    keywords: ['走慢一點', '不必照順序']
};

const HERO_OPENING = '歡迎來到南園。這座園子依宋代畫作〈阿閣圖〉的意境建成，有樓、有門、有水、有亭。接下來的關卡不必照順序走，看到哪一處讓你停下腳步，就從那裡開始。每到一關，掃描立牌上的 QR，或拍下眼前的建築，就能打開那一關的引導。今天不用趕路，走慢一點。';

const HERO_VISIT_DONE = '你走完了今天的七關。在榕樹下放下的那件事，在孔雀亭留下的那句話，都存在你的筆記裡。離開前，可以回榕蔭庭走一趟，決定要不要把放下的事帶走。下次若住下來，夜裡和清晨的南園還有三關。';

const HERO_STAY_DONE = '你走完了南園十關。這兩天的筆記、錄音和照片都存在你的手機裡，回家後隨時可以打開。在快覽亭決定帶走的那一樣東西，就放進明天的日常裡。';

const HERO_TRANSITIONS = {
    wave: '先在樹下坐一會兒，把外面的事放下。',
    rain: '抬頭看看南樓，數數它有幾層屋簷。',
    dawn: '找到延爽門，先別急著走過去。',
    mission4: '到湖邊的水風軒，看看水面。',
    mission5: '走上圓形戲臺，數數你的角色。',
    mission6: '到風檐下，聽一聽風。',
    mission7: '到竹苑與蘭苑之間的孔雀亭，留一句話給一年後的自己。',
    mission8: '到住宿區找水牛望月，繞它走一圈。',
    mission9: '回房前，在同心樓前停一下。',
    mission10: '清晨到湖邊的快覽亭，整理要帶回去的東西。'
};

const VISIT_TASKS = ['wave', 'rain', 'dawn', 'mission4', 'mission5', 'mission6', 'mission7'];
const ALL_TASKS = VISIT_TASKS.concat(['mission8', 'mission9', 'mission10']);

function guestIsVisit() {
    if (window.GuestType && window.GuestType.getGuestType() === 'visit') return true;
    try {
        return localStorage.getItem('guestType') === 'visit';
    } catch (e) {
        return false;
    }
}

function hasAll(completed, keys) {
    return keys.every(function(key) { return completed.indexOf(key) !== -1; });
}

function ht(key, fallback) {
    if (window.I18n && typeof window.I18n.t === 'function') {
        const value = window.I18n.t(key);
        if (value && value !== key) return value;
    }
    return fallback;
}

const HERO_LINE_KEYS = {
    wave: 'heroLineWave',
    rain: 'heroLineRain',
    dawn: 'heroLineDawn',
    mission4: 'heroLineMission4',
    mission5: 'heroLineMission5',
    mission6: 'heroLineMission6',
    mission7: 'heroLineMission7',
    mission8: 'heroLineMission8',
    mission9: 'heroLineMission9',
    mission10: 'heroLineMission10'
};

function getHeroGreeting(progress) {
    const completed = (progress && progress.completed) || [];
    if (guestIsVisit()) {
        if (hasAll(completed, VISIT_TASKS)) return ht('heroVisitDone', HERO_VISIT_DONE);
        return ht('heroOpening', HERO_OPENING);
    }
    if (hasAll(completed, ALL_TASKS)) return ht('heroStayDone', HERO_STAY_DONE);
    return ht('heroOpening', HERO_OPENING);
}

function getHeroTransition(taskKey) {
    const key = HERO_LINE_KEYS[taskKey];
    const fallback = HERO_TRANSITIONS[taskKey] || '';
    return key ? ht(key, fallback) : fallback;
}

function getHeroCompletionFeedback(taskKey) {
    return getHeroTransition(taskKey);
}

function renderHeroGreeting() {
    if (!window.TaskProgress) return;
    const progress = window.TaskProgress.getTaskProgress();
    const message = getHeroGreeting(progress);
    const container = document.getElementById('hero-guide-message');
    if (container) container.textContent = message;
}

if (typeof window !== 'undefined') {
    window.HeroGuide = {
        profile: HERO_PROFILE,
        getGreeting: getHeroGreeting,
        getTransition: getHeroTransition,
        getCompletionFeedback: getHeroCompletionFeedback,
        renderHeroGreeting: renderHeroGreeting
    };

    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('hero-guide-message')) renderHeroGreeting();
    });

    window.addEventListener('languageChanged', function() {
        if (document.getElementById('hero-guide-message')) renderHeroGreeting();
    });
}
