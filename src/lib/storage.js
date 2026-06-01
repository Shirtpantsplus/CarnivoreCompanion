const KEYS = {
  kitchen: 'ccmp:kitchen-items',
  photos: 'ccmp:kitchen-photos',
  seasonings: 'ccmp:owned-seasonings',
  mealPlan: 'ccmp:meal-plan',
  favorites: 'ccmp:favorites',
  customRecipes: 'ccmp:custom-recipes',
  generalGrocery: 'ccmp:general-grocery',
  feedback: 'ccmp:feedback'
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
  return loadJson(KEYS.kitchen, [
    { name: 'ground beef', addedAt: new Date().toISOString() },
    { name: 'eggs', addedAt: new Date().toISOString() },
    { name: 'butter', addedAt: new Date().toISOString() },
    { name: 'cheese', addedAt: new Date().toISOString() }
  ]);
}

export function saveKitchenItems(items) {
  saveJson(KEYS.kitchen, items);
}

export function getKitchenPhotos() {
  return loadJson(KEYS.photos, []);
}

export function saveKitchenPhotos(photos) {
  saveJson(KEYS.photos, photos);
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

export function saveFavorites(favorites) {
  saveJson(KEYS.favorites, favorites);
}

export function getCustomRecipes() {
  return loadJson(KEYS.customRecipes, []);
}

export function saveCustomRecipes(recipes) {
  saveJson(KEYS.customRecipes, recipes);
}

export function getGeneralGroceryItems() {
  return loadJson(KEYS.generalGrocery, []);
}

export function saveGeneralGroceryItems(items) {
  saveJson(KEYS.generalGrocery, items);
}

export function getFeedbackEntries() {
  return loadJson(KEYS.feedback, []);
}

export function saveFeedbackEntries(entries) {
  saveJson(KEYS.feedback, entries);
}
