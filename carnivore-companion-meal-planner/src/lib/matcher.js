export function normalize(value) {
  return value.toLowerCase().trim();
}

export function matchRecipes(recipes, kitchenItems, ownedSeasoningIds) {
  const pantry = new Set(kitchenItems.map(normalize));

  return recipes
    .map((recipe) => {
      const required = recipe.ingredients.map(normalize);
      const matched = required.filter((item) => pantry.has(item));
      const missing = recipe.ingredients.filter((item) => !pantry.has(normalize(item)));
      const hasSeasoning = ownedSeasoningIds.includes(recipe.seasoningId);
      const ingredientScore = matched.length / required.length;
      const score = Math.round((ingredientScore * 80) + (hasSeasoning ? 20 : 0));

      return { ...recipe, matched, missing, hasSeasoning, score };
    })
    .sort((a, b) => b.score - a.score || a.prepTime - b.prepTime);
}

export function buildGroceryList(mealPlan) {
  const missing = new Set();
  Object.values(mealPlan).forEach((recipe) => {
    recipe?.missing?.forEach((item) => missing.add(item));
    if (recipe && !recipe.hasSeasoning) missing.add('Needed seasoning: ' + recipe.seasoningName);
  });
  return Array.from(missing).sort();
}
