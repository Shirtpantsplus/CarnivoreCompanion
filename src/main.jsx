import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Beef,
  CalendarDays,
  Camera,
  ChefHat,
  Heart,
  Home,
  ImagePlus,
  ListPlus,
  Search,
  ShoppingCart,
  Soup,
  Star,
  Trash2
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
  saveOwnedSeasonings
} from './lib/storage';
import { buildGroceryList, matchRecipes } from './lib/matcher';
import './styles.css';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'kitchen', label: 'My Kitchen', icon: Beef },
  { id: 'seasonings', label: 'Seasonings', icon: Soup },
  { id: 'recipes', label: 'Recipes', icon: ChefHat },
  { id: 'mealprep', label: 'Meal Prep', icon: CalendarDays },
  { id: 'grocery', label: 'Grocery List', icon: ShoppingCart }
];

const mealSlots = ['Monday Dinner', 'Tuesday Dinner', 'Wednesday Dinner', 'Thursday Dinner', 'Friday Dinner', 'Saturday Dinner', 'Sunday Dinner'];

const QUICK_ADD_ITEMS = [
  { label: 'Ground Beef', value: 'ground beef', category: 'Beef' },
  { label: 'Steak', value: 'steak', category: 'Beef' },
  { label: 'Roast', value: 'roast', category: 'Beef' },
  { label: 'Bacon', value: 'bacon', category: 'Pork' },
  { label: 'Pork', value: 'pork', category: 'Pork' },
  { label: 'Chicken', value: 'chicken', category: 'Chicken' },
  { label: 'Chicken Thighs', value: 'chicken thighs', category: 'Chicken' },
  { label: 'Eggs', value: 'eggs', category: 'Dairy & Eggs' },
  { label: 'Butter', value: 'butter', category: 'Dairy & Eggs' },
  { label: 'Cheese', value: 'cheese', category: 'Dairy & Eggs' },
  { label: 'Cream Cheese', value: 'cream cheese', category: 'Dairy & Eggs' },
  { label: 'Shrimp', value: 'shrimp', category: 'Seafood' },
  { label: 'Fish', value: 'fish', category: 'Seafood' },
  { label: 'Pork Rinds', value: 'pork rinds', category: 'Carnivore-ish' },
  { label: 'Sour Cream', value: 'sour cream', category: 'Carnivore-ish' }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kitchenItems, setKitchenItems] = useState(getKitchenItems);
  const [kitchenPhotos, setKitchenPhotos] = useState(getKitchenPhotos);
  const [ownedSeasonings, setOwnedSeasonings] = useState(getOwnedSeasonings);
  const [mealPlan, setMealPlan] = useState(getMealPlan);
  const [favorites, setFavorites] = useState(getFavorites);
  const [query, setQuery] = useState('');

  const seasoningMap = useMemo(() => Object.fromEntries(SEASONINGS.map((s) => [s.id, s])), []);
  const matches = useMemo(() => {
    return matchRecipes(RECIPES, kitchenItems, ownedSeasonings).map((recipe) => ({
      ...recipe,
      seasoningName: seasoningMap[recipe.seasoningId]?.name || 'Unknown seasoning',
      seasoningUrl: seasoningMap[recipe.seasoningId]?.productUrl || 'https://www.carnivorecompanion.com/collections/all',
      isFavorite: favorites.includes(recipe.id)
    }));
  }, [kitchenItems, ownedSeasonings, seasoningMap, favorites]);

  const filteredRecipes = matches.filter((recipe) => {
    const haystack = [
      recipe.title,
      recipe.seasoningName,
      recipe.strictness,
      recipe.category,
      recipe.protein,
      recipe.difficulty,
      ...recipe.ingredients,
      ...(recipe.optional || [])
    ].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  function updateKitchen(items) {
    setKitchenItems(items);
    saveKitchenItems(items);
  }

  function updateKitchenPhotos(photos) {
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

  function toggleFavorite(recipeId) {
    const next = favorites.includes(recipeId) ? favorites.filter((id) => id !== recipeId) : [...favorites, recipeId];
    setFavorites(next);
    saveFavorites(next);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-icon"><ChefHat size={26} /></div>
          <div>
            <h1>Carnivore Companion</h1>
            <p>Meal Planner MVP</p>
          </div>
        </div>
        <nav>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={activeTab === tab.id ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab(tab.id)}>
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="content">
        {activeTab === 'dashboard' && <Dashboard matches={matches} kitchenItems={kitchenItems} kitchenPhotos={kitchenPhotos} ownedSeasonings={ownedSeasonings} favorites={favorites} setActiveTab={setActiveTab} onToggleFavorite={toggleFavorite} />}
        {activeTab === 'kitchen' && <Kitchen items={kitchenItems} photos={kitchenPhotos} onChange={updateKitchen} onPhotoChange={updateKitchenPhotos} />}
        {activeTab === 'seasonings' && <Seasonings owned={ownedSeasonings} onChange={updateSeasonings} />}
        {activeTab === 'recipes' && <Recipes recipes={filteredRecipes} query={query} setQuery={setQuery} onToggleFavorite={toggleFavorite} />}
        {activeTab === 'mealprep' && <MealPrep matches={matches} mealPlan={mealPlan} onChange={updateMealPlan} />}
        {activeTab === 'grocery' && <GroceryList mealPlan={mealPlan} />}
      </section>
    </main>
  );
}

function Dashboard({ matches, kitchenItems, kitchenPhotos, ownedSeasonings, favorites, setActiveTab, onToggleFavorite }) {
  const top = matches[0];
  const favoriteRecipes = matches.filter((recipe) => favorites.includes(recipe.id)).slice(0, 3);
  return (
    <div>
      <Header eyebrow="Today" title="What can you cook right now?" subtitle="Match recipes to the food, photos, and seasonings already in your house." />
      <div className="stats-grid">
        <Stat label="Kitchen Items" value={kitchenItems.length} />
        <Stat label="Food Photos" value={kitchenPhotos.length} />
        <Stat label="Seasonings Owned" value={ownedSeasonings.length} />
        <Stat label="Best Match" value={top ? `${top.score}%` : '0%'} />
        <Stat label="Favorite Recipes" value={favorites.length} />
        <Stat label="Recipe Library" value={RECIPES.length} />
      </div>
      {top && <RecipeCard recipe={top} featured onToggleFavorite={onToggleFavorite} />}
      {favoriteRecipes.length > 0 && (
        <section className="mini-section">
          <h2><Star size={18} /> Favorite Recipes</h2>
          <div className="mini-grid">
            {favoriteRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} compact onToggleFavorite={onToggleFavorite} />)}
          </div>
        </section>
      )}
      <div className="action-row">
        <button onClick={() => setActiveTab('kitchen')}>Update My Kitchen</button>
        <button onClick={() => setActiveTab('recipes')}>See Recipe Matches</button>
      </div>
    </div>
  );
}

function Kitchen({ items, photos, onChange, onPhotoChange }) {
  const [input, setInput] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Meat');

  const groupedItems = useMemo(() => {
    return QUICK_ADD_ITEMS.reduce((groups, quick) => {
      if (items.includes(quick.value)) {
        groups[quick.category] = [...(groups[quick.category] || []), quick.value];
      }
      return groups;
    }, { Custom: items.filter((item) => !QUICK_ADD_ITEMS.some((quick) => quick.value === item)) });
  }, [items]);

  function addItem(value = input) {
    const cleanValue = value.trim().toLowerCase();
    if (!cleanValue || items.includes(cleanValue)) return;
    onChange([...items, cleanValue]);
    setInput('');
  }

  function removeItem(item) {
    onChange(items.filter((x) => x !== item));
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const name = photoName.trim().toLowerCase() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toLowerCase();
      const nextPhoto = {
        id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${file.name}`,
        name,
        category: photoCategory,
        image: reader.result,
        addedAt: new Date().toISOString()
      };
      onPhotoChange([nextPhoto, ...photos]);
      if (name && !items.includes(name)) onChange([...items, name]);
      setPhotoName('');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(photoId) {
    onPhotoChange(photos.filter((photo) => photo.id !== photoId));
  }

  return (
    <div>
      <Header eyebrow="Inventory" title="My Kitchen" subtitle="Add what you have, quick-add common foods, or take/upload a photo of current ingredients." />

      <section className="panel-section">
        <h2><ListPlus size={18} /> Manual Add</h2>
        <div className="input-row">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="ground beef, eggs, steak, shrimp..." />
          <button onClick={() => addItem()}><ListPlus size={18} /> Add</button>
        </div>
      </section>

      <section className="panel-section">
        <h2>Quick Add</h2>
        <div className="quick-add-grid">
          {QUICK_ADD_ITEMS.map((quick) => (
            <button key={quick.value} className={items.includes(quick.value) ? 'quick-add selected' : 'quick-add'} onClick={() => items.includes(quick.value) ? removeItem(quick.value) : addItem(quick.value)}>
              {items.includes(quick.value) ? '✓ ' : '+ '}{quick.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <h2><Camera size={18} /> Photo Log</h2>
        <p className="section-note">This stores a photo in browser storage and adds the typed name to your kitchen inventory. On phones, the camera opens automatically.</p>
        <div className="input-row photo-input-row">
          <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder="name this food, ex: ribeye, eggs, bacon" />
          <select value={photoCategory} onChange={(e) => setPhotoCategory(e.target.value)}>
            <option>Meat</option>
            <option>Dairy & Eggs</option>
            <option>Seafood</option>
            <option>Seasoning</option>
            <option>Other</option>
          </select>
          <label className="upload-button">
            <ImagePlus size={18} /> Take / Upload Photo
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
          </label>
        </div>
        {photos.length > 0 && (
          <div className="photo-grid">
            {photos.map((photo) => (
              <article className="photo-card" key={photo.id}>
                <img src={photo.image} alt={photo.name} />
                <div>
                  <strong>{photo.name}</strong>
                  <span>{photo.category}</span>
                </div>
                <button className="icon-button danger" onClick={() => removePhoto(photo.id)} aria-label={`Remove ${photo.name}`}><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel-section">
        <h2>Current Inventory</h2>
        {Object.entries(groupedItems).map(([category, groupItems]) => groupItems.length > 0 && (
          <div className="inventory-group" key={category}>
            <h3>{category}</h3>
            <div className="chip-grid">
              {groupItems.map((item) => <span className="chip" key={item}>{item}<button onClick={() => removeItem(item)}>×</button></span>)}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Seasonings({ owned, onChange }) {
  function toggle(id) {
    onChange(owned.includes(id) ? owned.filter((x) => x !== id) : [...owned, id]);
  }
  return (
    <div>
      <Header eyebrow="Cabinet" title="Seasoning Cabinet" subtitle="Select the Carnivore Companion seasonings the user owns." />
      <div className="card-grid">
        {SEASONINGS.map((seasoning) => (
          <button key={seasoning.id} className={owned.includes(seasoning.id) ? 'seasoning-card selected' : 'seasoning-card'} onClick={() => toggle(seasoning.id)}>
            <h3>{seasoning.name}</h3>
            <p>{seasoning.profile}</p>
            <small>Best with: {seasoning.bestWith.join(', ')}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function Recipes({ recipes, query, setQuery, onToggleFavorite }) {
  return (
    <div>
      <Header eyebrow="Matches" title="Recipe Library" subtitle="Recipes are scored by available ingredients and owned seasonings." />
      <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by food, seasoning, category, or recipe..." /></div>
      <div className="recipe-list">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onToggleFavorite={onToggleFavorite} />)}</div>
    </div>
  );
}

function MealPrep({ matches, mealPlan, onChange }) {
  return (
    <div>
      <Header eyebrow="Weekly" title="Meal Prep Planner" subtitle="Assign recipe matches to each dinner slot." />
      <div className="planner-grid">
        {mealSlots.map((slot) => (
          <div className="planner-card" key={slot}>
            <strong>{slot}</strong>
            <select value={mealPlan[slot]?.id || ''} onChange={(e) => {
              const selected = matches.find((recipe) => recipe.id === e.target.value);
              onChange({ ...mealPlan, [slot]: selected || null });
            }}>
              <option value="">Choose a recipe</option>
              {matches.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title} ({recipe.score}%)</option>)}
            </select>
            {mealPlan[slot] && <p>{mealPlan[slot].seasoningName} • Missing: {mealPlan[slot].missing.length || 'nothing'}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function GroceryList({ mealPlan }) {
  const items = buildGroceryList(mealPlan);
  return (
    <div>
      <Header eyebrow="Missing Items" title="Grocery List" subtitle="Auto-built from the meals planned for the week." />
      {items.length === 0 ? <p className="empty">No missing ingredients yet. Add meals to the planner first.</p> : <ul className="grocery-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>}
    </div>
  );
}

function RecipeCard({ recipe, featured = false, compact = false, onToggleFavorite }) {
  return (
    <article className={featured ? 'recipe-card featured' : compact ? 'recipe-card compact' : 'recipe-card'}>
      <div className="recipe-topline">
        <span>{recipe.score}% match</span>
        <span>{recipe.prepTime} min</span>
        <span>{recipe.strictness}</span>
        {recipe.category && <span>{recipe.category}</span>}
        {recipe.difficulty && <span>{recipe.difficulty}</span>}
      </div>
      <div className="recipe-title-row">
        <h2>{recipe.title}</h2>
        <button className={recipe.isFavorite ? 'favorite-button active' : 'favorite-button'} onClick={() => onToggleFavorite?.(recipe.id)} aria-label={`Favorite ${recipe.title}`}>
          <Heart size={18} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      {recipe.image && (
        <a href={recipe.videoUrl} target="_blank" rel="noreferrer" className="recipe-image-link" aria-label={`Open video for ${recipe.title}`}>
          <img src={recipe.image} alt={recipe.title} className="recipe-image" loading="lazy" />
        </a>
      )}
      {recipe.protein && <p><strong>Main protein:</strong> {recipe.protein}</p>}
      <p><strong>Seasoning:</strong> {recipe.seasoningName} {recipe.hasSeasoning ? '✅' : '🛒'}</p>
      {!recipe.hasSeasoning && <a className="buy-link" href={recipe.seasoningUrl} target="_blank" rel="noreferrer">Buy {recipe.seasoningName}</a>}
      <p><strong>Have:</strong> {recipe.matched.join(', ') || 'none yet'}</p>
      {recipe.optionalMatched?.length > 0 && <p><strong>Optional have:</strong> {recipe.optionalMatched.join(', ')}</p>}
      <p><strong>Missing:</strong> {recipe.missing.join(', ') || 'nothing'}</p>
      {!compact && (
        <details>
          <summary>Cooking steps</summary>
          <ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <a href={recipe.videoUrl} target="_blank" rel="noreferrer">Open related CarnivorousChef video</a>
        </details>
      )}
    </article>
  );
}

function Header({ eyebrow, title, subtitle }) {
  return <header className="page-header"><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></header>;
}

function Stat({ label, value }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}

createRoot(document.getElementById('root')).render(<App />);
