/**
 * Operational knowledge base (from the Star Global offer + standard practice).
 * The agent calls company_info(topic) so it ALWAYS has an answer and never blocks.
 */

type Entry = { keys: string[]; en: string; ro: string };

const KB: Entry[] = [
  {
    keys: ["payment", "pay", "deposit", "avans", "plata", "plată", "smartbill", "factura", "factură", "invoice"],
    en: "Three ways to pay at checkout: (1) 20% deposit by card now, rest before the event; (2) full payment by card (Stripe); (3) full on invoice by bank transfer (pay later). A SmartBill invoice is issued automatically either way. The deposit secures your date.",
    ro: "Trei moduri de plată la checkout: (1) avans 20% pe card acum, restul înainte de eveniment; (2) plată integrală pe card (Stripe); (3) integral pe factură prin transfer bancar (plată ulterioară). Factura SmartBill se emite automat în orice variantă. Avansul vă blochează data.",
  },
  {
    keys: ["minimum", "min", "minim", "cati", "câți", "participants", "absolventi", "absolvenți", "how many"],
    en: "Minimums: Base Pack from 25 graduates; Expert/VIP and the Banquet from 100; the album from 20. Smaller groups can be arranged on request.",
    ro: "Minime: Base Pack de la 25 de absolvenți; Expert/VIP și Banchetul de la 100; albumul de la 20. Grupurile mai mici se pot aranja la cerere.",
  },
  {
    keys: ["included", "include", "ce contine", "ce conține", "package", "pachet", "what do i get"],
    en: "Every festivity pack includes the gown rental, cap (kept), sash, badge, a velvet honorary diploma, the event photography and a photo session. Expert/VIP add photobooth, 360, livestream, stage, medals and more.",
    ro: "Fiecare pachet de festivitate include închirierea robei, toca (rămâne), eșarfă, insignă, diplomă onorifică pe catifea, fotografierea evenimentului și o ședință foto. Expert/VIP adaugă photobooth, 360, livestream, scenă, medalii și altele.",
  },
  {
    keys: ["photo location", "locatie foto", "locație foto", "sedinta foto", "ședință foto", "studio", "where photo"],
    en: "The photo session is included. It can be at our Studio Photo Session (Star Global HQ, with an outdoor coffee/bar area) or at 20+ partner locations (Crama Rasova, Forest M, Perryland Urban Farm…). We only intermediate; any on-site consumption fee (~50-75 RON/graduate) is paid at the venue.",
    ro: "Ședința foto este inclusă. Poate fi la Studio Photo Session (sediul Star Global, cu zonă de coffee/bar în aer liber) sau la 20+ locații partenere (Crama Rasova, Forest M, Perryland Urban Farm…). Noi doar intermediem; eventuala consumație (~50-75 RON/absolvent) se achită la locație.",
  },
  {
    keys: ["venue", "locatie", "locație", "local", "sala", "sală", "banchet", "banquet hall"],
    en: "The banquet is held at a Star Global partner venue in Constanța (Porto del Sole, Ten Luxury Ballroom, Del Mar Ballroom, The View, Zoom Beach, Neversea Beach and more). The venue is included in the banquet package.",
    ro: "Banchetul are loc la o locație parteneră Star Global din Constanța (Porto del Sole, Ten Luxury Ballroom, Del Mar Ballroom, The View, Zoom Beach, Neversea Beach și altele). Locația este inclusă în pachetul de banchet.",
  },
  {
    keys: ["artist", "artisti", "artiști", "band", "trupa", "trupă", "dj", "concert"],
    en: "We book national & international artists (Pop, Hip-Hop, Rock/Indie, DJ) — from a resident DJ to headliners like INNA. Artist fees are quoted in EUR + VAT and include the artist's travel and per diem; availability is confirmed on request.",
    ro: "Aducem artiști naționali & internaționali (Pop, Hip-Hop, Rock/Indie, DJ) — de la DJ rezident la capete de afiș precum INNA. Onorariile artiștilor sunt în EUR + TVA și includ transportul și diurna artistului; disponibilitatea se confirmă la cerere.",
  },
  {
    keys: ["area", "zona", "zonă", "oras", "oraș", "city", "constanta", "constanța", "where do you operate"],
    en: "Star Global Academic operates across Constanța and the Dobrogea region (Tulcea, Mangalia, Medgidia, Hârșova and more), with 10+ years and 40,000+ graduates.",
    ro: "Star Global Academic operează în Constanța și regiunea Dobrogea (Tulcea, Mangalia, Medgidia, Hârșova și altele), cu peste 10 ani și 40.000+ absolvenți.",
  },
  {
    keys: ["change", "modify", "reschedule", "modifica", "modifică", "reprograma", "cancel", "anula"],
    en: "You can change anything anytime — date, venue, packages or add-ons — just tell me and I'll update it. Confirmed bookings can be modified or rescheduled from the booking page; the same reference is kept.",
    ro: "Poți schimba orice oricând — dată, locație, pachete sau extra — spune-mi și actualizez. Rezervările confirmate pot fi modificate sau reprogramate din pagina rezervării; se păstrează aceeași referință.",
  },
  {
    keys: ["contact", "phone", "telefon", "email", "talk to", "human", "om"],
    en: "Star Global Academic — contact@starglobal.ro, 0748 031 166, @starglobalacademic. I can also have a coordinator follow up by email.",
    ro: "Star Global Academic — contact@starglobal.ro, 0748 031 166, @starglobalacademic. Pot ruga și un coordonator să revină pe email.",
  },
  {
    keys: ["expensive", "scump", "scumpa", "scumpă", "prea mult", "too much", "nu ne permitem", "budget too", "costa mult"],
    en: "Totally fair. Two ways to fit any budget: (1) I trim to the essentials and keep the price down — Base pack + the must-haves still make a beautiful day; (2) you split it — a 20% deposit now secures the date, the rest before the event. And group bookings (3+ grads) already take money off. Tell me your ceiling and I'll build the best possible event under it.",
    ro: "Foarte corect. Două căi ca să intre în orice buget: (1) reduc la esențial și țin prețul jos — Base + must-have-urile fac tot o zi frumoasă; (2) îl împărțiți — avans 20% acum blochează data, restul înainte de eveniment. Iar rezervările de grup (3+ absolvenți) au deja reducere. Spune-mi plafonul și construiesc cel mai bun eveniment sub el.",
  },
  {
    keys: ["think", "gandesc", "gândesc", "mai vedem", "later", "not sure", "nu stiu", "nu știu", "ezit", "decide"],
    en: "No pressure — but popular dates and top artists book fast, so I'd lock the date with the refundable deposit and keep refining the rest together. Want me to email you this exact package so you (and the class) can review and decide? I just need a name and email.",
    ro: "Fără presiune — dar datele bune și artiștii de top se ocupă repede, așa că aș bloca data cu avansul și rafinăm restul împreună. Vreți să vă trimit pe email exact acest pachet, ca să-l revedeți (și clasa) și să decideți? Îmi trebuie doar un nume și un email.",
  },
  {
    keys: ["just venue", "doar locatia", "doar locația", "only venue", "doar sala", "numai locatia"],
    en: "We can start with just the venue, sure. But the magic (and the savings) come from the package — photo, gown, diploma and the session are already inside it, so it's far better value than booking each separately. Want me to show what the full Base pack adds for not much more?",
    ro: "Putem porni doar cu locația, sigur. Dar magia (și economia) vin din pachet — foto, robă, diplomă și ședința foto sunt deja incluse, deci e mult mai avantajos decât separat. Vă arăt ce adaugă pachetul Base complet pentru foarte puțin în plus?",
  },
  {
    keys: ["compare", "diferenta", "diferența", "difference", "vs", "expert vs vip", "base vs", "care e mai bun"],
    en: "Quick compare (per graduate): Base (125) = gown, cap, diploma, photo session. Expert (245) = all that + photobooth, 360, livestream, 4K film, medals, stage & event planner. VIP (320) = all of Expert + Graduation Village, prosecco van, bars, live DJ. Most ~100-grad classes pick Expert as the sweet spot; VIP is for a festival-level show.",
    ro: "Comparație rapidă (per absolvent): Base (125) = robă, tocă, diplomă, ședință foto. Expert (245) = tot + photobooth, 360, livestream, film 4K, medalii, scenă & event planner. VIP (320) = tot din Expert + Graduation Village, prosecco van, baruri, DJ live. Majoritatea claselor de ~100 aleg Expert ca sweet-spot; VIP e pentru un show de nivel festival.",
  },
  {
    keys: ["discount", "reducere", "offer", "oferta", "ofertă", "promo"],
    en: "Group bookings (3+ graduates) get an automatic discount, and promo codes (e.g. GRAD2026, EARLYBIRD) apply on top. Partner perks: festival discounts (UNTOLD, Neversea), free sunbeds, coffee and more.",
    ro: "Rezervările de grup (3+ absolvenți) au discount automat, iar codurile promo (ex. GRAD2026, EARLYBIRD) se aplică în plus. Beneficii parteneri: reduceri la festivaluri (UNTOLD, Neversea), șezlonguri gratuite, cafea și altele.",
  },
];

/** Best-effort lookup: return matching KB answers, or a graceful fallback the agent can use. */
export function lookupInfo(topic: string, lang: "en" | "ro"): string {
  const q = (topic || "").toLowerCase();
  const hits = KB.filter((e) => e.keys.some((k) => q.includes(k) || k.includes(q)));
  const chosen = hits.length ? hits : []; // empty → fallback
  if (!chosen.length) {
    return lang === "ro"
      ? "Nu am acest detaliu exact la îndemână, dar îl pot afla. Spune-i clientului că verifici cu echipa/furnizorii și revii pe email — nu refuza niciodată."
      : "I don't have that exact detail on hand, but I can find it. Tell the customer you'll check with the team/suppliers and follow up by email — never refuse.";
  }
  return chosen.map((e) => e[lang]).join("\n\n");
}
