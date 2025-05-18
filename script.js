document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let appState = {
        xp: 0,
        streak: 0,
        lastCompletionDate: null,
        currentTheme: 'light',
        currentModuleId: null,
        currentLessonId: null,
        currentExerciseIndex: 0,
        lessonsData: null,
        lessonProgress: {},
        earnedBadges: [],
        isSidenavOpen: false,
        currentLearningPathId: null,
        activityDates: []
    };

    // --- DOM ELEMENTS ---
    const xpDisplay = document.getElementById('xp-display');
    const streakDisplay = document.getElementById('streak-display');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const dashboardView = document.getElementById('dashboard-view');
    const lessonView = document.getElementById('lesson-view');
    const lessonTitleElement = document.getElementById('lesson-title');
    const lessonContentElement = document.getElementById('lesson-content');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackText = document.getElementById('feedback-text');
    const feedbackExplanation = document.getElementById('feedback-explanation');
    const nextExerciseButton = document.getElementById('next-exercise-button');
    const backToDashboardButton = document.getElementById('back-to-dashboard');
    const loadingSpinner = document.getElementById('loading-spinner');

    const sidenavElement = document.getElementById('sidenav');
    const sidenavToggle = document.getElementById('sidenav-toggle');
    const closeSidenavButton = document.getElementById('close-sidenav-btn');
    const overlayElement = document.getElementById('overlay');
    const sidenavLinks = document.querySelectorAll('.sidenav-link');
    const sidenavThemeToggle = document.getElementById('sidenav-theme-toggle');
    const themeSelectSettings = document.getElementById('theme-select-settings');
    const resetProgressButton = document.getElementById('reset-progress-button');

    // Dashboard specific elements
    const dashboardXpElement = document.querySelector('#dashboard-xp .summary-value');
    const dashboardStreakElement = document.querySelector('#dashboard-streak .summary-value');
    const dashboardLessonsCompletedElement = document.querySelector('#dashboard-lessons-completed .summary-value');
    const dashboardBadgesEarnedElement = document.querySelector('#dashboard-badges-earned .summary-value');
    const dashboardAreasPracticedRadarChartCanvas = document.getElementById('dashboard-areas-practiced-radar-chart');
    const dashboardStreakCalendarContainer = document.getElementById('dashboard-streak-calendar-container');
    const continueLessonCardPlaceholder = document.getElementById('continue-lesson-card-placeholder');
    const dashboardBadgesContainer = document.getElementById('dashboard-badges-container');

    // Courses View Elements
    const myCoursesContainer = document.getElementById('my-courses-container');
    const myCoursesSearchInput = document.getElementById('my-courses-search-input');

    // Progress View Elements
    const progressViewXpElement = document.querySelector('#progress-view-xp .summary-value');
    const progressViewStreakElement = document.querySelector('#progress-view-streak .summary-value');
    const progressViewLessonsCompletedElement = document.querySelector('#progress-view-lessons-completed .summary-value');
    const progressViewBadgesEarnedElement = document.querySelector('#progress-view-badges-earned .summary-value');
    const progressViewModulesDetailedContainer = document.getElementById('progress-view-modules-detailed-container');
    const progressViewAreasPracticedRadarChartCanvas = document.getElementById('progress-view-areas-practiced-radar-chart');
    const progressViewStreakCalendarContainer = document.getElementById('progress-view-streak-calendar-container');

    // Learning Paths Elements
    const learningPathsContainer = document.getElementById('learning-paths-container');
    const learningPathDetailView = document.getElementById('learning-path-detail-view');
    const lpDetailTitle = document.getElementById('lp-detail-title');
    const lpDetailDifficulty = document.getElementById('lp-detail-difficulty');
    const lpDetailModulesCount = document.getElementById('lp-detail-modules-count');
    const lpDetailEstimatedTime = document.getElementById('lp-detail-estimated-time');
    const lpDetailLongDescription = document.getElementById('lp-detail-long-description');
    const enrollLpButton = document.getElementById('enroll-lp-button');
    const lpDetailModulesContainer = document.getElementById('lp-detail-modules-container');
    const lpDetailBadgesContainer = document.getElementById('lp-detail-badges-container');
    const backToLpOverviewButton = document.getElementById('back-to-lp-overview');
    const lpSearchInput = document.getElementById('lp-search-input');

    let dashboardRadarChartInstance;
    let progressViewRadarChartInstance;

    // --- LOCALSTORAGE FUNCTIONS ---
    function saveState() {
        const stateToSave = {
            xp: appState.xp, streak: appState.streak, lastCompletionDate: appState.lastCompletionDate,
            currentTheme: appState.currentTheme, lessonProgress: appState.lessonProgress,
            earnedBadges: appState.earnedBadges, currentLearningPathId: appState.currentLearningPathId,
            activityDates: appState.activityDates
        };
        localStorage.setItem('eduAppState', JSON.stringify(stateToSave));
    }

    function loadState() {
        const savedState = localStorage.getItem('eduAppState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState.xp = parsedState.xp || 0;
            appState.streak = parsedState.streak || 0;
            appState.lastCompletionDate = parsedState.lastCompletionDate || null;
            appState.currentTheme = parsedState.currentTheme || 'light';
            appState.lessonProgress = parsedState.lessonProgress || {};
            appState.earnedBadges = parsedState.earnedBadges || [];
            appState.currentLearningPathId = parsedState.currentLearningPathId || null;
            appState.activityDates = parsedState.activityDates || [];
        }
        updateStreak();
    }

    // --- SIDENAV MANAGEMENT ---
    function openSidenav() {
        if (!sidenavElement || !overlayElement) return;
        sidenavElement.classList.add('open');
        overlayElement.classList.add('active');
        document.body.classList.add('sidenav-active');
        if (sidenavToggle) sidenavToggle.setAttribute('aria-expanded', 'true');
        appState.isSidenavOpen = true;
    }

    function closeSidenav() {
        if (!sidenavElement || !overlayElement) return;
        sidenavElement.classList.remove('open');
        overlayElement.classList.remove('active');
        document.body.classList.remove('sidenav-active');
        if (sidenavToggle) sidenavToggle.setAttribute('aria-expanded', 'false');
        appState.isSidenavOpen = false;
    }

    function handleSidenavLinkClick(event) {
        const link = event.target.closest('.sidenav-link');
        if (!link || link.id === 'sidenav-theme-toggle' || link.getAttribute('href') === '#logout') {
            if (link && link.getAttribute('href') === '#logout') {
                event.preventDefault();
                if (confirm("Sunteți sigur că doriți să vă deconectați și să resetați progresul?")) {
                    localStorage.removeItem('eduAppState');
                    window.location.reload();
                }
                closeSidenav();
            }
            return;
        }
        event.preventDefault();
        const viewId = link.dataset.view;
        if (viewId) {
            showView(viewId);
            sidenavLinks.forEach(sl => sl.classList.remove('active-sidenav-link'));
            link.classList.add('active-sidenav-link');
        }
        if (window.innerWidth < 992) closeSidenav();
    }

    // --- THEME MANAGEMENT ---
    function updateThemeToggleIcons() {
        if (!themeToggleButton) return;
        const isLightTheme = appState.currentTheme === 'light';
        const iconClass = isLightTheme ? 'fa-moon' : 'fa-sun';
        themeToggleButton.innerHTML = `<i class="fas ${iconClass}"></i>`;
        themeToggleButton.setAttribute('aria-label', isLightTheme ? 'Activează tema întunecată' : 'Activează tema deschisă');
        if (sidenavThemeToggle) {
            const sidenavText = sidenavThemeToggle.querySelector('span');
            if (sidenavText) sidenavText.textContent = isLightTheme ? ' Activează Întunecat' : ' Activează Deschis';
        }
        if (themeSelectSettings) themeSelectSettings.value = appState.currentTheme;
    }

    function applyTheme() {
        document.body.className = '';
        document.body.classList.add(appState.currentTheme + '-theme');
        if(appState.isSidenavOpen && window.innerWidth < 992) document.body.classList.add('sidenav-active');
        else if (appState.isSidenavOpen && window.innerWidth >= 992) document.body.classList.add('sidenav-active');
        updateThemeToggleIcons();
        saveState();
        if (dashboardView && dashboardView.classList.contains('active-view')) {
            if (typeof Chart !== 'undefined' && dashboardAreasPracticedRadarChartCanvas) renderDashboardRadarChart();
        }
        if (document.getElementById('progress-view') && document.getElementById('progress-view').classList.contains('active-view')) {
            if (typeof Chart !== 'undefined' && progressViewAreasPracticedRadarChartCanvas) renderProgressViewRadarChart();
        }
    }

    function toggleTheme() {
        appState.currentTheme = appState.currentTheme === 'light' ? 'dark' : 'light';
        applyTheme();
    }
    
    // --- STREAK MANAGEMENT ---
    function updateStreak() {
        const today = new Date().toDateString();
        if (appState.lastCompletionDate) {
            const lastDate = new Date(appState.lastCompletionDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate.toDateString() !== yesterday.toDateString() && lastDate.toDateString() !== today) {
                appState.streak = 0;
            }
        } else {
            appState.streak = 0; 
        }
    }

    function incrementStreakOnLessonComplete() {
        const todayString = new Date().toDateString();
        if (appState.lastCompletionDate !== todayString) {
            if (appState.lastCompletionDate) {
                 const lastDate = new Date(appState.lastCompletionDate);
                 const yesterday = new Date();
                 yesterday.setDate(yesterday.getDate() - 1);
                 if(lastDate.toDateString() === yesterday.toDateString()) appState.streak++;
                 else appState.streak = 1;
            } else appState.streak = 1;
            appState.lastCompletionDate = todayString;
        }
        if (!appState.activityDates) appState.activityDates = [];
        if (!appState.activityDates.includes(todayString)) {
            appState.activityDates.push(todayString);
            if (appState.activityDates.length > 60) appState.activityDates.shift();
        }
        saveState();
        updateUI();
        checkAndAwardBadges();
    }

    // --- UI UPDATE FUNCTIONS ---
    function updateUI() {
        if (xpDisplay) xpDisplay.innerHTML = `<i class="fas fa-star"></i> ${appState.xp}`;
        if (streakDisplay) streakDisplay.innerHTML = `<i class="fas fa-fire"></i> ${appState.streak}`;
        
        if (dashboardView && dashboardView.classList.contains('active-view')) {
            if (dashboardXpElement) dashboardXpElement.textContent = appState.xp;
            if (dashboardStreakElement) dashboardStreakElement.textContent = appState.streak;
            if (appState.lessonsData) {
                let totalLessons = 0; let completedLessons = 0;
                appState.lessonsData.modules.forEach(m => {
                    totalLessons += m.lessons.length;
                    m.lessons.forEach(l => { if (appState.lessonProgress[l.id]?.completed) completedLessons++; });
                });
                if (dashboardLessonsCompletedElement) dashboardLessonsCompletedElement.textContent = `${completedLessons} / ${totalLessons}`;
                const totalBadges = appState.lessonsData.badges ? appState.lessonsData.badges.length : 0;
                if (dashboardBadgesEarnedElement) dashboardBadgesEarnedElement.textContent = `${appState.earnedBadges.length} / ${totalBadges}`;
            }
            renderBadgesOnDashboard();
        }
        if (document.getElementById('progress-view') && document.getElementById('progress-view').classList.contains('active-view')) {
            renderProgressView();
        }
    }

    // --- DATA LOADING ---
    async function loadLessonsData() {
        if (loadingSpinner) loadingSpinner.style.display = 'flex';
        try {
            const response = await fetch('data/lessons.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            appState.lessonsData = await response.json();
            updateUI(); 
            renderDashboard();
            if (sidenavLinks.length > 0 && sidenavLinks[0].dataset.view === 'dashboard-view') {
                sidenavLinks.forEach(sl => sl.classList.remove('active-sidenav-link'));
                sidenavLinks[0].classList.add('active-sidenav-link');
            }
        } catch (error) {
            console.error("Could not load lessons data:", error);
            if (dashboardView) dashboardView.innerHTML += "<p>Eroare la încărcarea datelor lecțiilor.</p>";
        } finally {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
        }
    }

    // --- RENDERING FUNCTIONS ---
    function renderDashboard() {
        if (!dashboardView || !appState.lessonsData) return;
        renderDashboardStatsAndVisuals();
        renderContinueLearningCard();
        renderBadgesOnDashboard();
    }

    function renderDashboardStatsAndVisuals() {
        if (dashboardXpElement) dashboardXpElement.textContent = appState.xp;
        if (dashboardStreakElement) dashboardStreakElement.textContent = appState.streak;
        if (appState.lessonsData) {
            let totalLessons = 0; let completedLessons = 0;
            appState.lessonsData.modules.forEach(m => {
                totalLessons += m.lessons.length;
                m.lessons.forEach(l => { if (appState.lessonProgress[l.id]?.completed) completedLessons++; });
            });
            if (dashboardLessonsCompletedElement) dashboardLessonsCompletedElement.textContent = `${completedLessons} / ${totalLessons}`;
            const totalBadges = appState.lessonsData.badges ? appState.lessonsData.badges.length : 0;
            if (dashboardBadgesEarnedElement) dashboardBadgesEarnedElement.textContent = `${appState.earnedBadges.length} / ${totalBadges}`;
        }
        if (typeof Chart !== 'undefined' && dashboardAreasPracticedRadarChartCanvas) renderDashboardRadarChart();
        if (dashboardStreakCalendarContainer) renderDashboardStreakCalendar();
    }

    function renderContinueLearningCard() {
        if (!continueLessonCardPlaceholder || !appState.lessonsData) {
            if (continueLessonCardPlaceholder) continueLessonCardPlaceholder.innerHTML = '<p class="no-lessons-to-continue">Nu există lecții disponibile.</p>';
            return;
        }
        let lastAccessedLessonInfo = null;
        let firstUnstartedLessonInPath = null;

        for (const lessonIdKey in appState.lessonProgress) {
            const progress = appState.lessonProgress[lessonIdKey];
            if (!progress.completed && progress.exercises) {
                const moduleData = appState.lessonsData.modules.find(m => m.lessons.some(l => l.id === lessonIdKey));
                if (moduleData) {
                    const lessonData = moduleData.lessons.find(l => l.id === lessonIdKey);
                    if (lessonData) {
                        const someNotAttempted = progress.exercises.some(ex => ex.status === 'not_attempted');
                        if (someNotAttempted || !progress.completed) {
                            lastAccessedLessonInfo = { ...lessonData, moduleId: moduleData.id };
                            break; 
                        }
                    }
                }
            }
        }
        
        if (!lastAccessedLessonInfo && appState.lessonsData.learningPaths && appState.lessonsData.learningPaths.length > 0) {
            for (const lp of appState.lessonsData.learningPaths) {
                if (lp.moduleIds && lp.moduleIds.length > 0) {
                    for (const moduleIdInLP of lp.moduleIds) {
                        const moduleData = appState.lessonsData.modules.find(m => m.id === moduleIdInLP);
                        if (moduleData && moduleData.lessons.length > 0) {
                            for (const lesson of moduleData.lessons) {
                                if (!appState.lessonProgress[lesson.id] || !appState.lessonProgress[lesson.id].completed) {
                                    firstUnstartedLessonInPath = { ...lesson, moduleId: moduleData.id, lpTitle: lp.title };
                                    break;
                                }
                            }
                        }
                        if (firstUnstartedLessonInPath) break;
                    }
                }
                if (firstUnstartedLessonInPath) break;
            }
        }

        const lessonToContinue = lastAccessedLessonInfo || firstUnstartedLessonInPath;

        if (lessonToContinue) {
            const lessonCard = document.createElement('div');
            lessonCard.className = 'lesson-card';
            lessonCard.dataset.moduleId = lessonToContinue.moduleId;
            lessonCard.dataset.lessonId = lessonToContinue.id;
            const exercisesInLesson = lessonToContinue.exercises.length;
            let attemptedOrCompletedExercises = 0;
            let lessonProgressPercentage = 0;
            let progressDetailsText = `0 / ${exercisesInLesson} `;
            if (appState.lessonProgress[lessonToContinue.id] && appState.lessonProgress[lessonToContinue.id].exercises) {
                appState.lessonProgress[lessonToContinue.id].exercises.forEach(exProg => {
                    if (exProg.status !== 'not_attempted') attemptedOrCompletedExercises++;
                });
                if (exercisesInLesson > 0) lessonProgressPercentage = (attemptedOrCompletedExercises / exercisesInLesson) * 100;
                progressDetailsText = `${attemptedOrCompletedExercises} / ${exercisesInLesson} `;
            }
             if (appState.lessonProgress[lessonToContinue.id]?.completed) {
                 if (continueLessonCardPlaceholder) continueLessonCardPlaceholder.innerHTML = '<p class="no-lessons-to-continue">Felicitări! Explorează un nou <a href="#learning-paths" data-view="learning-paths-overview-view" class="sidenav-link-inline">Parcurs de Învățare</a>.</p>';
                 const inlineLink = continueLessonCardPlaceholder.querySelector('.sidenav-link-inline');
                 if(inlineLink) inlineLink.addEventListener('click', (e) => { e.preventDefault(); showView('learning-paths-overview-view');});
                 return;
            }
            const progressBarHtml = `<div class="lesson-progress-bar-container" title="${progressDetailsText}"><div class="lesson-progress-bar" style="width: ${lessonProgressPercentage.toFixed(0)}%;">${lessonProgressPercentage > 10 ? `<span class="lesson-progress-percentage">${lessonProgressPercentage.toFixed(0)}%</span>` : ''}</div></div><small class="lesson-progress-text-details">${progressDetailsText} exerciții</small>`;
            let cardTitlePrefix = lessonToContinue.lpTitle ? `Din "${lessonToContinue.lpTitle}":<br>` : '';
            lessonCard.innerHTML = `${cardTitlePrefix}<h4><i class="fas fa-play"></i> ${lessonToContinue.title}</h4><p class="lesson-short-description">${lessonToContinue.short_description || ''}</p>${progressBarHtml}<div class="meta-info"><span class="xp-info"><i class="fas fa-star"></i> ${lessonToContinue.xp} XP</span>${lessonToContinue.estimated_time ? `<span class="time-info"><i class="fas fa-clock"></i> ${lessonToContinue.estimated_time}</span>` : ''}<span class="exercise-count-info"><i class="fas fa-list-ol"></i> ${exercisesInLesson} Exerciții</span></div>`;
            lessonCard.addEventListener('click', () => startLesson(lessonToContinue.moduleId, lessonToContinue.id));
            if (continueLessonCardPlaceholder) { continueLessonCardPlaceholder.innerHTML = ''; continueLessonCardPlaceholder.appendChild(lessonCard); }
        } else {
            if (continueLessonCardPlaceholder) continueLessonCardPlaceholder.innerHTML = '<p class="no-lessons-to-continue">Nicio lecție de continuat. Explorează un <a href="#learning-paths" data-view="learning-paths-overview-view" class="sidenav-link-inline">Parcurs de Învățare</a> pentru a începe!</p>';
            const inlineLink = continueLessonCardPlaceholder.querySelector('.sidenav-link-inline');
            if(inlineLink) inlineLink.addEventListener('click', (e) => { e.preventDefault(); showView('learning-paths-overview-view');});
        }
    }

    function renderBadgesOnDashboard(targetContainer = null) {
        const badgeListContainer = targetContainer || (dashboardBadgesContainer ? dashboardBadgesContainer.querySelector('.badge-list') : null);
        if (!badgeListContainer) return;
        badgeListContainer.innerHTML = '';
        if (!appState.lessonsData || !appState.lessonsData.badges) { badgeListContainer.innerHTML = "<p>Nicio recompensă.</p>"; return; }
        const badgesToDisplay = appState.lessonsData.badges;
        if (badgesToDisplay.length === 0) { badgeListContainer.innerHTML = "<p>Nicio recompensă.</p>"; return; }
        const earnedBadgesOnTop = [...badgesToDisplay].sort((a, b) => {
            const aEarned = appState.earnedBadges.includes(a.id);
            const bEarned = appState.earnedBadges.includes(b.id);
            return bEarned - aEarned;
        });
        earnedBadgesOnTop.slice(0, 5).forEach(badgeData => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge';
            const isEarned = appState.earnedBadges.includes(badgeData.id);
            if(isEarned) badgeElement.classList.add('earned');
            badgeElement.innerHTML = `<i class="${badgeData.icon_class_fallback || 'fas fa-medal'}"></i><span class="badge-name">${badgeData.name}</span>`;
            badgeElement.title = isEarned ? `${badgeData.name}: ${badgeData.description}` : `Blocat: ${badgeData.name} - ${badgeData.description}`;
            if (!isEarned) badgeElement.style.opacity = "0.6";
            badgeListContainer.appendChild(badgeElement);
        });
        if (badgesToDisplay.length > 5 && badgeListContainer.parentElement.id === 'dashboard-badges-container') { // Adaugă link doar pe dashboard
            const seeAllLink = document.createElement('a');
            seeAllLink.href = "#recompense-nav";
            seeAllLink.classList.add('button-like', 'button-subtle', 'see-all-badges-link');
            seeAllLink.dataset.view = 'badges-view';
            seeAllLink.innerHTML = 'Vezi Toate <i class="fas fa-arrow-right"></i>';
            seeAllLink.addEventListener('click', (e) => {
                e.preventDefault(); showView('badges-view');
                sidenavLinks.forEach(sl => sl.classList.remove('active-sidenav-link'));
                const targetLink = document.querySelector('.sidenav-link[data-view="badges-view"]');
                if (targetLink) targetLink.classList.add('active-sidenav-link');
            });
            badgeListContainer.appendChild(seeAllLink);
        }
    }
    
    function renderAllBadgesView() {
        const allBadgesListContainer = document.querySelector('#badges-view .all-badges-list-container');
        if (!allBadgesListContainer) return;
        allBadgesListContainer.innerHTML = '';
        if (!appState.lessonsData || !appState.lessonsData.badges) {
            allBadgesListContainer.innerHTML = "<p>Nicio recompensă.</p>"; return;
        }
        const badgesToDisplay = appState.lessonsData.badges;
        if (badgesToDisplay.length === 0) { allBadgesListContainer.innerHTML = "<p>Nicio recompensă.</p>"; return; }
        const listElement = document.createElement('div');
        listElement.className = 'badge-list'; // Refolosim stilul
        badgesToDisplay.forEach(badgeData => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge';
            const isEarned = appState.earnedBadges.includes(badgeData.id);
            if(isEarned) badgeElement.classList.add('earned');
            badgeElement.innerHTML = `<i class="${badgeData.icon_class_fallback || 'fas fa-medal'}"></i><span class="badge-name">${badgeData.name}</span><p class="badge-description-small">${isEarned ? badgeData.description : '<em>Blocat</em>'}</p>`;
            badgeElement.title = isEarned ? `${badgeData.name}: ${badgeData.description}` : `Blocat: ${badgeData.name} - ${badgeData.description}`;
            if (!isEarned) badgeElement.style.opacity = "0.6";
            listElement.appendChild(badgeElement);
        });
        allBadgesListContainer.appendChild(listElement);
    }

    function renderMyCoursesView(searchTerm = '') {
        if (!myCoursesContainer) return;
        myCoursesContainer.innerHTML = '';
        if (!appState.lessonsData || !appState.lessonsData.modules || appState.lessonsData.modules.length === 0) {
            myCoursesContainer.innerHTML = "<p>Nu există cursuri (module) disponibile momentan.</p>";
            return;
        }
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const modulesToDisplay = appState.lessonsData.modules.filter(module => 
            module.title.toLowerCase().includes(lowerSearchTerm) || 
            module.description.toLowerCase().includes(lowerSearchTerm)
        );

        if (modulesToDisplay.length === 0 && lowerSearchTerm) {
            myCoursesContainer.innerHTML = `<p class="no-search-results">Niciun modul găsit pentru "${searchTerm}".</p>`;
            return;
        }
        if (modulesToDisplay.length === 0 && !lowerSearchTerm) {
            myCoursesContainer.innerHTML = "<p>Nu există module disponibile.</p>";
            return;
        }

        const allMyCourseLessonCards = [];
        modulesToDisplay.forEach(module => {
            const moduleElement = document.createElement('div');
            moduleElement.className = 'module';
            const moduleIconHtml = module.icon ? `<i class="${module.icon}"></i>` : '';
            let completedLessonsInModule = 0;
            module.lessons.forEach(lesson => { if (appState.lessonProgress[lesson.id]?.completed) completedLessonsInModule++; });
            const totalLessonsInModule = module.lessons.length;
            const progressPercentage = totalLessonsInModule > 0 ? (completedLessonsInModule / totalLessonsInModule) * 100 : 0;
            moduleElement.innerHTML = `<h3>${moduleIconHtml} ${module.title}</h3><p>${module.description}</p><div class="module-progress-summary"><strong>Progres Modul:</strong> ${completedLessonsInModule} din ${totalLessonsInModule} lecții completate.</div><div class="progress-bar-container"><div class="progress-bar" style="width: ${progressPercentage.toFixed(0)}%;">${progressPercentage.toFixed(0)}%</div></div><h4>Lecții în acest modul:</h4><div class="lesson-cards-container" id="my-courses-module-lessons-${module.id}"></div>`;
            myCoursesContainer.appendChild(moduleElement);
            const lessonCardsContainer = moduleElement.querySelector(`#my-courses-module-lessons-${module.id}`);
            if (lessonCardsContainer) {
                module.lessons.forEach(lesson => {
                    const lessonCard = document.createElement('div');
                    lessonCard.className = 'lesson-card';
                    lessonCard.dataset.moduleId = module.id;
                    lessonCard.dataset.lessonId = lesson.id;
                    const isCompleted = appState.lessonProgress[lesson.id]?.completed;
                    const lessonCompletionIcon = isCompleted ? '<i class="fas fa-check-circle"></i>' : '';
                    let lessonProgressPercentage = 0; let exercisesInLesson = lesson.exercises.length; let attemptedOrCompletedExercises = 0; let progressDetailsText = `0 / ${exercisesInLesson} `;
                    if (appState.lessonProgress[lesson.id] && appState.lessonProgress[lesson.id].exercises) {
                        appState.lessonProgress[lesson.id].exercises.forEach(exProg => { if (exProg.status !== 'not_attempted') attemptedOrCompletedExercises++; });
                        if (exercisesInLesson > 0) lessonProgressPercentage = (attemptedOrCompletedExercises / exercisesInLesson) * 100;
                        progressDetailsText = `${attemptedOrCompletedExercises} / ${exercisesInLesson} `;
                    }
                    if (isCompleted) { lessonProgressPercentage = 100; progressDetailsText = `${exercisesInLesson} / ${exercisesInLesson} `; }
                    const progressBarHtml = `<div class="lesson-progress-bar-container" title="${progressDetailsText}"><div class="lesson-progress-bar" style="width: ${lessonProgressPercentage.toFixed(0)}%;">${lessonProgressPercentage > 10 ? `<span class="lesson-progress-percentage">${lessonProgressPercentage.toFixed(0)}%</span>` : ''}</div></div><small class="lesson-progress-text-details">${progressDetailsText} exerciții</small>`;
                    lessonCard.innerHTML = `<h4><i class="fas fa-book-reader"></i> ${lesson.title} ${lessonCompletionIcon}</h4><p class="lesson-short-description">${lesson.short_description || ''}</p>${progressBarHtml}<div class="meta-info"><span class="xp-info"><i class="fas fa-star"></i> ${lesson.xp} XP</span>${lesson.estimated_time ? `<span class="time-info"><i class="fas fa-clock"></i> ${lesson.estimated_time}</span>` : ''}<span class="exercise-count-info"><i class="fas fa-list-ol"></i> ${exercisesInLesson} Exerciții</span></div>`;
                    lessonCard.addEventListener('click', () => startLesson(module.id, lesson.id));
                    lessonCardsContainer.appendChild(lessonCard);
                    allMyCourseLessonCards.push(lessonCard);
                });
            }
        });
        if (allMyCourseLessonCards.length > 0 && typeof anime !== 'undefined') {
            allMyCourseLessonCards.forEach(card => { card.style.opacity = '0'; card.style.transform = 'translateY(15px)'; });
            anime({ targets: allMyCourseLessonCards, translateY: 0, opacity: 1, delay: anime.stagger(70, { start: 50 }), duration: 500, easing: 'easeOutCubic', complete: (anim) => anim.animatables.forEach(a => { a.target.style.opacity = ''; a.target.style.transform = ''; }) });
        }
    }

    function renderProgressView() {
        if (!appState.lessonsData) {
            if (progressViewModulesDetailedContainer) progressViewModulesDetailedContainer.innerHTML = "<p>Datele nu sunt disponibile.</p>";
            return;
        }
        if (progressViewXpElement) progressViewXpElement.textContent = appState.xp;
        if (progressViewStreakElement) progressViewStreakElement.textContent = appState.streak;
        let totalLessons = 0; let completedLessons = 0;
        appState.lessonsData.modules.forEach(m => { totalLessons += m.lessons.length; m.lessons.forEach(l => { if (appState.lessonProgress[l.id]?.completed) completedLessons++; }); });
        if (progressViewLessonsCompletedElement) progressViewLessonsCompletedElement.textContent = `${completedLessons} / ${totalLessons}`;
        const totalBadges = appState.lessonsData.badges ? appState.lessonsData.badges.length : 0;
        if (progressViewBadgesEarnedElement) progressViewBadgesEarnedElement.textContent = `${appState.earnedBadges.length} / ${totalBadges}`;

        if (progressViewModulesDetailedContainer) {
            const modulesTitle = progressViewModulesDetailedContainer.querySelector('h3');
            progressViewModulesDetailedContainer.innerHTML = '';
            if(modulesTitle) progressViewModulesDetailedContainer.appendChild(modulesTitle);
            if (!appState.lessonsData.modules || appState.lessonsData.modules.length === 0) {
                progressViewModulesDetailedContainer.innerHTML += "<p>Nu există module.</p>";
            } else {
                appState.lessonsData.modules.forEach(module => {
                    const moduleElement = document.createElement('div');
                    moduleElement.className = 'module';
                    const moduleIconHtml = module.icon ? `<i class="${module.icon}"></i>` : '';
                    let completedInModule = 0;
                    module.lessons.forEach(l => { if (appState.lessonProgress[l.id]?.completed) completedInModule++; });
                    const totalInModule = module.lessons.length;
                    const progressPerc = totalInModule > 0 ? (completedInModule / totalInModule) * 100 : 0;
                    moduleElement.innerHTML = `<h3>${moduleIconHtml} ${module.title}</h3><div class="module-progress-summary">${completedInModule} / ${totalInModule} lecții.</div><div class="progress-bar-container"><div class="progress-bar" style="width: ${progressPerc.toFixed(0)}%;">${progressPerc.toFixed(0)}%</div></div>`;
                    // Aici se pot adăuga detalii despre fiecare lecție din modul
                    progressViewModulesDetailedContainer.appendChild(moduleElement);
                });
            }
        }
        if (typeof Chart !== 'undefined' && progressViewAreasPracticedRadarChartCanvas) renderProgressViewRadarChart();
        if (progressViewStreakCalendarContainer) renderProgressViewStreakCalendar();
    }

    function renderDashboardRadarChart() {
        if (!dashboardAreasPracticedRadarChartCanvas || !appState.lessonsData || !appState.lessonsData.modules || typeof Chart === 'undefined') return;
        const labels = []; const dataCompleted = [];
        appState.lessonsData.modules.forEach(module => {
            labels.push(module.title.substring(0, 15) + (module.title.length > 15 ? '...' : ''));
            let completedInModule = 0;
            module.lessons.forEach(lesson => { if (appState.lessonProgress[lesson.id]?.completed) completedInModule++; });
            dataCompleted.push(completedInModule);
        });
        if (dashboardRadarChartInstance) dashboardRadarChartInstance.destroy();
        const isDarkTheme = appState.currentTheme === 'dark';
        const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
        const ticksColor = isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        const pointLabelColor = isDarkTheme ? '#f9fafb' : '#1f2937';
        dashboardRadarChartInstance = new Chart(dashboardAreasPracticedRadarChartCanvas, {
            type: 'radar',
            data: { labels: labels, datasets: [{ label: 'Lecții Completate', data: dataCompleted, fill: true, backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.4)', borderColor: isDarkTheme ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)', pointBackgroundColor: isDarkTheme ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: isDarkTheme ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)' }] },
            options: { responsive: true, maintainAspectRatio: false, elements: { line: { borderWidth: 2 }}, scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: pointLabelColor, font: { size: 10 }}, ticks: { color: ticksColor, backdropColor: 'transparent', stepSize: 1 }, suggestedMin: 0 }}, plugins: { legend: { display: false }}}
        });
    }
    
    function renderProgressViewRadarChart() {
        if (!progressViewAreasPracticedRadarChartCanvas || !appState.lessonsData || !appState.lessonsData.modules || typeof Chart === 'undefined') return;
        const labels = []; const dataCompleted = [];
        appState.lessonsData.modules.forEach(module => {
            labels.push(module.title); // Nume complete aici
            let completedInModule = 0;
            module.lessons.forEach(lesson => { if (appState.lessonProgress[lesson.id]?.completed) completedInModule++; });
            dataCompleted.push(completedInModule);
        });
        if (progressViewRadarChartInstance) progressViewRadarChartInstance.destroy();
        const isDarkTheme = appState.currentTheme === 'dark';
        const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
        const ticksColor = isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        const pointLabelColor = isDarkTheme ? '#f9fafb' : '#1f2937';
        progressViewRadarChartInstance = new Chart(progressViewAreasPracticedRadarChartCanvas, {
            type: 'radar',
            data: { labels: labels, datasets: [{ label: 'Lecții Completate', data: dataCompleted, fill: true, backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.4)', borderColor: isDarkTheme ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)', pointBackgroundColor: isDarkTheme ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: isDarkTheme ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)' }] },
            options: { responsive: true, maintainAspectRatio: false, elements: { line: { borderWidth: 2 }}, scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: pointLabelColor, font: { size: 11 }}, ticks: { color: ticksColor, backdropColor: 'transparent', stepSize: 1 }, suggestedMin: 0 }}, plugins: { legend: { position: 'top', labels: {color: pointLabelColor} }}}
        });
    }

    function renderStreakCalendar(container) {
        if (!container) return;
        container.innerHTML = '';
        const daysOfWeek = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        daysOfWeek.forEach(day => { const dayHeader = document.createElement('span'); dayHeader.textContent = day; headerRow.appendChild(dayHeader); });
        container.appendChild(headerRow);
        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (6*7 -1) ); // Afișăm ~6 săptămâni
        let firstDayOfMonthShown = new Date(endDate);
        firstDayOfMonthShown.setDate(1);
        let firstDayDisplay = new Date(firstDayOfMonthShown);
        firstDayDisplay.setDate(1 - (firstDayOfMonthShown.getDay() === 0 ? 6 : firstDayOfMonthShown.getDay() - 1));
        for (let i = 0; i < 6 * 7; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            const currentDateIterator = new Date(firstDayDisplay);
            currentDateIterator.setDate(firstDayDisplay.getDate() + i);
            dayCell.textContent = currentDateIterator.getDate();
            const dateString = currentDateIterator.toDateString();
            if (currentDateIterator.getMonth() !== endDate.getMonth()) dayCell.classList.add('empty');
            if (appState.activityDates && appState.activityDates.includes(dateString)) dayCell.classList.add('active-streak');
            if (dateString === today.toDateString()) dayCell.classList.add('today');
            dayCell.title = dateString;
            container.appendChild(dayCell);
        }
    }
    function renderDashboardStreakCalendar() { renderStreakCalendar(dashboardStreakCalendarContainer); }
    function renderProgressViewStreakCalendar() { renderStreakCalendar(progressViewStreakCalendarContainer); }
    
    function renderLearningPathsOverview(searchTerm = '') {
        if (!learningPathsContainer) return;
        learningPathsContainer.innerHTML = '';

        if (!appState.lessonsData || !appState.lessonsData.learningPaths || appState.lessonsData.learningPaths.length === 0) {
            learningPathsContainer.innerHTML = "<p>Niciun parcurs de învățare disponibil momentan.</p>";
            return;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const pathsToDisplay = appState.lessonsData.learningPaths.filter(lp =>
            lp.title.toLowerCase().includes(lowerSearchTerm) ||
            lp.short_description.toLowerCase().includes(lowerSearchTerm)
        );

        if (pathsToDisplay.length === 0 && lowerSearchTerm) {
            learningPathsContainer.innerHTML = `<p class="no-search-results">Niciun parcurs găsit pentru "${searchTerm}".</p>`;
            return;
        }
         if (pathsToDisplay.length === 0 && !lowerSearchTerm) { // Cazul când nu există LP-uri deloc
            learningPathsContainer.innerHTML = "<p>Niciun parcurs de învățare disponibil momentan.</p>";
            return;
        }


        const lpCardsToAnimate = [];
        pathsToDisplay.forEach(lp => {
            const lpCard = document.createElement('div');
            lpCard.className = 'lp-card';
            lpCard.dataset.lpId = lp.id;
            const moduleCount = lp.moduleIds ? lp.moduleIds.length : 0;
            lpCard.innerHTML = `
                <div class="lp-card-header">
                    <i class="${lp.icon_class || 'fas fa-road'}"></i>
                    <h3 class="lp-card-title">${lp.title}</h3>
                </div>
                <p class="lp-card-description">${lp.short_description || 'Explorați acest parcurs de învățare.'}</p>
                <div class="lp-card-meta">
                    <span><i class="fas fa-cubes"></i> ${moduleCount} Module</span>
                    <span><i class="fas fa-signal"></i> ${lp.difficulty || 'Nespecificat'}</span>
                </div>
            `;
            lpCard.addEventListener('click', () => showLearningPathDetail(lp.id));
            learningPathsContainer.appendChild(lpCard);
            lpCardsToAnimate.push(lpCard);
        });

        if (lpCardsToAnimate.length > 0 && typeof anime !== 'undefined') {
            lpCardsToAnimate.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95) translateY(10px)';
            });
            anime({
                targets: lpCardsToAnimate, translateY: 0, scale: 1, opacity: 1,
                delay: anime.stagger(100), duration: 500, easing: 'easeOutBack',
                complete: (anim) => anim.animatables.forEach(a => { a.target.style.opacity = ''; a.target.style.transform = ''; })
            });
        }
    }

    function showLearningPathDetail(lpId) {
        appState.currentLearningPathId = lpId;
        const learningPath = appState.lessonsData.learningPaths.find(lp => lp.id === lpId);

        if (!learningPath || !learningPathDetailView) {
            console.error("Learning path sau view-ul de detaliu nu a fost găsit:", lpId);
            showView('learning-paths-overview-view');
            return;
        }

        showView('learning-path-detail-view');

        if (lpDetailTitle) lpDetailTitle.textContent = learningPath.title;
        if (lpDetailDifficulty) lpDetailDifficulty.innerHTML = `<i class="fas fa-signal"></i> ${learningPath.difficulty || 'Nespecificat'}`;
        if (lpDetailModulesCount) lpDetailModulesCount.innerHTML = `<i class="fas fa-cubes"></i> ${learningPath.moduleIds ? learningPath.moduleIds.length : 0} Module`;
        if (lpDetailEstimatedTime) lpDetailEstimatedTime.innerHTML = `<i class="fas fa-clock"></i> ${learningPath.estimated_total_time || 'Nespecificat'}`;
        if (lpDetailLongDescription) lpDetailLongDescription.textContent = learningPath.long_description || '';
        
        if (enrollLpButton) {
            enrollLpButton.onclick = () => {
                if (learningPath.moduleIds && learningPath.moduleIds.length > 0) {
                    // Găsește prima lecție necompletată din acest LP
                    let firstLessonToStart = null;
                    for (const moduleId of learningPath.moduleIds) {
                        const moduleData = appState.lessonsData.modules.find(m => m.id === moduleId);
                        if (moduleData && moduleData.lessons.length > 0) {
                            for (const lesson of moduleData.lessons) {
                                if (!appState.lessonProgress[lesson.id]?.completed) {
                                    firstLessonToStart = { moduleId: moduleData.id, lessonId: lesson.id };
                                    break;
                                }
                            }
                        }
                        if (firstLessonToStart) break;
                    }

                    if (firstLessonToStart) {
                        startLesson(firstLessonToStart.moduleId, firstLessonToStart.lessonId);
                    } else { // Toate lecțiile din LP sunt completate, poate duce la prima lecție pentru revizuire
                        const firstModuleId = learningPath.moduleIds[0];
                        const firstModule = appState.lessonsData.modules.find(m => m.id === firstModuleId);
                        if (firstModule && firstModule.lessons.length > 0) {
                            startLesson(firstModule.id, firstModule.lessons[0].id);
                        } else {
                             alert("Acest parcurs nu are încă module sau lecții definite.");
                        }
                    }
                } else {
                     alert("Acest parcurs nu are module definite.");
                }
            };
        }

        if (lpDetailModulesContainer) {
            lpDetailModulesContainer.innerHTML = '';
            if (learningPath.moduleIds && appState.lessonsData.modules) {
                learningPath.moduleIds.forEach(moduleId => {
                    const moduleData = appState.lessonsData.modules.find(m => m.id === moduleId);
                    if (moduleData) {
                        const moduleCard = document.createElement('div');
                        moduleCard.className = 'module-card-in-lp';
                        moduleCard.dataset.moduleId = moduleId;
                        let allLessonsInModuleCompleted = true;
                        if (moduleData.lessons.length === 0) allLessonsInModuleCompleted = false;
                        moduleData.lessons.forEach(lesson => {
                            if (!appState.lessonProgress[lesson.id]?.completed) allLessonsInModuleCompleted = false;
                        });
                        const completionIcon = allLessonsInModuleCompleted ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>';
                        moduleCard.innerHTML = `<i class="${moduleData.icon || 'fas fa-cube'} module-icon"></i><span class="module-title-in-lp">${moduleData.title}</span><span class="module-completion-status-lp ${allLessonsInModuleCompleted ? 'completed' : ''}">${completionIcon}</span>`;
                        moduleCard.addEventListener('click', () => {
                            // Navighează la prima lecție a modulului selectat
                            if (moduleData.lessons.length > 0) {
                                startLesson(moduleData.id, moduleData.lessons[0].id);
                            }
                        });
                        lpDetailModulesContainer.appendChild(moduleCard);
                    }
                });
            }
        }

        if (lpDetailBadgesContainer) {
            lpDetailBadgesContainer.innerHTML = '';
            if (learningPath.relatedBadgeIds && appState.lessonsData.badges) {
                learningPath.relatedBadgeIds.forEach(badgeId => {
                    const badgeData = appState.lessonsData.badges.find(b => b.id === badgeId);
                    if (badgeData) {
                        const badgeElement = document.createElement('div');
                        badgeElement.className = 'badge';
                        const isEarned = appState.earnedBadges.includes(badgeData.id);
                        if(isEarned) badgeElement.classList.add('earned');
                        badgeElement.innerHTML = `<i class="${badgeData.icon_class_fallback || 'fas fa-medal'}"></i><span class="badge-name">${badgeData.name}</span>`;
                        badgeElement.title = isEarned ? `${badgeData.name}: ${badgeData.description}` : `Blocat: ${badgeData.name} - ${badgeData.description}`;
                         if (!isEarned) badgeElement.style.opacity = "0.6";
                        lpDetailBadgesContainer.appendChild(badgeElement);
                    }
                });
            }
        }
    }
    
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active-view');
            const firstHeading = targetView.querySelector('h2');
            if (firstHeading) { firstHeading.setAttribute('tabindex', '-1'); firstHeading.focus(); }
            else { targetView.setAttribute('tabindex', '-1'); targetView.focus(); }
        } else {
            console.warn(`View ${viewId} negăsit.`);
            const fallbackView = document.getElementById('dashboard-view');
            if(fallbackView) {
                fallbackView.classList.add('active-view');
                const firstHeading = fallbackView.querySelector('h2');
                if (firstHeading) { firstHeading.setAttribute('tabindex', '-1'); firstHeading.focus(); }
            }
        }
        sidenavLinks.forEach(link => {
            link.classList.remove('active-sidenav-link');
            if (link.dataset.view === viewId) link.classList.add('active-sidenav-link');
        });

        if (viewId === 'dashboard-view') renderDashboard();
        else if (viewId === 'courses-view') renderMyCoursesView(myCoursesSearchInput ? myCoursesSearchInput.value : '');
        else if (viewId === 'progress-view') renderProgressView();
        else if (viewId === 'badges-view') renderAllBadgesView();
        else if (viewId === 'learning-paths-overview-view') renderLearningPathsOverview(lpSearchInput ? lpSearchInput.value : '');
    }

    function startLesson(moduleId, lessonId) {
        appState.currentModuleId = moduleId;
        appState.currentLessonId = lessonId;
        appState.currentExerciseIndex = 0;
        showView('lesson-view'); // showView se ocupă de focus pe h2
        loadCurrentExercise(); // loadCurrentExercise se va ocupa de focus pe primul element din exercițiu
    }

    function getCurrentLesson() {
        if (!appState.lessonsData || !appState.lessonsData.modules) return null;
        const module = appState.lessonsData.modules.find(m => m.id === appState.currentModuleId);
        return module ? module.lessons.find(l => l.id === appState.currentLessonId) : null;
    }

    function getCurrentExercise() {
        const lesson = getCurrentLesson();
        return lesson ? lesson.exercises[appState.currentExerciseIndex] : null;
    }

    function loadCurrentExercise() {
        const exercise = getCurrentExercise();
        const lesson = getCurrentLesson();
        if (!exercise || !lesson) { console.error("Lecție/Exercițiu negăsit."); finishLesson(); return; }

        if (lessonTitleElement) lessonTitleElement.textContent = lesson.title;
        if (lessonContentElement) lessonContentElement.innerHTML = '';
        if (feedbackContainer) { feedbackContainer.style.display = 'none'; feedbackContainer.className = ''; }
        if (nextExerciseButton) { nextExerciseButton.style.display = 'none'; nextExerciseButton.disabled = false; }

        if (!appState.lessonProgress[lesson.id]) {
            appState.lessonProgress[lesson.id] = {
                completed: false, score: 0,
                exercises: lesson.exercises.map((ex, index) => ({
                    id: ex.id || `ex_${index}`, type: ex.type, status: 'not_attempted',
                    userAnswer: null, xpAwarded: false
                }))
            };
        }

        let exerciseHtml = `<div class="exercise-header"><h3>Exercițiul ${appState.currentExerciseIndex + 1} din ${lesson.exercises.length}</h3></div>`;
        switch (exercise.type) {
             case 'info':
                exerciseHtml += `<div class="exercise-info"><p>${exercise.text}</p>${exercise.image ? `<img src="${exercise.image}" alt="Material vizual" onerror="this.style.display='none';">` : ''}</div>`;
                if (lessonContentElement) lessonContentElement.innerHTML = exerciseHtml;
                if (nextExerciseButton) { nextExerciseButton.textContent = "Am înțeles"; nextExerciseButton.style.display = 'block'; nextExerciseButton.onclick = () => proceedToNextExercise(); }
                break;
            case 'multiple_choice':
                exerciseHtml += `<p class="question-text">${exercise.question}</p>${exercise.image ? `<img src="${exercise.image}" alt="Întrebare vizuală" class="exercise-image" onerror="this.style.display='none';">` : ''}<div class="options-container">`;
                exercise.options.forEach(opt => exerciseHtml += `<button class="option-button" data-value="${opt.value !== undefined ? opt.value : opt.text}">${opt.text}</button>`);
                exerciseHtml += `</div>`;
                if (lessonContentElement) lessonContentElement.innerHTML = exerciseHtml;
                lessonContentElement.querySelectorAll('.option-button').forEach(b => b.addEventListener('click', () => {
                    lessonContentElement.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
                    b.classList.add('selected');
                    handleAnswer(b.dataset.value);
                }));
                break;
            case 'fill_in_the_blank':
                exerciseHtml += `<p class="question-text">${exercise.question}</p><div class="fill-blank-container">${exercise.beforeText || ''}<input type="text" id="fill-blank-input" placeholder="${exercise.placeholder || "..."}" autocomplete="off">${exercise.afterText || ''}<button id="submit-fill-blank" class="button-like">Verifică</button></div>`;
                if (lessonContentElement) lessonContentElement.innerHTML = exerciseHtml;
                const fbi = document.getElementById('fill-blank-input');
                const sfb = document.getElementById('submit-fill-blank');
                if(sfb && fbi) sfb.addEventListener('click', () => handleAnswer(fbi.value.trim()));
                if(fbi && sfb) fbi.addEventListener('keypress', e => { if (e.key === 'Enter') sfb.click(); });
                break;
            case 'drag_drop_words':
                exerciseHtml += `<p class="question-text">${exercise.question}</p><p class="instruction-text"><small>Trage cuvintele pentru a forma propoziția corectă.</small></p><div id="draggable-source" class="draggable-words-container sortable-list">`;
                [...exercise.words].sort(() => Math.random() - 0.5).forEach(w => exerciseHtml += `<div class="draggable-word" draggable="true">${w}</div>`);
                exerciseHtml += `</div><h4 class="drop-area-label">Propoziția formată:</h4><div id="drop-target" class="drop-target-area sortable-list"></div><button id="submit-drag-drop" class="button-like">Verifică Ordinea</button>`;
                if (lessonContentElement) lessonContentElement.innerHTML = exerciseHtml;
                const srcCont = document.getElementById('draggable-source'), tgtCont = document.getElementById('drop-target');
                if (typeof Sortable !== 'undefined' && srcCont && tgtCont) {
                    new Sortable(srcCont, { group: 'sharedDragDrop', animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag' });
                    new Sortable(tgtCont, { group: 'sharedDragDrop', animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag' });
                } else console.warn("SortableJS sau container lipsă.");
                const sddb = document.getElementById('submit-drag-drop');
                if(sddb && tgtCont) sddb.addEventListener('click', () => handleAnswer(Array.from(tgtCont.children).map(el => el.textContent.trim())));
                break;
            case 'interactive_lab':
                exerciseHtml += `<div class="lab-description"><h4>${exercise.title || 'Laborator Interactiv'}</h4><p>${exercise.description || 'Explorați acest laborator interactiv.'}</p></div>`;
                if (exercise.lab_url) exerciseHtml += `<div class="open-lab-button-container"><button id="open-interactive-lab-button" class="button-like button-primary"><i class="fas fa-external-link-alt"></i> Deschide Laboratorul într-un Tab Nou</button></div>`;
                else exerciseHtml += "<p>URL-ul laboratorului nu este configurat.</p>";
                if (exercise.guidance && exercise.guidance.length > 0) {
                    exerciseHtml += `<div class="lab-guidance"><h4>Ghid de Utilizare / Întrebări:</h4><ul>`;
                    exercise.guidance.forEach(g => exerciseHtml += `<li>${g}</li>`);
                    exerciseHtml += `</ul></div>`;
                }
                if (lessonContentElement) lessonContentElement.innerHTML = exerciseHtml;
                const olb = document.getElementById('open-interactive-lab-button');
                if (olb && exercise.lab_url) olb.addEventListener('click', () => {
                    const lw = window.open(exercise.lab_url, '_blank');
                    if (lw) lw.focus(); else alert('Vă rugăm să permiteți ferestrele pop-up pentru a deschide laboratorul.');
                });
                if (nextExerciseButton) { nextExerciseButton.textContent = "Am terminat explorarea"; nextExerciseButton.style.display = 'block'; nextExerciseButton.onclick = () => proceedToNextExercise(); }
                break;
            default:
                if (lessonContentElement) lessonContentElement.innerHTML = `<p>Tip de exercițiu '${exercise.type}' necunoscut.</p>`;
                if (nextExerciseButton) { nextExerciseButton.textContent = "Continuă"; nextExerciseButton.style.display = 'block'; nextExerciseButton.onclick = () => proceedToNextExercise(); }
        }

        const firstFocusable = lessonContentElement.querySelector('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
        else if (nextExerciseButton && nextExerciseButton.style.display === 'block' && !nextExerciseButton.disabled) nextExerciseButton.focus();
        else if (lessonTitleElement) lessonTitleElement.focus();
    }

    function handleAnswer(userAnswer) {
        const exercise = getCurrentExercise();
        if (!exercise) return;
        let isCorrect = false;
        if (lessonContentElement) {
            lessonContentElement.querySelectorAll('button:not(#next-exercise-button):not(.option-button.selected), input').forEach(el => el.disabled = true);
            lessonContentElement.querySelectorAll('.option-button:not(.selected)').forEach(btn => btn.disabled = true);
            if (exercise.type === 'drag_drop_words' && typeof Sortable !== 'undefined') {
                const src = document.getElementById('draggable-source'), tgt = document.getElementById('drop-target');
                if (src && Sortable.get(src)) Sortable.get(src).option('disabled', true);
                if (tgt && Sortable.get(tgt)) Sortable.get(tgt).option('disabled', true);
            }
        }

        if (exercise.type === 'drag_drop_words') isCorrect = userAnswer.length === exercise.correctOrder.length && userAnswer.every((w, i) => w.toLowerCase() === exercise.correctOrder[i].toLowerCase());
        else if (exercise.type === 'multiple_choice') isCorrect = userAnswer.toLowerCase() === String(exercise.answer).toLowerCase();
        else if (exercise.type === 'fill_in_the_blank') isCorrect = exercise.answer.some(ans => ans.toLowerCase() === userAnswer.toLowerCase());
        
        const currentLp = appState.lessonProgress[appState.currentLessonId];
        if (currentLp && currentLp.exercises && currentLp.exercises[appState.currentExerciseIndex]) {
            const exProg = currentLp.exercises[appState.currentExerciseIndex];
            exProg.userAnswer = userAnswer;
            if (exercise.type === 'info' || exercise.type === 'interactive_lab') exProg.status = 'attempted';
            else exProg.status = isCorrect ? 'correct' : 'incorrect';
            if (isCorrect && exercise.type !== 'info' && exercise.type !== 'interactive_lab' && !exProg.xpAwarded) exProg.xpAwarded = true;
        }

        if (feedbackContainer && feedbackText && feedbackExplanation) {
            feedbackContainer.style.display = 'block';
            feedbackContainer.className = 'feedback-visible';
            if (isCorrect && (exercise.type !== 'info' && exercise.type !== 'interactive_lab')) {
                feedbackText.innerHTML = `<i class="fas fa-check-circle"></i> Corect!`;
                feedbackContainer.classList.add('correct'); feedbackContainer.classList.remove('incorrect');
                if (typeof anime !== 'undefined') anime({ targets: feedbackContainer, scale: [0.9, 1], opacity: [0.5, 1], duration: 400, easing: 'easeOutExpo' });
            } else if (!isCorrect && (exercise.type !== 'info' && exercise.type !== 'interactive_lab')) {
                feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> Greșit.`;
                feedbackContainer.classList.add('incorrect'); feedbackContainer.classList.remove('correct');
                if (typeof anime !== 'undefined') anime({ targets: feedbackContainer, translateX: [{value: -6, duration:50}, {value: 6, duration:50}, {value: -4, duration:50}, {value: 4, duration:50}, {value: 0, duration:50}], easing: 'easeInOutSine', loop: 2 });
            } else {
                 feedbackContainer.style.display = 'none';
            }
            feedbackExplanation.textContent = exercise.explanation || '';
        }
        if (nextExerciseButton) { nextExerciseButton.textContent = "Continuă"; nextExerciseButton.style.display = 'block'; nextExerciseButton.disabled = false; nextExerciseButton.onclick = () => proceedToNextExercise(); }
        saveState();
    }

    function proceedToNextExercise() {
        const lesson = getCurrentLesson();
        if (!lesson) { finishLesson(); return; }
        if (appState.currentExerciseIndex < lesson.exercises.length - 1) {
            appState.currentExerciseIndex++;
            loadCurrentExercise();
        } else {
            finishLesson();
        }
    }

    function finishLesson() {
        const lesson = getCurrentLesson();
        if (!lesson) { showView('dashboard-view'); return; }
        const currentLp = appState.lessonProgress[lesson.id];
        if (currentLp && !currentLp.completed) {
            let correct = 0, attemptedNonInfo = 0, totalNonInfo = 0;
            currentLp.exercises.forEach(ex => {
                if (ex.type !== 'info' && ex.type !== 'interactive_lab') {
                    totalNonInfo++;
                    if (ex.status === 'correct') { correct++; attemptedNonInfo++; }
                    else if (ex.status === 'incorrect') attemptedNonInfo++;
                } else if (ex.status === 'attempted') attemptedNonInfo++;
            });
            currentLp.score = correct;
            const allAttempted = currentLp.exercises.every(ex => ex.status !== 'not_attempted');
            const sufficientScore = totalNonInfo === 0 || (correct / totalNonInfo) >= 0.0;
            if (allAttempted && sufficientScore) {
                appState.xp += lesson.xp;
                currentLp.completed = true;
                incrementStreakOnLessonComplete();
            } else {
                 checkAndAwardBadges();
                 saveState();
                 updateUI();
            }
        } else {
            saveState();
            updateUI();
        }
        showView('dashboard-view');
        if (currentLp?.completed && typeof anime !== 'undefined' && xpDisplay && streakDisplay) {
             const initialXP = parseInt(xpDisplay.textContent.split(' ')[1]) - lesson.xp;
             anime({ targets: xpDisplay, innerHTML: [Math.max(0, initialXP), appState.xp], round: 1, easing: 'easeOutQuad', duration: 800 });
             if (appState.streak > 0 && streakDisplay.querySelector('i')) anime({ targets: streakDisplay.querySelector('i'), scale: [1, 1.5, 1], duration: 800, easing: 'easeOutElastic(1, .8)' });
        }
    }

    function checkAndAwardBadges() {
        if (!appState.lessonsData || !appState.lessonsData.badges) return;
        appState.lessonsData.badges.forEach(badge => {
            if (appState.earnedBadges.includes(badge.id)) return;
            let conditionMet = false;
            switch (badge.conditionType) {
                case 'xp': if (appState.xp >= badge.value) conditionMet = true; break;
                case 'streak': if (appState.streak >= badge.value) conditionMet = true; break;
                case 'lessons_completed':
                    let completedCount = 0;
                    if (badge.moduleId) {
                        const module = appState.lessonsData.modules.find(m => m.id === badge.moduleId);
                        if (module) module.lessons.forEach(l => { if (appState.lessonProgress[l.id]?.completed) completedCount++; });
                    } else {
                        completedCount = Object.values(appState.lessonProgress).filter(lp => lp.completed).length;
                    }
                    if (completedCount >= badge.value) conditionMet = true;
                    break;
                case 'learning_path_completed':
                    const lp = appState.lessonsData.learningPaths.find(p => p.id === badge.value);
                    if (lp && lp.moduleIds) {
                        let allModulesInPathCompleted = true;
                        if (lp.moduleIds.length === 0) allModulesInPathCompleted = false;
                        else {
                            for (const modId of lp.moduleIds) {
                                const modData = appState.lessonsData.modules.find(m => m.id === modId);
                                if (modData) {
                                    for (const l of modData.lessons) {
                                        if (!appState.lessonProgress[l.id]?.completed) {
                                            allModulesInPathCompleted = false; break;
                                        }
                                    }
                                } else allModulesInPathCompleted = false;
                                if (!allModulesInPathCompleted) break;
                            }
                        }
                        if (allModulesInPathCompleted) conditionMet = true;
                    }
                    break;
            }
            if (conditionMet) { appState.earnedBadges.push(badge.id); showBadgeNotification(badge); }
        });
        saveState();
        if (dashboardView && dashboardView.classList.contains('active-view')) renderBadgesOnDashboard();
        if (document.getElementById('badges-view') && document.getElementById('badges-view').classList.contains('active-view')) renderAllBadgesView();
    }

    function showBadgeNotification(badge) {
        const existing = document.querySelector('.badge-notification');
        if (existing) existing.remove();
        const activeEl = document.activeElement;
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `<h3>Felicitări! Ai câștigat o recompensă!</h3><i class="${badge.icon_class_fallback || 'fas fa-award'}"></i><h4>${badge.name}</h4><p>${badge.description}</p><button id="close-badge-notification" class="button-like">Minunat!</button>`;
        document.body.appendChild(notification);
        const closeBtn = notification.querySelector('#close-badge-notification');
        if (closeBtn) closeBtn.focus();
        if(typeof anime !== 'undefined') {
            anime({ targets: notification, translateY: ['-120%', '-50%'], scale: [0.8, 1], opacity: [0,1], duration: 700, easing: 'easeOutQuint' });
            if (closeBtn) closeBtn.onclick = () => anime({ targets: notification, translateY: ['-50%', '120%'], opacity: [1,0], scale: 0.8, duration: 500, easing: 'easeInQuint', complete: () => { notification.remove(); if (activeEl && typeof activeEl.focus === 'function') activeEl.focus(); } });
        } else if (closeBtn) closeBtn.onclick = () => { notification.remove(); if (activeEl && typeof activeEl.focus === 'function') activeEl.focus(); };
    }
    
    // --- INITIALIZATION ---
    function init() {
        loadState();
        applyTheme();
        loadLessonsData();

        if (sidenavToggle) sidenavToggle.addEventListener('click', openSidenav);
        if (closeSidenavButton) closeSidenavButton.addEventListener('click', closeSidenav);
        if (overlayElement) overlayElement.addEventListener('click', closeSidenav);
        if (sidenavLinks) sidenavLinks.forEach(link => link.addEventListener('click', handleSidenavLinkClick));
        
        if (sidenavThemeToggle) {
            sidenavThemeToggle.addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); });
        }
        if (themeSelectSettings) {
            themeSelectSettings.value = appState.currentTheme;
            themeSelectSettings.addEventListener('change', (e) => { appState.currentTheme = e.target.value; applyTheme(); });
        }
        if (resetProgressButton) {
            resetProgressButton.addEventListener('click', () => {
                if (confirm("Ești sigur că vrei să resetezi tot progresul? Această acțiune este ireversibilă!")) {
                    localStorage.removeItem('eduAppState');
                    appState = {
                        xp: 0, streak: 0, lastCompletionDate: null, currentTheme: appState.currentTheme,
                        currentModuleId: null, currentLessonId: null, currentExerciseIndex: 0,
                        lessonsData: appState.lessonsData, lessonProgress: {}, earnedBadges: [],
                        isSidenavOpen: appState.isSidenavOpen, currentLearningPathId: null, activityDates: []
                    };
                    saveState(); window.location.reload();
                }
            });
        }

        if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);
        if (backToDashboardButton) backToDashboardButton.addEventListener('click', () => showView('dashboard-view'));
        if (backToLpOverviewButton) backToLpOverviewButton.addEventListener('click', () => showView('learning-paths-overview-view'));
        
        // Căutarea de pe dashboard a fost eliminată din funcționalitatea principală de listare module
        // if (searchInput) searchInput.addEventListener('input', (event) => renderDashboard(event.target.value));
        
        if(lpSearchInput) lpSearchInput.addEventListener('input', (e) => renderLearningPathsOverview(e.target.value));
        if(myCoursesSearchInput) myCoursesSearchInput.addEventListener('input', (e) => renderMyCoursesView(e.target.value));

                // Event listeners pentru navigarea anilor în calendarul de pe dashboard
        if (prevYearBtn) {
            prevYearBtn.addEventListener('click', () => {
                appState.currentDisplayYear--;
                if (yearlyActivityGridContainer) renderYearlyActivityGrid(yearlyActivityGridContainer, appState.currentDisplayYear);
                if (currentYearDisplay) currentYearDisplay.textContent = appState.currentDisplayYear;
            });
        }
        if (nextYearBtn) {
            nextYearBtn.addEventListener('click', () => {
                const maxYear = new Date().getFullYear();
                if (appState.currentDisplayYear < maxYear) {
                    appState.currentDisplayYear++;
                    if (yearlyActivityGridContainer) renderYearlyActivityGrid(yearlyActivityGridContainer, appState.currentDisplayYear);
                    if (currentYearDisplay) currentYearDisplay.textContent = appState.currentDisplayYear;
                }
            });
        }
        // Similar pentru butoanele de pe pagina de progres detaliat, dacă există
        if (progressPrevYearBtn) {
            progressPrevYearBtn.addEventListener('click', () => {
                appState.currentDisplayYear--; // Poți folosi aceeași variabilă de stare sau una separată
                if (progressViewStreakCalendarContainer) renderYearlyActivityGrid(progressViewStreakCalendarContainer, appState.currentDisplayYear);
                if (progressCurrentYearDisplay) progressCurrentYearDisplay.textContent = appState.currentDisplayYear;
            });
        }
        if (progressNextYearBtn) {
            progressNextYearBtn.addEventListener('click', () => {
                const maxYear = new Date().getFullYear();
                if (appState.currentDisplayYear < maxYear) {
                    appState.currentDisplayYear++;
                    if (progressViewStreakCalendarContainer) renderYearlyActivityGrid(progressViewStreakCalendarContainer, appState.currentDisplayYear);
                    if (progressCurrentYearDisplay) progressCurrentYearDisplay.textContent = appState.currentDisplayYear;
                }
            });
        }

        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && appState.isSidenavOpen) closeSidenav(); });
        if (window.innerWidth >= 992 && sidenavElement && sidenavElement.classList.contains('open-desktop-default')) openSidenav();
        updateUI();
    }

    init();
});