# EduFlow - Platforma e-learningowa

EduFlow to full-stackowa platforma e-learningowa zbudowana przy użyciu Vue 3, TypeScript, Node.js, Express, Prisma i PostgreSQL. Projekt umożliwia nauczycielom zarządzanie kursami i lekcjami, studentom naukę oraz śledzenie postępów, a administratorowi nadzór nad użytkownikami, wiadomościami i aktywnością na platformie.

Wersja angielska: [README.md](./README.md)

![Vue](https://img.shields.io/badge/Vue%203-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-F6D32D?style=for-the-badge&logo=pinia&logoColor=black)
![Vue Router](https://img.shields.io/badge/Vue_Router-4B8BF5?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

## Spis treści

- [Widoki aplikacji](#widoki-aplikacji)
- [Funkcjonalności](#funkcjonalności)
- [Architektura](#architektura)
- [Bezpieczeństwo](#bezpieczeństwo)
- [Stack technologiczny](#stack-technologiczny)
- [Uruchomienie projektu](#uruchomienie-projektu)
- [Struktura projektu](#struktura-projektu)
- [Uwagi](#uwagi)

## Widoki aplikacji

### Home View

Główny widok po zalogowaniu, z szybkim dostępem do kursów, nawigacji zależnej od roli i najważniejszych sekcji systemu.

### Courses List

Lista kursów z wyszukiwaniem i paginacją, umożliwiająca przeglądanie dostępnych materiałów i przechodzenie do szczegółów kursu.

### Course Details

Widok pojedynczego kursu z opisem i listą lekcji, dostosowany do uprawnień aktualnego użytkownika.

### Lesson View

Widok lekcji z treścią, linkami do materiałów wideo oraz dostępem do zabezpieczonych plików PDF.

### Teacher Dashboard

Panel nauczyciela do zarządzania własnymi kursami, lekcjami, zapisami studentów, kolejnością lekcji i komunikacją.

### Messages / Notifications

Widok wiadomości oraz powiadomień z licznikami nieprzeczytanych elementów i regularnym odświeżaniem danych.

### Auth (Login / Register)

Widok logowania i rejestracji z obsługą sesji, odświeżania tokenów oraz ochroną tras w zależności od roli użytkownika.

## Funkcjonalności

### Autoryzacja i sesje

- Rejestracja i logowanie użytkowników.
- Haszowanie haseł z użyciem `bcryptjs`.
- JWT access token oraz refresh token oparty o przechowywanie hasha w bazie.
- Rotacja refresh tokenów oraz unieważnianie już wykorzystanych tokenów.
- Zarządzanie sesjami: lista sesji, wylogowanie pojedynczej sesji, pozostałych sesji lub wszystkich sesji.
- Śledzenie sesji per urządzenie dzięki `deviceId`.
- Ochrona tras i endpointów dla ról `STUDENT`, `TEACHER`, `ADMIN`.
- Rate limiting dla logowania, rejestracji, refresh i logout.

### Kursy i lekcje

- Przeglądanie kursów z paginacją i wyszukiwaniem.
- Widok szczegółów kursu i listy lekcji.
- Tworzenie, edycja i usuwanie kursów przez nauczyciela lub administratora.
- CRUD lekcji z kontrolą właściciela kursu.
- Obsługa kolejności lekcji oraz automatyczne porządkowanie po zmianach.
- Lekcje mogą zawierać treść, link do wideo, czas trwania i plik PDF.
- Upload PDF po stronie backendu z walidacją typu pliku.
- Ochrona dostępu do plików PDF zależnie od roli i zapisu na kurs.

### Panel studenta

- Widok tylko zapisanych kursów.
- Oznaczanie lekcji jako ukończonych.
- Śledzenie postępu w kursie.
- Powiadomienie po ukończeniu całego kursu.
- Możliwość rozpoczęcia rozmowy z nauczycielem przypisanym do kursu.

### Wiadomości i powiadomienia

- Rozmowy student-nauczyciel powiązane z kursem.
- Bezpośrednie wiadomości administratora do użytkowników.
- Skrzynka odbiorcza z licznikami nieprzeczytanych wiadomości.
- Oznaczanie rozmów jako przeczytane.
- Powiadomienia o nowych wiadomościach, zapisaniu na kurs, usunięciu z kursu i ukończeniu kursu.
- Polling na froncie dla wiadomości i powiadomień.

### Panel administratora

- Statystyki platformy, m.in. liczba użytkowników i kursów.
- Przegląd użytkowników z filtrami i zmianą roli.
- Wymuszanie wylogowania użytkownika.
- Przegląd kursów w systemie.
- Wysyłanie wiadomości i powiadomień do wybranych użytkowników lub grup.

## Architektura

### Frontend

- Vue 3 z Composition API.
- TypeScript.
- Pinia do zarządzania stanem.
- Vue Router z guardami zależnymi od roli.
- Axios z obsługą autoryzacji i ciasteczek.
- Struktura oparta o podział na `views`, `stores`, `components`, `api`, `router` i `utils`.

### Backend

- Node.js + Express.
- Prisma ORM z PostgreSQL.
- Moduły domenowe: `auth`, `courses`, `lessons`, `student`, `teacher`, `messages`, `notifications`, `admin`.
- Warstwowa architektura:
  `routes -> controllers -> services -> database`
- Wspólne middleware dla auth, autoryzacji i obsługi błędów.
- Lokalne przechowywanie PDF-ów lekcji w `backend/uploads/pdf`.

### Główne założenia

- DTO i mappery do oddzielenia modeli bazy od odpowiedzi API.
- Wyraźny podział odpowiedzialności między warstwy aplikacji.
- Logika uprawnień i ownership checks po stronie backendu.
- Paginacja oparta o `page/limit` lub cursor, zależnie od modułu.

## Bezpieczeństwo

- `httpOnly` refresh token cookies.
- Haszowanie refresh tokenów przed zapisem w bazie.
- Rotacja refresh tokenów i odrzucanie zastąpionych tokenów.
- Unieważnianie sesji oraz limit aktywnych sesji per użytkownik.
- Role-based access control na froncie i backendzie.
- Walidacja danych wejściowych.
- Rate limiting dla wybranych endpointów.
- Ochrona dostępu do PDF-ów na podstawie roli, ownership i zapisów na kurs.
- CORS z jawnie ustawionym adresem frontendu.

## Stack technologiczny

### Frontend

- Vue 3
- TypeScript
- Pinia
- Vue Router
- Axios
- Vite

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Multer

### Inne

- JWT
- REST API
- Cookie-based refresh flow

## Uruchomienie projektu

### Wymagania

- Node.js `20+`
- npm
- PostgreSQL

### 1. Klonowanie repozytorium

```bash
git clone [repository-url]
```

### 2. Konfiguracja backendu

Utwórz plik `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/YOUR_DATABASE_NAME"
PORT=3000
FRONTEND_ORIGIN="http://localhost:5173"
NODE_ENV=development
JWT_ACCESS_SECRET="your_strong_access_secret_here"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
AUTH_MAX_ACTIVE_SESSIONS_PER_USER=10
AUTH_SESSION_RETENTION_DAYS=30
```

Zainstaluj zależności i przygotuj bazę:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

Uruchom backend:

```bash
npm run dev
```

Domyślny adres backendu:

```text
http://localhost:3000
```

### 3. Konfiguracja frontendu

Utwórz plik `frontend/.env`:

```env
VITE_API_BASE_URL="http://localhost:3000"
```

Zainstaluj zależności i uruchom frontend:

```bash
cd frontend
npm install
npm run dev
```

Domyślny adres frontendu:

```text
http://localhost:5173
```

### 4. Zalecana kolejność uruchamiania

1. Uruchom PostgreSQL.
2. Upewnij się, że istnieje użytkownik bazy zgodny z danymi w `DATABASE_URL`.
3. Utwórz bazę danych wskazaną w `DATABASE_URL`, jeśli jeszcze nie istnieje.
4. Wykonaj kroki instalacyjne dla backendu i frontendu opisane wyżej.
5. Otwórz frontend w przeglądarce i zarejestruj konto albo zaloguj się.
6. Nowe konta otrzymują domyślnie rolę `STUDENT`, więc dostęp do panelu nauczyciela lub administratora wymaga zmiany roli w bazie lub przez istniejące konto admina.

## Uwagi

- Projekt zawiera pole `isActive`, a logika autoryzacji uwzględnia nieaktywne konta, ale panel administratora nie ma jeszcze pełnej funkcji blokowania i odblokowywania użytkowników.
- Zastąpienie pollingu w wiadomościach i powiadomieniach przez WebSockety byłoby naturalnym kolejnym krokiem.
- W projekcie nie ma jeszcze dedykowanych testów automatycznych. Dobrym rozwinięciem byłyby testy jednostkowe dla serwisów, testy integracyjne dla endpointów API i testy end-to-end dla głównych flow użytkownika.
- Osobny storage dla plików PDF byłby lepszym rozwiązaniem niż wyłącznie lokalne przechowywanie po stronie serwera.
