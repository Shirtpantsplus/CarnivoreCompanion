# Carnivore Companion Meal Planner MVP

A ShirtPants-style React/Vite starter app for carnivore meal prep, recipe matching, seasoning selection, and grocery list generation.

## What it does

- Lets the user add food they currently have in **My Kitchen**.
- Lets the user select which Carnivore Companion seasonings they own.
- Scores recipes based on available ingredients and owned seasonings.
- Lets the user assign recipe matches to a weekly meal prep plan.
- Builds a grocery list from missing ingredients.
- Uses browser localStorage, so no backend is required for this first MVP.

## Setup

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal, usually:

```bash
http://localhost:5173
```

## Main files

- `src/main.jsx` — all core screens/components for the first MVP.
- `src/data/seasonings.js` — Carnivore Companion seasoning seed data.
- `src/data/recipes.js` — starter recipe library.
- `src/lib/storage.js` — localStorage helpers.
- `src/lib/matcher.js` — recipe matching and grocery-list logic.
- `src/styles.css` — app styling.

## Next build steps

1. Add real product images and product-specific links.
2. Add a recipe admin/editor screen.
3. Add YouTube video links per recipe.
4. Add user accounts and cloud sync.
5. Add shopping links back to Carnivore Companion products.
6. Convert to a PWA so users can install it on phones.

## Notes

This starter uses public product/creator references only. For a real official app, get permission before using brand assets, copied recipe text, product photos, or YouTube-derived recipe instructions.
