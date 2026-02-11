import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCiLmto9ntvEgrCKQ-1jjdqW1miktseZA8",
  authDomain: "schoolquiz-1b9b3.firebaseapp.com",
  projectId: "schoolquiz-1b9b3",
  storageBucket: "schoolquiz-1b9b3.firebasestorage.app",
  messagingSenderId: "695438030711",
  appId: "1:695438030711:web:cc13ac0d060b043eadd372"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentPlayerName = ""; 

// Пути исправлены (убрали ../)
const avatars = {
    1: "img/top1.png", 
    2: "img/top2.png", 
    3: "img/top3.png"
};

const questions = [
    { 
        question: "How do you say 'Книга' in English?", 
        answers: ["Pen", "Book", "Apple", "Table"], 
        correct: 1 
    },
    { 
        question: "Посмотри видео и ответь: какое видео повторяется?", 
        // Пути исправлены и убраны пробелы (переименуй файлы в папке video!)
        videos: ["video/video1.mov", "video/video1.mov", "video/video1.mov"], 
        answers: ["Вариант 1", "Вариант 2", "Вариант 3"], 
        correct: 0 
    },
    { 
        question: "I ___ a student.", 
        answers: ["is", "am", "are", "be"], 
        correct: 1 
    }
   { 
        question: "Who is a Shakespeare.", 
        answers: ["clay mixer", "cucumber", "undertaker", "writer"], 
        correct: 3
    }
   { 
        question: "How say 'Испытание'?", 
        answers: ["path", "trial", "adventure", "apple"], 
        correct: 1
    }
];

let currentQuestionIndex = 0;
let score = 0;
let currentVideoIndex = 0;

function showQuestion() {
    const container = document.getElementById('quiz-container');
    const progText = document.getElementById('question-number');
    const progBar = document.getElementById('quiz-progress');

    if (currentQuestionIndex >= questions.length) {
        showFinalForm();
        return;
    }

    const q = questions[currentQuestionIndex];
    currentVideoIndex = 0; 
    
    if (progText) progText.innerText = `Вопрос ${currentQuestionIndex + 1} из ${questions.length}`;
    if (progBar) {
        progBar.max = questions.length;
        progBar.value = currentQuestionIndex + 1;
    }

    container.innerHTML = `<h2>${q.question}</h2>`;

    if (q.videos) {
        container.innerHTML += `
            <div id="video-slider" style="margin-bottom:15px; background: #f8f9fa; padding: 10px; border-radius: 12px;">
                <video id="main-video" width="100%" controls style="border-radius:8px;">
                    <source src="${q.videos[0]}" type="video/mp4">
                </video>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <button id="prevVid" style="background:#1976d2; color:white; border:none; border-radius:5px; padding:5px 15px; cursor:pointer;">⬅</button>
                    <span id="vidNum" style="font-size:14px; color:#1565c0; font-weight:bold;">1 / ${q.videos.length}</span>
                    <button id="nextVid" style="background:#1976d2; color:white; border:none; border-radius:5px; padding:5px 15px; cursor:pointer;">➡</button>
                </div>
            </div>
        `;

        setTimeout(() => {
            const videoPlayer = document.getElementById('main-video');
            const vidNumDisplay = document.getElementById('vidNum');
            document.getElementById('nextVid').onclick = () => {
                if (currentVideoIndex < q.videos.length - 1) {
                    currentVideoIndex++;
                    videoPlayer.src = q.videos[currentVideoIndex];
                    vidNumDisplay.innerText = `${currentVideoIndex + 1} / ${q.videos.length}`;
                    videoPlayer.play();
                }
            };
            document.getElementById('prevVid').onclick = () => {
                if (currentVideoIndex > 0) {
                    currentVideoIndex--;
                    videoPlayer.src = q.videos[currentVideoIndex];
                    vidNumDisplay.innerText = `${currentVideoIndex + 1} / ${q.videos.length}`;
                    videoPlayer.play();
                }
            };
        }, 10);
    }

    q.answers.forEach((ans, idx) => {
        const btn = document.createElement('button');
        btn.innerText = ans;
        btn.className = 'answer-btn';
        btn.onclick = () => {
            if (idx === q.correct) score++;
            currentQuestionIndex++;
            showQuestion();
        };
        container.appendChild(btn);
    });
}

function showFinalForm() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = `
        <h2>Готово!</h2>
        <p>Результат: <b style="color:#1976d2;">${score}</b></p>
        <input type="text" id="pName" placeholder="Твое имя" style="width:80%; margin-bottom:15px; padding:10px;">
        <br>
        <button id="saveBtn" class="answer-btn" style="background:#1976d2; color:white;">СОХРАНИТЬ РЕЗУЛЬТАТ</button>
    `;

    document.getElementById('saveBtn').onclick = async () => {
        const name = document.getElementById('pName').value.trim();
        if (name) {
            currentPlayerName = name; 
            try {
                await addDoc(collection(db, "leaderboard"), { name, score: Number(score), date: new Date() });
                loadLeaderboard();
            } catch (e) { console.error(e); }
        }
    };
}

async function loadLeaderboard() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '<h3 style="color:#1976d2;">Загрузка рейтинга...</h3>';

    try {
        const snap = await getDocs(collection(db, "leaderboard"));
        let players = [];
        snap.forEach(doc => players.push(doc.data()));
        
        players.sort((a, b) => b.score - a.score || a.date - b.date);

        let playerPlace = players.findIndex(p => p.name === currentPlayerName) + 1;
        let playerPoints = players.find(p => p.name === currentPlayerName)?.score || 0;

        let html = `<h2 style="margin-top:0;">🏆 Топ-10</h2><table style="width:100%; border-collapse:collapse;">`;

        players.slice(0, 10).forEach((p, i) => {
            let place = i + 1;
            let avatarHtml = '';
            let rowStyle = 'background: white;'; 

            if (place === 1) { 
                rowStyle = 'background: #e3f2fd;'; 
                avatarHtml = `<img src="${avatars[1]}" style="width:25px; vertical-align:middle; margin-right:8px;">`;
            } else if (place === 2) { 
                rowStyle = 'background: #f1f8fe;'; 
                avatarHtml = `<img src="${avatars[2]}" style="width:25px; vertical-align:middle; margin-right:8px;">`;
            } else if (place === 3) { 
                rowStyle = 'background: #f9fcff;'; 
                avatarHtml = `<img src="${avatars[3]}" style="width:25px; vertical-align:middle; margin-right:8px;">`;
            }

            html += `
                <tr style="border-bottom:1px solid #e0e0e0; ${rowStyle}">
                    <td style="padding:12px; text-align:left;">${avatarHtml} <b>${place}.</b> ${p.name}</td>
                    <td style="padding:12px; text-align:right; font-weight:bold; color:#1565c0;">${p.score}</td>
                </tr>
            `;
        });

        html += `</table>`;

        html += `
            <div style="margin-top:20px; padding:15px; background:#1976d2; color:white; border-radius:10px; font-weight:bold; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                ВАШ РЕЗУЛЬТАТ: ${playerPlace}-е МЕСТО (${playerPoints} б.)
            </div>
        `;

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<h3>Ошибка загрузки</h3>';
    }
}


showQuestion();
