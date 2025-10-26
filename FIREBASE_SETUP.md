# Konfiguracja Firebase dla Enduro Tracker

## Krok 1: Utwórz projekt Firebase

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Kliknij "Add project" lub "Dodaj projekt"
3. Podaj nazwę projektu, np. "Enduro Tracker"
4. (Opcjonalnie) Włącz Google Analytics
5. Kliknij "Create project"

## Krok 2: Dodaj aplikację Web do projektu

1. W Firebase Console wybierz swój projekt
2. Kliknij ikonę **</>** (Web) aby dodać aplikację web
3. Podaj nazwę aplikacji, np. "Enduro Tracker Web"
4. Kliknij "Register app"

## Krok 3: Skopiuj dane konfiguracyjne

Firebase wyświetli kod konfiguracyjny podobny do:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "twoj-projekt.firebaseapp.com",
  projectId: "twoj-projekt",
  storageBucket: "twoj-projekt.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

Skopiuj te dane!

## Krok 4: Wklej konfigurację do aplikacji

Otwórz plik `src/config/firebase.ts` i zastąp wartości placeholderów swoimi danymi:

```typescript
const firebaseConfig = {
  apiKey: "TWÓJ_API_KEY",              // <- Wklej apiKey
  authDomain: "TWÓJ_PROJECT_ID.firebaseapp.com",  // <- Wklej authDomain
  projectId: "TWÓJ_PROJECT_ID",        // <- Wklej projectId
  storageBucket: "TWÓJ_PROJECT_ID.appspot.com",  // <- Wklej storageBucket
  messagingSenderId: "TWÓJ_SENDER_ID", // <- Wklej messagingSenderId
  appId: "TWOJA_APP_ID"                // <- Wklej appId
};
```

## Krok 5: Włącz Email/Password Authentication

1. W Firebase Console przejdź do **Authentication** → **Sign-in method**
2. Kliknij na **Email/Password**
3. Włącz (toggle ON) opcję "Email/Password"
4. Kliknij "Save"

## Krok 6: (Opcjonalne) Włącz Firestore Database

Jeśli chcesz przechowywać dane użytkowników w bazie danych:

1. W Firebase Console przejdź do **Firestore Database**
2. Kliknij "Create database"
3. Wybierz tryb:
   - **Production mode** - dla produkcji (musisz skonfigurować reguły)
   - **Test mode** - dla testów (otwarte reguły przez 30 dni)
4. Wybierz lokalizację serwera (np. europe-west3)
5. Kliknij "Enable"

## Krok 7: Testuj aplikację

1. Uruchom aplikację: `npx expo start`
2. Przejdź do ekranu rejestracji
3. Utwórz nowe konto z emailem i hasłem
4. Zaloguj się używając utworzonego konta

## Funkcje systemu logowania

### ✅ Co zostało zaimplementowane:

- **Rejestracja** - tworzenie nowych kont email/hasło
- **Logowanie** - uwierzytelnianie użytkowników
- **Wylogowanie** - funkcja logout w ProfileScreen
- **Zarządzanie sesją** - automatyczne sprawdzanie stanu logowania
- **Walidacja** - sprawdzanie poprawności danych
- **Obsługa błędów** - przyjazne komunikaty błędów w języku polskim
- **Profil użytkownika** - wyświetlanie danych zalogowanego użytkownika

### 📱 Ekrany:

- `LoginScreen` - ekran logowania
- `RegisterScreen` - ekran rejestracji
- `ProfileScreen` - profil użytkownika z przyciskiem wylogowania

### 🔐 Bezpieczeństwo:

- Hasła są bezpiecznie hashowane przez Firebase
- Sesje użytkowników są zarządzane automatycznie
- Dane wrażliwe nie są przechowywane lokalnie

## Rozwiązywanie problemów

### Problem: "Firebase: Error (auth/configuration-not-found)"
**Rozwiązanie:** Sprawdź czy poprawnie skopiowałeś dane konfiguracyjne do `src/config/firebase.ts`

### Problem: "Firebase: Error (auth/operation-not-allowed)"
**Rozwiązanie:** Włącz Email/Password authentication w Firebase Console (Krok 5)

### Problem: Aplikacja nie uruchamia się
**Rozwiązanie:** Upewnij się, że zainstalowałeś wszystkie zależności:
```bash
npm install
```

## Następne kroki (opcjonalne)

- Dodaj resetowanie hasła
- Dodaj logowanie przez Google/Facebook
- Zapisuj dane użytkowników w Firestore
- Dodaj weryfikację emaila
- Implementuj role użytkowników (admin, user)

## Przydatne linki

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth dla Web](https://firebase.google.com/docs/auth/web/start)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
