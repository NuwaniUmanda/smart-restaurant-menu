# Restaurant Menu with Search Functionality

This repository contains a restaurant menu application with smart search capabilities, available in both React and static HTML versions.

## Features

### 🔍 Smart Search Bar
- **Multi-field Search**: Search across item names, descriptions, and tags
- **Real-time Filtering**: Results update as you type
- **Clear Search**: One-click button to clear search and show all items
- **Results Counter**: Shows how many items match your search
- **No Results Handler**: Friendly message when no items are found

### 🍽️ Menu Items
The menu includes various categories:
- **Main Dishes**: Pizza, Wings, Salmon, Burgers, Ramen
- **Salads & Appetizers**: Caesar Salad, Nachos, Veggie Delight
- **Desserts**: Chocolate Cake

### 🏷️ Tag-based Filtering
Items are tagged with categories like:
- `spicy` - For spicy dishes
- `vegetarian` - For vegetarian options
- `healthy` - For healthy choices
- `popular` - For customer favorites
- `seafood` - For seafood items

## How to Use the Search

### React Version (`/restaurant-menu/`)
1. Navigate to the menu page
2. Use the search bar at the top to filter items
3. Search works across:
   - Item names (e.g., "pizza", "salmon")
   - Descriptions (e.g., "crispy", "fresh")
   - Tags (e.g., "spicy", "vegetarian", "healthy")

### Static HTML Version (`restaurant-menu.html`)
1. Open the HTML file in a browser
2. Use the search bar below the header
3. Same search functionality as the React version

## Search Examples

- **"spicy"** - Shows Spicy Chicken Wings and Loaded Nachos
- **"vegetarian"** - Shows all vegetarian options
- **"healthy"** - Shows Grilled Salmon and Caesar Salad
- **"pizza"** - Shows Margherita Pizza
- **"fresh"** - Shows items with "fresh" in the description

## Development

### React Version
```bash
cd restaurant-menu
npm install
npm start
```

### Static HTML Version
Simply open `restaurant-menu.html` in your browser.

## Technical Implementation

### React Features
- **useState** for search state management
- **useMemo** for performance optimization
- **Component-based architecture** with reusable SearchBar component
- **Real-time filtering** with debounced search

### HTML Features
- **Vanilla JavaScript** search implementation
- **CSS animations** for smooth transitions
- **DOM manipulation** for real-time filtering
- **Responsive design** that works on all devices

## Search Component API (React)

```jsx
<SearchBar 
  searchTerm={string}
  onSearchChange={function}
  onClearSearch={function}
  placeholder={string}
  className={string}
/>
```

The search functionality enhances the user experience by making it easy to find specific items based on dietary preferences, flavor profiles, or specific ingredients.