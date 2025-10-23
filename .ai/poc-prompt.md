# Prompt dla Generatora Proof of Concept - Szybkie Kalorie

## Cel PoC

Zweryfikuj podstawową funkcjonalność aplikacji "Szybkie Kalorie" - czyli zdolność do **szacowania liczby kalorii i makroskładników za pomocą AI na podstawie opisu tekstowego posiłku**.

## Zakres PoC (minimalistyczny)

### Co MUSI być w PoC:

1. **Prosty interfejs webowy** z pojedynczym polem tekstowym do opisu posiłku
2. **Komunikacja z modelem AI** przez Openrouter.ai do przetwarzania opisu
3. **Wyświetlanie wyniku**: kalorie (wymagane) + makroskładniki B/W/T (opcjonalne)
4. **Komunikaty o założeniach**: jeśli AI dokonało założeń (np. "duża miska" = 450ml), wyświetl je użytkownikowi
5. **Obsługa błędów**: gdy AI nie rozumie opisu, proś o doprecyzowanie

### Co NIE MOŻE być w PoC:

- ❌ Baza danych / persistence
- ❌ Autentykacja / system kont
- ❌ Dashboard / historia wpisów
- ❌ Edycja / usuwanie wpisów
- ❌ Ręczne wprowadzanie wartości (tryb manualny)
- ❌ Kategorie posiłków
- ❌ Datowanie / godziny
- ❌ Cele kaloryczne
- ❌ Wskaźniki postępów
- ❌ Zaawansowane stylowanie (wystarczy czytelny, funkcjonalny UI)

## Stack technologiczny dla PoC

- **Frontend**: Astro 5 + React 19 + TypeScript 5
- **Styling**: Tailwind 4 (podstawowe style)
- **AI**: Openrouter.ai API (użyj modelu, który zapewni dobry balans jakości i kosztów)
- **Bez backendu**: PoC może działać w całości po stronie przeglądarki, komunikując się bezpośrednio z Openrouter.ai

## Przykładowy przepływ użytkownika w PoC

1. Użytkownik otwiera stronę
2. Widzi pole tekstowe z placeholderem "Opisz swój posiłek..."
3. Wpisuje: "duża miska płatków owsianych z mlekiem i bananem"
4. Klika przycisk "Oblicz"
5. Widzę wynik:
   ```
   Kalorie: ~520 kcal
   Białko: 15g
   Węglowodany: 85g
   Tłuszcze: 12g

   Założenia AI:
   - "duża miska" = ~80g płatków owsianych
   - mleko 2% tłuszczu, ~250ml
   - średni banan ~120g
   ```

## Wymagania techniczne

- Kod TypeScript z typowaniem
- Obsługa błędów API (timeout, błędne klucze, rate limiting)
- Możliwość łatwego przetestowania lokalnie (npm install + npm run dev)
- Plik `.env.example` z wymaganymi zmiennymi środowiskowymi

## Wskazówki implementacyjne

- Wykorzystaj Astro do stworzenia prostej strony single-page
- Komponent React obsłuży formularz i wyświetlanie wyniku
- API call do Openrouter.ai może być wykonany bezpośrednio z komponentu (dla PoC nie potrzeba backend API route)
- Zadbaj o czytelny prompt dla AI, który wymusi zwrot danych w strukturze JSON (łatwej do parsowania)

## WAŻNE: Przed implementacją

**Przygotuj plan pracy i przedstaw go do mojej akceptacji.**

Plan powinien zawierać:
1. Listę plików/komponentów do stworzenia
2. Strukturę projektu
3. Przykładowy prompt dla modelu AI
4. Szacowany czas implementacji każdego elementu

**Dopiero po mojej akceptacji planu przejdź do implementacji PoC.**

## Definicja sukcesu PoC

PoC jest uznany za udany, jeśli:
- ✅ Użytkownik może opisać posiłek w języku naturalnym (polskim)
- ✅ AI zwraca sensowne oszacowanie kalorii (± 20% błędu to akceptowalne dla PoC)
- ✅ Makroskładniki sumują się do podobnej wartości kalorycznej (B*4 + W*4 + T*9 ≈ podane Kcal)
- ✅ System pokazuje założenia, na których AI oparło oszacowanie
- ✅ Aplikacja działa lokalnie bez błędów

---

**Rozpocznij od zaplanowania pracy i poczekaj na moją akceptację.**
