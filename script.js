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
        isSidenavOpen: false 
    };

    // --- DOM ELEMENTS ---
    const xpDisplay = document.getElementById('xp-display');
    const streakDisplay = document.getElementById('streak-display');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const dashboardView = document.getElementById('dashboard-view');
    const lessonView = document.getElementById('lesson-view');
    const modulesContainer = document.getElementById('modules-container');
    const lessonTitleElement = document.getElementById('lesson-title');
    const lessonContentElement = document.getElementById('lesson-content');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackText = document.getElementById('feedback-text');
    const feedbackExplanation = document.getElementById('feedback-explanation');
    const nextExerciseButton = document.getElementById('next-exercise-button');
    const backToDashboardButton = document.getElementById('back-to-dashboard');
    const badgesContainer = document.getElementById('badges-container'); // Containerul principal pentru recompense de pe dashboard

    // Sidenav Elements
    const sidenavElement = document.getElementById('sidenav');
    const sidenavToggle = document.getElementById('sidenav-toggle');
    const closeSidenavButton = document.getElementById('close-sidenav-btn');
    const overlayElement = document.getElementById('overlay');
    const pageContentPusherElement = document.querySelector('.page-content-pusher');
    const sidenavLinks = document.querySelectorAll('.sidenav-link');
    const sidenavThemeToggle = document.getElementById('sidenav-theme-toggle');
    const themeSelectSettings = document.getElementById('theme-select-settings');


    // --- LOCALSTORAGE FUNCTIONS ---
    function saveState() {
        const stateToSave = {
            xp: appState.xp,
            streak: appState.streak,
            lastCompletionDate: appState.lastCompletionDate,
            currentTheme: appState.currentTheme,
            lessonProgress: appState.lessonProgress,
            earnedBadges: appState.earnedBadges
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
        }
        updateStreak(); 
    }

    // --- SIDENAV MANAGEMENT ---
    function openSidenav() {
        if (!sidenavElement || !overlayElement) return;
        sidenavElement.classList.add('open');
        overlayElement.classList.add('active');
        document.body.classList.add('sidenav-active'); 
        sidenavToggle.setAttribute('aria-expanded', 'true');
        appState.isSidenavOpen = true;
    }

    function closeSidenav() {
        if (!sidenavElement || !overlayElement) return;
        sidenavElement.classList.remove('open');
        overlayElement.classList.remove('active');
        document.body.classList.remove('sidenav-active');
        sidenavToggle.setAttribute('aria-expanded', 'false');
        appState.isSidenavOpen = false;
    }

    function handleSidenavLinkClick(event) {
        const link = event.target.closest('.sidenav-link');
        if (!link || link.id === 'sidenav-theme-toggle' || link.getAttribute('href') === '#logout') {
             // Nu închide pentru schimbarea temei sau logout, acestea pot avea acțiuni proprii
            if (link && link.getAttribute('href') === '#logout') {
                event.preventDefault();
                console.log("Logout action triggered"); 
                // Aici poți adăuga logica de logout (ex: ștergere localStorage, redirectare)
                // localStorage.removeItem('eduAppState'); // Exemplu
                // window.location.reload(); // Exemplu
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
        
        // Închide Sidenav-ul doar dacă nu suntem pe un ecran mare unde Sidenav-ul e persistent
        if (window.innerWidth < 992) {
            closeSidenav();
        }
    }

    // --- THEME MANAGEMENT ---
    function updateThemeToggleIcons() {
        const isLightTheme = appState.currentTheme === 'light';
        const iconClass = isLightTheme ? 'fa-moon' : 'fa-sun'; 
        
        themeToggleButton.innerHTML = `<i class="fas ${iconClass}"></i>`;
        themeToggleButton.setAttribute('aria-label', isLightTheme ? 'Activează tema întunecată' : 'Activează tema deschisă');

        if (sidenavThemeToggle) {
            const sidenavIcon = sidenavThemeToggle.querySelector('i');
            const sidenavText = sidenavThemeToggle.querySelector('span');
            if (sidenavIcon) {
                // Păstrează iconița de paletă, dar poți schimba altceva dacă dorești
                // sidenavIcon.className = `fas ${iconClass}`; 
            }
            if (sidenavText) {
                 sidenavText.textContent = isLightTheme ? ' Activează Întunecat' : ' Activează Deschis';
            }
        }
        if (themeSelectSettings) {
            themeSelectSettings.value = appState.currentTheme;
        }
    }

    function applyTheme() {
        document.body.className = ''; 
        document.body.classList.add(appState.currentTheme + '-theme');
        if(appState.isSidenavOpen && window.innerWidth < 992) { 
            document.body.classList.add('sidenav-active'); // Pentru blocare scroll mobil
        } else if (appState.isSidenavOpen && window.innerWidth >= 992) {
            document.body.classList.add('sidenav-active'); // Pentru push content desktop
        }
        updateThemeToggleIcons();
        saveState();
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

            if (lastDate.toDateString() === yesterday.toDateString()) {
                // ok
            } else if (lastDate.toDateString() !== today) {
                appState.streak = 0; 
            }
        }
        updateUI();
    }

    function incrementStreakOnLessonComplete() {
        const today = new Date().toDateString();
        if (appState.lastCompletionDate !== today) {
            if (appState.lastCompletionDate) {
                 const lastDate = new Date(appState.lastCompletionDate);
                 const yesterday = new Date();
                 yesterday.setDate(yesterday.getDate() - 1);
                 if(lastDate.toDateString() === yesterday.toDateString()){
                    appState.streak++;
                 } else {
                    appState.streak = 1; 
                 }
            } else {
                 appState.streak = 1; 
            }
            appState.lastCompletionDate = today;
            checkAndAwardBadges(); 
        }
        saveState();
        updateUI();
    }


    // --- UI UPDATE FUNCTIONS ---
    function updateUI() {
        if (xpDisplay) xpDisplay.textContent = `XP: ${appState.xp}`;
        if (streakDisplay) streakDisplay.innerHTML = `<i class="fas fa-fire"></i> ${appState.streak}`;
        if (document.getElementById('dashboard-view').classList.contains('active-view')) {
             renderBadgesOnDashboard(); // Re-randează badge-urile doar dacă dashboard-ul e vizibil
        }
    }

    // --- DATA LOADING ---
    async function loadLessonsData() {
        try {
            const response = await fetch('data/lessons.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            appState.lessonsData = await response.json();
            renderDashboard(); 
            sidenavLinks.forEach(link => {
                link.classList.remove('active-sidenav-link');
                if(link.dataset.view === 'dashboard-view') {
                    link.classList.add('active-sidenav-link');
                }
            });
        } catch (error) {
            console.error("Could not load lessons data:", error);
            if (modulesContainer) modulesContainer.innerHTML = "<p>Eroare la încărcarea lecțiilor. Te rugăm să încerci din nou mai târziu.</p>";
        }
    }

    // --- RENDERING FUNCTIONS ---
    function renderDashboard() {
        if (!modulesContainer) return;
        modulesContainer.innerHTML = ''; 
        if (!appState.lessonsData || !appState.lessonsData.modules) {
            modulesContainer.innerHTML = "<p>Nu există module disponibile.</p>";
            return;
        }

        appState.lessonsData.modules.forEach(module => {
            const moduleElement = document.createElement('div');
            moduleElement.className = 'module';
            const moduleIconHtml = module.icon ? `<i class="${module.icon}"></i>` : '';
            moduleElement.innerHTML = `
                <h3>${moduleIconHtml} ${module.title}</h3>
                <p>${module.description}</p>
                <div class="lesson-cards-container" id="module-lessons-${module.id}"></div>
            `;
            modulesContainer.appendChild(moduleElement);

            const lessonCardsContainer = document.getElementById(`module-lessons-${module.id}`);
            module.lessons.forEach(lesson => {
                const lessonCard = document.createElement('div');
                lessonCard.className = 'lesson-card';
                lessonCard.dataset.moduleId = module.id;
                lessonCard.dataset.lessonId = lesson.id;
                const isCompleted = appState.lessonProgress[lesson.id]?.completed;
                const lessonCompletionIcon = isCompleted ? '<i class="fas fa-check-circle"></i>' : '';
                
                lessonCard.innerHTML = `
                    <h4><i class="fas fa-book-reader"></i> ${lesson.title} ${lessonCompletionIcon}</h4>
                    <p>${lesson.short_description || `Acumulează cunoștințe și câștigă ${lesson.xp} XP.`}</p>
                    <div class="meta-info">
                        <span class="xp-info"><i class="fas fa-star"></i> ${lesson.xp} XP</span>
                        ${lesson.estimated_time ? `<span class="time-info"><i class="fas fa-clock"></i> ${lesson.estimated_time}</span>` : ''}
                    </div>
                `;
                lessonCard.addEventListener('click', () => startLesson(module.id, lesson.id));
                lessonCardsContainer.appendChild(lessonCard);
            });
        });
        renderBadgesOnDashboard(); 
    }

    function renderBadgesOnDashboard() {
        if (!badgesContainer) return; // Verifică dacă #badges-container există
        const badgeListContainer = badgesContainer.querySelector('.badge-list');
        if (!badgeListContainer) { 
            console.warn("Containerul .badge-list nu a fost găsit în #badges-container. Se creează unul nou.");
            // Acest fallback poate fi util, dar ideal ar fi ca structura HTML să fie corectă
            // const newBadgeList = document.createElement('div');
            // newBadgeList.className = 'badge-list';
            // badgesContainer.appendChild(newBadgeList);
            // badgeListContainer = newBadgeList;
            // Dacă nu îl găsește, e o problemă de HTML, mai bine nu continuăm.
            return; 
        }
        badgeListContainer.innerHTML = ''; 

        if (!appState.lessonsData || !appState.lessonsData.badges) {
            badgeListContainer.innerHTML = "<p>Nicio recompensă de afișat.</p>";
            return;
        }
        
        const badgesToDisplay = appState.lessonsData.badges; 

        if (badgesToDisplay.length === 0) {
            badgeListContainer.innerHTML = "<p>Nicio recompensă disponibilă momentan.</p>";
            return;
        }

        badgesToDisplay.forEach(badgeData => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge';
            const isEarned = appState.earnedBadges.includes(badgeData.id);
            if(isEarned) badgeElement.classList.add('earned');

            badgeElement.innerHTML = `
                <i class="${badgeData.icon_class || 'fas fa-medal'}"></i>
                <span class="badge-name">${badgeData.name}</span>
            `;
            if (isEarned) {
                 badgeElement.title = `${badgeData.name}: ${badgeData.description}`;
            } else {
                 badgeElement.title = `Blocat: ${badgeData.name} - ${badgeData.description}`;
                 badgeElement.style.opacity = "0.6"; 
            }
            badgeListContainer.appendChild(badgeElement);
        });
    }

    // Funcție pentru a randarea badge-urilor în view-ul dedicat "badges-view"
    function renderAllBadgesView() {
        const allBadgesListContainer = document.querySelector('#badges-view .all-badges-list-container');
        if (!allBadgesListContainer) return;
        allBadgesListContainer.innerHTML = ''; // Clear previous

        if (!appState.lessonsData || !appState.lessonsData.badges) {
            allBadgesListContainer.innerHTML = "<p>Nicio recompensă de afișat.</p>";
            return;
        }
        
        const badgesToDisplay = appState.lessonsData.badges;

        if (badgesToDisplay.length === 0) {
            allBadgesListContainer.innerHTML = "<p>Nicio recompensă disponibilă momentan.</p>";
            return;
        }
        // Folosește un stil similar cu .badge-list pentru coerență
        const listElement = document.createElement('div');
        listElement.className = 'badge-list'; // Refolosește stilul .badge-list

        badgesToDisplay.forEach(badgeData => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge'; // Refolosește stilul .badge
            const isEarned = appState.earnedBadges.includes(badgeData.id);
            if(isEarned) badgeElement.classList.add('earned');

            badgeElement.innerHTML = `
                <i class="${badgeData.icon_class || 'fas fa-medal'}"></i>
                <span class="badge-name">${badgeData.name}</span>
                ${isEarned ? `<p class="badge-description-small">${badgeData.description}</p>` : `<p class="badge-description-small"><em>Blocat</em></p>`}
            `;
            badgeElement.title = isEarned ? `${badgeData.name}: ${badgeData.description}` : `Blocat: ${badgeData.name} - ${badgeData.description}`;
            if (!isEarned) badgeElement.style.opacity = "0.6";
            
            listElement.appendChild(badgeElement);
        });
        allBadgesListContainer.appendChild(listElement);
    }


    function showView(viewId) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active-view');
        } else {
            console.warn(`View-ul cu ID-ul "${viewId}" nu a fost găsit.`);
            document.getElementById('dashboard-view').classList.add('active-view'); // Fallback
        }
        
        sidenavLinks.forEach(link => {
            link.classList.remove('active-sidenav-link');
            if (link.dataset.view === viewId) {
                link.classList.add('active-sidenav-link');
            }
        });

        if (viewId === 'dashboard-view') {
            renderDashboard();
        } else if (viewId === 'badges-view') {
            renderAllBadgesView();
        }
    }

    function startLesson(moduleId, lessonId) {
        appState.currentModuleId = moduleId;
        appState.currentLessonId = lessonId;
        appState.currentExerciseIndex = 0;
        showView('lesson-view');
        loadCurrentExercise();
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
        if (!exercise || !lesson) {
            console.error("Exercițiu sau lecție negăsită. Se revine la dashboard.");
            finishLesson(); 
            return;
        }

        lessonTitleElement.textContent = lesson.title;
        lessonContentElement.innerHTML = ''; 
        feedbackContainer.style.display = 'none';
        feedbackContainer.className = ''; 
        nextExerciseButton.style.display = 'none';
        nextExerciseButton.disabled = false; 

        if (!appState.lessonProgress[lesson.id]) {
            appState.lessonProgress[lesson.id] = { 
                completed: false, 
                score: 0, 
                answers: Array(lesson.exercises.length).fill(null).map(() => ({ answer: null, correct: false, xpAwarded: false }))
            };
        }
        saveState();

        let exerciseHtml = `<div class="exercise-header"><h3>Exercițiul ${appState.currentExerciseIndex + 1} din ${lesson.exercises.length}</h3></div>`;

        switch (exercise.type) {
            case 'info':
                exerciseHtml += `
                    <div class="exercise-info">
                        <p>${exercise.text}</p>
                        ${exercise.image ? `<img src="${exercise.image}" alt="Material vizual" onerror="this.style.display='none'; console.warn('Imagine negăsită: ${exercise.image}')">` : ''}
                    </div>`;
                lessonContentElement.innerHTML = exerciseHtml;
                nextExerciseButton.textContent = "Am înțeles";
                nextExerciseButton.style.display = 'block';
                nextExerciseButton.onclick = () => proceedToNextExercise();
                break;

            case 'multiple_choice':
                exerciseHtml += `<p class="question-text">${exercise.question}</p>`;
                if (exercise.image) {
                    exerciseHtml += `<img src="${exercise.image}" alt="Întrebare vizuală" class="exercise-image" onerror="this.style.display='none'; console.warn('Imagine negăsită: ${exercise.image}')">`;
                }
                exerciseHtml += `<div class="options-container">`;
                exercise.options.forEach((option) => { 
                    exerciseHtml += `<button class="option-button" data-value="${option.value !== undefined ? option.value : option.text}">${option.text}</button>`;
                });
                exerciseHtml += `</div>`;
                lessonContentElement.innerHTML = exerciseHtml;
                lessonContentElement.querySelectorAll('.option-button').forEach(button => {
                    button.addEventListener('click', () => {
                        lessonContentElement.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
                        button.classList.add('selected');
                        handleAnswer(button.dataset.value);
                    });
                });
                break;

            case 'fill_in_the_blank':
                exerciseHtml += `
                    <p class="question-text">${exercise.question}</p>
                    <div class="fill-blank-container">
                        ${exercise.beforeText || ''}
                        <input type="text" id="fill-blank-input" placeholder="${exercise.placeholder || "..."}" autocomplete="off">
                        ${exercise.afterText || ''}
                        <button id="submit-fill-blank" class="button-like">Verifică</button>
                    </div>`;
                lessonContentElement.innerHTML = exerciseHtml;
                const fillBlankInput = document.getElementById('fill-blank-input');
                const submitFillBlankButton = document.getElementById('submit-fill-blank');
                
                submitFillBlankButton.addEventListener('click', () => {
                    const userAnswer = fillBlankInput.value.trim();
                    handleAnswer(userAnswer);
                });
                 fillBlankInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        submitFillBlankButton.click();
                    }
                });
                break;
            
            case 'drag_drop_words':
                exerciseHtml += `<p class="question-text">${exercise.question}</p>`;
                exerciseHtml += `<p class="instruction-text"><small>Trage cuvintele în zona de mai jos pentru a forma propoziția corectă.</small></p>`;
                exerciseHtml += `<div id="draggable-source" class="draggable-words-container sortable-list">`;
                const shuffledWords = [...exercise.words].sort(() => Math.random() - 0.5);
                shuffledWords.forEach(word => {
                    exerciseHtml += `<div class="draggable-word" draggable="true">${word}</div>`;
                });
                exerciseHtml += `</div>`;
                exerciseHtml += `<h4 class="drop-area-label">Propoziția formată:</h4>`;
                exerciseHtml += `<div id="drop-target" class="drop-target-area sortable-list"></div>`;
                exerciseHtml += `<button id="submit-drag-drop" class="button-like">Verifică Ordinea</button>`;
                lessonContentElement.innerHTML = exerciseHtml;

                const sourceContainer = document.getElementById('draggable-source');
                const targetContainer = document.getElementById('drop-target');

                if (typeof Sortable !== 'undefined') {
                    new Sortable(sourceContainer, {
                        group: 'sharedDragDrop', 
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        chosenClass: 'sortable-chosen',
                        dragClass: 'sortable-drag'
                    });
                    new Sortable(targetContainer, {
                        group: 'sharedDragDrop',
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        chosenClass: 'sortable-chosen',
                        dragClass: 'sortable-drag'
                    });
                } else {
                    console.warn("SortableJS nu este încărcat. Funcționalitatea Drag & Drop nu va funcționa.");
                    if(targetContainer) targetContainer.innerHTML = "<p>Librăria SortableJS nu este disponibilă.</p>";
                }
                
                const submitDragDropButton = document.getElementById('submit-drag-drop');
                if(submitDragDropButton) {
                    submitDragDropButton.addEventListener('click', () => {
                        const droppedWords = Array.from(targetContainer.children).map(el => el.textContent.trim());
                        handleAnswer(droppedWords); 
                    });
                }
                break;

            default:
                lessonContentElement.innerHTML = `<p>Tip de exercițiu '${exercise.type}' necunoscut.</p>`;
                 nextExerciseButton.textContent = "Continuă";
                 nextExerciseButton.style.display = 'block';
                 nextExerciseButton.onclick = () => proceedToNextExercise();
        }
    }

    // --- ANSWER HANDLING & FEEDBACK ---
    function handleAnswer(userAnswer) {
        const exercise = getCurrentExercise();
        if (!exercise) return;
        let isCorrect = false;

        lessonContentElement.querySelectorAll('button:not(#next-exercise-button):not(.option-button.selected), input').forEach(el => el.disabled = true);
        // Butoanele option-button care nu sunt selectate devin disabled, cel selectat rămâne enabled dar stilizat
        lessonContentElement.querySelectorAll('.option-button:not(.selected)').forEach(btn => btn.disabled = true);


        if (exercise.type === 'drag_drop_words' && typeof Sortable !== 'undefined') {
            const sourceSortable = Sortable.get(document.getElementById('draggable-source'));
            const targetSortable = Sortable.get(document.getElementById('drop-target'));
            if (sourceSortable) sourceSortable.option('disabled', true);
            if (targetSortable) targetSortable.option('disabled', true);
        }

        if (exercise.type === 'drag_drop_words') {
            isCorrect = userAnswer.length === exercise.correctOrder.length && 
                        userAnswer.every((word, index) => word.toLowerCase() === exercise.correctOrder[index].toLowerCase());
        } else if (exercise.type === 'multiple_choice') {
            isCorrect = userAnswer.toLowerCase() === String(exercise.answer).toLowerCase(); 
        } else if (exercise.type === 'fill_in_the_blank') {
             isCorrect = exercise.answer.some(ans => ans.toLowerCase() === userAnswer.toLowerCase());
        } else { // Pentru tip 'info' sau necunoscut, nu se aplică corect/greșit
            isCorrect = true; // Sau false, depinde cum vrei să tratezi
        }


        const lessonProgress = appState.lessonProgress[appState.currentLessonId];
        if (lessonProgress && lessonProgress.answers && lessonProgress.answers[appState.currentExerciseIndex]) {
            lessonProgress.answers[appState.currentExerciseIndex].answer = userAnswer;
            lessonProgress.answers[appState.currentExerciseIndex].correct = isCorrect;
        } else if (lessonProgress) {
            // Acest caz nu ar trebui să apară dacă inițializarea e corectă
             console.warn("Structura lessonProgress.answers[index] lipsește.");
        }


        feedbackContainer.style.display = 'block';
        feedbackContainer.className = 'feedback-visible'; 
        
        if (isCorrect) {
            feedbackText.innerHTML = `<i class="fas fa-check-circle"></i> Corect!`;
            feedbackContainer.classList.add('correct');
            feedbackContainer.classList.remove('incorrect');
            if (exercise.type !== 'info' && lessonProgress && lessonProgress.answers[appState.currentExerciseIndex] && !lessonProgress.answers[appState.currentExerciseIndex].xpAwarded) {
                lessonProgress.answers[appState.currentExerciseIndex].xpAwarded = true;
            }
            if (anime) {
                anime({
                    targets: feedbackContainer,
                    scale: [0.9, 1],
                    opacity: [0.5, 1],
                    duration: 400,
                    easing: 'easeOutExpo'
                });
            }
        } else {
            feedbackText.innerHTML = `<i class="fas fa-times-circle"></i> Greșit.`;
            feedbackContainer.classList.add('incorrect');
            feedbackContainer.classList.remove('correct');
             if (anime) {
                anime({
                    targets: feedbackContainer,
                    translateX: [{value: -6, duration:50}, {value: 6, duration:50}, {value: -4, duration:50}, {value: 4, duration:50}, {value: 0, duration:50}],
                    easing: 'easeInOutSine',
                    loop: 2
                });
            }
        }
        feedbackExplanation.textContent = exercise.explanation || '';
        
        nextExerciseButton.textContent = "Continuă";
        nextExerciseButton.style.display = 'block';
        nextExerciseButton.disabled = false;
        nextExerciseButton.onclick = () => proceedToNextExercise(); 

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
        if (!lesson) {
            showView('dashboard-view'); 
            return;
        }

        const lessonProgress = appState.lessonProgress[lesson.id];
        if (lessonProgress && !lessonProgress.completed) { 
            let correctAnswersCount = 0;
            let nonInfoExercisesCount = 0;

            lesson.exercises.forEach((ex, index) => {
                if (ex.type !== 'info') {
                    nonInfoExercisesCount++;
                    if (lessonProgress.answers[index]?.correct) {
                        correctAnswersCount++;
                    }
                }
            });
            
            const canComplete = nonInfoExercisesCount === 0 || (nonInfoExercisesCount > 0 && (correctAnswersCount / nonInfoExercisesCount) >= 0.7);

            if (canComplete) {
                 appState.xp += lesson.xp;
                 lessonProgress.completed = true;
                 incrementStreakOnLessonComplete(); 
            }
            lessonProgress.score = correctAnswersCount; 
            checkAndAwardBadges(); 
        }
        
        saveState();
        updateUI(); 
        showView('dashboard-view'); 
        
        if (lessonProgress?.completed && anime) { 
             const initialXP = parseInt(xpDisplay.textContent.split(':')[1].trim()) - (lessonProgress.completed ? lesson.xp : 0);
             anime({
                targets: xpDisplay,
                innerHTML: [initialXP < 0 ? 0 : initialXP, appState.xp],
                round: 1,
                easing: 'easeOutQuad',
                duration: 800
            });
            if (appState.streak > 0) {
                anime({
                    targets: streakDisplay.querySelector('i'),
                    scale: [1, 1.5, 1],
                    duration: 800,
                    easing: 'easeOutElastic(1, .8)'
                });
            }
        }
    }

    // --- GAMIFICATION: BADGES ---
    function checkAndAwardBadges() {
        if (!appState.lessonsData || !appState.lessonsData.badges) return;

        appState.lessonsData.badges.forEach(badge => {
            if (appState.earnedBadges.includes(badge.id)) return; 

            let conditionMet = false;
            switch (badge.conditionType) {
                case 'xp':
                    if (appState.xp >= badge.value) conditionMet = true;
                    break;
                case 'streak':
                    if (appState.streak >= badge.value) conditionMet = true;
                    break;
                case 'lessons_completed':
                    const completedLessonsCount = Object.values(appState.lessonProgress).filter(lp => lp.completed).length;
                    if (completedLessonsCount >= badge.value) conditionMet = true;
                    break;
            }

            if (conditionMet) {
                appState.earnedBadges.push(badge.id);
                showBadgeNotification(badge);
            }
        });
        saveState();
        if (document.getElementById('dashboard-view').classList.contains('active-view')) {
            renderBadgesOnDashboard();
        }
        if (document.getElementById('badges-view').classList.contains('active-view')) {
            renderAllBadgesView();
        }
    }

    function showBadgeNotification(badge) {
        const existingNotification = document.querySelector('.badge-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <h3>Felicitări! Ai câștigat o recompensă!</h3>
            <i class="${badge.icon_class || 'fas fa-award'}"></i>
            <h4>${badge.name}</h4>
            <p>${badge.description}</p>
            <button id="close-badge-notification" class="button-like">Minunat!</button>
        `;
        document.body.appendChild(notification);
        
        if(anime) {
            anime({
                targets: notification,
                translateY: ['-150%', '-50%'], 
                scale: [0.7, 1],
                opacity: [0,1],
                duration: 600,
                easing: 'easeOutExpo'
            });

            notification.querySelector('#close-badge-notification').onclick = () => {
                 anime({
                    targets: notification,
                    translateY: ['-50%', '100%'], 
                    opacity: [1,0],
                    duration: 400,
                    easing: 'easeInExpo',
                    complete: () => notification.remove()
                });
            };
        } else {
             notification.querySelector('#close-badge-notification').onclick = () => notification.remove();
        }
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
            sidenavThemeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        }
        if (themeSelectSettings) {
            themeSelectSettings.value = appState.currentTheme;
            themeSelectSettings.addEventListener('change', (e) => {
                appState.currentTheme = e.target.value;
                applyTheme();
            });
        }

        if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);
        if (backToDashboardButton) {
            backToDashboardButton.addEventListener('click', () => {
                showView('dashboard-view');
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && appState.isSidenavOpen) {
                closeSidenav();
            }
        });

        // Sincronizează starea inițială a sidenav-ului pe desktop dacă e setat să fie deschis by default
        if (window.innerWidth >= 992 && sidenavElement && sidenavElement.classList.contains('open-desktop-default')) { // Adaugă această clasă în HTML dacă vrei default deschis
            openSidenav(); // Sau doar aplică clasa .sidenav-active pe body
            document.body.classList.add('sidenav-active');
        }
    }

    init();
});