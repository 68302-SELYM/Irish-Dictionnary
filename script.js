let dictionaryData = [];
let mistakesList = JSON.parse(localStorage.getItem('gaelicMistakes')) || [];
let allWordsFlattened = [];
let currentList = [], currentIndex = 0, gameMode = "", errorsCount = 0, successCount = 0, startTime = 0;

async function init() {
    if (window.location.hash === '#admin') {
        document.getElementById('admin-bar').style.display = 'flex';
    }

    try {
        const response = await fetch('data.json');
        if (response.ok) {
            dictionaryData = await response.json();
        } else {
            console.error("Fichier data.json introuvable.");
        }
    } catch (error) {
        console.error("Erreur de chargement du JSON.", error);
    }

    updateFlattenedWords();
    renderDictionary();
    updateMistakesButton();
}

function updateFlattenedWords() {
    allWordsFlattened = dictionaryData.flatMap(list => list.words);
}

function downloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dictionaryData, null, 4));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function playAudio(path) { if (path) console.log("Play audio:", path); }

function updateMistakesButton() {
    const btn = document.getElementById("btn-mistakes");
    btn.disabled = mistakesList.length === 0;
    btn.innerText = `Mistakes (${mistakesList.length})`;
}

function showSection(sectionId) {
    document.getElementById("dict-section").style.display = sectionId === 'dict-section' ? 'block' : 'none';
    document.getElementById("flashcard-menu").style.display = sectionId === 'flashcard-menu' ? 'flex' : 'none';
    document.getElementById("game-container").style.display = 'none';
    document.getElementById("main-header").style.display = 'flex';
    document.getElementById("tab-dict").classList.toggle("active", sectionId === 'dict-section');
    document.getElementById("tab-flash").classList.toggle("active", sectionId === 'flashcard-menu');
}

function renderDictionary() {
    const container = document.getElementById("dictionary-wrapper");
    const selectList = document.getElementById("select-list-target");
    container.innerHTML = ""; selectList.innerHTML = "";

    dictionaryData.forEach(list => {
        const opt = document.createElement('option');
        opt.value = list.id; opt.innerText = list.title;
        selectList.appendChild(opt);

        let listHtml = `<div class="list-bubble"><div class="list-title">${list.title}</div>`;
        list.words.forEach(item => {
            listHtml += `
                <div class="dict-row">
                    <div class="word-group">
                        <span class="gaelic-word" data-phonetic="${item.phonetic}">${item.gaelic}</span>
                        <button class="audio-btn" onclick="playAudio('${item.audio}')">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="3" y="10" width="2" height="4" rx="1"/><rect x="7" y="6" width="2" height="12" rx="1"/>
                                <rect x="11" y="2" width="2" height="20" rx="1"/><rect x="15" y="6" width="2" height="12" rx="1"/>
                                <rect x="19" y="10" width="2" height="4" rx="1"/>
                            </svg>
                        </button>
                    </div>
                    <span>${item.english}</span>
                </div>`;
        });
        listHtml += `</div>`;
        container.innerHTML += listHtml;
    });
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function saveList() {
    const name = document.getElementById("input-list-name").value.trim();
    if (!name) return;
    dictionaryData.push({ id: 'list-' + Date.now(), title: name, words: [] });
    updateFlattenedWords(); renderDictionary();
    document.getElementById("input-list-name").value = ""; closeModal('modal-list');
}

function saveWord() {
    const targetId = document.getElementById("select-list-target").value;
    const gaelic = document.getElementById("input-gaelic").value.trim();
    const english = document.getElementById("input-english").value.trim();
    const phonetic = document.getElementById("input-phonetic").value.trim();
    if (!targetId || !gaelic || !english) return;

    const listIndex = dictionaryData.findIndex(l => l.id === targetId);
    if (listIndex > -1) {
        dictionaryData[listIndex].words.push({ gaelic, english, phonetic, audio: "" });
        updateFlattenedWords(); renderDictionary();
    }
    document.getElementById("input-gaelic").value = "";
    document.getElementById("input-english").value = "";
    document.getElementById("input-phonetic").value = "";
    closeModal('modal-word');
}

function quitGame() {
    showSection('flashcard-menu');
    document.getElementById("game-summary").classList.add("hidden");
    localStorage.setItem('gaelicMistakes', JSON.stringify(mistakesList));
    updateMistakesButton();
}

function renderWordList(targetId) {
    const preview = document.getElementById(targetId);
    preview.innerHTML = allWordsFlattened.map(w => 
        `<div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span class="gaelic-word" data-phonetic="${w.phonetic}">${w.gaelic}</span><br>
            <small style="color:#aaa;">${w.english}</small>
        </div>`
    ).join('');
    preview.classList.remove('hidden');
}

function startWordsPreview() {
    if (allWordsFlattened.length === 0) return alert("Dictionary is empty!");
    document.getElementById("main-header").style.display = 'none';
    document.getElementById("flashcard-menu").style.display = 'none';
    document.getElementById("game-container").style.display = 'flex';
    document.getElementById("game-summary").classList.add('hidden');
    renderWordList("words-preview");
    const startBtn = document.getElementById("btn-start-words");
    startBtn.innerText = "Start Flashcards"; startBtn.onclick = startWordsGame; startBtn.classList.remove('hidden');
    document.getElementById("active-game-area").classList.add('hidden');
}

function startWordsGame() {
    startTime = Date.now();
    document.getElementById("words-preview").classList.add('hidden');
    document.getElementById("btn-start-words").classList.add('hidden');
    document.getElementById("active-game-area").classList.remove('hidden');
    document.getElementById("options-container").classList.add('hidden');
    currentList = [...allWordsFlattened].sort(() => Math.random() - 0.5);
    currentIndex = 0; gameMode = "words";
    document.getElementById("stat-errors").style.display = 'none';
    document.getElementById("stat-success").style.display = 'none';
    showNextCard();
}

function startGame(mode) {
    if (allWordsFlattened.length === 0) return alert("Dictionary is empty!");
    startTime = Date.now();
    document.getElementById("main-header").style.display = 'none';
    document.getElementById("flashcard-menu").style.display = 'none';
    document.getElementById("game-container").style.display = 'flex';
    document.getElementById("game-summary").classList.add('hidden');
    document.getElementById("words-preview").classList.add('hidden');
    document.getElementById("btn-start-words").classList.add('hidden');
    document.getElementById("active-game-area").classList.remove('hidden');
    document.getElementById("btn-next-word").classList.add('hidden');
    document.getElementById("stat-errors").style.display = 'block';
    document.getElementById("stat-success").style.display = 'block';

    gameMode = mode;
    currentList = mode === 'guesser' ? [...allWordsFlattened] : [...allWordsFlattened.filter(w => mistakesList.includes(w.gaelic))];
    currentList.sort(() => Math.random() - 0.5);
    currentIndex = 0; errorsCount = 0; successCount = 0; updateStats();
    if(currentList.length > 0) showNextCard(); else quitGame();
}

function finishGame() {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const min = String(Math.floor(timeTaken / 60)).padStart(2, '0');
    const sec = String(timeTaken % 60).padStart(2, '0');
    const messages = ["Great job!", "Awesome work!", "You nailed it!", "Keep it up!"];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    document.getElementById("active-game-area").classList.add("hidden");
    const summary = document.getElementById("game-summary");
    summary.innerHTML = `<h2 style="color: var(--irish-green); margin-top: 0;">${msg}</h2>
        <div class="glass-btn" style="display:inline-block; pointer-events: none;"><span class="clock-icon">⏱️</span> ${min}:${sec}</div>`;
    summary.classList.remove("hidden");
    renderWordList("words-preview");
    const backBtn = document.getElementById("btn-start-words");
    backBtn.innerText = "Back to Menu"; backBtn.onclick = quitGame; backBtn.classList.remove("hidden");
    localStorage.setItem('gaelicMistakes', JSON.stringify(mistakesList)); updateMistakesButton();
}

function showNextCard() {
    if (currentIndex >= currentList.length) return finishGame();
    const word = currentList[currentIndex];
    const card = document.getElementById("flashcard");
    const btnNext = document.getElementById("btn-next-word");
    let hasFlipped = false;
    card.className = "card"; btnNext.classList.add("hidden");
    const textFront = document.getElementById("card-text-front");
    textFront.innerText = word.gaelic; textFront.setAttribute("data-phonetic", word.phonetic);
    document.getElementById("card-text-back").innerText = word.english;

    if (gameMode === "words") {
        card.onclick = () => {
            card.classList.toggle("is-flipped"); hasFlipped = true;
            if (card.classList.contains("is-flipped") || hasFlipped) btnNext.classList.remove("hidden");
        };
    } else {
        card.onclick = null; document.getElementById("options-container").classList.remove('hidden'); generateOptions(word);
    }
}

function nextWord() { currentIndex++; showNextCard(); }

function generateOptions(correctWord) {
    const container = document.getElementById("options-container"); container.innerHTML = "";
    let options = [correctWord];
    let others = allWordsFlattened.filter(w => w.gaelic !== correctWord.gaelic).sort(() => Math.random() - 0.5);
    if(others[0]) options.push(others[0]); if(others[1]) options.push(others[1]);
    options.sort(() => Math.random() - 0.5);

    options.forEach(opt => {
        const btn = document.createElement("button"); btn.className = "glass-btn"; btn.innerText = opt.english;
        btn.onclick = () => checkAnswer(opt.gaelic === correctWord.gaelic, correctWord.gaelic);
        container.appendChild(btn);
    });
}

function checkAnswer(isCorrect, gaelicWord) {
    const card = document.getElementById("flashcard");
    if (isCorrect) {
        card.classList.add("success"); successCount++; mistakesList = mistakesList.filter(w => w !== gaelicWord);
    } else {
        card.classList.add("error"); errorsCount++; if (!mistakesList.includes(gaelicWord)) mistakesList.push(gaelicWord);
    }
    updateStats(); document.getElementById("options-container").innerHTML = "";
    setTimeout(() => { currentIndex++; showNextCard(); }, 1000);
}

function updateStats() {
    document.getElementById("stat-errors").innerText = errorsCount;
    document.getElementById("stat-success").innerText = successCount;
}

window.onload = init;