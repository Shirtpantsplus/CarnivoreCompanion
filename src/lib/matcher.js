export function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

export function getInventoryName(item) {
  return typeof item === 'string' ? item : item?.name;
}

export function matchRecipes(recipes, kitchenItems, ownedSeasoningIds) {
  const pantry = new Set(kitchenItems.map(getInventoryName).map(normalize));

  return recipes
    .map((recipe) => {
      const required = (recipe.ingredients || []).map(normalize);
      const optional = (recipe.optional || []).map(normalize);
      const matched = (recipe.ingredients || []).filter((item) => pantry.has(normalize(item)));
      const optionalMatched = (recipe.optional || []).filter((item) => pantry.has(normalize(item)));
      const missing = (recipe.ingredients || []).filter((item) => !pantry.has(normalize(item)));
      const hasSeasoning = !recipe.seasoningId || ownedSeasoningIds.includes(recipe.seasoningId);
      const ingredientScore = required.length ? matched.length / required.length : 0;
      const optionalBoost = optional.length ? Math.min(optionalMatched.length * 3, 9) : 0;
      const score = Math.min(100, Math.round((ingredientScore * 76) + (hasSeasoning ? 18 : 0) + optionalBoost));

      return { ...recipe, matched, optionalMatched, missing, hasSeasoning, score };
    })
    .sort((a, b) => b.score - a.score || a.prepTime - b.prepTime);
}

export function buildGroceryList(mealPlan) {
  const missing = new Set();
  Object.values(mealPlan).forEach((recipe) => {
    recipe?.missing?.forEach((item) => missing.add(item));
    if (recipe && !recipe.hasSeasoning && recipe.seasoningName) missing.add('Needed seasoning: ' + recipe.seasoningName);
  });
  return Array.from(missing).sort();
}
