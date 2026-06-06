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
    id: "wedding",
    name: { en: "Wedding", ro: "Nuntă" },
    tagline: { en: "Your perfect day", ro: "Ziua ta perfectă" },
    icon: "💍",
    honoreeLabel: { en: "Couple", ro: "Miri" },
    steps: [
      { id: "location", kind: "basics", field: "location", title: { en: "Location", ro: "Locația" },
        question: { en: "Congratulations! 🥂 First things first — which city or area is the wedding in?", ro: "Felicitări! 🥂 Întâi de toate — în ce oraș sau zonă va fi nunta?" } },
      { id: "people", kind: "basics", field: "people", title: { en: "Guests", ro: "Invitați" },
        question: { en: "How many guests are you expecting? You can set a budget too — I'll keep us within it.", ro: "Câți invitați estimezi? Poți seta și un buget — mă încadrez în el." } },
      { id: "venue", kind: "places", title: { en: "Venue", ro: "Locație" }, placesQuery: { en: "wedding venue", ro: "sală de nunți" },
        question: { en: "Here are real venues near you. What's your vibe — grand ballroom, seaside terrace, or intimate?", ro: "Iată locații reale aproape de tine. Ce stil — sală mare, terasă la mare sau intim?" } },
      { id: "date", kind: "basics", field: "date", title: { en: "Date", ro: "Data" },
        question: { en: "Lovely. When is the big day? Type it or pick from the calendar.", ro: "Minunat. Când e marea zi? Scrie sau alege din calendar." } },
      { id: "menu", kind: "catalog", title: { en: "Menu & Bar", ro: "Meniu & Bar" }, categories: ["catering", "bar"],
        question: { en: "Now the food & drinks — standard or premium menu, and shall we add an open or cocktail bar?", ro: "Acum mâncarea & băuturile — meniu standard sau premium, și adăugăm open bar sau cocktail bar?" } },
      { id: "memories", kind: "catalog", title: { en: "Photo & Video", ro: "Foto & Video" }, categories: ["photography", "videography"],
        question: { en: "These memories last forever — photo+video team, a photobooth, a cinematic drone film?", ro: "Amintirile rămân pe viață — echipă foto+video, photobooth, film cinematic cu dronă?" } },
      { id: "music", kind: "catalog", title: { en: "Music & Show", ro: "Muzică & Show" }, categories: ["music", "artists"],
        question: { en: "Let's fill the dance floor — a DJ, a live band, or even a known artist for the wow moment?", ro: "Să umplem ringul — DJ, formație live sau chiar un artist consacrat pentru efectul wow?" } },
      { id: "decor", kind: "catalog", title: { en: "Decor & Magic", ro: "Decor & Magie" }, categories: ["decorations", "effects", "cakes", "favors", "photozone", "invitations"],
        question: { en: "The magic touches — florals, special effects (fog, cold sparks, fireworks), cake, candy bar, favors. I can tailor a combo to your budget.", ro: "Atingerile magice — flori, efecte speciale (fum, scântei reci, artificii), tort, candy bar, mărturii. Pot adapta o combinație la bugetul tău." } },
      { id: "review", kind: "review", title: { en: "Review", ro: "Sumar" }, question: { en: "Here's your complete wedding package. Shall we lock it in?", ro: "Iată pachetul complet de nuntă. Îl confirmăm?" } },
    ],
  },
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
  {
    id: "custom",
    name: { en: "Something Else", ro: "Alt Eveniment" },
    tagline: { en: "Tell me your dream — I'll plan it", ro: "Spune-mi ce visezi — îl planific eu" },
    icon: "🧭",
    honoreeLabel: { en: "People", ro: "Persoane" },
    steps: [
      { id: "location", kind: "basics", field: "location", title: { en: "Where", ro: "Unde" },
        question: { en: "Let's plan something special! 🌟 Where would you like it — a city, the seaside, the mountains, or somewhere specific? (Or let me suggest.)", ro: "Hai să planificăm ceva special! 🌟 Unde ți-ai dori — un oraș, la mare, la munte sau un loc anume? (Sau îți sugerez eu.)" } },
      { id: "people", kind: "basics", field: "people", title: { en: "People & budget", ro: "Persoane & buget" },
        question: { en: "How many of you, and what's your budget? I'll find options that fit.", ro: "Câți sunteți și care e bugetul? Caut opțiuni care se încadrează." } },
      { id: "date", kind: "basics", field: "date", title: { en: "When", ro: "Când" },
        question: { en: "When are you thinking? Type it or pick a date.", ro: "Când te gândești? Scrie sau alege o dată." } },
      { id: "discover", kind: "discover", title: { en: "Discover", ro: "Descoperă" },
        question: { en: "Tell me the vibe — a cozy mountain cabin, a seaside spa, a romantic dinner? I'll find real places near you. Or just say 'surprise me'.", ro: "Spune-mi atmosfera — o cabană cozy la munte, un spa la mare, o cină romantică? Găsesc locuri reale aproape de tine. Sau spune doar „surprinde-mă”." } },
      { id: "review", kind: "review", title: { en: "Review", ro: "Sumar" },
        question: { en: "Here's your plan. Shall we confirm?", ro: "Iată planul tău. Confirmăm?" } },
    ],
  },
];

export const CATEGORIES: Category[] = [
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
  { id: "print", name: { en: "Personalized & Print", ro: "Personalizate & Print" }, icon: "👕" },
  { id: "invitations", name: { en: "Invitations", ro: "Invitații" }, icon: "✉️" },
  { id: "favors", name: { en: "Favors", ro: "Mărturii" }, icon: "🎁" },
  { id: "afterparty", name: { en: "After-party", ro: "After-party" }, icon: "🥂" },
];

const W = "wedding" as const;
const U = "grad_university" as const;
const H = "grad_highschool" as const;
const ALL = [W, U, H];

const mk = (s: CatalogItem): CatalogItem => s;

export const CATALOG: CatalogItem[] = [
  // ===== CATERING =====
  mk({ id: "wed_menu_standard", category: "catering", eventTypes: [W], unit: "per_guest", price: 85, popular: true,
    name: { en: "Wedding Menu — Standard", ro: "Meniu Nuntă — Standard" }, description: { en: "Three-course plated dinner with drinks, per guest.", ro: "Meniu servit în trei feluri cu băuturi, per invitat." } }),
  mk({ id: "wed_menu_premium", category: "catering", eventTypes: [W], unit: "per_guest", price: 120,
    name: { en: "Wedding Menu — Premium", ro: "Meniu Nuntă — Premium" },
    description: { en: "Five-course gourmet menu with premium drinks, per guest.", ro: "Meniu gourmet în cinci feluri cu băuturi premium, per invitat." },
    long: { en: "An elevated five-course tasting menu crafted by the chef, paired with premium wines and an open bar. Plated service, dietary options on request — a dinner your guests will talk about for years.", ro: "Un meniu rafinat în cinci feluri creat de bucătar, alături de vinuri premium și open bar. Servire la farfurie, opțiuni dietetice la cerere — o cină despre care invitații vor vorbi ani de zile." },
    includes: { en: ["Five gourmet courses, plated", "Premium wines + open bar", "Welcome cocktail & canapés", "Vegetarian/vegan options"], ro: ["Cinci feluri gourmet, servite", "Vinuri premium + open bar", "Cocktail de bun-venit & canapé-uri", "Opțiuni vegetariene/vegane"] } }),
  mk({ id: "uni_menu", category: "catering", eventTypes: [U], unit: "per_guest", price: 30, popular: true,
    name: { en: "Banquet Menu", ro: "Meniu Banchet" }, description: { en: "Festive banquet dinner, per guest.", ro: "Cină festivă de banchet, per invitat." } }),
  mk({ id: "hs_menu", category: "catering", eventTypes: [H], unit: "per_guest", price: 25, popular: true,
    name: { en: "Banquet Menu", ro: "Meniu Banchet" }, description: { en: "Festive plated dinner with drinks, per guest.", ro: "Meniu festiv servit cu băuturi, per invitat." } }),
  mk({ id: "welcome_cocktail", category: "catering", eventTypes: ALL, unit: "per_guest", price: 6,
    name: { en: "Welcome Cocktail", ro: "Cocktail de Bun-venit" }, description: { en: "Canapés and a welcome drink on arrival, per guest.", ro: "Canapé-uri și o băutură de bun-venit la sosire, per invitat." } }),

  // ===== BAR =====
  mk({ id: "bar_open", category: "bar", eventTypes: [W, U], unit: "per_guest", price: 18,
    name: { en: "Open Bar", ro: "Open Bar" }, description: { en: "Unlimited bar all night, per guest.", ro: "Bar nelimitat toată noaptea, per invitat." } }),
  mk({ id: "bar_cocktail", category: "bar", eventTypes: [W, U], unit: "flat", price: 800,
    name: { en: "Cocktail Bar", ro: "Cocktail Bar" }, description: { en: "Mixologist with a signature cocktail menu.", ro: "Mixolog cu meniu de cocktail-uri semnătură." } }),
  mk({ id: "bar_coffee", category: "bar", eventTypes: ALL, unit: "flat", price: 300,
    name: { en: "Coffee Bar", ro: "Bar de Cafea" }, description: { en: "Barista station with specialty coffee.", ro: "Stație de barista cu cafea de specialitate." } }),

  // ===== CAKES & SWEETS =====
  mk({ id: "wed_cake", category: "cakes", eventTypes: [W], unit: "flat", price: 350, popular: true,
    name: { en: "Wedding Cake", ro: "Tort de Nuntă" }, description: { en: "Custom multi-tier wedding cake.", ro: "Tort de nuntă personalizat pe mai multe etaje." } }),
  mk({ id: "cake_festive", category: "cakes", eventTypes: [U, H], unit: "flat", price: 220,
    name: { en: "Celebration Cake", ro: "Tort Festiv" }, description: { en: "Themed graduation cake with your year.", ro: "Tort tematic de absolvire cu anul promoției." } }),
  mk({ id: "candy_bar", category: "cakes", eventTypes: ALL, unit: "flat", price: 500, popular: true,
    name: { en: "Candy Bar", ro: "Candy Bar" },
    description: { en: "Sweet table with pastries, macarons and fruit.", ro: "Masă cu prăjituri, macarons și fructe." },
    long: { en: "A beautifully styled sweets table matched to your colors — mini pastries, macarons, cake pops, chocolate and fresh fruit, refreshed through the evening. Always a guest favourite, day and night.", ro: "O masă de dulciuri stilizată pe culorile tale — mini-prăjituri, macarons, cake pops, ciocolată și fructe proaspete, reîmprospătate pe parcursul serii. Mereu preferata invitaților, zi și noapte." },
    includes: { en: ["Styled table on your color palette", "Pastries, macarons, cake pops, fruit", "Decor, jars & labels included", "Restocked through the event"], ro: ["Masă stilizată pe paleta ta de culori", "Prăjituri, macarons, cake pops, fructe", "Decor, borcane & etichete incluse", "Reaprovizionat pe parcurs"] } }),
  mk({ id: "shots_bar", category: "cakes", eventTypes: [W, U, H], unit: "flat", price: 180,
    name: { en: "Shots Station", ro: "Stație de Shot-uri" }, description: { en: "Fun shot-glass station for toasts.", ro: "Stație distractivă de shot-uri pentru toasturi." } }),

  // ===== PHOTOGRAPHY =====
  mk({ id: "wed_photovideo", category: "photography", eventTypes: [W], unit: "flat", price: 1300, popular: true,
    name: { en: "Photo & Video Package", ro: "Pachet Foto & Video" },
    description: { en: "Full-day photographer + videographer, edited gallery & film.", ro: "Fotograf + videograf toată ziua, galerie și film editat." },
    long: { en: "A complete two-person team captures your entire day — from getting ready to the last dance. You receive a beautifully edited online gallery and a cinematic wedding film you'll treasure for life.", ro: "O echipă completă de doi profesioniști surprinde toată ziua — de la pregătiri până la ultimul dans. Primești o galerie online editată impecabil și un film de nuntă cinematic, de păstrat o viață." },
    includes: { en: ["Photographer + videographer, full day", "300+ professionally edited photos", "5–7 min cinematic highlight film", "Private online gallery & download"], ro: ["Fotograf + videograf, toată ziua", "300+ poze editate profesional", "Film cinematic de 5–7 min", "Galerie online privată & download"] } }),
  mk({ id: "uni_portrait", category: "photography", eventTypes: [U], unit: "per_graduate", price: 45, popular: true,
    name: { en: "Portrait Session", ro: "Ședință Portret" }, description: { en: "Studio portraits in your gown, 10 retouched photos.", ro: "Portrete în robă, 10 poze retușate." } }),
  mk({ id: "uni_album", category: "photography", eventTypes: [U], unit: "per_graduate", price: 22,
    name: { en: "Personalized Album", ro: "Album Personalizat" }, description: { en: "Printed keepsake album per graduate.", ro: "Album tipărit per absolvent." } }),
  mk({ id: "hs_photovideo", category: "photography", eventTypes: [H], unit: "flat", price: 600, popular: true,
    name: { en: "Photo & Video Team", ro: "Echipă Foto & Video" },
    description: { en: "Photographer + videographer for the banquet.", ro: "Fotograf + videograf pentru banchet." },
    long: { en: "A photographer and videographer cover the whole banquet — the entrance, the speeches, the dance floor and all the candid moments with your classmates. You get an online gallery and a fun highlight clip to share with the whole class.", ro: "Un fotograf și un videograf acoperă tot banchetul — intrarea, discursurile, ringul de dans și toate momentele spontane cu colegii. Primești o galerie online și un clip de momente, de distribuit întregii clase." },
    includes: { en: ["Photographer + videographer", "Online gallery for the class", "Highlight clip to share", "Group & candid shots"], ro: ["Fotograf + videograf", "Galerie online pentru clasă", "Clip de momente de distribuit", "Poze de grup & spontane"] } }),
  mk({ id: "hs_album", category: "photography", eventTypes: [H, U], unit: "per_graduate", price: 35,
    name: { en: "Graduation Album", ro: "Album de Absolvire" }, description: { en: "Personalized printed album per student.", ro: "Album tipărit personalizat per elev." } }),
  mk({ id: "photobooth", category: "photography", eventTypes: ALL, unit: "flat", price: 450, popular: true,
    name: { en: "Photo Booth / Magic Mirror", ro: "Cabină Foto / Oglinda Magică" }, description: { en: "Photo booth with props and instant prints.", ro: "Cabină foto cu recuzită și printuri instant." } }),

  // ===== VIDEOGRAPHY =====
  mk({ id: "wed_cinematic", category: "videography", eventTypes: [W], unit: "flat", price: 700,
    name: { en: "Cinematic Drone Film", ro: "Film Cinematic cu Dronă" }, description: { en: "Aerial drone shots and a cinematic highlight edit.", ro: "Cadre cu dronă și montaj cinematic." } }),
  mk({ id: "uni_video", category: "videography", eventTypes: [U], unit: "flat", price: 450,
    name: { en: "Ceremony Film", ro: "Film Ceremonie" }, description: { en: "Edited film of the ceremony and celebration.", ro: "Film editat al ceremoniei și petrecerii." } }),
  mk({ id: "drone", category: "videography", eventTypes: ALL, unit: "flat", price: 200,
    name: { en: "Drone Coverage", ro: "Filmare cu Dronă" }, description: { en: "Aerial drone shots of the group and venue.", ro: "Cadre aeriene cu drona ale grupului și locației." } }),

  // ===== MUSIC / DJ =====
  mk({ id: "dj_wedding", category: "music", eventTypes: [W], unit: "flat", price: 900, popular: true,
    name: { en: "DJ + Sound & Lights", ro: "DJ + Sonorizare & Lumini" },
    description: { en: "Professional DJ with full sound and lighting rig.", ro: "DJ profesionist cu sonorizare și lumini complete." },
    long: { en: "An experienced wedding DJ reads the room and keeps the dance floor packed all night, with a pro sound system and a full lighting show. Music is planned with you in advance, including your special-moment songs.", ro: "Un DJ cu experiență la nunți simte publicul și ține ringul plin toată noaptea, cu sonorizare profesională și show complet de lumini. Muzica e planificată din timp cu tine, inclusiv piesele pentru momentele speciale." },
    includes: { en: ["Professional DJ, up to 8 hours", "Concert-grade sound system", "Dance-floor lighting show", "Wireless mics for speeches"], ro: ["DJ profesionist, până la 8 ore", "Sonorizare de concert", "Show de lumini pe ring", "Microfoane wireless pentru discursuri"] } }),
  mk({ id: "dj_party", category: "music", eventTypes: [U, H], unit: "flat", price: 450, popular: true,
    name: { en: "DJ + Sound & Lights", ro: "DJ + Sonorizare & Lumini" }, description: { en: "DJ with full sound and light show.", ro: "DJ cu sonorizare și show de lumini." } }),
  mk({ id: "mc_host", category: "music", eventTypes: ALL, unit: "flat", price: 400,
    name: { en: "MC / Host", ro: "Prezentator / MC" }, description: { en: "Charismatic host to run the evening.", ro: "Prezentator carismatic care conduce seara." } }),

  // ===== ARTISTS / BANDS (real Romanian acts; photos from Wikimedia) =====
  mk({ id: "art_loredana", category: "artists", eventTypes: ALL, unit: "flat", price: 8000, popular: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Loredana_Groza_-_oct_2020.jpg/500px-Loredana_Groza_-_oct_2020.jpg",
    name: { en: "Loredana Groza", ro: "Loredana Groza" },
    description: { en: "Iconic Romanian pop/dance superstar. A headline concert that turns your event into a show — full band, hits across decades, huge stage energy.", ro: "Superstar pop/dance, una dintre cele mai mari artiste din România. Un concert-eveniment cu trupă completă, hituri din toate timpurile și energie de scenă uriașă." } }),
  mk({ id: "art_delia", category: "artists", eventTypes: ALL, unit: "flat", price: 7000, popular: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Delia_-_Untold_2023_%2853115701763%29_%28cropped%29.jpg/500px-Delia_-_Untold_2023_%2853115701763%29_%28cropped%29.jpg",
    name: { en: "Delia", ro: "Delia" },
    description: { en: "One of the country's most beloved pop voices. A vibrant, theatrical live set that's perfect for a wow moment at weddings and galas.", ro: "Una dintre cele mai îndrăgite voci pop din România. Un recital viu și spectaculos, perfect pentru un moment wow la nuntă sau gală." } }),
  mk({ id: "art_holograf", category: "artists", eventTypes: ALL, unit: "flat", price: 6000,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Dan_Bittman.jpg/500px-Dan_Bittman.jpg",
    name: { en: "Holograf", ro: "Holograf" },
    description: { en: "Legendary Romanian rock/pop band fronted by Dan Bittman. Decades of anthems everyone sings along to — a timeless crowd-pleaser.", ro: "Trupă legendară de rock/pop, cu Dan Bittman. Zeci de hituri pe care le cântă toată lumea — un favorit garantat al publicului." } }),
  mk({ id: "art_vunk", category: "artists", eventTypes: ALL, unit: "flat", price: 5000,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Vunk_in_2023.jpg/500px-Vunk_in_2023.jpg",
    name: { en: "VUNK", ro: "VUNK" },
    description: { en: "High-energy pop-rock band, a favourite at weddings and corporate parties. ~60 min headline set, then the party keeps going.", ro: "Trupă pop-rock plină de energie, favorită la nunți și petreceri corporate. Recital de ~60 min, apoi petrecerea continuă." } }),
  mk({ id: "art_fuego", category: "artists", eventTypes: ALL, unit: "flat", price: 1800,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Paul_Surugiu_%28Fuego%29_at_West_Side_Christmas_Market_2025.jpg/500px-Paul_Surugiu_%28Fuego%29_at_West_Side_Christmas_Market_2025.jpg",
    name: { en: "Fuego", ro: "Fuego" },
    description: { en: "Beloved entertainer blending pop and Romanian folk. Warm, charismatic 45–60 min recital that every generation enjoys.", ro: "Artist îndrăgit, mix de pop și muzică populară. Recital cald și carismatic de 45–60 min, pe placul tuturor generațiilor." } }),
  mk({ id: "art_maria", category: "artists", eventTypes: ALL, unit: "flat", price: 1600,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Maria_Dragomiroiu.jpg/500px-Maria_Dragomiroiu.jpg",
    name: { en: "Maria Dragomiroiu", ro: "Maria Dragomiroiu" },
    description: { en: "Renowned Romanian folk soloist. Authentic 'muzică populară' recital — the heart of a traditional celebration.", ro: "Solistă consacrată de muzică populară. Recital autentic — inima unei petreceri tradiționale." } }),
  mk({ id: "art_irina", category: "artists", eventTypes: ALL, unit: "flat", price: 1600,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Irina_Loghin.jpg/500px-Irina_Loghin.jpg",
    name: { en: "Irina Loghin", ro: "Irina Loghin" },
    description: { en: "Legendary folk voice of Romania. A classic, elegant recital for traditional weddings and banquets.", ro: "Voce legendară a muzicii populare. Un recital clasic și elegant pentru nunți și banchete tradiționale." } }),
  mk({ id: "art_sofia", category: "artists", eventTypes: ALL, unit: "flat", price: 1500,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Sofia_Vicoveanca_2021.jpg/500px-Sofia_Vicoveanca_2021.jpg",
    name: { en: "Sofia Vicoveanca", ro: "Sofia Vicoveanca" },
    description: { en: "Iconic folk artist from Bucovina. Timeless songs and stage presence for a heartfelt traditional moment.", ro: "Artistă emblematică din Bucovina. Cântece nemuritoare și prezență de scenă pentru un moment tradițional emoționant." } }),
  mk({ id: "art_band", category: "artists", eventTypes: ALL, unit: "flat", price: 3500, popular: true,
    name: { en: "Live Cover Band", ro: "Formație Live (Cover)" },
    description: { en: "Versatile live band covering pop, rock and party classics all night — keeps every generation on the dance floor.", ro: "Formație live versatilă: pop, rock și hituri de petrecere toată noaptea — ține toate generațiile pe ring." } }),

  // ===== EFFECTS =====
  mk({ id: "fx_confetti", category: "effects", eventTypes: ALL, unit: "flat", price: 200,
    name: { en: "Confetti Cannons", ro: "Tunuri de Confetti" }, description: { en: "Confetti blast for key moments.", ro: "Tunuri de confetti pentru momentele cheie." } }),
  mk({ id: "fx_coldsparks", category: "effects", eventTypes: ALL, unit: "flat", price: 350,
    name: { en: "Cold Sparks", ro: "Scântei Reci" }, description: { en: "Indoor cold-spark fountains for the entrance/dance.", ro: "Fântâni de scântei reci pentru intrare/dans." } }),
  mk({ id: "fx_fog", category: "effects", eventTypes: [W], unit: "flat", price: 150,
    name: { en: "Heavy Fog (first dance)", ro: "Fum Greu (primul dans)" }, description: { en: "Dreamy low fog for your first dance.", ro: "Efect de fum jos pentru primul dans." } }),
  mk({ id: "fx_fireworks", category: "effects", eventTypes: [W, U], unit: "flat", price: 700,
    name: { en: "Fireworks Show", ro: "Spectacol de Artificii" }, description: { en: "Outdoor pyrotechnic show.", ro: "Spectacol pirotehnic în aer liber." } }),
  mk({ id: "fx_dryice", category: "effects", eventTypes: [W], unit: "flat", price: 250,
    name: { en: "Dry Ice / Bubbles", ro: "Gheață Carbonică / Baloane de Săpun" }, description: { en: "Dry-ice clouds or soap bubbles for magic moments.", ro: "Nori de gheață carbonică sau baloane de săpun pentru momente magice." } }),
  mk({ id: "fx_balloons", category: "effects", eventTypes: [U, H], unit: "flat", price: 180,
    name: { en: "Helium Balloon Release", ro: "Lansare Baloane Heliu" }, description: { en: "Helium balloon moment for the class.", ro: "Moment cu baloane cu heliu pentru clasă." } }),

  // ===== DECORATIONS =====
  mk({ id: "wed_decor_floral", category: "decorations", eventTypes: [W], unit: "flat", price: 1200, popular: true,
    name: { en: "Floral Décor", ro: "Decor Floral" }, description: { en: "Centerpieces, ceremony arch and aisle florals.", ro: "Aranjamente, arcadă și flori pe culoar." } }),
  mk({ id: "wed_decor_premium", category: "decorations", eventTypes: [W], unit: "flat", price: 2500,
    name: { en: "Premium Floral Installation", ro: "Instalație Florală Premium" }, description: { en: "Lavish arches, drapery, candles and themed zones.", ro: "Arcade bogate, draperii, lumânări și zone tematice." } }),
  mk({ id: "decor_themed", category: "decorations", eventTypes: [U, H], unit: "flat", price: 250, popular: true,
    name: { en: "Themed Décor & Balloons", ro: "Decor Tematic & Baloane" }, description: { en: "Themed décor, balloon arch and signage.", ro: "Decor tematic, arcadă de baloane și banner." } }),
  mk({ id: "ambient_lights", category: "decorations", eventTypes: [W, U], unit: "flat", price: 500,
    name: { en: "Ambient Lighting", ro: "Lumini Ambientale" }, description: { en: "Warm uplighting and fairy lights.", ro: "Lumini calde și instalații de lumini." } }),

  // ===== PHOTO ZONE =====
  mk({ id: "photozone_themed", category: "photozone", eventTypes: ALL, unit: "flat", price: 350, popular: true,
    name: { en: "Themed Photo Zone", ro: "Zonă Foto Amenajată" }, description: { en: "Decorated backdrop corner with props (e.g. 'Absolvire 2026').", ro: "Colț cu backdrop decorat și recuzită (ex. „Absolvire 2026”)." } }),

  // ===== ATTIRE / RENTALS =====
  mk({ id: "uni_gown", category: "attire", eventTypes: [U], unit: "per_graduate", price: 28, popular: true,
    name: { en: "Togă & Tocă Rental", ro: "Închiriere Togă & Tocă" },
    description: { en: "Gown, cap and tassel in faculty colors.", ro: "Togă, tocă și ciucure în culorile facultății." },
    long: { en: "A premium graduation set in your faculty's colors — gown, cap and tassel, freshly cleaned and pressed in your exact size. Delivered ready for the ceremony and collected afterwards, so you have nothing to worry about.", ro: "Un set premium de absolvire în culorile facultății tale — togă, tocă și ciucure, curățate și călcate proaspăt, pe mărimea ta exactă. Livrate gata pentru ceremonie și ridicate după, fără bătăi de cap." },
    includes: { en: ["Gown, cap & tassel, per graduate", "Faculty colors, exact sizing", "Cleaned & pressed", "Delivery + collection"], ro: ["Togă, tocă & ciucure, per absolvent", "Culorile facultății, mărime exactă", "Curățate & călcate", "Livrare + ridicare"] } }),
  mk({ id: "hs_gown", category: "attire", eventTypes: [H], unit: "per_graduate", price: 30, popular: true,
    name: { en: "Cap, Gown & Sash", ro: "Tocă, Robă & Eșarfă" }, description: { en: "Ceremony set personalized with the school logo.", ro: "Set de ceremonie personalizat cu sigla liceului." } }),

  // ===== PRINT / PERSONALIZED =====
  mk({ id: "print_tshirts", category: "print", eventTypes: [U, H], unit: "per_graduate", price: 15, popular: true,
    name: { en: "Personalized T-shirts", ro: "Tricouri Personalizate" }, description: { en: "Custom class t-shirt per student.", ro: "Tricou personalizat al clasei per elev." } }),
  mk({ id: "print_hoodies", category: "print", eventTypes: [U, H], unit: "per_graduate", price: 30,
    name: { en: "Personalized Hoodies", ro: "Hanorace Personalizate" }, description: { en: "Custom embroidered hoodie per student.", ro: "Hanorac brodat personalizat per elev." } }),
  mk({ id: "print_diploma", category: "print", eventTypes: [U, H], unit: "per_graduate", price: 8,
    name: { en: "Premium Diploma + Ribbon", ro: "Diplomă Premium + Panglică" }, description: { en: "Personalized diploma with ribbon.", ro: "Diplomă personalizată cu panglică." } }),
  mk({ id: "uni_diploma_frame", category: "print", eventTypes: [U], unit: "per_graduate", price: 25,
    name: { en: "Framed Diploma Keepsake", ro: "Diplomă Înrămată" }, description: { en: "Quality frame and plaque for the diploma.", ro: "Ramă de calitate și plachetă pentru diplomă." } }),

  // ===== INVITATIONS =====
  mk({ id: "wed_invitations", category: "invitations", eventTypes: [W], unit: "flat", price: 250,
    name: { en: "Invitation Suite", ro: "Set Invitații" }, description: { en: "Designed printed + digital invitations, menus & place cards.", ro: "Invitații tipărite + digitale, meniuri și place cards." } }),
  mk({ id: "grad_invitations", category: "invitations", eventTypes: [U, H], unit: "flat", price: 40,
    name: { en: "Invitations & Diplomas", ro: "Invitații & Diplome" }, description: { en: "Printed invitations for the banquet.", ro: "Invitații tipărite pentru banchet." } }),

  // ===== FAVORS =====
  mk({ id: "favors", category: "favors", eventTypes: ALL, unit: "per_guest", price: 4,
    name: { en: "Guest Favors", ro: "Mărturii" }, description: { en: "Personalized thank-you favor per guest.", ro: "Mărturie personalizată per invitat." } }),

  // ===== AFTER-PARTY =====
  mk({ id: "afterparty_pass", category: "afterparty", eventTypes: [U], unit: "per_graduate", price: 25, popular: true,
    name: { en: "After-party Pass", ro: "Acces After-party" }, description: { en: "Entry to the official after-party with a drink.", ro: "Acces la after-party-ul oficial cu o băutură." } }),
  mk({ id: "afterparty_vip", category: "afterparty", eventTypes: [U], unit: "flat", price: 300,
    name: { en: "VIP Table", ro: "Masă VIP" }, description: { en: "Reserved VIP table with bottle service.", ro: "Masă VIP rezervată cu serviciu la sticlă." } }),

  // ===== GRADUATION STANDARD EXTRAS (industry standard for absolvire) =====
  mk({ id: "grad_sash", category: "attire", eventTypes: [U, H], unit: "per_graduate", price: 10,
    name: { en: "Personalized Sash", ro: "Eșarfă Personalizată" }, description: { en: "Sash with the school logo & class year, per graduate.", ro: "Eșarfă cu sigla școlii și anul promoției, per absolvent." } }),
  mk({ id: "grad_medals", category: "favors", eventTypes: [U, H], unit: "flat", price: 150,
    name: { en: "Medals & Trophies", ro: "Medalii & Trofee" }, description: { en: "Awards for the top students and the mentors/teachers.", ro: "Premii pentru șefii de promoție și îndrumători/profesori." } }),
  mk({ id: "grad_usb", category: "print", eventTypes: [U, H], unit: "per_graduate", price: 8,
    name: { en: "Personalized USB Stick", ro: "Stick USB Personalizat" }, description: { en: "Branded USB with all the photos & videos, per graduate.", ro: "USB personalizat cu toate pozele & filmările, per absolvent." } }),
  mk({ id: "grad_flowers", category: "decorations", eventTypes: [U, H], unit: "flat", price: 250,
    name: { en: "Ceremony Flowers", ro: "Flori & Aranjamente (curs festiv)" }, description: { en: "Floral arrangements for the festive ceremony.", ro: "Aranjamente florale pentru cursul festiv." } }),
  mk({ id: "grad_digital_album", category: "photography", eventTypes: [U, H], unit: "per_graduate", price: 15,
    name: { en: "Digital Photo Album", ro: "Album Foto Digital" }, description: { en: "Online shared album with all the photos, per graduate.", ro: "Album digital online cu toate pozele, per absolvent." } }),
  mk({ id: "grad_balloon_machine", category: "effects", eventTypes: [U, H], unit: "flat", price: 120,
    name: { en: "Balloon Machine & Arch", ro: "Mașină de Baloane & Arcadă" }, description: { en: "Balloon machine and a themed balloon arch.", ro: "Mașină de baloane și arcadă tematică." } }),
  mk({ id: "grad_champagne", category: "bar", eventTypes: [U, H], unit: "per_guest", price: 7,
    name: { en: "Champagne & Biscuits", ro: "Șampanie & Pișcoturi" }, description: { en: "Welcome toast with champagne and biscuits, per guest.", ro: "Toast de bun-venit cu șampanie și pișcoturi, per invitat." } }),

  // ===== TRANSPORT =====
  mk({ id: "wed_limo", category: "transport", eventTypes: [W], unit: "flat", price: 600, popular: true,
    name: { en: "Bridal Limousine", ro: "Limuzină pentru Miri" }, description: { en: "Chauffeured stretch limousine for the couple, decorated, a few hours.", ro: "Limuzină cu șofer pentru miri, decorată, câteva ore." } }),
  mk({ id: "wed_vintage_car", category: "transport", eventTypes: [W], unit: "flat", price: 450,
    name: { en: "Vintage Wedding Car", ro: "Mașină de Epocă" }, description: { en: "Classic vintage car with driver for the bridal entrance.", ro: "Mașină clasică de epocă, cu șofer, pentru intrarea mirilor." } }),
  mk({ id: "guest_shuttle", category: "transport", eventTypes: ALL, unit: "flat", price: 500,
    name: { en: "Guest Shuttle Bus", ro: "Transfer Invitați (autocar)" }, description: { en: "Coach transfer for guests between venue, church and hotel.", ro: "Autocar pentru invitați între locație, biserică și hotel." } }),
  mk({ id: "private_transfer", category: "transport", eventTypes: ALL, unit: "flat", price: 250,
    name: { en: "Private Transfer", ro: "Transfer Privat" }, description: { en: "Private chauffeured car for the hosts/VIPs.", ro: "Mașină privată cu șofer pentru gazde/VIP." } }),

  // ===== HAIR & MAKEUP =====
  mk({ id: "bridal_beauty", category: "beauty", eventTypes: [W], unit: "flat", price: 350, popular: true,
    name: { en: "Bridal Hair & Makeup", ro: "Coafură & Machiaj Mireasă" }, description: { en: "Bride's hair + makeup on the day, with a prior trial session.", ro: "Coafură + machiaj mireasă în ziua Z, cu probă în prealabil." } }),
  mk({ id: "party_beauty", category: "beauty", eventTypes: [W, U, H], unit: "per_graduate", price: 45,
    name: { en: "Hair & Makeup", ro: "Coafură & Machiaj" }, description: { en: "Professional hair + makeup per honoree.", ro: "Coafură + machiaj profesional per protagonist." } }),

  // ===== COORDINATION =====
  mk({ id: "day_coordinator", category: "coordination", eventTypes: ALL, unit: "flat", price: 700,
    name: { en: "Day-of Coordinator", ro: "Coordonator în Ziua Z" }, description: { en: "A planner who runs the whole event day so you relax — timeline, vendors, troubleshooting.", ro: "Un coordonator care conduce toată ziua evenimentului — program, furnizori, rezolvă orice." } }),

  // ===== CEREMONY / FLORALS / AV / LATE-NIGHT =====
  mk({ id: "officiant", category: "tickets", eventTypes: [W], unit: "flat", price: 300,
    name: { en: "Ceremony Officiant", ro: "Oficiant Ceremonie" }, description: { en: "Celebrant for a personalized civil/symbolic ceremony.", ro: "Oficiant pentru o ceremonie civilă/simbolică personalizată." } }),
  mk({ id: "bridal_bouquet", category: "decorations", eventTypes: [W], unit: "flat", price: 220,
    name: { en: "Bridal Bouquet & Boutonnieres", ro: "Buchet Mireasă & Cocarde" }, description: { en: "Bride's bouquet plus boutonnieres for the groom & close family.", ro: "Buchetul miresei plus cocarde pentru mire și familia apropiată." } }),
  mk({ id: "sound_lighting", category: "rentals", eventTypes: ALL, unit: "flat", price: 800, popular: true,
    name: { en: "Sound & Lighting", ro: "Sonorizare & Lumini" }, description: { en: "Pro PA system + ambient/architectural lighting for the venue.", ro: "Sistem de sunet profesional + lumini ambientale/arhitecturale." } }),
  mk({ id: "marquee_tent", category: "rentals", eventTypes: ALL, unit: "flat", price: 1500,
    name: { en: "Event Marquee", ro: "Cort de Eveniment" }, description: { en: "Elegant tent/marquee for an outdoor celebration, with flooring.", ro: "Cort elegant pentru eveniment în aer liber, cu pardoseală." } }),
  mk({ id: "av_screen", category: "rentals", eventTypes: ALL, unit: "flat", price: 400,
    name: { en: "LED Screen & Projector", ro: "Ecran LED & Proiector" }, description: { en: "Big LED screen / projector for photos, slideshows and live feed.", ro: "Ecran LED mare / proiector pentru poze, slideshow și transmisie live." } }),
  mk({ id: "late_snacks", category: "catering", eventTypes: [W, U, H], unit: "per_guest", price: 12,
    name: { en: "Late-night Snacks", ro: "Gustări de Noapte" }, description: { en: "Midnight bites to keep the party going, per guest.", ro: "Gustări de la miezul nopții ca să țină petrecerea, per invitat." } }),
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
