import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgePercent,
  Beef,
  CalendarDays,
  Camera,
  ChefHat,
  ClipboardList,
  FilePlus2,
  Filter,
  Heart,
  Home,
  ImagePlus,
  ListPlus,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Soup,
  Star,
  Trash2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { SEASONINGS } from './data/seasonings';
import { RECIPES } from './data/recipes';
import {
  getFavorites,
  getKitchenItems,
  getKitchenPhotos,
  getMealPlan,
  getOwnedSeasonings,
  saveFavorites,
  saveKitchenItems,
  saveKitchenPhotos,
  saveMealPlan,
  saveOwnedSeasonings,
  getCustomRecipes,
  saveCustomRecipes,
  getGeneralGroceryItems,
  saveGeneralGroceryItems,
  getFeedbackEntries,
  saveFeedbackEntries
} from './lib/storage';
import { buildGroceryList, matchRecipes } from './lib/matcher';
import './styles.css';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'inventory', label: 'Pantry & Inventory', icon: Package },
  { id: 'seasonings', label: 'Seasonings', icon: Soup },
  { id: 'recipes', label: 'Recipes', icon: ChefHat },
  { id: 'mealprep', label: 'Meal Prep', icon: CalendarDays },
  { id: 'grocery', label: 'Meal Grocery', icon: ShoppingCart },
  { id: 'general-grocery', label: 'Shopping Lists', icon: ClipboardList },
  { id: 'custom-recipes', label: 'My Recipes', icon: FilePlus2 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare }
];

const mealSlots = ['Monday Dinner', 'Tuesday Dinner', 'Wednesday Dinner', 'Thursday Dinner', 'Friday Dinner', 'Saturday Dinner', 'Sunday Dinner'];
const INVENTORY_CATEGORIES = ['Protein', 'Dairy & Eggs', 'Seafood', 'Produce', 'Pantry', 'Snacks', 'Seasonings', 'Household'];
const SHOPPING_CATEGORIES = ['Groceries', 'Snacks', 'Household', 'Carnivore', 'Other'];
const QUICK_ADD_ITEMS = [
  { label: 'Ground Beef', value: 'ground beef', category: 'Protein' },
  { label: 'Steak', value: 'steak', category: 'Protein' },
  { label: 'Chicken', value: 'chicken', category: 'Protein' },
  { label: 'Bacon', value: 'bacon', category: 'Protein' },
  { label: 'Eggs', value: 'eggs', category: 'Dairy & Eggs' },
  { label: 'Butter', value: 'butter', category: 'Dairy & Eggs' },
  { label: 'Cheese', value: 'cheese', category: 'Dairy & Eggs' },
  { label: 'Shrimp', value: 'shrimp', category: 'Seafood' },
  { label: 'Salmon', value: 'salmon', category: 'Seafood' },
  { label: 'Apples', value: 'apples', category: 'Produce' },
  { label: 'Bananas', value: 'bananas', category: 'Produce' },
  { label: 'Rice', value: 'rice', category: 'Pantry' },
  { label: 'Peanuts', value: 'peanuts', category: 'Snacks' },
  { label: 'Little Debbie Cakes', value: 'little debbie cakes', category: 'Snacks' },
  { label: 'Chips', value: 'chips', category: 'Snacks' },
  { label: 'Oreos', value: 'oreos', category: 'Snacks' },
  { label: 'Paper Towels', value: 'paper towels', category: 'Household' },
  { label: 'Toilet Paper', value: 'toilet paper', category: 'Household' },
  { label: 'Trash Bags', value: 'trash bags', category: 'Household' }
];

function makeId(prefix = 'id') {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function itemName(item) {
  return typeof item === 'string' ? item : item.name;
}

function clean(value) {
  return String(value || '').trim().toLowerCase();
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [inventoryItems, setInventoryItems] = useState(getKitchenItems);
  const [kitchenPhotos, setKitchenPhotos] = useState(getKitchenPhotos);
  const [ownedSeasonings, setOwnedSeasonings] = useState(getOwnedSeasonings);
  const [mealPlan, setMealPlan] = useState(getMealPlan);
  const [favorites, setFavorites] = useState(getFavorites);
  const [customRecipes, setCustomRecipes] = useState(getCustomRecipes);
  const [shoppingItems, setShoppingItems] = useState(getGeneralGroceryItems);
  const [feedbackEntries, setFeedbackEntries] = useState(getFeedbackEntries);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'All', difficulty: 'All', strictness: 'All', seasoningId: 'All' });

  const inventoryNames = useMemo(() => inventoryItems.map(itemName), [inventoryItems]);
  const allRecipes = useMemo(() => [...RECIPES, ...customRecipes], [customRecipes]);
  const seasoningMap = useMemo(() => Object.fromEntries(SEASONINGS.map((s) => [s.id, s])), []);
  const matches = useMemo(() => matchRecipes(allRecipes, inventoryNames, ownedSeasonings).map((recipe) => ({
    ...recipe,
    seasoningName: recipe.seasoningId ? (seasoningMap[recipe.seasoningId]?.name || 'Unknown seasoning') : 'No Carnivore Companion seasoning',
    seasoningUrl: recipe.seasoningId ? (seasoningMap[recipe.seasoningId]?.productUrl || 'https://www.carnivorecompanion.com/collections/all') : '',
    isFavorite: favorites.includes(recipe.id)
  })), [allRecipes, inventoryNames, ownedSeasonings, seasoningMap, favorites]);

  const selectedRecipe = selectedRecipeId ? matches.find((recipe) => recipe.id === selectedRecipeId) : null;
  const filteredRecipes = matches.filter((recipe) => {
    const haystack = [recipe.title, recipe.seasoningName, recipe.strictness, recipe.category, recipe.protein, recipe.difficulty, ...recipe.ingredients, ...(recipe.optional || [])].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase()) &&
      (filters.category === 'All' || recipe.category === filters.category) &&
      (filters.difficulty === 'All' || recipe.difficulty === filters.difficulty) &&
      (filters.strictness === 'All' || recipe.strictness === filters.strictness) &&
      (filters.seasoningId === 'All' || recipe.seasoningId === filters.seasoningId);
  });

  function updateInventory(items) {
    setInventoryItems(items);
    saveKitchenItems(items);
  }
  function updatePhotos(photos) {
    setKitchenPhotos(photos);
    saveKitchenPhotos(photos);
  }
  function updateSeasonings(ids) {
    setOwnedSeasonings(ids);
    saveOwnedSeasonings(ids);
  }
  function updateMealPlan(nextPlan) {
    setMealPlan(nextPlan);
    saveMealPlan(nextPlan);
  }
  function updateCustomRecipes(recipes) {
    setCustomRecipes(recipes);
    saveCustomRecipes(recipes);
  }
  function updateShopping(items) {
    setShoppingItems(items);
    saveGeneralGroceryItems(items);
  }
  function updateFeedback(entries) {
    setFeedbackEntries(entries);
    saveFeedbackEntries(entries);
  }
  function toggleFavorite(recipeId) {
    const next = favorites.includes(recipeId) ? favorites.filter((id) => id !== recipeId) : [...favorites, recipeId];
    setFavorites(next);
    saveFavorites(next);
  }
  function openRecipe(recipeId) {
    setSelectedRecipeId(recipeId);
    setActiveTab('recipe-detail');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="promo-strip sidebar-promo"><BadgePercent size={15} /> Free shipping on $99+ orders</div>
        <div className="brand-card">
          <div className="brand-icon"><ChefHat size={26} /></div>
          <div><h1>Carnivore Companion</h1><p>Seasoning-powered meal prep</p></div>
        </div>
        <nav>{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={activeTab === tab.id ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab(tab.id)}><Icon size={18} /> {tab.label}</button>; })}</nav>
        <a className="store-card" href="https://www.carnivorecompanion.com/collections/all" target="_blank" rel="noreferrer">
          <span>Shop the Seasonings</span>
          <strong>Steak Dust · Taco Shake · Gator Bite</strong>
        </a>
      </aside>
      <section className="content">
        <div className="mobile-topbar"><strong>Carnivore Companion</strong><span>Meal Planner</span></div>
        {activeTab === 'dashboard' && <Dashboard matches={matches} inventoryItems={inventoryItems} kitchenPhotos={kitchenPhotos} favorites={favorites} shoppingItems={shoppingItems} setActiveTab={setActiveTab} onToggleFavorite={toggleFavorite} onOpenRecipe={openRecipe} />}
        {activeTab === 'inventory' && <Inventory items={inventoryItems} photos={kitchenPhotos} onChange={updateInventory} onPhotoChange={updatePhotos} />}
        {activeTab === 'seasonings' && <Seasonings owned={ownedSeasonings} onChange={updateSeasonings} />}
        {activeTab === 'recipes' && <Recipes recipes={filteredRecipes} allRecipes={allRecipes} query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} onToggleFavorite={toggleFavorite} onOpenRecipe={openRecipe} />}
        {activeTab === 'recipe-detail' && <RecipeDetail recipe={selectedRecipe} mealPlan={mealPlan} onBack={() => setActiveTab('recipes')} onToggleFavorite={toggleFavorite} onMealPlanChange={updateMealPlan} />}
        {activeTab === 'mealprep' && <MealPrep matches={matches} mealPlan={mealPlan} onChange={updateMealPlan} />}
        {activeTab === 'grocery' && <MealGrocery mealPlan={mealPlan} />}
        {activeTab === 'general-grocery' && <ShoppingLists items={shoppingItems} inventoryItems={inventoryItems} onChange={updateShopping} onInventoryChange={updateInventory} />}
        {activeTab === 'custom-recipes' && <CustomRecipes recipes={customRecipes} onChange={updateCustomRecipes} />}
        {activeTab === 'feedback' && <Feedback entries={feedbackEntries} onChange={updateFeedback} />}
      </section>
    </main>
  );
}

function Dashboard({ matches, inventoryItems, kitchenPhotos, favorites, shoppingItems, setActiveTab, onToggleFavorite, onOpenRecipe }) {
  const top = matches[0];
  const favoriteRecipes = matches.filter((recipe) => favorites.includes(recipe.id)).slice(0, 3);
  const lowItems = inventoryItems.filter((item) => item.low || Number(item.quantity) <= 1).slice(0, 5);
  const recentItems = [...inventoryItems].slice(-5).reverse();
  return <div>
    <section className="hero-panel"><div><span className="hero-kicker">Carnivore Companion Planner</span><h1>Plan meals around what you own.</h1><p>Match your pantry, snacks, household needs, and Carnivore Companion seasonings to recipes and shopping lists.</p></div><div className="hero-bottle-card"><span>Featured lineup</span><strong>5 Simple Seasonings</strong><small>Steak Dust · Gator Bite · Smoke Stack · Spicy Ranch · Taco Shake</small></div></section>
    <div className="stats-grid">
      <Stat label="Inventory Items" value={inventoryItems.length} />
      <Stat label="Food Photos" value={kitchenPhotos.length} />
      <Stat label="Best Match" value={top ? `${top.score}%` : '0%'} />
      <Stat label="Favorite Recipes" value={favorites.length} />
      <Stat label="Shopping Items" value={shoppingItems.length} />
      <Stat label="Low Inventory" value={lowItems.length} />
    </div>
    {top && <RecipeCard recipe={top} featured onToggleFavorite={onToggleFavorite} onOpenRecipe={onOpenRecipe} />}
    <div className="dashboard-grid">
      <MiniList title="Recently Added" items={recentItems.map((item) => `${item.name}${item.quantity ? ` × ${item.quantity}` : ''}`)} />
      <MiniList title="Running Low" items={lowItems.map((item) => `${item.name}${item.quantity ? ` × ${item.quantity}` : ''}`)} empty="Nothing marked low yet." />
    </div>
    {favoriteRecipes.length > 0 && <section className="mini-section"><h2><Star size={18} /> Favorite Recipes</h2><div className="mini-grid">{favoriteRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} compact onToggleFavorite={onToggleFavorite} onOpenRecipe={onOpenRecipe} />)}</div></section>}
    <div className="action-row"><button onClick={() => setActiveTab('inventory')}>Update Inventory</button><button onClick={() => setActiveTab('general-grocery')}>Open Shopping Lists</button><button onClick={() => setActiveTab('recipes')}>See Recipes</button></div>
  </div>;
}

function Inventory({ items, photos, onChange, onPhotoChange }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Protein');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Protein');
  const [filterCategory, setFilterCategory] = useState('All');

  const grouped = useMemo(() => INVENTORY_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: items.filter((item) => item.category === cat) }), {}), [items]);

  function addInventoryItem(rawName = name, rawCategory = category) {
    const cleanName = clean(rawName);
    if (!cleanName) return;
    const existing = items.find((item) => clean(item.name) === cleanName);
    if (existing) {
      onChange(items.map((item) => item.id === existing.id ? { ...item, quantity: Number(item.quantity || 0) + Number(quantity || 1), category: item.category || rawCategory } : item));
    } else {
      onChange([...items, { id: makeId('inv'), name: cleanName, category: rawCategory, quantity: Number(quantity || 1), unit, low: false, addedAt: new Date().toISOString() }]);
    }
    setName(''); setQuantity(1); setUnit('');
  }
  function removeItem(id) { onChange(items.filter((item) => item.id !== id)); }
  function updateItem(id, patch) { onChange(items.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function toggleQuick(quick) {
    const existing = items.find((item) => clean(item.name) === quick.value);
    if (existing) removeItem(existing.id); else addInventoryItem(quick.value, quick.category);
  }
  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photoItemName = clean(photoName) || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toLowerCase();
      const photo = { id: makeId('photo'), name: photoItemName, category: photoCategory, image: reader.result, addedAt: new Date().toISOString() };
      onPhotoChange([photo, ...photos]);
      if (photoItemName && !items.some((item) => clean(item.name) === photoItemName)) onChange([...items, { id: makeId('inv'), name: photoItemName, category: photoCategory, quantity: 1, unit: '', low: false, addedAt: new Date().toISOString() }]);
      setPhotoName(''); event.target.value = '';
    };
    reader.readAsDataURL(file);
  }
  const visibleCategories = filterCategory === 'All' ? INVENTORY_CATEGORIES : [filterCategory];
  return <div>
    <Header eyebrow="Inventory" title="Pantry & Inventory" subtitle="Track everything once: proteins, produce, snacks, pantry goods, seasonings, and household supplies." />
    <section className="panel-section"><h2><ListPlus size={18} /> Add Item</h2><div className="input-row wrap-row"><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addInventoryItem()} placeholder="little debbie cakes, eggs, peanuts, paper towels..." /><select value={category} onChange={(e) => setCategory(e.target.value)}>{INVENTORY_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select><input className="small-input" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} /><input className="small-input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unit" /><button onClick={() => addInventoryItem()}><ListPlus size={18} /> Add</button></div></section>
    <section className="panel-section"><h2>Quick Add</h2><div className="quick-add-grid">{QUICK_ADD_ITEMS.map((quick) => { const selected = items.some((item) => clean(item.name) === quick.value); return <button key={quick.value} className={selected ? 'quick-add selected' : 'quick-add'} onClick={() => toggleQuick(quick)}>{selected ? '✓ ' : '+ '}{quick.label}</button>; })}</div></section>
    <section className="panel-section"><h2><Camera size={18} /> Photo Log</h2><p className="section-note">Take or upload a photo and name the item. The item is added to inventory automatically.</p><div className="input-row photo-input-row"><input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder="name this item" /><select value={photoCategory} onChange={(e) => setPhotoCategory(e.target.value)}>{INVENTORY_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select><label className="upload-button"><ImagePlus size={18} /> Take / Upload Photo<input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} /></label></div>{photos.length > 0 && <div className="photo-grid">{photos.map((photo) => <article className="photo-card" key={photo.id}><img src={photo.image} alt={photo.name} /><div><strong>{photo.name}</strong><span>{photo.category}</span></div><button className="icon-button danger" onClick={() => onPhotoChange(photos.filter((p) => p.id !== photo.id))}><Trash2 size={16} /></button></article>)}</div>}</section>
    <section className="panel-section"><div className="section-title-row"><h2>Current Inventory</h2><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option>All</option>{INVENTORY_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select></div>{visibleCategories.map((cat) => grouped[cat]?.length > 0 && <div className="inventory-group" key={cat}><h3>{cat}</h3><div className="inventory-list">{grouped[cat].map((item) => <div className="inventory-row" key={item.id}><strong>{item.name}</strong><input type="number" min="0" value={item.quantity ?? 1} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} /><span>{item.unit}</span><label><input type="checkbox" checked={item.low} onChange={(e) => updateItem(item.id, { low: e.target.checked })} /> Low</label><button className="icon-button danger" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button></div>)}</div></div>)}</section>
  </div>;
}

function Seasonings({ owned, onChange }) { return <div><Header eyebrow="Cabinet" title="Seasoning Cabinet" subtitle="Select the Carnivore Companion seasonings you own." /><div className="card-grid">{SEASONINGS.map((seasoning) => <button key={seasoning.id} className={owned.includes(seasoning.id) ? 'seasoning-card selected' : 'seasoning-card'} onClick={() => onChange(owned.includes(seasoning.id) ? owned.filter((id) => id !== seasoning.id) : [...owned, seasoning.id])}><h3>{seasoning.name}</h3><p>{seasoning.profile}</p><small>Best with: {seasoning.bestWith.join(', ')}</small></button>)}</div></div>; }

function Recipes({ recipes, allRecipes, query, setQuery, filters, setFilters, onToggleFavorite, onOpenRecipe }) {
  const categoryOptions = ['All', ...Array.from(new Set(allRecipes.map((r) => r.category).filter(Boolean))).sort()];
  const difficultyOptions = ['All', ...Array.from(new Set(allRecipes.map((r) => r.difficulty).filter(Boolean))).sort()];
  const strictnessOptions = ['All', ...Array.from(new Set(allRecipes.map((r) => r.strictness).filter(Boolean))).sort()];
  return <div><Header eyebrow="Matches" title="Recipe Library" subtitle="Open a recipe for the full detail page, ingredients, steps, video, and buy links." /><div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by food, seasoning, category, or recipe..." /></div><div className="filter-bar"><Filter size={18} /><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select><select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>{difficultyOptions.map((option) => <option key={option}>{option}</option>)}</select><select value={filters.strictness} onChange={(e) => setFilters({ ...filters, strictness: e.target.value })}>{strictnessOptions.map((option) => <option key={option}>{option}</option>)}</select><select value={filters.seasoningId} onChange={(e) => setFilters({ ...filters, seasoningId: e.target.value })}><option value="All">All seasonings</option>{SEASONINGS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="recipe-list">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onToggleFavorite={onToggleFavorite} onOpenRecipe={onOpenRecipe} />)}</div></div>;
}

function RecipeCard({ recipe, featured = false, compact = false, onToggleFavorite, onOpenRecipe }) {
  return <article className={featured ? 'recipe-card featured' : compact ? 'recipe-card compact' : 'recipe-card'}><div className="recipe-topline"><span>{recipe.score}% match</span><span>{recipe.prepTime} min</span><span>{recipe.strictness}</span>{recipe.category && <span>{recipe.category}</span>}{recipe.difficulty && <span>{recipe.difficulty}</span>}</div>{recipe.image && <button className="recipe-image-button" onClick={() => onOpenRecipe?.(recipe.id)}><img src={recipe.image} alt={recipe.title} className="recipe-image" loading="lazy" /></button>}<div className="recipe-title-row"><h2>{recipe.title}</h2><button className={recipe.isFavorite ? 'favorite-button active' : 'favorite-button'} onClick={() => onToggleFavorite?.(recipe.id)}><Heart size={18} fill={recipe.isFavorite ? 'currentColor' : 'none'} /></button></div>{recipe.protein && <p><strong>Main protein:</strong> {recipe.protein}</p>}<p><strong>Seasoning:</strong> {recipe.seasoningName} {recipe.hasSeasoning ? '✅' : '🛒'}</p>{!recipe.hasSeasoning && recipe.seasoningUrl && <a className="buy-link" href={recipe.seasoningUrl} target="_blank" rel="noreferrer">Buy {recipe.seasoningName}</a>}<p><strong>Have:</strong> {recipe.matched.join(', ') || 'none yet'}</p><p><strong>Missing:</strong> {recipe.missing.join(', ') || 'nothing'}</p><div className="action-row compact-actions"><button onClick={() => onOpenRecipe?.(recipe.id)}>Open Recipe</button></div>{!compact && <details><summary>Quick steps</summary><ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol></details>}</article>;
}

function RecipeDetail({ recipe, mealPlan, onBack, onToggleFavorite, onMealPlanChange }) {
  const [slot, setSlot] = useState('Monday Dinner');
  if (!recipe) return <div><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Back to Recipes</button><p className="empty">Recipe not found.</p></div>;
  function addToMealPlan() { onMealPlanChange({ ...mealPlan, [slot]: recipe }); }
  return <div><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Back to Recipes</button><article className="recipe-detail"><div className="recipe-detail-hero">{recipe.image && <img src={recipe.image} alt={recipe.title} />}<div><div className="recipe-topline"><span>{recipe.score}% match</span><span>{recipe.prepTime} min</span><span>{recipe.difficulty}</span><span>{recipe.strictness}</span></div><h1>{recipe.title}</h1><p>{recipe.category} • {recipe.protein}</p><button className={recipe.isFavorite ? 'favorite-button active wide' : 'favorite-button wide'} onClick={() => onToggleFavorite?.(recipe.id)}><Heart size={18} fill={recipe.isFavorite ? 'currentColor' : 'none'} /> {recipe.isFavorite ? 'Favorited' : 'Favorite'}</button></div></div><div className="detail-grid"><section><h2>Ingredients</h2><ul className="check-list">{recipe.ingredients.map((ing) => <li key={ing} className={recipe.matched.includes(ing) ? 'have' : 'missing'}>{recipe.matched.includes(ing) ? '✓' : '•'} {ing}</li>)}</ul>{recipe.optional?.length > 0 && <><h3>Optional</h3><ul className="check-list">{recipe.optional.map((ing) => <li key={ing}>{ing}</li>)}</ul></>}</section><section><h2>Steps</h2><ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol></section></div><div className="action-row wrap-row"><select value={slot} onChange={(e) => setSlot(e.target.value)}>{mealSlots.map((mealSlot) => <option key={mealSlot}>{mealSlot}</option>)}</select><button onClick={addToMealPlan}><CalendarDays size={18} /> Add to Meal Plan</button>{recipe.videoUrl && <a className="button-link" href={recipe.videoUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Watch Video</a>}{recipe.seasoningUrl && <a className="button-link" href={recipe.seasoningUrl} target="_blank" rel="noreferrer">Buy {recipe.seasoningName}</a>}</div></article></div>;
}

function MealPrep({ matches, mealPlan, onChange }) { return <div><Header eyebrow="Weekly" title="Meal Prep Planner" subtitle="Assign recipe matches to each dinner slot." /><div className="planner-grid">{mealSlots.map((slot) => <div className="planner-card" key={slot}><strong>{slot}</strong><select value={mealPlan[slot]?.id || ''} onChange={(e) => { const selected = matches.find((recipe) => recipe.id === e.target.value); onChange({ ...mealPlan, [slot]: selected || null }); }}><option value="">Choose a recipe</option>{matches.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title} ({recipe.score}%)</option>)}</select>{mealPlan[slot] && <p>{mealPlan[slot].seasoningName} • Missing: {mealPlan[slot].missing.length || 'nothing'}</p>}</div>)}</div></div>; }
function MealGrocery({ mealPlan }) { const items = buildGroceryList(mealPlan); return <div><Header eyebrow="Meal Prep" title="Meal Grocery List" subtitle="Auto-built from meals planned for the week." />{items.length === 0 ? <p className="empty">No missing ingredients yet. Add meals to the planner first.</p> : <ul className="grocery-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>}</div>; }

function ShoppingLists({ items, inventoryItems, onChange, onInventoryChange }) {
  const [name, setName] = useState(''); const [category, setCategory] = useState('Groceries'); const [sourceItemId, setSourceItemId] = useState('');
  function addItem(rawName = name, rawCategory = category) { const value = clean(rawName); if (!value) return; onChange([{ id: makeId('shop'), name: value, category: rawCategory, done: false, createdAt: new Date().toISOString() }, ...items]); setName(''); }
  function addFromInventory() { const item = inventoryItems.find((x) => x.id === sourceItemId); if (!item) return; addItem(item.name, item.category === 'Snacks' ? 'Snacks' : item.category === 'Household' ? 'Household' : 'Groceries'); setSourceItemId(''); }
  function toggleDone(id) { onChange(items.map((item) => item.id === id ? { ...item, done: !item.done } : item)); }
  function moveToInventory(item) { if (!inventoryItems.some((inv) => clean(inv.name) === clean(item.name))) onInventoryChange([...inventoryItems, { id: makeId('inv'), name: item.name, category: item.category === 'Snacks' ? 'Snacks' : item.category === 'Household' ? 'Household' : 'Pantry', quantity: 1, unit: '', low: false, addedAt: new Date().toISOString() }]); toggleDone(item.id); }
  const grouped = SHOPPING_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: items.filter((item) => item.category === cat) }), {});
  return <div><Header eyebrow="General" title="Shopping Lists" subtitle="Track non-meal-prep groceries, snacks, household supplies, and items from inventory without entering them twice." /><section className="panel-section"><h2>Add Shopping Item</h2><div className="input-row wrap-row"><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="chips, little debbie cakes, peanuts, paper towels..." /><select value={category} onChange={(e) => setCategory(e.target.value)}>{SHOPPING_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select><button onClick={() => addItem()}><ListPlus size={18} /> Add</button></div><div className="input-row wrap-row"><select value={sourceItemId} onChange={(e) => setSourceItemId(e.target.value)}><option value="">Add existing inventory item...</option>{inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.category})</option>)}</select><button onClick={addFromInventory}>Add From Inventory</button></div></section>{SHOPPING_CATEGORIES.map((cat) => grouped[cat]?.length > 0 && <section className="panel-section" key={cat}><h2>{cat}</h2><div className="shopping-list">{grouped[cat].map((item) => <div className={item.done ? 'shopping-row done' : 'shopping-row'} key={item.id}><label><input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id)} /> {item.name}</label><button onClick={() => moveToInventory(item)}>Move to Inventory</button><button className="icon-button danger" onClick={() => onChange(items.filter((x) => x.id !== item.id))}><Trash2 size={16} /></button></div>)}</div></section>)}</div>;
}

function CustomRecipes({ recipes, onChange }) {
  const [title, setTitle] = useState(''); const [ingredients, setIngredients] = useState(''); const [steps, setSteps] = useState(''); const [category, setCategory] = useState('Family Recipe');
  function addRecipe() { if (!title.trim() || !ingredients.trim()) return; const recipe = { id: makeId('custom-recipe'), title: title.trim(), category, protein: 'Custom', difficulty: 'Easy', seasoningId: '', prepTime: 20, strictness: 'general', ingredients: ingredients.split(',').map(clean).filter(Boolean), optional: [], steps: steps.split('\n').map((x) => x.trim()).filter(Boolean), videoUrl: '', isCustom: true }; onChange([recipe, ...recipes]); setTitle(''); setIngredients(''); setSteps(''); }
  return <div><Header eyebrow="Custom" title="Create Your Own Recipes" subtitle="Add non-Carnivore Companion dishes and match them against the same Pantry & Inventory." /><section className="panel-section"><div className="input-row wrap-row"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recipe name" /><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" /></div><textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingredients separated by commas" /><textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Steps, one per line" /><div className="action-row"><button onClick={addRecipe}><FilePlus2 size={18} /> Save Recipe</button></div></section><div className="recipe-list">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}><h2>{recipe.title}</h2><p>{recipe.ingredients.join(', ')}</p><button className="icon-button danger" onClick={() => onChange(recipes.filter((x) => x.id !== recipe.id))}><Trash2 size={16} /></button></article>)}</div></div>;
}

function Feedback({ entries, onChange }) { const [type, setType] = useState('Idea'); const [message, setMessage] = useState(''); function submit() { if (!message.trim()) return; onChange([{ id: makeId('feedback'), type, message: message.trim(), createdAt: new Date().toISOString() }, ...entries]); setMessage(''); } return <div><Header eyebrow="Help Improve" title="Submit Feedback" subtitle="For now, this saves locally. Later, wire it to email, Firebase, or a support inbox." /><section className="panel-section"><select value={type} onChange={(e) => setType(e.target.value)}><option>Idea</option><option>Bug</option><option>Recipe Request</option><option>General Feedback</option></select><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What should be improved?" /><div className="action-row"><button onClick={submit}><MessageSquare size={18} /> Save Feedback</button></div></section><div className="recipe-list">{entries.map((entry) => <article className="recipe-card" key={entry.id}><div className="recipe-topline"><span>{entry.type}</span><span>{new Date(entry.createdAt).toLocaleDateString()}</span></div><p>{entry.message}</p></article>)}</div></div>; }

function MiniList({ title, items, empty = 'Nothing yet.' }) { return <section className="mini-list"><h2>{title}</h2>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="empty">{empty}</p>}</section>; }
function Header({ eyebrow, title, subtitle }) { return <header className="page-header"><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></header>; }
function Stat({ label, value }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>; }

createRoot(document.getElementById('root')).render(<App />);
