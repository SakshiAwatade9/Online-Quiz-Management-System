// Firebase configuration
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "dbmsquiz-3237f.firebaseapp.com",
  projectId: "project_id",
  storageBucket: "dbmsquiz-3237f.firebasestorage.app",
  messagingSenderId: "468588534982",
  appId: "app_id"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();


// ================= LOGIN =================
function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
        alert("Login Successful");
        window.location.href = "dashboard.html";
    })
    .catch((error) => {
        alert(error.message);
    });
}


// ================= LOGOUT =================
function logout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}


// ================= NAVIGATION =================
function openLeaderboard() {
    window.location.href = "leaderboard.html";
}


// ================= QUIZ VARIABLES =================
let attempted = 0;
let score = 0;
let questions = [];
let currentIndex = 0;
let submitted = false; // ✅ ADD HERE

// ================= LOAD QUESTIONS =================
function loadQuestions() {
    db.collection("questions").get().then((snapshot) => {

        questions = [];

        snapshot.forEach((doc) => {
            questions.push(doc.data());
        });

        if (questions.length > 0) {
            showQuestion();
        } else {
            document.getElementById("question").innerText = "No questions found!";
        }
    });
}


// ================= SHOW QUESTION =================
function showQuestion() {
    let q = questions[currentIndex];
    if (!q) return;

    document.getElementById("question").innerText = q.question;

    document.getElementById("options").innerHTML = `
        <button onclick="checkAnswer(this,'${q.option1}')">${q.option1}</button>
        <button onclick="checkAnswer(this,'${q.option2}')">${q.option2}</button>
        <button onclick="checkAnswer(this,'${q.option3}')">${q.option3}</button>
        <button onclick="checkAnswer(this,'${q.option4}')">${q.option4}</button>
    `;
}


// ================= CHECK ANSWER =================
function checkAnswer(element, selected) {

    let correct = questions[currentIndex].answer;

    attempted++;

    let buttons = document.querySelectorAll("#options button");

    buttons.forEach(btn => {
        btn.disabled = true;

        if (btn.innerText === correct) {
            btn.style.background = "green";
            btn.style.color = "white";
        }
    });

    if (selected === correct) {
        element.style.background = "green";
        score++;
    } else {
        element.style.background = "red";
    }
}


// ================= NEXT QUESTION =================
function nextQuestion() {

    // 🚫 stop multiple clicks after submission
    if (submitted) return;

    currentIndex++;

    if (currentIndex < questions.length) {
        showQuestion(); // ✅ show next question
    } else {

        submitted = true; // ✅ lock submission

        auth.onAuthStateChanged((user) => {

            if (!user) {
                alert("Session expired");
                window.location.href = "login.html";
                return;
            }

            let userId = user.uid;
            let email = user.email;

            db.collection("attempts").doc(userId).get()
            .then((doc) => {

                let attempts = doc.exists ? doc.data().attempts : 0;

                if (attempts >= 2) {
                    alert("❌ Only 2 attempts allowed!");
                    return;
                }

                return db.collection("scores").add({
                    email: email,
                    score: score,
                    total: questions.length,
                    attempted: attempted,
                    timestamp: new Date()
                })
                .then(() => {
                    return db.collection("attempts").doc(userId).set({
                        attempts: attempts + 1
                    });
                })
                .then(() => {

                    localStorage.setItem("score", score);
                    localStorage.setItem("total", questions.length);
                    localStorage.setItem("attempted", attempted);

                    window.location.href = "result.html";
                });
            })
            .catch((error) => {
                console.log("Error:", error);
            });
        });
    }
}

// ================= START QUIZ =================
function startQuiz() {

    auth.onAuthStateChanged((user) => {

        if (!user) {
            alert("Login first");
            window.location.href = "login.html";
            return;
        }

        let userId = user.uid;

        db.collection("attempts").doc(userId).get()
        .then((doc) => {

            let attempts = doc.exists ? doc.data().attempts : 0;

            if (attempts >= 2) {
                alert("❌ You already used 2 attempts");

                auth.signOut().then(() => {
                    window.location.href = "login.html";
                });

            } else {
                score = 0;
                currentIndex = 0;
                attempted = 0;
                submitted = false; // reset

                window.location.href = "quiz.html";
            }
        });
    });
}


// ================= PAGE LOAD =================
window.onload = function () {
    if (document.getElementById("question")) {
        loadQuestions();
    }
};
