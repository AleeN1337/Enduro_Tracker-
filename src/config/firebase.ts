import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Konfiguracja Firebase - UWAGA: Należy zastąpić własnymi danymi z Firebase Console
// Aby uzyskać te dane:
// 1. Przejdź do https://console.firebase.google.com/
// 2. Utwórz nowy projekt lub wybierz istniejący
// 3. Przejdź do Project Settings (ikona zębatki) -> General
// 4. Przewiń do sekcji "Your apps" i kliknij </> (Web app)
// 5. Skopiuj dane konfiguracyjne
const firebaseConfig = {
  apiKey: "TWÓJ_API_KEY",
  authDomain: "TWÓJ_PROJECT_ID.firebaseapp.com",
  projectId: "TWÓJ_PROJECT_ID",
  storageBucket: "TWÓJ_PROJECT_ID.appspot.com",
  messagingSenderId: "TWÓJ_SENDER_ID",
  appId: "TWOJA_APP_ID"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);

// Inicjalizacja Auth
const auth = getAuth(app);

// Inicjalizacja Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
