import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
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
  { id: 'kitchen', label: 'My Kitchen', icon: Beef },
  { id: 'seasonings', label: 'Seasonings', icon: Soup },
  { id: 'recipes', label: 'Recipes', icon: ChefHat },
  { id: 'mealprep', label: 'Meal Prep', icon: CalendarDays },
  { id: 'grocery', label: 'Meal Grocery', icon: ShoppingCart },
  { id: 'general-grocery', label: 'General Grocery', icon: ClipboardList },
  { id: 'custom-recipes', label: 'My Recipes', icon: FilePlus2 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare }
];

const mealSlots = ['Monday Dinner', 'Tuesday Dinner', 'Wednesday Dinner', 'Thursday Dinner', 'Friday Dinner', 'Saturday Dinner', 'Sunday Dinner'];

const QUICK_ADD_ITEMS = [
  { label: 'Ground Beef', value: 'ground beef', category: 'Beef' },
  { label: 'Steak', value: 'steak', category: 'Beef' },
  { label: 'Roast', value: 'roast', category: 'Beef' },
  { label: 'Brisket', value: 'brisket', category: 'Beef' },
  { label: 'Bacon', value: 'bacon', category: 'Pork' },
  { label: 'Pork', value: 'pork', category: 'Pork' },
  { label: 'Ribs', value: 'ribs', category: 'Pork' },
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

function normalizeKitchenItems(items) {
  return items.map((item) => typeof item === 'string'
    ? { name: item, addedAt: new Date().toISOString() }
    : item
  );
}

function getItemName(item) {
  return typeof item === 'string' ? item : item.name;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kitchenItems, setKitchenItems] = useState(() => normalizeKitchenItems(getKitchenItems()));
  const [kitchenPhotos, setKitchenPhotos] = useState(getKitchenPhotos);
  const [ownedSeasonings, setOwnedSeasonings] = useState(getOwnedSeasonings);
  const [mealPlan, setMealPlan] = useState(getMealPlan);
  const [favorites, setFavorites] = useState(getFavorites);
  const [customRecipes, setCustomRecipes] = useState(getCustomRecipes);
  const [generalGroceryItems, setGeneralGroceryItems] = useState(getGeneralGroceryItems);
  const [feedbackEntries, setFeedbackEntries] = useState(getFeedbackEntries);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'All', difficulty: 'All', strictness: 'All', seasoningId: 'All' });

  const kitchenNames = useMemo(() => kitchenItems.map(getItemName), [kitchenItems]);
  const allRecipes = useMemo(() => [...RECIPES, ...customRecipes], [customRecipes]);
  const seasoningMap = useMemo(() => Object.fromEntries(SEASONINGS.map((s) => [s.id, s])), []);
  const matches = useMemo(() => {
    return matchRecipes(allRecipes, kitchenNames, ownedSeasonings).map((recipe) => ({
      ...recipe,
      seasoningName: recipe.seasoningId ? (seasoningMap[recipe.seasoningId]?.name || 'Unknown seasoning') : 'No Carnivore Companion seasoning',
      seasoningUrl: recipe.seasoningId ? (seasoningMap[recipe.seasoningId]?.productUrl || 'https://www.carnivorecompanion.com/collections/all') : '',
      isFavorite: favorites.includes(recipe.id)
    }));
  }, [allRecipes, kitchenNames, ownedSeasonings, seasoningMap, favorites]);

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

    const matchesSearch = haystack.includes(query.toLowerCase());
    const matchesCategory = filters.category === 'All' || recipe.category === filters.category;
    const matchesDifficulty = filters.difficulty === 'All' || recipe.difficulty === filters.difficulty;
    const matchesStrictness = filters.strictness === 'All' || recipe.strictness === filters.strictness;
    const matchesSeasoning = filters.seasoningId === 'All' || recipe.seasoningId === filters.seasoningId;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStrictness && matchesSeasoning;
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

  function updateCustomRecipes(recipes) {
    setCustomRecipes(recipes);
    saveCustomRecipes(recipes);
  }

  function updateGeneralGrocery(items) {
    setGeneralGroceryItems(items);
    saveGeneralGroceryItems(items);
  }

  function updateFeedback(entries) {
    setFeedbackEntries(entries);
    saveFeedbackEntries(entries);
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
        {activeTab === 'dashboard' && <Dashboard matches={matches} kitchenItems={kitchenItems} kitchenPhotos={kitchenPhotos} ownedSeasonings={ownedSeasonings} favorites={favorites} customRecipes={customRecipes} generalGroceryItems={generalGroceryItems} feedbackEntries={feedbackEntries} setActiveTab={setActiveTab} onToggleFavorite={toggleFavorite} />}
        {activeTab === 'kitchen' && <Kitchen items={kitchenItems} photos={kitchenPhotos} onChange={updateKitchen} onPhotoChange={updateKitchenPhotos} />}
        {activeTab === 'seasonings' && <Seasonings owned={ownedSeasonings} onChange={updateSeasonings} />}
        {activeTab === 'recipes' && <Recipes recipes={filteredRecipes} allRecipes={allRecipes} query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} onToggleFavorite={toggleFavorite} />}
        {activeTab === 'mealprep' && <MealPrep matches={matches} mealPlan={mealPlan} onChange={updateMealPlan} />}
        {activeTab === 'grocery' && <GroceryList mealPlan={mealPlan} />}
        {activeTab === 'general-grocery' && <GeneralGrocery items={generalGroceryItems} onChange={updateGeneralGrocery} />}
        {activeTab === 'custom-recipes' && <CustomRecipes recipes={customRecipes} onChange={updateCustomRecipes} />}
        {activeTab === 'feedback' && <Feedback entries={feedbackEntries} onChange={updateFeedback} />}
      </section>
    </main>
  );
}

function Dashboard({ matches, kitchenItems, kitchenPhotos, ownedSeasonings, favorites, customRecipes, generalGroceryItems, feedbackEntries, setActiveTab, onToggleFavorite }) {
  const top = matches[0];
  const favoriteRecipes = matches.filter((recipe) => favorites.includes(recipe.id)).slice(0, 3);
  const recentItems = kitchenItems.slice(-5).reverse();
  const missingSeasonings = matches.filter((recipe) => !recipe.hasSeasoning).slice(0, 3);

  return (
    <div>
      <Header eyebrow="Today" title="What can you cook right now?" subtitle="Match recipes to the food, photos, and seasonings already in your house." />
      <div className="stats-grid">
        <Stat label="Kitchen Items" value={kitchenItems.length} />
        <Stat label="Food Photos" value={kitchenPhotos.length} />
        <Stat label="Seasonings Owned" value={ownedSeasonings.length} />
        <Stat label="Best Match" value={top ? `${top.score}%` : '0%'} />
        <Stat label="Favorite Recipes" value={favorites.length} />
        <Stat label="Recipe Library" value={RECIPES.length + customRecipes.length} />
        <Stat label="Custom Recipes" value={customRecipes.length} />
        <Stat label="Grocery Items" value={generalGroceryItems.filter((item) => !item.checked).length} />
        <Stat label="Feedback Notes" value={feedbackEntries.length} />
      </div>

      {top && <RecipeCard recipe={top} featured onToggleFavorite={onToggleFavorite} />}

      <div className="dashboard-grid">
        {favoriteRecipes.length > 0 && (
          <section className="mini-section panel-section">
            <h2><Star size={18} /> Favorite Recipes</h2>
            <div className="mini-grid">
              {favoriteRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} compact onToggleFavorite={onToggleFavorite} />)}
            </div>
          </section>
        )}

        <section className="mini-section panel-section">
          <h2>Recently Added Foods</h2>
          {recentItems.length === 0 ? <p className="empty">No foods added yet.</p> : (
            <div className="recent-list">
              {recentItems.map((item) => <span key={`${item.name}-${item.addedAt}`}>{item.name}<small>{daysSince(item.addedAt)} day(s) ago</small></span>)}
            </div>
          )}
        </section>

        <section className="mini-section panel-section">
          <h2>Missing Seasoning Opportunities</h2>
          {missingSeasonings.length === 0 ? <p className="empty">You own the seasonings for your top matches.</p> : (
            <div className="recent-list">
              {missingSeasonings.map((recipe) => <a key={recipe.id} href={recipe.seasoningUrl} target="_blank" rel="noreferrer">{recipe.seasoningName}<small>{recipe.title}</small></a>)}
            </div>
          )}
        </section>
      </div>

      <div className="action-row">
        <button onClick={() => setActiveTab('kitchen')}>Update My Kitchen</button>
        <button onClick={() => setActiveTab('recipes')}>See Recipe Matches</button>
        <button onClick={() => setActiveTab('custom-recipes')}>Create Recipe</button>
        <button onClick={() => setActiveTab('general-grocery')}>General Grocery</button>
      </div>
    </div>
  );
}

function Kitchen({ items, photos, onChange, onPhotoChange }) {
  const [input, setInput] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Meat');
  const itemNames = items.map(getItemName);

  const groupedItems = useMemo(() => {
    return QUICK_ADD_ITEMS.reduce((groups, quick) => {
      const found = items.find((item) => getItemName(item) === quick.value);
      if (found) groups[quick.category] = [...(groups[quick.category] || []), found];
      return groups;
    }, { Custom: items.filter((item) => !QUICK_ADD_ITEMS.some((quick) => quick.value === getItemName(item))) });
  }, [items]);

  function addItem(value = input) {
    const cleanValue = value.trim().toLowerCase();
    if (!cleanValue || itemNames.includes(cleanValue)) return;
    onChange([...items, { name: cleanValue, addedAt: new Date().toISOString() }]);
    setInput('');
  }

  function removeItem(itemName) {
    onChange(items.filter((x) => getItemName(x) !== itemName));
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
      if (name && !itemNames.includes(name)) onChange([...items, { name, addedAt: new Date().toISOString() }]);
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
            <button key={quick.value} className={itemNames.includes(quick.value) ? 'quick-add selected' : 'quick-add'} onClick={() => itemNames.includes(quick.value) ? removeItem(quick.value) : addItem(quick.value)}>
              {itemNames.includes(quick.value) ? '✓ ' : '+ '}{quick.label}
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
                  <span>{photo.category} • {daysSince(photo.addedAt)} day(s) ago</span>
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
              {groupItems.map((item) => {
                const name = getItemName(item);
                return <span className="chip" key={name}>{name}<small>{daysSince(item.addedAt)}d</small><button onClick={() => removeItem(name)}>×</button></span>;
              })}
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

function Recipes({ recipes, allRecipes, query, setQuery, filters, setFilters, onToggleFavorite }) {
  const categories = uniqueOptions(allRecipes.map((recipe) => recipe.category));
  const difficulties = uniqueOptions(allRecipes.map((recipe) => recipe.difficulty));
  const strictnesses = uniqueOptions(allRecipes.map((recipe) => recipe.strictness));

  return (
    <div>
      <Header eyebrow="Matches" title="Recipe Library" subtitle="Recipes are scored by available ingredients and owned seasonings." />
      <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by food, seasoning, category, or recipe..." /></div>
      <div className="filter-panel">
        <strong><Filter size={16} /> Filters</strong>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option>All</option>
          {categories.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
          <option>All</option>
          {difficulties.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select value={filters.strictness} onChange={(e) => setFilters({ ...filters, strictness: e.target.value })}>
          <option>All</option>
          {strictnesses.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select value={filters.seasoningId} onChange={(e) => setFilters({ ...filters, seasoningId: e.target.value })}>
          <option value="All">All Seasonings</option>
          {SEASONINGS.map((seasoning) => <option key={seasoning.id} value={seasoning.id}>{seasoning.name}</option>)}
        </select>
      </div>
      <p className="section-note">Showing {recipes.length} recipe match(es).</p>
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


function GeneralGrocery({ items, onChange }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [note, setNote] = useState('');
  const activeItems = items.filter((item) => !item.checked);
  const completedItems = items.filter((item) => item.checked);

  function addItem() {
    const cleanName = name.trim();
    if (!cleanName) return;
    const nextItem = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${cleanName}`,
      name: cleanName,
      category,
      note: note.trim(),
      checked: false,
      addedAt: new Date().toISOString()
    };
    onChange([nextItem, ...items]);
    setName('');
    setNote('');
  }

  function toggleItem(id) {
    onChange(items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  }

  function removeItem(id) {
    onChange(items.filter((item) => item.id !== id));
  }

  function clearCompleted() {
    onChange(items.filter((item) => !item.checked));
  }

  return (
    <div>
      <Header eyebrow="General Grocery" title="Any Meal Grocery List" subtitle="Use this for non-Carnivore Companion meals, household staples, cookout items, or regular grocery runs." />
      <section className="panel-section">
        <h2><ClipboardList size={18} /> Add Grocery Item</h2>
        <div className="input-row grocery-input-row">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="milk, buns, paper plates, vegetables, snacks..." />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>General</option>
            <option>Meat</option>
            <option>Dairy</option>
            <option>Produce</option>
            <option>Pantry</option>
            <option>Household</option>
            <option>Other</option>
          </select>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional note" />
          <button onClick={addItem}><ListPlus size={18} /> Add</button>
        </div>
      </section>

      <section className="panel-section">
        <h2>Shopping List</h2>
        {activeItems.length === 0 ? <p className="empty">No active grocery items yet.</p> : (
          <div className="general-grocery-list">
            {activeItems.map((item) => <GroceryRow key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />)}
          </div>
        )}
      </section>

      {completedItems.length > 0 && (
        <section className="panel-section">
          <div className="section-title-row">
            <h2>Completed</h2>
            <button className="secondary-button" onClick={clearCompleted}>Clear Completed</button>
          </div>
          <div className="general-grocery-list completed">
            {completedItems.map((item) => <GroceryRow key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function GroceryRow({ item, onToggle, onRemove }) {
  return (
    <article className={item.checked ? 'grocery-row checked' : 'grocery-row'}>
      <button className="favorite-button" onClick={() => onToggle(item.id)} aria-label={`Toggle ${item.name}`}>{item.checked ? '✓' : ''}</button>
      <div>
        <strong>{item.name}</strong>
        <span>{item.category}{item.note ? ` • ${item.note}` : ''}</span>
      </div>
      <button className="icon-button danger" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button>
    </article>
  );
}

function CustomRecipes({ recipes, onChange }) {
  const emptyForm = { title: '', category: 'Custom', protein: '', difficulty: 'Easy', strictness: 'regular', prepTime: '20', ingredients: '', optional: '', steps: '', videoUrl: '', image: '' };
  const [form, setForm] = useState(emptyForm);

  function updateField(field, value) {
    setForm({ ...form, [field]: value });
  }

  function saveRecipe() {
    const title = form.title.trim();
    const ingredients = splitList(form.ingredients);
    const steps = splitSteps(form.steps);
    if (!title || ingredients.length === 0 || steps.length === 0) return;

    const nextRecipe = {
      id: `custom-${Date.now()}`,
      title,
      category: form.category.trim() || 'Custom',
      protein: form.protein.trim() || 'Mixed',
      difficulty: form.difficulty,
      seasoningId: '',
      prepTime: Number(form.prepTime) || 20,
      strictness: form.strictness,
      ingredients,
      optional: splitList(form.optional),
      steps,
      videoUrl: form.videoUrl.trim() || '#',
      image: form.image.trim(),
      imageSource: 'User provided',
      isCustom: true
    };
    onChange([nextRecipe, ...recipes]);
    setForm(emptyForm);
  }

  function deleteRecipe(id) {
    onChange(recipes.filter((recipe) => recipe.id !== id));
  }

  return (
    <div>
      <Header eyebrow="My Recipes" title="Create Your Own Recipes" subtitle="Add non-Carnivore Companion dishes or family meals so they can show up in the recipe matcher." />
      <section className="panel-section recipe-form">
        <h2><FilePlus2 size={18} /> New Recipe</h2>
        <div className="form-grid">
          <input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Recipe name" />
          <input value={form.protein} onChange={(e) => updateField('protein', e.target.value)} placeholder="Main protein or main ingredient" />
          <input value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Category" />
          <select value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Advanced</option>
          </select>
          <select value={form.strictness} onChange={(e) => updateField('strictness', e.target.value)}>
            <option>regular</option>
            <option>carnivore-ish</option>
            <option>strict carnivore</option>
            <option>keto</option>
            <option>family meal</option>
          </select>
          <input type="number" value={form.prepTime} onChange={(e) => updateField('prepTime', e.target.value)} placeholder="Prep minutes" />
        </div>
        <textarea value={form.ingredients} onChange={(e) => updateField('ingredients', e.target.value)} placeholder="Required ingredients, separated by commas" />
        <textarea value={form.optional} onChange={(e) => updateField('optional', e.target.value)} placeholder="Optional ingredients, separated by commas" />
        <textarea value={form.steps} onChange={(e) => updateField('steps', e.target.value)} placeholder="Cooking steps. Use one line per step." />
        <div className="form-grid two">
          <input value={form.image} onChange={(e) => updateField('image', e.target.value)} placeholder="Optional image URL" />
          <input value={form.videoUrl} onChange={(e) => updateField('videoUrl', e.target.value)} placeholder="Optional video/source URL" />
        </div>
        <button className="primary-wide" onClick={saveRecipe}>Save Recipe</button>
      </section>

      <section className="panel-section">
        <h2>Saved Custom Recipes</h2>
        {recipes.length === 0 ? <p className="empty">No custom recipes yet.</p> : (
          <div className="custom-recipe-list">
            {recipes.map((recipe) => (
              <article className="custom-recipe-row" key={recipe.id}>
                <div>
                  <strong>{recipe.title}</strong>
                  <span>{recipe.category} • {recipe.prepTime} min • {recipe.ingredients.length} ingredient(s)</span>
                </div>
                <button className="icon-button danger" onClick={() => deleteRecipe(recipe.id)} aria-label={`Delete ${recipe.title}`}><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Feedback({ entries, onChange }) {
  const [form, setForm] = useState({ type: 'Idea', message: '', email: '' });

  function submitFeedback() {
    const message = form.message.trim();
    if (!message) return;
    const nextEntry = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-feedback`,
      ...form,
      message,
      createdAt: new Date().toISOString(),
      status: 'local'
    };
    onChange([nextEntry, ...entries]);
    setForm({ type: 'Idea', message: '', email: '' });
  }

  function removeFeedback(id) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div>
      <Header eyebrow="Feedback" title="Submit Feedback" subtitle="Collect app ideas, bugs, recipe requests, and user notes. This version saves feedback locally until a backend/form service is added." />
      <section className="panel-section feedback-form">
        <h2><MessageSquare size={18} /> New Feedback</h2>
        <div className="form-grid two">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Idea</option>
            <option>Bug</option>
            <option>Recipe Request</option>
            <option>Seasoning Request</option>
            <option>Other</option>
          </select>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional email" />
        </div>
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what should be added, fixed, or improved..." />
        <button className="primary-wide" onClick={submitFeedback}>Save Feedback</button>
        <p className="section-note">Next upgrade: connect this page to Formspree, Firebase, Supabase, or a Vercel serverless endpoint so feedback can be emailed/stored centrally.</p>
      </section>

      <section className="panel-section">
        <h2>Saved Feedback</h2>
        {entries.length === 0 ? <p className="empty">No feedback submitted yet.</p> : (
          <div className="feedback-list">
            {entries.map((entry) => (
              <article className="feedback-card" key={entry.id}>
                <div>
                  <strong>{entry.type}</strong>
                  <span>{new Date(entry.createdAt).toLocaleString()}{entry.email ? ` • ${entry.email}` : ''}</span>
                  <p>{entry.message}</p>
                </div>
                <button className="icon-button danger" onClick={() => removeFeedback(entry.id)} aria-label="Delete feedback"><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        )}
      </section>
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
      <p><strong>Seasoning:</strong> {recipe.seasoningName} {recipe.requiresSeasoning ? (recipe.hasSeasoning ? '✅' : '🛒') : '🍽️'}</p>
      {recipe.requiresSeasoning && !recipe.hasSeasoning && <a className="buy-link" href={recipe.seasoningUrl} target="_blank" rel="noreferrer">Buy {recipe.seasoningName}</a>}
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

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function splitList(value) {
  return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function splitSteps(value) {
  return value.split(/\n|\|/).map((item) => item.trim()).filter(Boolean);
}

function daysSince(dateValue) {
  if (!dateValue) return 0;
  const diff = Date.now() - new Date(dateValue).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

createRoot(document.getElementById('root')).render(<App />);
