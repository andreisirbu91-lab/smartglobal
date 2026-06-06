import type { CatalogItem, CategoryId } from "./types";

/**
 * Every card gets a real, themed photo. Real uploads (item.image as a URL or
 * /catalog/... path) win; otherwise we pick a verified Unsplash photo for the
 * category, deterministically by item id so it's stable. Gradient is the very
 * last resort (handled by the card's onError).
 */

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

/** A distinct, well-matched photo per catalog item (real `item.image` overrides win). */
const ITEM_PHOTOS: Record<string, string> = {
  // catering
  wed_menu_standard: U("1555244162-803834f70033"),
  wed_menu_premium: U("1414235077428-338989a2e8c0"),
  uni_menu: U("1467003909585-2f8a72700288"),
  hs_menu: U("1504674900247-0877df9cc836"),
  welcome_cocktail: U("1551024709-8f23befc6f87"),
  // bar
  bar_open: U("1470337458703-46ad1756a187"),
  bar_cocktail: U("1514362545857-3bc16c4c7d1b"),
  bar_coffee: U("1495474472287-4d71bcdd2085"),
  // cakes
  wed_cake: U("1535141192574-5d4897c12636"),
  cake_festive: U("1578985545062-69928b1d9587"),
  candy_bar: U("1488477181946-6428a0291777"),
  shots_bar: U("1551538827-9c037cb4f32a"),
  // photography
  wed_photovideo: U("1452587925148-ce544e77e70d"),
  uni_portrait: U("1554048612-b6a482bc67e5"),
  uni_album: U("1512820790803-83ca734da794"),
  hs_photovideo: U("1485846234645-a62644f84728"),
  hs_album: U("1516979187457-637abb4f9353"),
  photobooth: U("1567446537708-ac4aa75c9c28"),
  // videography
  wed_cinematic: U("1500051638674-ff996a0ec29e"),
  uni_video: U("1574717024653-61fd2cf4d44d"),
  drone: U("1473968512647-3e447244af8f"),
  // music
  dj_wedding: U("1429962714451-bb934ecdc4ec"),
  dj_party: U("1459749411175-04bf5292ceea"),
  mc_host: U("1505373877841-8d25f7d46678"),
  // effects
  fx_confetti: U("1492684223066-81342ee5ff30"),
  fx_coldsparks: U("1530103862676-de8c9debad1d"),
  fx_fog: U("1518609878373-06d740f60d8b"),
  fx_fireworks: U("1467810563316-b5476525c0f9"),
  fx_dryice: U("1518609878373-06d740f60d8b"),
  fx_balloons: U("1527529482837-4698179dc6ce"),
  // decorations
  wed_decor_floral: U("1478146896981-b80fe463b330"),
  wed_decor_premium: U("1519225421980-715cb0215aed"),
  decor_themed: U("1464366400600-7168b8af9bc3"),
  ambient_lights: U("1503095396549-807759245b35"),
  // photozone
  photozone_themed: U("1530023367847-a683933f4172"),
  // attire / tickets
  uni_gown: U("1564981797816-1043664bf78d"),
  hs_gown: U("1627556704302-624286467c65"),
  uni_ticket: U("1627556704302-624286467c65"),
  // print
  print_tshirts: U("1521572163474-6864f9cf17ab"),
  print_hoodies: U("1556821840-3a63f95609a7"),
  print_diploma: U("1606326608606-aa0b62935f2b"),
  uni_diploma_frame: U("1607013251379-e6eecfffe234"),
  // invitations / favors / afterparty
  wed_invitations: U("1607344645866-009c320b63e0"),
  grad_invitations: U("1607344645866-009c320b63e0"),
  favors: U("1513201099705-a9746e1e201f"),
  afterparty_pass: U("1516450360452-9312f5e86fc7"),
  afterparty_vip: U("1470229722913-7c0e2dbbafd3"),
};

const CATEGORY_PHOTOS: Record<CategoryId, string[]> = {
  venues: [U("1519225421980-715cb0215aed"), U("1511285560929-80b456fea0bc")],
  attire: [U("1564981797816-1043664bf78d"), U("1627556704302-624286467c65")],
  tickets: [U("1627556704302-624286467c65"), U("1564981797816-1043664bf78d")],
  catering: [U("1414235077428-338989a2e8c0"), U("1467003909585-2f8a72700288")],
  bar: [U("1514362545857-3bc16c4c7d1b")],
  cakes: [U("1535141192574-5d4897c12636"), U("1488477181946-6428a0291777")],
  photography: [U("1452587925148-ce544e77e70d")],
  videography: [U("1485846234645-a62644f84728")],
  music: [U("1429962714451-bb934ecdc4ec"), U("1459749411175-04bf5292ceea")],
  artists: [U("1501386761578-eac5c94b800a"), U("1493676304819-0d7a8d026dcf")],
  effects: [U("1467810563316-b5476525c0f9"), U("1530103862676-de8c9debad1d")],
  decorations: [U("1478146896981-b80fe463b330"), U("1511285560929-80b456fea0bc")],
  photozone: [U("1492684223066-81342ee5ff30"), U("1516450360452-9312f5e86fc7")],
  rentals: [U("1522413452208-996ff3f3e740")],
  transport: [U("1485291571150-772bcfc10da5"), U("1503376780353-7e6692767b70")],
  beauty: [U("1487412947147-5cebf100ffc2"), U("1522335789203-aabd1fc54bc9")],
  coordination: [U("1505373877841-8d25f7d46678")],
  logistics: [U("1521791136064-7986c2920216")],
  lodging: [U("1566073771259-6a8506099945"), U("1611892440504-42a792e24d32")],
  print: [U("1492684223066-81342ee5ff30")],
  invitations: [U("1607344645866-009c320b63e0")],
  favors: [U("1513201099705-a9746e1e201f")],
  afterparty: [U("1516450360452-9312f5e86fc7"), U("1470229722913-7c0e2dbbafd3")],
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export function imageUrl(path: string): string {
  return path.startsWith("http") || path.startsWith("/") ? path : `/catalog/${path}.jpg`;
}

/** Resolve the best photo for a catalog item: real override → per-item → category pool. */
export function itemImage(item: CatalogItem): string {
  if (item.image) return imageUrl(item.image);
  if (ITEM_PHOTOS[item.id]) return ITEM_PHOTOS[item.id];
  const pool = CATEGORY_PHOTOS[item.category] ?? [];
  if (!pool.length) return "";
  return pool[hash(item.id) % pool.length];
}

export const CATEGORY_GRADIENT: Record<CategoryId, string> = {
  venues: "linear-gradient(135deg, #eef0e8, #cdd9bd)",
  attire: "linear-gradient(135deg, #efe7f2, #d9c2e0)",
  tickets: "linear-gradient(135deg, #f3ecdd, #e3cf9c)",
  catering: "linear-gradient(135deg, #f5ece4, #e6c9b0)",
  bar: "linear-gradient(135deg, #e8eef3, #bcd0e0)",
  cakes: "linear-gradient(135deg, #f7e9ec, #f0c2cf)",
  photography: "linear-gradient(135deg, #e8eef3, #c2d3e0)",
  videography: "linear-gradient(135deg, #e6e9f2, #c2c8e0)",
  music: "linear-gradient(135deg, #e9e6f3, #c9c0e6)",
  artists: "linear-gradient(135deg, #f1e6ef, #dcb6d6)",
  effects: "linear-gradient(135deg, #fbeede, #f5d0a0)",
  decorations: "linear-gradient(135deg, #fbeede, #f5d8b0)",
  photozone: "linear-gradient(135deg, #eef1f3, #cfd9de)",
  rentals: "linear-gradient(135deg, #ede9e2, #d6cbb4)",
  transport: "linear-gradient(135deg, #e8ecef, #c2ccd6)",
  beauty: "linear-gradient(135deg, #f6e8ee, #ecc2d4)",
  coordination: "linear-gradient(135deg, #eaedef, #ccd3d9)",
  logistics: "linear-gradient(135deg, #e9ece9, #cdd6cb)",
  lodging: "linear-gradient(135deg, #efeae3, #d8cab2)",
  print: "linear-gradient(135deg, #e9edf0, #c4d0d9)",
  invitations: "linear-gradient(135deg, #f3efe6, #ddd0b0)",
  favors: "linear-gradient(135deg, #f5ecef, #e6c2cf)",
  afterparty: "linear-gradient(135deg, #f1e6ef, #d9b8d6)",
};
