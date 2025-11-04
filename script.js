import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
const startBtn = document.getElementById('start-vote-btn');
const welcomePage = document.getElementById('welcome-page');
const firebaseSection = document.getElementById('firebase-section');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        welcomePage.classList.add('hidden');
        firebaseSection.classList.remove('hidden');
        setupFirebaseAndAuth();
    });
}

  const firebaseConfig = {
    apiKey: "AIzaSyCulrjZvnInfioftdsZ3G1UwiXMyEdA3Rk",
    authDomain: "nacos-election-live.firebaseapp.com",
    projectId: "nacos-election-live",
    storageBucket: "nacos-election-live.firebasestorage.app",
    messagingSenderId: "575146331407",
    appId: "1:575146331407:web:a1b80b28c8d6035aa7027a"
  };


const APP_ID_FOR_DEPLOYMENT = 'nacos-voter-app-live'; 



const HARDCODED_ELECTION = {
    id: 'nacos_comp_sci_2025',
    title: 'NACOS Computer Science Election 2025',
    positions: [
        { id: 'president', title: 'NACOS President', candidates: ['Adesola Adegoke', 'Boluwatife Ige', 'Elijah Samson'] },
        { id: 'vice_president', title: 'NACOS Vice President', candidates: ['Chidinma Okoro', 'Musa Bello'] },
        { id: 'welfare_director', title: 'Welfare Director', candidates: ['Toluwani Oladipo', 'Zainab Mohammed'] },
        { id: 'treasurer', title: 'Treasurer', candidates: ['Kelechi Nwankwo', 'Femi Adesanya'] },
        { id: 'librarian', title: 'Librarian', candidates: ['Grace Johnson', 'Daniel Olorunfemi'] },
    ],
};

let db = null;
let auth = null;
let userId = null;
let hasVoted = false; 

// --- UTILITY FUNCTIONS ---

const getCollectionPath = (type, uid = userId) => {

    switch (type) {
        case 'VOTER_STATUS':

        return `/artifacts/${APP_ID_FOR_DEPLOYMENT}/users/${uid}/voter_status`;
        case 'BALLOTS':

        return `/artifacts/${APP_ID_FOR_DEPLOYMENT}/public/data/ballots`;
        default:
            throw new Error(`Unknown collection type: ${type}`);
    }
};


const confirmAction = (message) => {
    return window.confirm(message); 
};


const setupFirebaseAndAuth = async () => {
    
    if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY") {
        document.getElementById('content').innerHTML = `
            <div class="p-8 bg-red-100 rounded-lg card">
                <h2 class="text-2xl font-semibold text-red-700">Deployment Setup Error</h2>
                <p class="mt-2 text-lg text-red-600">
                    You must replace the **FIREBASE CONFIGURATION PLACEHOLDERS** at the top of **script.js** with your live project credentials.
                </p>
            </div>
        `;
        return; 
    }

    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
       
        await signInAnonymously(auth);

        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                checkVoterStatusAndRender(); 
            } else {
                renderErrorMessage("Authentication failed. Please reload the page.");
            }
        });

    } catch (error) {
        console.error("Firebase Initialization Error:", error);
        renderErrorMessage(`Critical Error during setup: ${error.message}`);
    }
};

const checkVoterStatusAndRender = () => {
    if (!userId) return;

    const electionId = HARDCODED_ELECTION.id;
    const voterStatusRef = doc(db, getCollectionPath('VOTER_STATUS'), electionId);
    
    
    onSnapshot(voterStatusRef, (docSnap) => {
        const status = docSnap.exists() ? docSnap.data() : { hasVoted: false };
        hasVoted = status.hasVoted === true;

        if (hasVoted) {
            renderVotedScreen(); 
        } else {
            renderVoterBallot(); 
        }
    }, (error) => {
        console.error("Error listening to voter status:", error);
        renderErrorMessage("Could not load voter status. Check console for details.");
    });
};


const renderErrorMessage = (message) => {
    document.getElementById('content').innerHTML = `
        <div class="p-8 bg-red-100 rounded-lg card">
            <h2 class="text-2xl font-semibold text-red-700">System Error</h2>
            <p class="mt-2 text-lg text-red-600">${message}</p>
        </div>
    `;
};

const renderVoterBallot = () => {
    if (hasVoted) return; 

    const content = document.getElementById('content');
    let html = `<form id="voting-ballot-form" class="space-y-6 text-left">`;
    
    HARDCODED_ELECTION.positions.forEach(position => {
        html += `
            <div class="p-5 bg-gray-50 rounded-xl card border-l-4 border-teal-600">
                <h3 class="text-xl font-bold mb-3 text-gray-800">${position.title}</h3>
                <div class="space-y-2">
        `;
        
        position.candidates.forEach(candidate => {
            const inputId = `${position.id}-${candidate.replace(/\s/g, '_')}`;
            
            html += `
                <input type="radio" id="${inputId}" name="${position.id}" value="${candidate}" class="hidden" required>
                <label for="${inputId}" class="candidate-label flex items-center p-3 bg-white rounded-lg cursor-pointer shadow-sm">
                    <span class="ml-3 text-base font-medium text-gray-700">${candidate}</span>
                </label>
            `;
        });
        
        html += `</div></div>`;
    });
    
    html += `
            <button type="submit" class="w-full button-primary p-4 text-white font-bold text-xl mt-8 shadow-lg transition transform hover:scale-[1.01]">
                Cast My Vote Securely
            </button>
        </form>
    `;
    
    content.innerHTML = html;
    document.getElementById('voting-ballot-form')?.addEventListener('submit', handleCastVote);
};


const renderVotedScreen = () => {
     document.getElementById('content').innerHTML = `
        <div class="p-10 bg-teal-50 rounded-xl card border-t-4 border-teal-600 animate-in fade-in duration-500">
            <svg class="w-20 h-20 mx-auto text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h2 class="text-3xl font-bold text-teal-700 mt-4">Thank You! 🎉</h2>
            <p class="mt-3 text-xl text-teal-600">Your vote for the ${HARDCODED_ELECTION.title} has been successfully cast.</p>
            <p class="mt-5 text-gray-500 text-sm">You have already completed the ballot for this election.</p>
            
            <!-- Display User ID as requested -->
            <div class="mt-6 p-3 bg-teal-100 rounded-lg">
                <p class="text-sm font-semibold text-teal-800">Your User ID:</p>
                <p class="text-xs text-teal-700 break-all">${userId}</p>
            </div>

            <!-- Main Menu Button with window.location.href -->
            <button id="main-menu-btn" class="w-full button-primary p-3 text-white font-bold text-lg mt-8 shadow-lg transition transform hover:scale-[1.01]">
                Go to Main Menu
            </button>
        </div>
    `;
    
    document.getElementById('main-menu-btn')?.addEventListener('click', () => {
        window.location.href = '/'; 
    });
};


const handleCastVote = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    if (!userId || !db) return renderErrorMessage("System not fully initialized. Cannot submit vote.");

   
    let voteData = {};
    HARDCODED_ELECTION.positions.forEach(position => {
        const selected = form.elements[position.id].value;
        voteData[position.id] = selected;
    });
    
    if (!confirmAction('Are you sure you want to submit your vote? You cannot change it later.')) return;
    
    document.getElementById('content').innerHTML = `
        <div class="p-8 text-center text-gray-500">
            <svg class="animate-spin h-8 w-8 mx-auto text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="mt-2 font-semibold text-lg text-teal-600">Casting Secure Ballot...</p>
        </div>`;

    try {
        const electionId = HARDCODED_ELECTION.id;

        
        const ballotsColRef = collection(db, getCollectionPath('BALLOTS'));
        await addDoc(ballotsColRef, {
            electionId: electionId,
            ballot: voteData,
            timestamp: serverTimestamp()
        });
        console.log("Anonymous ballot submitted.");


        const voterStatusRef = doc(db, getCollectionPath('VOTER_STATUS'), electionId);
        await setDoc(voterStatusRef, { hasVoted: true, votedAt: serverTimestamp() }, { merge: true });
        console.log("Voter status updated.");


    } catch (error) {
        console.error("Error casting vote:", error);
        renderErrorMessage(`Submission Error: ${error.message}. Please reload and try again.`);
    }
};


