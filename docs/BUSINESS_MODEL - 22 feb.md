# NordiqFlow — Affärsmodell

**Senast uppdaterad**: 2026-02-22

---

## Third-Party Payer Model

### Principen

NordiqFlow använder en **third-party payer**-modell:

- **Användare** (privatpersoner): Gratis tillgång till TalentFlow
- **Betalare** (kommuner/stat): Köper CityIQ-licens som inkluderar TalentFlow för invånarna

Analogt med:
- **1177 Vårdguiden**: Gratis för patienten, regionen betalar
- **Skolplattformen**: Gratis för föräldrar, kommunen betalar
- **Folkhälsomyndighetens appar**: Gratis för medborgare, staten betalar

### Varför denna modell?

| Alternativ | Problem |
|------------|---------|
| Freemium (299 kr/mån) | Låg betalningsvilja bland arbetssökande, hög churn |
| Annonsfinansierad | Intressekonflikt (annonsörer vs användare) |
| **Third-party payer** | **Ren modell, en kund, hög LTV** |

Arbetssökande har i regel begränsad betalningsförmåga. Kommunen har däremot:
- Budget för arbetsmarknadsåtgärder (miljarder SEK nationellt)
- Incitament att minska arbetslöshet (skatteintäkter)
- Upphandlingsprocesser som skapar lock-in

---

## Intäktsmodell

### CityIQ-licenser (enda intäktskällan)

| Kommunstorlek | Invånare | Pris/år | Inkluderar |
|---------------|----------|---------|------------|
| Liten | < 30 000 | 75 000 SEK | CityIQ + TalentFlow |
| Medelstor | 30 000-100 000 | 150 000 SEK | CityIQ + TalentFlow |
| Stor | > 100 000 | 250 000 SEK | CityIQ + TalentFlow |

### Revenue Projections

| År | Kommuner | Snittintäkt | ARR |
|----|----------|-------------|-----|
| 1 | 3-5 (pilot) | 50 000 SEK (rabatt) | 150-250k SEK |
| 2 | 15-25 | 150 000 SEK | 2.3-3.8M SEK |
| 3 | 30-50 | 150 000 SEK | 4.5-7.5M SEK |

### Enhetsekonomi per kommun

- **Licensintäkt**: 150 000 SEK/år (snitt)
- **CAC**: 30-80k SEK (säljcykel 6-18 mån)
- **Servingkostnad**: ~5 000 SEK/år (hosting, API-anrop)
- **Bruttomarginal**: ~95%
- **LTV (5 år)**: 750 000 SEK
- **LTV:CAC ratio**: 9-25x

---

## Värdeproposition per segment

### För kommunen (köparen)

1. **Talangbristanalys**: Vilka kompetenser saknas lokalt?
2. **Utbildnings-ROI**: Vilka YH-program ger bäst avkastning?
3. **Skatteintäktsprognos**: Om 100 personer byter till bristyrken = X kr i ökad kommunalskatt
4. **Politisk poäng**: "Vi investerar i datadriven arbetsmarknadspolitik"
5. **TalentFlow för invånare**: Gratis karriärverktyg som del av kommunens service

### För invånaren (användaren)

1. **Dolda karriärvägar**: Se yrken du aldrig tänkt på
2. **Konkreta matchprocent**: "85% av kraven uppfyllda"
3. **Gap-analys**: Exakt vilka kompetenser som saknas
4. **Utbildningsvägar**: Vilka kurser täpper igen gapet
5. **Löneprognos**: Potentiell löneförändring

### För staten (potentiell framtida kund)

1. **Minska kostnaden för arbetsmarknadsåtgärder** (SEK 80+ mdr/år)
2. **Bättre matchning** = kortare arbetslöshetstid = lägre bidragskostnader
3. **Data-feedback**: Anonymiserad aggregerad data om arbetssökande beteende

---

## Jämförelse med alternativ

| Aspekt | NordiqFlow | Eget bygge (kommun) | Konsult (McKinsey etc) |
|--------|-----------|-------------------|----------------------|
| Kostnad/år | 75-250k SEK | >5M SEK | 500k-2M SEK/projekt |
| Tid till värde | 1-2 månader | 12-24 månader | 3-6 månader |
| Kontinuerlig data | Ja (nattlig uppdatering) | Manuell | Engångsrapport |
| TalentFlow för invånare | Ingår | Nej | Nej |
| Skalbar | Ja | Nej | Nej |

---

## Framtida intäktsströmmar (ej i MVP)

1. **Statlig licens**: Om nationell utrullning, förhandling med SKR/AF direkt
2. **Premium-tjänster**: AI-genererade CV:n, intervjuträning (om det finns betalningsvilja)
3. **API-åtkomst**: Tredjepartsutvecklare som vill bygga på vår data
4. **Nordisk expansion**: Norge (NAV), Danmark (Jobindex), Finland (TE-palvelut)

---

## Risker med modellen

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|------------|-----------|-----------|
| Långsam B2G-säljcykel | Hög | Försenade intäkter | Vinnova-finansiering som brygga |
| Kommuner har inte budget | Medium | Färre kunder | Positionera som kostnadsbesparande, inte ny kostnad |
| Staten upphandlar centralt | Låg | Konkurrent eller kund | Vara redo att bjuda på nationell upphandling |
| Användare utan kommun | Medium | Begränsad reach | Öppna grundfunktioner för alla, premium via kommun |
