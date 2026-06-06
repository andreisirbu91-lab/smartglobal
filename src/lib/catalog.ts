import type { CatalogItem, Category, EventType } from "./types";

/**
 * Editable source of truth, modelled on real Romanian event practice
 * (Absolvire Liceu / Facultate / Nuntă). Venues are fetched live from Google
 * Places; everything here is an add-on/provider. Prices are 2026 EUR estimates.
 */

export const PROMO_CODES: Record<string, { pct: number; label: { en: string; ro: string } }> = {
  EARLYBIRD: { pct: 0.1, label: { en: "Early-bird (EARLYBIRD)", ro: "Înscriere timpurie (EARLYBIRD)" } },
  GRAD2026: { pct: 0.15, label: { en: "Graduation 2026 (GRAD2026)", ro: "Absolvire 2026 (GRAD2026)" } },
};

export const GROUP_DISCOUNT = {
  minGraduates: 3,
  pct: 0.1,
  label: { en: "Group booking (3+ graduates)", ro: "Rezervare de grup (3+ absolvenți)" },
};

// --- Events & their funnels ------------------------------------------------

export const EVENT_TYPES: EventType[] = [
  {
    id: "grad_university",
    name: { en: "University Graduation", ro: "Absolvire Facultate" },
    tagline: { en: "Licență & Master", ro: "Licență și Master" },
    icon: "🎓",
    honoreeLabel: { en: "Graduates", ro: "Absolvenți" },
    steps: [
      { id: "location", kind: "basics", field: "location", title: { en: "Location", ro: "Locația" },
        question: { en: "Congrats! 🎓 Which city or area is the celebration in?", ro: "Felicitări! 🎓 În ce oraș sau zonă va fi petrecerea?" } },
      { id: "people", kind: "basics", field: "people", title: { en: "People", ro: "Persoane" },
        question: { en: "How many of you are graduating, and how many guests in total?", ro: "Câți absolviți și câți invitați în total?" } },
      { id: "venue", kind: "places", title: { en: "Banquet venue", ro: "Locație banchet" }, placesQuery: { en: "event venue restaurant for graduation banquet", ro: "restaurant sală pentru banchet absolvire" },
        question: { en: "Where shall we hold the banquet? Here are great venues near you.", ro: "Unde ținem banchetul? Iată locații grozave aproape de tine." } },
      { id: "date", kind: "basics", field: "date", title: { en: "Date", ro: "Data" },
        question: { en: "When is it? Type the date or pick from the calendar.", ro: "Când are loc? Scrie data sau alege din calendar." } },
      { id: "attire", kind: "catalog", title: { en: "Gown & Ceremony", ro: "Togă & Ceremonie" }, categories: ["attire", "tickets", "catering", "bar"],
        question: { en: "Let's sort the look & the table — togă & tocă rental, ceremony seats, the banquet menu and a welcome cocktail?", ro: "Să rezolvăm ținuta & masa — togă & tocă, locuri la ceremonie, meniul de banchet și un cocktail de bun-venit?" } },
      { id: "memories", kind: "catalog", title: { en: "Photo & Video", ro: "Foto & Video" }, categories: ["photography", "videography"],
        question: { en: "Portraits in the gown are a must — individual portraits, album, drone coverage?", ro: "Portretele în robă sunt obligatorii — portrete individuale, album, filmare cu drona?" } },
      { id: "party", kind: "catalog", title: { en: "Party & Extras", ro: "Petrecere & Extra" }, categories: ["music", "artists", "afterparty", "effects", "decorations", "print", "favors"],
        question: { en: "Time to celebrate — DJ or band, after-party, effects, décor, framed-diploma keepsakes?", ro: "E timpul de sărbătoare — DJ sau formație, after-party, efecte, decor, diplome înrămate?" } },
      { id: "review", kind: "review", title: { en: "Review", ro: "Sumar" }, question: { en: "Here's your graduation package. Ready to confirm?", ro: "Iată pachetul de absolvire. Confirmăm?" } },
    ],
  },
  {
    id: "grad_highschool",
    name: { en: "Highschool Banquet", ro: "Banchet Liceu" },
    tagline: { en: "Banchet & curs festiv", ro: "Banchet și curs festiv" },
    icon: "📚",
    honoreeLabel: { en: "Students", ro: "Elevi" },
    steps: [
      { id: "location", kind: "basics", field: "location", title: { en: "Location", ro: "Locația" },
        question: { en: "The big banquet! 🎉 Which city or area is it in?", ro: "Marele banchet! 🎉 În ce oraș sau zonă va fi?" } },
      { id: "people", kind: "basics", field: "people", title: { en: "People", ro: "Persoane" },
        question: { en: "How many students are in your class, and how many guests total?", ro: "Câți elevi sunteți în clasă și câți invitați în total?" } },
      { id: "venue", kind: "places", title: { en: "Venue", ro: "Local" }, placesQuery: { en: "banquet hall event venue", ro: "sală de banchet local evenimente" },
        question: { en: "First the venue — it sets the night. Here are halls near you.", ro: "Întâi localul — dă tonul serii. Iată săli aproape de tine." } },
      { id: "date", kind: "basics", field: "date", title: { en: "Date", ro: "Data" },
        question: { en: "When is the banquet? Type or pick a date.", ro: "Când e banchetul? Scrie sau alege o dată." } },
      { id: "memories", kind: "catalog", title: { en: "Attire & Memories", ro: "Ținută & Amintiri" }, categories: ["attire", "catering", "photography", "videography"],
        question: { en: "Cap & gown for the ceremony, the banquet menu, a photo-video team with drone, a photo booth?", ro: "Tocă & robă pentru ceremonie, meniul de banchet, echipă foto-video cu dronă, photo booth?" } },
      { id: "entertainment", kind: "catalog", title: { en: "Show & Effects", ro: "Show & Efecte" }, categories: ["music", "artists", "effects"],
        question: { en: "Now the fun — DJ with an MC, maybe a live act, confetti cannons at the diplomas?", ro: "Acum distracția — DJ cu prezentator, poate un moment live, tunuri de confetti la diplome?" } },
      { id: "extras", kind: "catalog", title: { en: "Décor & Class Extras", ro: "Decor & Extra" }, categories: ["decorations", "photozone", "cakes", "print", "invitations"],
        question: { en: "The extras the class will love — themed décor, a photo zone, cake/candy bar, custom t-shirts, premium diplomas?", ro: "Extra-urile pe care clasa le adoră — decor tematic, zonă foto, tort/candy bar, tricouri personalizate, diplome premium?" } },
      { id: "review", kind: "review", title: { en: "Review", ro: "Sumar" }, question: { en: "Here's the class package. Shall we confirm?", ro: "Iată pachetul clasei. Confirmăm?" } },
    ],
  },
];

export const CATEGORIES: Category[] = [
  { id: "package", name: { en: "Graduation Package", ro: "Pachet Absolvire" }, icon: "🎓" },
  { id: "banquet", name: { en: "Banquet", ro: "Banchet" }, icon: "🥂" },
  { id: "venues", name: { en: "Venues", ro: "Locații" }, icon: "🏛️" },
  { id: "attire", name: { en: "Gown & Attire", ro: "Togă & Robă" }, icon: "🎓" },
  { id: "tickets", name: { en: "Ceremony", ro: "Ceremonie" }, icon: "🎟️" },
  { id: "catering", name: { en: "Food & Catering", ro: "Mâncare & Catering" }, icon: "🍽️" },
  { id: "bar", name: { en: "Drinks & Bar", ro: "Băuturi & Bar" }, icon: "🍸" },
  { id: "cakes", name: { en: "Cakes & Sweets", ro: "Torturi & Dulciuri" }, icon: "🍰" },
  { id: "photography", name: { en: "Photo", ro: "Foto" }, icon: "📷" },
  { id: "videography", name: { en: "Video", ro: "Video" }, icon: "🎥" },
  { id: "music", name: { en: "DJ & Sound", ro: "DJ & Sonorizare" }, icon: "🎶" },
  { id: "artists", name: { en: "Artists & Bands", ro: "Artiști & Formații" }, icon: "🎤" },
  { id: "effects", name: { en: "Special Effects", ro: "Efecte Speciale" }, icon: "🎆" },
  { id: "decorations", name: { en: "Decorations", ro: "Decor" }, icon: "🎈" },
  { id: "photozone", name: { en: "Photo Zone", ro: "Zonă Foto" }, icon: "🖼️" },
  { id: "rentals", name: { en: "Rentals & AV", ro: "Închirieri & AV" }, icon: "🪑" },
  { id: "transport", name: { en: "Transport", ro: "Transport" }, icon: "🚗" },
  { id: "beauty", name: { en: "Hair & Makeup", ro: "Coafură & Machiaj" }, icon: "💄" },
  { id: "coordination", name: { en: "Coordination", ro: "Coordonare" }, icon: "📋" },
  { id: "logistics", name: { en: "Logistics", ro: "Logistică" }, icon: "🛡️" },
  { id: "lodging", name: { en: "Accommodation", ro: "Cazare" }, icon: "🏨" },
  { id: "print", name: { en: "Personalized & Print", ro: "Personalizate & Print" }, icon: "👕" },
  { id: "invitations", name: { en: "Invitations", ro: "Invitații" }, icon: "✉️" },
  { id: "favors", name: { en: "Favors", ro: "Mărturii" }, icon: "🎁" },
  { id: "afterparty", name: { en: "After-party", ro: "After-party" }, icon: "🥂" },
];

const U = "grad_university" as const;
const H = "grad_highschool" as const;
const ALL = [U, H];

const mk = (s: CatalogItem): CatalogItem => s;

export const CATALOG: CatalogItem[] = [
  // ===== FESTIVITY PACKAGES (per graduate) — the core Star Global offer =====
  mk({ id: "sga_base", image: "/catalog/sga/base.jpg", category: "package", eventTypes: [U, H], unit: "per_graduate", price: 125,
    name: { en: "Graduation — Base Pack", ro: "Festivitate — Base Pack" },
    description: { en: "Robe, cap, sash, badge, velvet diploma, gift box & photo session.", ro: "Robă, tocă, eșarfă, insignă, diplomă pe catifea, gift box & ședință foto." },
    long: { en: "The essentials for a beautiful graduation ceremony, per graduate (min. 25).", ro: "Esențialul pentru o festivitate frumoasă, per absolvent (min. 25)." },
    includes: { en: ["Robe rental + cap (kept)", "Personalized sash & badge", "Honorary velvet diploma", "Graduation gift box", "Event photography (1 photographer/class)", "Photo session indoor/outdoor"], ro: ["Închiriere robă + tocă (rămâne)", "Eșarfă & insignă personalizate", "Diplomă onorifică pe catifea", "Graduation gift box", "Fotografiere eveniment (1 fotograf/clasă)", "Ședință foto indoor/outdoor"] } }),
  mk({ id: "sga_expert", image: "/catalog/sga/expert.jpg", category: "package", eventTypes: [U, H], unit: "per_graduate", price: 245, popular: true,
    name: { en: "Graduation — Expert Pack", ro: "Festivitate — Expert Pack" },
    description: { en: "Everything in Base + photobooth, 360, livestream, 4K film, medals & stage.", ro: "Tot din Base + photobooth, 360, livestream, film 4K, medalii & scenă." },
    long: { en: "A full-production ceremony, per graduate (min. 100).", ro: "O festivitate cu producție completă, per absolvent (min. 100)." },
    includes: { en: ["Everything in Base Pack", "Orange carpet, photobooth & 360 videobooth", "Livestream + 4K filming + after movie", "Medals & trophies for top students", "Pro sound, LED screens, daylight fireworks", "Host, presidium, event planner & crew"], ro: ["Tot din Base Pack", "Orange carpet, photobooth & 360 videobooth", "Livestream + filmare 4K + after movie", "Medalii & trofee pentru șefii de promoție", "Sonorizare pro, ecrane LED, daylight fireworks", "Prezentator, prezidiu, event planner & echipă"] } }),
  mk({ id: "sga_vip", image: "/catalog/sga/vip.jpg", category: "package", eventTypes: [U, H], unit: "per_graduate", price: 320,
    name: { en: "Graduation — VIP Pack", ro: "Festivitate — VIP Pack" },
    description: { en: "Everything in Expert + Graduation Village, prosecco van, bars, live DJ.", ro: "Tot din Expert + Graduation Village, prosecco van, baruri, DJ live." },
    long: { en: "The flagship festival-vibe ceremony, per graduate (min. 100).", ro: "Festivitatea premium cu vibe de festival, per absolvent (min. 100)." },
    includes: { en: ["Everything in Expert Pack", "Graduation Village (festival vibes)", "Prosecco van, lemonade & drinks bar", "Smoke entrance moment + remember clip", "Specialty coffee + live DJ mix", "Volumetric letters, roses, premium décor"], ro: ["Tot din Expert Pack", "Graduation Village (festival vibes)", "Prosecco van, lemonade & drinks bar", "Intrare cu fumigene + clip remember", "Specialty coffee + live DJ mix", "Litere volumetrice, trandafiri, decor premium"] } }),
  mk({ id: "sga_outdoor", category: "package", eventTypes: [U, H], unit: "per_graduate", price: 90,
    name: { en: "Outdoor Upgrade", ro: "Upgrade Outdoor" },
    description: { en: "Modular stage, Chiavari chairs, helium balloons, colored smoke, live DJ.", ro: "Scenă modulară, scaune Chiavari, baloane heliu, fumigene colorate, DJ live." } }),

  // ===== BANQUET (per graduate) =====
  mk({ id: "sga_banquet", image: "/catalog/sga/banquet.jpg", category: "banquet", eventTypes: [U, H], unit: "per_graduate", price: 625, popular: true,
    name: { en: "Graduation Banquet", ro: "Banchet de Absolvire" },
    description: { en: "Full banquet: dinner, free bar, cake, DJ & MC, bars, photo-video & décor.", ro: "Banchet complet: cină, free bar, tort, DJ & MC, baruri, foto-video & decor." },
    long: { en: "An all-in banquet at a partner venue (Porto del Sole, Ten Luxury Ballroom, The View…), per graduate (min. 100). Teachers' menus included.", ro: "Banchet all-in la o locație parteneră (Porto del Sole, Ten Luxury Ballroom, The View…), per absolvent (min. 100). Meniurile cadrelor didactice incluse." },
    includes: { en: ["Starter + 1-2 main courses", "Free bar (wine, spirits, cocktails)", "Personalized cake", "DJ + MC, smoke machine, CO2, fireworks", "Photo + video team (4K, drone)", "Themed bars: candy, prosecco, gin, fruit…", "Décor, sound & full lighting"], ro: ["Aperitiv + 1-2 feluri principale", "Free bar (vin, tării, cocktailuri)", "Tort personalizat", "DJ + MC, mașină de fum, CO2, artificii", "Echipă foto + video (4K, dronă)", "Baruri tematice: candy, prosecco, gin, fruit…", "Decor, sonorizare & lumini complete"] } }),

  // ===== CAP PERSONALIZATION (per graduate) =====
  mk({ id: "toca_digital", image: "/catalog/sga/toca1.jpg", category: "attire", eventTypes: [U, H], unit: "per_graduate", price: 120,
    name: { en: "Custom Cap — Digital Print", ro: "Tocă Personalizată — Print Digital" },
    description: { en: "Your message or image printed on the cap.", ro: "Mesajul sau imaginea ta, printate pe tocă." } }),
  mk({ id: "toca_painted", image: "/catalog/sga/toca2.jpg", category: "attire", eventTypes: [U, H], unit: "per_graduate", price: 250,
    name: { en: "Custom Cap — Hand-Painted", ro: "Tocă Personalizată — Pictată Manual" },
    description: { en: "A one-of-a-kind hand-painted graduation cap.", ro: "O tocă pictată manual, unicat." } }),

  // ===== ALBUM (per graduate) + extras =====
  mk({ id: "album_2020", image: "/catalog/sga/album.jpg", category: "photography", eventTypes: [U, H], unit: "per_graduate", price: 150,
    name: { en: "Yearbook Album 20×20", ro: "Album Promoție 20×20" },
    description: { en: "Hardcover 20×20cm, 15-25 photos, personalized graphics.", ro: "Hardcover 20×20cm, 15-25 poze, grafică personalizată." } }),
  mk({ id: "album_2030", image: "/catalog/sga/photo.jpg", category: "photography", eventTypes: [U, H], unit: "per_graduate", price: 180, popular: true,
    name: { en: "Yearbook Album 20×30", ro: "Album Promoție 20×30" },
    description: { en: "Hardcover 20×30cm, 15-35 photos, personalized graphics.", ro: "Hardcover 20×30cm, 15-35 poze, grafică personalizată." } }),
  mk({ id: "album_plush", category: "photography", eventTypes: [U, H], unit: "per_graduate", price: 100,
    name: { en: "Plush Album Cover", ro: "Copertă de Pluș" }, description: { en: "Soft plush cover, various colors.", ro: "Copertă de pluș, diverse culori." } }),
  mk({ id: "album_leather", category: "photography", eventTypes: [U, H], unit: "per_graduate", price: 150,
    name: { en: "Leather Album Cover", ro: "Copertă de Piele" }, description: { en: "Premium leather cover, various colors.", ro: "Copertă de piele premium, diverse culori." } }),
  mk({ id: "canvas", category: "photozone", eventTypes: [U, H], unit: "per_graduate", price: 70,
    name: { en: "Canvas Print", ro: "Tablou Canvas" }, description: { en: "A canvas keepsake from the shoot.", ro: "Un tablou canvas din ședința foto." } }),

  // ===== ARTISTS — grouped by genre (id prefix art_pop_/art_hh_/art_rock_/art_dj_); prices in EUR + VAT =====
  // POP
  mk({ id: "art_pop_inna", category: "artists", eventTypes: [U, H], unit: "flat", price: 22000, currency: "EUR",
    name: { en: "INNA", ro: "INNA" }, description: { en: "Pop · international headliner. + VAT.", ro: "Pop · cap de afiș internațional. + TVA." } }),
  mk({ id: "art_pop_carlas_dreams", category: "artists", eventTypes: [U, H], unit: "flat", price: 13500, currency: "EUR",
    name: { en: "Carla's Dreams", ro: "Carla's Dreams" }, description: { en: "Pop · headliner (12-15k). + VAT.", ro: "Pop · cap de afiș (12-15k). + TVA." } }),
  mk({ id: "art_pop_the_motans", category: "artists", eventTypes: [U, H], unit: "flat", price: 13500, currency: "EUR",
    name: { en: "The Motans", ro: "The Motans" }, description: { en: "Pop · headliner (12-15k). + VAT.", ro: "Pop · cap de afiș (12-15k). + TVA." } }),
  mk({ id: "art_pop_irina_rimes", category: "artists", eventTypes: [U, H], unit: "flat", price: 13500, currency: "EUR",
    name: { en: "Irina Rimes", ro: "Irina Rimes" }, description: { en: "Pop · headliner (12-15k). + VAT.", ro: "Pop · cap de afiș (12-15k). + TVA." } }),
  mk({ id: "art_pop_minelli", category: "artists", eventTypes: [U, H], unit: "flat", price: 9000, currency: "EUR", popular: true,
    name: { en: "Minelli", ro: "Minelli" }, description: { en: "Pop · top national artist. + VAT.", ro: "Pop · artist național de top. + TVA." } }),
  mk({ id: "art_pop_antonia", category: "artists", eventTypes: [U, H], unit: "flat", price: 7500, currency: "EUR",
    name: { en: "Antonia", ro: "Antonia" }, description: { en: "Pop · top national artist. + VAT.", ro: "Pop · artist național de top. + TVA." } }),
  mk({ id: "art_pop_nicole_cherry", category: "artists", eventTypes: [U, H], unit: "flat", price: 7500, currency: "EUR",
    name: { en: "Nicole Cherry", ro: "Nicole Cherry" }, description: { en: "Pop · top national artist. + VAT.", ro: "Pop · artist național de top. + TVA." } }),
  mk({ id: "art_pop_holy_molly", category: "artists", eventTypes: [U, H], unit: "flat", price: 4000, currency: "EUR",
    name: { en: "Holy Molly", ro: "Holy Molly" }, description: { en: "Pop · live act. + VAT.", ro: "Pop · moment live. + TVA." } }),
  mk({ id: "art_pop_florian_rus", category: "artists", eventTypes: [U, H], unit: "flat", price: 3500, currency: "EUR",
    name: { en: "Florian Rus", ro: "Florian Rus" }, description: { en: "Pop · live act. + VAT.", ro: "Pop · moment live. + TVA." } }),
  mk({ id: "art_pop_dara", category: "artists", eventTypes: [U, H], unit: "flat", price: 3000, currency: "EUR",
    name: { en: "DARA", ro: "DARA" }, description: { en: "Pop · live act. + VAT.", ro: "Pop · moment live. + TVA." } }),
  // HIP-HOP / RAP
  mk({ id: "art_hh_parazitii", category: "artists", eventTypes: [U, H], unit: "flat", price: 12000, currency: "EUR",
    name: { en: "Parazitii", ro: "Paraziții" }, description: { en: "Hip-hop · legendary act. + VAT.", ro: "Hip-hop · trupă legendară. + TVA." } }),
  mk({ id: "art_hh_grasu_xxl", category: "artists", eventTypes: [U, H], unit: "flat", price: 10000, currency: "EUR",
    name: { en: "Grasu XXL", ro: "Grasu XXL" }, description: { en: "Hip-hop · headliner. + VAT.", ro: "Hip-hop · cap de afiș. + TVA." } }),
  mk({ id: "art_hh_puya", category: "artists", eventTypes: [U, H], unit: "flat", price: 10000, currency: "EUR",
    name: { en: "Puya", ro: "Puya" }, description: { en: "Hip-hop · headliner. + VAT.", ro: "Hip-hop · cap de afiș. + TVA." } }),
  mk({ id: "art_hh_guess_who", category: "artists", eventTypes: [U, H], unit: "flat", price: 7000, currency: "EUR", popular: true,
    name: { en: "Guess Who", ro: "Guess Who" }, description: { en: "Hip-hop · top act. + VAT.", ro: "Hip-hop · artist de top. + TVA." } }),
  mk({ id: "art_hh_la_familia", category: "artists", eventTypes: [U, H], unit: "flat", price: 7000, currency: "EUR",
    name: { en: "La Familia", ro: "La Familia" }, description: { en: "Hip-hop · legendary act. + VAT.", ro: "Hip-hop · trupă legendară. + TVA." } }),
  mk({ id: "art_hh_killa_fonic", category: "artists", eventTypes: [U, H], unit: "flat", price: 9000, currency: "EUR",
    name: { en: "Killa Fonic", ro: "Killa Fonic" }, description: { en: "Hip-hop · band. + VAT.", ro: "Hip-hop · band. + TVA." } }),
  mk({ id: "art_hh_satra_benz", category: "artists", eventTypes: [U, H], unit: "flat", price: 6500, currency: "EUR",
    name: { en: "Satra B.E.N.Z.", ro: "Satra B.E.N.Z." }, description: { en: "Hip-hop · trap collective. + VAT.", ro: "Hip-hop · colectiv trap. + TVA." } }),
  mk({ id: "art_hh_speak", category: "artists", eventTypes: [U, H], unit: "flat", price: 5000, currency: "EUR",
    name: { en: "Speak", ro: "Speak" }, description: { en: "Hip-hop · live act. + VAT.", ro: "Hip-hop · moment live. + TVA." } }),
  mk({ id: "art_hh_vescan", category: "artists", eventTypes: [U, H], unit: "flat", price: 4500, currency: "EUR",
    name: { en: "Vescan", ro: "Vescan" }, description: { en: "Hip-hop · live act. + VAT.", ro: "Hip-hop · moment live. + TVA." } }),
  // ROCK / INDIE
  mk({ id: "art_rock_robin", category: "artists", eventTypes: [U, H], unit: "flat", price: 6000, currency: "EUR",
    name: { en: "Robin and the Backstabbers", ro: "Robin and the Backstabbers" }, description: { en: "Indie · live band. + VAT.", ro: "Indie · trupă live. + TVA." } }),
  mk({ id: "art_rock_mono_jacks", category: "artists", eventTypes: [U, H], unit: "flat", price: 5500, currency: "EUR",
    name: { en: "The Mono Jacks", ro: "The Mono Jacks" }, description: { en: "Indie rock · live band. + VAT.", ro: "Indie rock · trupă live. + TVA." } }),
  mk({ id: "art_rock_partizan", category: "artists", eventTypes: [U, H], unit: "flat", price: 3500, currency: "EUR",
    name: { en: "Partizan", ro: "Partizan" }, description: { en: "Rock · live band. + VAT.", ro: "Rock · trupă live. + TVA." } }),
  mk({ id: "art_rock_dora", category: "artists", eventTypes: [U, H], unit: "flat", price: 3000, currency: "EUR",
    name: { en: "Dora Gaitanovici", ro: "Dora Gaitanovici" }, description: { en: "Indie folk · live act. + VAT.", ro: "Indie folk · moment live. + TVA." } }),
  mk({ id: "art_rock_kumm", category: "artists", eventTypes: [U, H], unit: "flat", price: 2300, currency: "EUR",
    name: { en: "Kumm", ro: "Kumm" }, description: { en: "Rock · live band. + VAT.", ro: "Rock · trupă live. + TVA." } }),
  // DJ
  mk({ id: "art_dj_sickotoy", category: "artists", eventTypes: [U, H], unit: "flat", price: 3500, currency: "EUR",
    name: { en: "Sickotoy", ro: "Sickotoy" }, description: { en: "DJ · headliner set. + VAT.", ro: "DJ · set cap de afiș. + TVA." } }),
  mk({ id: "art_dj_manuel_riva", category: "artists", eventTypes: [U, H], unit: "flat", price: 2500, currency: "EUR",
    name: { en: "Manuel Riva", ro: "Manuel Riva" }, description: { en: "DJ · live set. + VAT.", ro: "DJ · set live. + TVA." } }),
  mk({ id: "art_dj_sasha_lopez", category: "artists", eventTypes: [U, H], unit: "flat", price: 2000, currency: "EUR",
    name: { en: "Sasha Lopez", ro: "Sasha Lopez" }, description: { en: "DJ · live set. + VAT.", ro: "DJ · set live. + TVA." } }),
  mk({ id: "art_dj_cristi_stanciu", category: "artists", eventTypes: [U, H], unit: "flat", price: 800, currency: "EUR",
    name: { en: "Cristi Stanciu (DJ)", ro: "Cristi Stanciu (DJ)" }, description: { en: "DJ · resident set. + VAT.", ro: "DJ · set rezident. + TVA." } }),

  // ===== AFTERPARTY & EXTRAS (RON) =====
  mk({ id: "sga_afterparty", category: "afterparty", eventTypes: [U, H], unit: "per_graduate", price: 50,
    name: { en: "Afterparty at Sunrise", ro: "Afterparty at Sunrise" }, description: { en: "DJ + sound & free bar until sunrise, per graduate.", ro: "DJ + sonorizare & free bar până în zori, per absolvent." } }),
  mk({ id: "sga_sushi_bar", category: "bar", eventTypes: [U, H], unit: "flat", price: 3500,
    name: { en: "Sushi Bar", ro: "Sushi Bar" }, description: { en: "Live sushi station (estimate — confirmed on request).", ro: "Stație de sushi live (estimativ — la cerere)." } }),
  mk({ id: "sga_limo", category: "transport", eventTypes: [U, H], unit: "flat", price: 1800,
    name: { en: "Dedicated Limousine", ro: "Limuzină Dedicată" }, description: { en: "Limo to the venue for the graduates (estimate — on request).", ro: "Limuzină până la locație pentru absolvenți (estimativ — la cerere)." } }),

  // ===== WEDDING (kept; RON pricing) =====

  // ===== SHARED =====
  mk({ id: "welcome_cocktail", category: "catering", eventTypes: ALL, unit: "per_guest", price: 30,
    name: { en: "Welcome Cocktail", ro: "Cocktail de Bun-venit" }, description: { en: "Canapés and a welcome drink, per guest.", ro: "Canapé-uri și o băutură de bun-venit, per invitat." } }),
  mk({ id: "candy_bar", image: "/catalog/sga/bar1.jpg", category: "cakes", eventTypes: [U, H], unit: "flat", price: 1500,
    name: { en: "Candy Bar", ro: "Candy Bar" }, description: { en: "Sweet table with assorted treats.", ro: "Masă cu dulciuri asortate." } }),
  mk({ id: "prosecco_bar", image: "/catalog/sga/bar2.jpg", category: "bar", eventTypes: [U, H], unit: "flat", price: 1800,
    name: { en: "Prosecco Bar", ro: "Prosecco Bar" }, description: { en: "Sparkling bar for the toast.", ro: "Bar cu spumant pentru toast." } }),
];

// --- Lookups ---------------------------------------------------------------

export const itemById = (id: string): CatalogItem | undefined => CATALOG.find((i) => i.id === id);
export const eventById = (id: string | null): EventType | undefined =>
  id ? EVENT_TYPES.find((e) => e.id === id) : undefined;
export const itemsForEvent = (eventType: string | null): CatalogItem[] =>
  CATALOG.filter((i) => i.eventTypes.length === 0 || (eventType !== null && i.eventTypes.includes(eventType as never)));
export const itemsForStep = (eventType: string | null, categories: string[] | undefined): CatalogItem[] =>
  itemsForEvent(eventType).filter((i) => !categories || categories.includes(i.category));
export const categoryById = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);
