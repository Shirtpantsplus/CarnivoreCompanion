const KEYS = {
  kitchen: 'ccmp:kitchen-items',
  kitchenPhotos: 'ccmp:kitchen-photos',
  seasonings: 'ccmp:owned-seasonings',
  mealPlan: 'ccmp:meal-plan',
  favorites: 'ccmp:favorites'
};

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getKitchenItems() {
  return loadJson(KEYS.kitchen, ['ground beef', 'eggs', 'butter', 'cheese']);
}

export function saveKitchenItems(items) {
  saveJson(KEYS.kitchen, items);
}

export function getKitchenPhotos() {
  return loadJson(KEYS.kitchenPhotos, []);
}

export function saveKitchenPhotos(photos) {
  saveJson(KEYS.kitchenPhotos, photos);
}

export function getOwnedSeasonings() {
  return loadJson(KEYS.seasonings, ['steak-dust', 'taco-shake']);
}

export function saveOwnedSeasonings(ids) {
  saveJson(KEYS.seasonings, ids);
}

export function getMealPlan() {
  return loadJson(KEYS.mealPlan, {});
}

export function saveMealPlan(plan) {
  saveJson(KEYS.mealPlan, plan);
}

export function getFavorites() {
  return loadJson(KEYS.favorites, []);
}

export function saveFavorites(ids) {
  saveJson(KEYS.favorites, ids);
}
