# 🏍️ Enduro Tracker

Aplikacja mobilna dla społeczności hard-enduro, umożliwiająca dzielenie się lokalizacjami ciekawych miejscówek, śledzenie przejazdów GPS i budowanie społeczności pasjonatów.

## 🚀 Funkcjonalności

### 🗺️ Mapa interaktywna

- Wyświetlanie miejsc enduro na mapie
- Markery z poziomami trudności (łatwy/średni/trudny/ekstremalny)
- Kategoryzacja (podjazdy, sekcje techniczne, skoki, błoto, kamienie)
- Geolokalizacja użytkownika

### 📍 Zarządzanie miejscówkami

- Przeglądanie listy wszystkich miejscówek
- Filtrowanie po poziomie trudności
- Oceny i komentarze społeczności
- System tagów (#kamienie #błoto #stromy_podjazd)

### 📱 GPS Tracking

- Śledzenie trasy w czasie rzeczywistym
- Statystyki przejażdżki (dystans, czas, prędkość)
- Historia wszystkich przejazdów
- Automatyczne wykrywanie odwiedzonych miejscówek

### 👤 Profil użytkownika

- Statystyki osobiste (łączny dystans, liczba przejazdów)
- System osiągnięć
- Ulubione miejscówki
- Historia aktywności

## 🛠️ Technologie

- **React Native** + **Expo SDK 53** - framework mobilny
- **TypeScript** - bezpieczeństwo typów
- **React Navigation** - nawigacja w aplikacji
- **React Native Maps** - integracja z mapami
- **Expo Location** - usługi GPS i geolokalizacji
- **SQLite** - lokalna baza danych

## 🔧 Instalacja i uruchomienie

### Wymagania

- Node.js 18+
- Expo CLI
- Expo Go (aplikacja na telefonie) lub emulator

### Kroki instalacji

1. **Klonowanie projektu**

   ```bash
   git clone <repository-url>
   cd Enduro_Tracker
   ```

2. **Instalacja zależności**

   ```bash
   npm install
   ```

3. **Uruchomienie aplikacji**

   ```bash
   npm start
   ```

4. **Testowanie na urządzeniu**
   - Zainstaluj aplikację **Expo Go** na swoim telefonie
   - Zeskanuj QR kod wyświetlony w terminalu
   - Lub użyj emulatora: `npm run android` / `npm run ios`

## 📱 Dostępne komendy

```bash
npm start          # Uruchomienie Expo dev server
npm run android    # Uruchomienie na emulatorze Android
npm run ios        # Uruchomienie na emulatorze iOS (tylko macOS)
npm run web        # Uruchomienie w przeglądarce
```

## 🏗️ Struktura projektu

```
src/
├── components/     # Komponenty wielokrotnego użytku
├── navigation/     # Konfiguracja nawigacji
├── screens/        # Ekrany aplikacji
│   ├── MapScreen.tsx
│   ├── SpotsListScreen.tsx
│   ├── TrackingScreen.tsx
│   └── ProfileScreen.tsx
├── services/       # Usługi (API, baza danych)
└── types/          # Typy TypeScript
```

## 🎯 Plany rozwoju

### Phase 1 (Obecna)

- ✅ Podstawowa nawigacja
- ✅ Mapa z markerami
- ✅ Lista miejscówek z filtrami
- ✅ GPS tracking
- ✅ Profil użytkownika

### Phase 2 (Przyszłość)

- 🔄 Dodawanie nowych miejscówek przez użytkowników
- 🔄 System komentarzy i ocen
- 🔄 Udostępnianie zdjęć lokalizacji
- 🔄 Mapy offline
- 🔄 Grupy użytkowników i eventy

### Phase 3 (Long-term)

- 🔄 Backend API i synchronizacja
- 🔄 System przyjaciół
- 🔄 Leaderboardy i rankingi
- 🔄 Integracja z social media
- 🔄 Powiadomienia push

## 🎨 Design System

### Kolory

- **Primary**: #FF6B35 (Pomarańczowy)
- **Success**: #4CAF50 (Zielony)
- **Warning**: #FF9800 (Pomarańczowy)
- **Error**: #F44336 (Czerwony)
- **Info**: #2196F3 (Niebieski)

### Poziomy trudności

- 🟢 **Łatwy**: #4CAF50
- 🟡 **Średni**: #FF9800
- 🔴 **Trudny**: #F44336
- 🟣 **Ekstremalny**: #9C27B0

## 📄 Licencja

Ten projekt jest licencjonowany na podstawie licencji MIT.

## 🤝 Wkład w projekt

Zapraszamy do współpracy! Aby wnieść swój wkład:

1. Fork projektu
2. Stwórz branch dla swojej funkcjonalności
3. Commit swoich zmian
4. Push do branch
5. Otwórz Pull Request

## 📞 Kontakt

W razie pytań lub sugestii, prosimy o kontakt przez Issues na GitHubie.

---

Stworzono z ❤️ dla społeczności hard-enduro
