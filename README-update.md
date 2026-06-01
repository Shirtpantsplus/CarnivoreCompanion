# Carnivore Companion v1.4 + v1.5 Update

Replace these files/folders in your project:

- `src/main.jsx`
- `src/styles.css`
- `src/lib/storage.js`
- `src/lib/matcher.js`

This update adds:

## v1.4 Pantry & Inventory
- Renames My Kitchen to Pantry & Inventory
- Single inventory source for carnivore foods, general foods, snacks, household supplies, produce, pantry items, and seasonings
- Snacks category with quick-add items like Little Debbie Cakes, chips, peanuts, Oreos
- Household category
- Quantity tracking
- Low inventory checkbox
- Shopping Lists page can add items from existing inventory so users do not enter the same item twice
- Move shopping item to inventory

## v1.5 Recipe Detail Pages
- Open Recipe button
- Full recipe detail view
- Large image
- Ingredients with have/missing status
- Steps
- Favorite button
- Add to meal plan
- Watch video button
- Buy seasoning button

After replacing files:

```powershell
npm run dev
```

If good:

```powershell
git add .
git commit -m "Add pantry inventory and recipe detail pages"
git push
```
