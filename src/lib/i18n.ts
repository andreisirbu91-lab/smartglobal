import type { Lang, Localized } from "./types";

type Key =
  | "brand" | "tagline" | "chooseEvent" | "chooseEventSub"
  | "yourPackage" | "empty" | "subtotal" | "total"
  | "honorees" | "guests" | "promoPlaceholder" | "apply"
  | "confirm" | "confirming" | "remove" | "popular"
  | "chatPlaceholder" | "send" | "greeting" | "changeEvent"
  | "contactName" | "contactEmail" | "needContact" | "savings"
  | "promoInvalid" | "thinking"
  | "continue" | "back" | "stepOf" | "city" | "cityPlaceholder"
  | "dateLabel" | "datePlaceholder" | "guestsQ" | "budgetLabel"
  | "select" | "selected" | "viewPhotos" | "viewOnMaps" | "reviews"
  | "from" | "loadingVenues" | "noVenues" | "recommended" | "skip"
  | "perGuest" | "added" | "add" | "included" | "home" | "more" | "sharePackage";

const S: Record<Key, Localized> = {
  brand: { en: "Event Concierge", ro: "Event Concierge" },
  tagline: { en: "Build your event, beautifully.", ro: "Construiește-ți evenimentul, frumos." },
  chooseEvent: { en: "What are we celebrating?", ro: "Ce sărbătorim?" },
  chooseEventSub: { en: "Pick an event to start your package.", ro: "Alege un eveniment pentru a începe." },
  yourPackage: { en: "Your Package", ro: "Pachetul Tău" },
  empty: { en: "Nothing yet — chat or tap items to add.", ro: "Încă nimic — scrie sau atinge articole." },
  subtotal: { en: "Subtotal", ro: "Subtotal" },
  total: { en: "Total", ro: "Total" },
  honorees: { en: "Honorees", ro: "Sărbătoriți" },
  guests: { en: "Guests", ro: "Invitați" },
  promoPlaceholder: { en: "Promo code", ro: "Cod promoțional" },
  apply: { en: "Apply", ro: "Aplică" },
  confirm: { en: "Confirm booking", ro: "Confirmă rezervarea" },
  confirming: { en: "Confirming…", ro: "Se confirmă…" },
  remove: { en: "Remove", ro: "Elimină" },
  popular: { en: "Popular", ro: "Popular" },
  chatPlaceholder: { en: "Describe what you'd like…", ro: "Descrie ce îți dorești…" },
  send: { en: "Send", ro: "Trimite" },
  greeting: {
    en: "Hi! I'm your event concierge. Let's build something special — tell me a bit about your event and I'll guide you step by step.",
    ro: "Salut! Sunt concierge-ul tău de evenimente. Hai să creăm ceva special — spune-mi câteva detalii și te ghidez pas cu pas.",
  },
  changeEvent: { en: "Change event", ro: "Schimbă evenimentul" },
  contactName: { en: "Full name", ro: "Nume complet" },
  contactEmail: { en: "Email", ro: "Email" },
  needContact: { en: "Add your name & email to confirm.", ro: "Adaugă numele și emailul pentru a confirma." },
  savings: { en: "you save", ro: "economisești" },
  promoInvalid: { en: "Invalid code", ro: "Cod invalid" },
  thinking: { en: "Working…", ro: "Lucrez…" },
  continue: { en: "Continue", ro: "Continuă" },
  back: { en: "Back", ro: "Înapoi" },
  stepOf: { en: "Step", ro: "Pasul" },
  city: { en: "City or area", ro: "Oraș sau zonă" },
  cityPlaceholder: { en: "e.g. Constanța", ro: "ex. Constanța" },
  dateLabel: { en: "Date", ro: "Data" },
  datePlaceholder: { en: "e.g. 15 July 2026", ro: "ex. 15 iulie 2026" },
  guestsQ: { en: "Guests", ro: "Invitați" },
  budgetLabel: { en: "Budget (€, optional)", ro: "Buget (€, opțional)" },
  select: { en: "Select", ro: "Alege" },
  selected: { en: "Selected", ro: "Ales" },
  viewPhotos: { en: "View photos", ro: "Vezi pozele" },
  viewOnMaps: { en: "View on Maps", ro: "Vezi pe Maps" },
  reviews: { en: "reviews", ro: "recenzii" },
  from: { en: "from", ro: "de la" },
  loadingVenues: { en: "Finding venues near you…", ro: "Caut locații aproape de tine…" },
  noVenues: { en: "No venues found — tell me your city in the chat.", ro: "Nicio locație găsită — spune-mi orașul în chat." },
  recommended: { en: "Within 50 km", ro: "În rază de 50 km" },
  skip: { en: "Skip", ro: "Sari peste" },
  perGuest: { en: "per guest", ro: "per invitat" },
  added: { en: "Added", ro: "Adăugat" },
  add: { en: "Add", ro: "Adaugă" },
  included: { en: "What's included", ro: "Ce include" },
  home: { en: "Home", ro: "Acasă" },
  more: { en: "more", ro: "detalii" },
  sharePackage: { en: "Share package", ro: "Trimite pachetul" },
};

export function t(key: Key, lang: Lang): string {
  return S[key][lang];
}
