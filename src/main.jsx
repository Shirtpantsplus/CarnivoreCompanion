import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Beef, CalendarDays, ChefHat, Home, ListPlus, Search, ShoppingCart, Soup } from 'lucide-react';
import { SEASONINGS } from './data/seasonings';
import { RECIPES } from './data/recipes';
import { getKitchenItems, getMealPlan, getOwnedSeasonings, saveKitchenItems, saveMealPlan, saveOwnedSeasonings } from './lib/storage';
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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kitchenItems, setKitchenItems] = useState(getKitchenItems);
  const [ownedSeasonings, setOwnedSeasonings] = useState(getOwnedSeasonings);
  const [mealPlan, setMealPlan] = useState(getMealPlan);
  const [query, setQuery] = useState('');

  const seasoningMap = useMemo(() => Object.fromEntries(SEASONINGS.map((s) => [s.id, s])), []);
  const matches = useMemo(() => {
    return matchRecipes(RECIPES, kitchenItems, ownedSeasonings).map((recipe) => ({
      ...recipe,
      seasoningName: seasoningMap[recipe.seasoningId]?.name || 'Unknown seasoning'
    }));
  }, [kitchenItems, ownedSeasonings, seasoningMap]);

  const filteredRecipes = matches.filter((recipe) => {
    const haystack = [recipe.title, recipe.seasoningName, recipe.strictness, ...recipe.ingredients].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  function updateKitchen(items) {
    setKitchenItems(items);
    saveKitchenItems(items);
  }

  function updateSeasonings(ids) {
    setOwnedSeasonings(ids);
    saveOwnedSeasonings(ids);
  }

  function updateMealPlan(nextPlan) {
    setMealPlan(nextPlan);
    saveMealPlan(nextPlan);
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
        {activeTab === 'dashboard' && <Dashboard matches={matches} kitchenItems={kitchenItems} ownedSeasonings={ownedSeasonings} setActiveTab={setActiveTab} />}
        {activeTab === 'kitchen' && <Kitchen items={kitchenItems} onChange={updateKitchen} />}
        {activeTab === 'seasonings' && <Seasonings owned={ownedSeasonings} onChange={updateSeasonings} />}
        {activeTab === 'recipes' && <Recipes recipes={filteredRecipes} query={query} setQuery={setQuery} />}
        {activeTab === 'mealprep' && <MealPrep matches={matches} mealPlan={mealPlan} onChange={updateMealPlan} />}
        {activeTab === 'grocery' && <GroceryList mealPlan={mealPlan} />}
      </section>
    </main>
  );
}

function Dashboard({ matches, kitchenItems, ownedSeasonings, setActiveTab }) {
  const top = matches[0];
  return (
    <div>
      <Header eyebrow="Today" title="What can you cook right now?" subtitle="Match recipes to the food and seasonings already in your house." />
      <div className="stats-grid">
        <Stat label="Kitchen Items" value={kitchenItems.length} />
        <Stat label="Seasonings Owned" value={ownedSeasonings.length} />
        <Stat label="Best Match" value={top ? `${top.score}%` : '0%'} />
      </div>
      {top && <RecipeCard recipe={top} featured />}
      <div className="action-row">
        <button onClick={() => setActiveTab('kitchen')}>Update My Kitchen</button>
        <button onClick={() => setActiveTab('recipes')}>See Recipe Matches</button>
      </div>
    </div>
  );
}

function Kitchen({ items, onChange }) {
  const [input, setInput] = useState('');
  function addItem() {
    const value = input.trim().toLowerCase();
    if (!value || items.includes(value)) return;
    onChange([...items, value]);
    setInput('');
  }
  return (
    <div>
      <Header eyebrow="Inventory" title="My Kitchen" subtitle="Add what you have in the fridge, freezer, or pantry." />
      <div className="input-row">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="ground beef, eggs, steak, shrimp..." />
        <button onClick={addItem}><ListPlus size={18} /> Add</button>
      </div>
      <div className="chip-grid">
        {items.map((item) => <span className="chip" key={item}>{item}<button onClick={() => onChange(items.filter((x) => x !== item))}>×</button></span>)}
      </div>
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

function Recipes({ recipes, query, setQuery }) {
  return (
    <div>
      <Header eyebrow="Matches" title="Recipe Library" subtitle="Recipes are scored by available ingredients and owned seasonings." />
      <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by food, seasoning, or recipe..." /></div>
      <div className="recipe-list">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
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

function RecipeCard({ recipe, featured = false }) {
  return (
    <article className={featured ? 'recipe-card featured' : 'recipe-card'}>
      <div className="recipe-topline">
        <span>{recipe.score}% match</span>
        <span>{recipe.prepTime} min</span>
        <span>{recipe.strictness}</span>
      </div>
      <h2>{recipe.title}</h2>
      <p><strong>Seasoning:</strong> {recipe.seasoningName} {recipe.hasSeasoning ? '✅' : '🛒'}</p>
      <p><strong>Have:</strong> {recipe.matched.join(', ') || 'none yet'}</p>
      <p><strong>Missing:</strong> {recipe.missing.join(', ') || 'nothing'}</p>
      <details>
        <summary>Cooking steps</summary>
        <ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <a href={recipe.videoUrl} target="_blank" rel="noreferrer">Open related CarnivorousChef videos</a>
      </details>
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
