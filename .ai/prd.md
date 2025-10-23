# **Dokument wymagań produktu (PRD) \- Szybkie Kalorie**

## **1\. Przegląd produktu**

"Szybkie Kalorie" to aplikacja internetowa (MVP) zaprojektowana w celu uproszczenia procesu liczenia kalorii i makroskładników. Głównym celem produktu jest usunięcie bariery wejścia dla osób, które chcą świadomie kontrolować swoją dietę, ale są zniechęcone czasochłonnością i złożonością istniejących narzędzi. Aplikacja wykorzystuje model AI do szacowania wartości odżywczych na podstawie prostego opisu tekstowego posiłku, co czyni proces szybkim i intuicyjnym. Użytkownicy mogą również ręcznie wprowadzać dane, ustalać własne dzienne cele kaloryczne oraz przeglądać swoje postępy na przejrzystym dashboardzie. Produkt skierowany jest do osób aktywnych i świadomych żywieniowo, które cenią sobie czas i prostotę.

## **2\. Problem użytkownika**

Głównym problemem, który rozwiązuje aplikacja, jest wysiłek i czas wymagany do dokładnego śledzenia kalorii i makroskładników. Proces ręcznego wyszukiwania produktów, ważenia składników i wprowadzania danych do skomplikowanych aplikacji jest uciążliwy i często prowadzi do porzucenia celu kontrolowania diety. Brak prostego, szybkiego narzędzia zniechęca potencjalnych użytkowników do podejmowania pierwszych kroków w kierunku zmiany nawyków żywieniowych lub efektywnego zarządzania masą ciała. "Szybkie Kalorie" ma na celu zminimalizowanie tego tarcia, oferując szacowanie wartości odżywczych na podstawie języka naturalnego, co sprawia, że codzienne monitorowanie diety staje się proste i dostępne dla każdego.

## **3\. Wymagania funkcjonalne**

### **3.1. System Kont i Ustawienia**

* Użytkownik może założyć konto podając adres e-mail i hasło.  
* Użytkownik może zalogować się na swoje konto.  
* Użytkownik może skorzystać z funkcji "Zapomniałem hasła", która wysyła link do resetu na podany adres e-mail.  
* Hasła użytkowników muszą być przechowywane w formie zahaszowanej (np. bcrypt).  
* Dane poszczególnych użytkowników muszą być od siebie w pełni odizolowane.  
* Sesja użytkownika jest utrzymywana przez 30 dni.  
* W panelu ustawień użytkownik może zarządzać swoim dziennym celem kalorycznym (w Kcal).  
* Użytkownik może poprosić o usunięcie swojego konta poprzez wysłanie prośby na wskazany adres e-mail.

### **3.2. Dodawanie Posiłku (Główny Przepływ)**

* Interfejs dodawania posiłku jest domyślnie ustawiony na tryb AI ("Opisz swój posiłek...").  
* Użytkownik może przełączyć się na tryb manualnego wprowadzania danych.  
* Użytkownik może opcjonalnie przypisać posiłek do jednej z kategorii: Śniadanie, Obiad, Kolacja, Przekąska, Inne.  
* Użytkownik może opcjonalnie wybrać datę i godzinę posiłku (domyślnie ustawiony jest aktualny czas).  
* Użytkownik może anulować proces dodawania posiłku, a zmiany nie zostaną zapisane.

### **3.3. Logika AI**

* System przetwarza opis tekstowy posiłku i zwraca oszacowaną liczbę kalorii (wymagane) oraz opcjonalnie makroskładniki (Białko, Węglowodany, Tłuszcze).  
* Jeśli AI dokonało założenia (np. "duża miska" \= 450ml), informacja ta jest wyświetlana użytkownikowi pod wynikiem.  
* Jeśli AI nie jest w stanie oszacować makroskładników, wyświetla komunikat "Makroskładniki nie zostały oszacowane.".  
* Jeśli AI nie rozumie opisu, prosi użytkownika o jego doprecyzowanie, dając możliwość ponownego wygenerowania wyniku lub przejścia do trybu manualnego.

### **3.4. Logika Manualna**

* Użytkownik może ręcznie wprowadzić liczbę kalorii (wymagane) oraz opcjonalnie makroskładniki (B/W/T).  
* System ostrzega użytkownika (ale nie blokuje zapisu), jeśli suma kalorii z makroskładników (B\*4 \+ W\*4 \+ T\*9) różni się o więcej niż 5% od podanej liczby kalorii.

### **3.5. Dashboard (Ekran Główny)**

* Dashboard wyświetla listę dni, posortowaną od najnowszego do najstarszego.  
* Każdy wpis na liście zawiera datę, sumę spożytych kalorii oraz ustawiony cel kaloryczny (np. "Środa, 15/10: 2150 / 2500 Kcal").  
* Wskaźnik wizualny (np. kolor tła lub paska postępu) informuje o statusie realizacji celu:  
  * Kolor Szary: Poniżej celu kalorycznego.  
  * Kolor Zielony: W ramach celu (Cel ± 100 Kcal).  
  * Kolor Pomarańczowy: Powyżej celu (więcej niż Cel \+ 100 Kcal).

### **3.6. Widok Dnia i Zarządzanie Wpisami**

* Po kliknięciu na dany dzień, użytkownik widzi listę posiłków z tego dnia, posortowaną od najstarszego do najnowszego.  
* Kliknięcie na wpis z posiłkiem otwiera widok jego edycji.  
* Przy każdym wpisie znajduje się ikona umożliwiająca jego usunięcie (po potwierdzeniu w oknie modalnym).

### **3.7. Wymagania Niefunkcjonalne**

* Platforma: Aplikacja internetowa musi być w pełni responsywna (RWD, Mobile First).  
* Wspierane przeglądarki: Dwie najnowsze, stabilne wersje Chrome, Firefox, Safari.  
* Onboarding: Przy pierwszym logowaniu użytkownik przechodzi przez krótki, 3-krokowy samouczek wyjaśniający działanie aplikacji.  
* Obsługa błędów: Aplikacja wyświetla przyjazną dla użytkownika stronę błędu w przypadku awarii serwera (błąd 500).  
* Treści: Wszystkie komunikaty w aplikacji (onboarding, walidacje, błędy) zostaną przygotowane przez PM.

## **4\. Granice produktu**

### **W zakresie MVP**

* Rejestracja i logowanie (e-mail/hasło).  
* Ręczne ustawianie celu kalorycznego.  
* Szacowanie kalorii i opcjonalnie makroskładników z tekstu (AI).  
* Ręczne wprowadzanie podsumowania kalorycznego.  
* Przeglądanie, edycja i usuwanie wpisów.  
* Dashboard z listą dni i wskaźnikiem realizacji celu.  
* Aplikacja w wersji webowej (RWD).

### **Poza zakresem MVP**

* Tworzenie podsumowań na podstawie zdjęć lub nagrań dźwiękowych.  
* Planowanie diet i propozycji dań.  
* Funkcje społecznościowe (np. udostępnianie wyników trenerom).  
* Integracje z zewnętrznymi aplikacjami (zdrowotnymi, treningowymi).  
* Dedykowana aplikacja mobilna (iOS/Android).  
* Automatyczne obliczanie zapotrzebowania kalorycznego (TDEE).  
* Śledzenie historii wagi lub innych pomiarów ciała.  
* Zapisywanie ulubionych/własnych posiłków.  
* Podsumowania tygodniowe/miesięczne.

## **5\. Historyjki użytkowników**

* ID: US-001  
* Tytuł: Rejestracja nowego użytkownika  
* Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, aby uzyskać dostęp do aplikacji.  
* Kryteria akceptacji:  
  1. Formularz rejestracji zawiera pola: "E-mail", "Hasło", "Powtórz hasło".  
  2. System waliduje poprawność formatu adresu e-mail.  
  3. System sprawdza, czy hasła w obu polach są identyczne.  
  4. Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do ekranu ustawiania celu kalorycznego.  
* ID: US-002  
* Tytuł: Logowanie do systemu  
* Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji za pomocą mojego e-maila i hasła, aby kontynuować śledzenie diety.  
* Kryteria akceptacji:  
  1. Formularz logowania zawiera pola "E-mail" i "Hasło".  
  2. Po podaniu poprawnych danych jestem zalogowany i przekierowany na główny dashboard.  
  3. W przypadku podania błędnych danych wyświetlany jest komunikat o błędzie.  
* ID: US-003  
* Tytuł: Resetowanie zapomnianego hasła  
* Opis: Jako użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, aby odzyskać dostęp do konta.  
* Kryteria akceptacji:  
  1. Na stronie logowania znajduje się link "Zapomniałem hasła".  
  2. Po podaniu adresu e-mail i kliknięciu przycisku, na moją skrzynkę zostaje wysłany link do resetu hasła.  
  3. Link jest unikalny i ma ograniczony czas ważności.  
  4. Po kliknięciu w link jestem przekierowany do formularza, gdzie mogę ustawić nowe hasło.  
* ID: US-004  
* Tytuł: Pierwsze ustawienie celu kalorycznego  
* Opis: Jako nowy użytkownik, zaraz po rejestracji chcę ustawić mój dzienny cel kaloryczny, aby aplikacja mogła śledzić moje postępy.  
* Kryteria akceptacji:  
  1. Po pierwszej rejestracji wyświetlany jest ekran z prośbą o podanie dziennego celu kalorycznego (w Kcal).  
  2. Pole akceptuje tylko wartości liczbowe.  
  3. Po zapisaniu celu jestem przekierowany na dashboard.  
* ID: US-005  
* Tytuł: Dodawanie posiłku za pomocą AI  
* Opis: Jako użytkownik, chcę opisać swój posiłek w polu tekstowym i uzyskać od AI oszacowanie jego kaloryczności, aby szybko dodać wpis.  
* Kryteria akceptacji:  
  1. Na ekranie dodawania posiłku widoczne jest pole tekstowe.  
  2. Po wpisaniu opisu i kliknięciu "Oblicz", system wyświetla oszacowane Kcal i (jeśli to możliwe) makroskładniki.  
  3. Pod wynikiem wyświetlana jest adnotacja, jeśli AI dokonało założeń (np. dotyczących gramatury).  
  4. Mogę zatwierdzić wynik, aby dodać posiłek do mojego dnia.  
* ID: US-006  
* Tytuł: Dodawanie posiłku manualnie  
* Opis: Jako użytkownik, chcę mieć możliwość ręcznego wprowadzenia wartości kalorycznej posiłku, gdy znam ją z etykiety lub AI nie działa poprawnie.  
* Kryteria akceptacji:  
  1. Na ekranie dodawania posiłku mogę przełączyć się do trybu manualnego.  
  2. Widoczne są pola: "Kalorie" (wymagane), "Białko", "Węglowodany", "Tłuszcze" (opcjonalne).  
  3. Po wypełnieniu i zapisaniu, wpis jest dodawany do listy posiłków.  
* ID: US-007  
* Tytuł: Obsługa niejednoznacznego opisu przez AI  
* Opis: Jako użytkownik, jeśli podam zbyt ogólny opis posiłku, chcę otrzymać prośbę o jego doprecyzowanie, aby uzyskać dokładniejszy wynik.  
* Kryteria akceptacji:  
  1. Gdy AI nie może przetworzyć opisu, wyświetla komunikat z prośbą o dodanie szczegółów (np. wagi, składników).  
  2. Widoczne są przyciski "Generuj ponownie" (aktywny po zmianie tekstu) oraz "Wprowadzę dane ręcznie".  
* ID: US-008  
* Tytuł: Opcjonalne kategoryzowanie i datowanie posiłku  
* Opis: Jako użytkownik, dodając posiłek chcę mieć opcję przypisania go do kategorii oraz ustawienia konkretnej daty i godziny, aby lepiej organizować swoje wpisy.  
* Kryteria akceptacji:  
  1. Na ekranie dodawania posiłku znajduje się opcjonalny \<select\> z kategoriami.  
  2. Znajduje się tam również opcjonalny selektor daty i godziny.  
  3. Domyślnie wybrana jest aktualna data i godzina, a kategoria jest pusta.  
* ID: US-009  
* Tytuł: Anulowanie dodawania posiłku  
* Opis: Jako użytkownik, chcę móc anulować proces dodawania posiłku w dowolnym momencie, aby powrócić do poprzedniego ekranu bez zapisywania zmian.  
* Kryteria akceptacji:  
  1. Na ekranie dodawania/edycji posiłku znajduje się przycisk "Anuluj".  
  2. Po jego kliknięciu widok jest zamykany, a żadne dane nie są zapisywane.  
* ID: US-010  
* Tytuł: Przeglądanie dashboardu  
* Opis: Jako użytkownik, po zalogowaniu chcę widzieć listę dni z podsumowaniem kalorycznym, aby szybko ocenić swoje postępy.  
* Kryteria akceptacji:  
  1. Ekran główny to lista dni, posortowana od najnowszego.  
  2. Każdy wiersz pokazuje datę, spożyte kalorie / cel kaloryczny.  
  3. Wiersz ma kolor tła zgodny ze statusem realizacji celu (Szary/Zielony/Pomarańczowy).  
* ID: US-011  
* Tytuł: Przeglądanie szczegółów dnia  
* Opis: Jako użytkownik, chcę móc kliknąć na dany dzień na dashboardzie, aby zobaczyć listę wszystkich posiłków z tego dnia.  
* Kryteria akceptacji:  
  1. Po kliknięciu w dzień na liście, przechodzę do widoku szczegółowego.  
  2. Widoczna jest lista posiłków posortowana chronologicznie (od najstarszego).  
  3. Przy posiłkach z nieoszacowanymi makroskładnikami widnieje znak "-".  
* ID: US-012  
* Tytuł: Edycja istniejącego wpisu  
* Opis: Jako użytkownik, chcę móc edytować wcześniej dodany posiłek, aby poprawić błędy w opisie lub wartościach liczbowych.  
* Kryteria akceptacji:  
  1. Kliknięcie na posiłek w widoku dnia otwiera ekran edycji z wypełnionymi danymi.  
  2. Mogę zmienić opis tekstowy i wygenerować nową propozycję AI.  
  3. Mogę bezpośrednio edytować wartości Kcal i makroskładników.  
  4. Po zapisaniu, zmiany są odzwierciedlone na liście posiłków i w sumie dnia.  
* ID: US-013  
* Tytuł: Usuwanie wpisu  
* Opis: Jako użytkownik, chcę móc usunąć posiłek z mojej listy, aby skorygować pomyłki.  
* Kryteria akceptacji:  
  1. Przy każdym posiłku na liście znajduje się ikona usuwania.  
  2. Po kliknięciu ikony pojawia się okno modalne z prośbą o potwierdzenie.  
  3. Po potwierdzeniu, wpis jest trwale usuwany, a suma dnia jest aktualizowana.  
* ID: US-014  
* Tytuł: Aktualizacja celu kalorycznego  
* Opis: Jako użytkownik, chcę móc w dowolnym momencie zmienić mój dzienny cel kaloryczny w ustawieniach, aby dostosować go do moich aktualnych potrzeb.  
* Kryteria akceptacji:  
  1. W ustawieniach konta znajduje się pole do edycji celu kalorycznego.  
  2. Po zapisaniu nowej wartości, jest ona od razu widoczna na dashboardzie dla bieżącego i przyszłych dni.

## **6\. Metryki sukcesu**

### **1\. Metryka Zaufania do AI (Cel: 75%)**

* Miernik: (Liczba podsumowań AI zaakceptowanych bez edycji) / (Liczba wszystkich podsumowań wygenerowanych przez AI)  
* Definicja: Mierzy, jak często użytkownicy ufają propozycji AI na tyle, by zaakceptować ją bez wprowadzania jakichkolwiek ręcznych poprawek w wartościach kalorycznych lub makroskładników. Pełna akceptacja to kluczowy wskaźnik dokładności i wiarygodności modelu.

### **2\. Metryka Użyteczności AI (Cel: 75%)**

* Miernik: (Liczba wpisów zainicjowanych przez AI) / (Liczba wszystkich wpisów, w tym manualnych)  
* Definicja: Mierzy, czy interfejs "AI-first" jest preferowaną metodą wprowadzania danych. Wysoki wynik wskazuje, że użytkownicy postrzegają funkcję AI jako szybszą i wygod