export const CUISINES = [
  'African', 'American', 'Asian', 'Bangladeshi', 'BBQ / Skewers', 'Beverages', 'Bread', 'Burgers',
  'Burmese', 'Cakes & Bakery', 'Cambodian', 'Chicken', 'Chinese', 'Chinese BBQ', 'Congee', 'Curry',
  'Desserts', 'Dim Sum', 'Dumpling', 'Fast Food', 'Frappe & Smoothies', 'French', 'Fried Chicken',
  'Fruit Juice', 'German', 'Greek', 'Grilled Meat', 'Halal', 'Healthy Food', 'Hot Pot', 'Ice Cream',
  'Indian', 'Indonesian', 'International', 'Italian', 'Japanese', 'Kebab', 'Korean', 'Lot Chha',
  'Malaysian', 'Meat', 'Meatball', 'Mexican', 'Middle Eastern', 'Milk Tea', 'Noodles',
  'Num Banh Chok - Khmer Noodle', 'Pakistani', 'Pasta', 'Pho', 'Pizza', 'Ramen', 'Rice Dishes',
  'Rice Noodles', 'Roasted Meat', 'Salads', 'Sandwiches', 'Seafood', 'Singaporean', 'Snacks', 'Soups',
  'Sour Fruit', 'Spicy Salad', 'Steak', 'Sushi', 'Tea & Coffee', 'Thai', 'Turkish', 'Udon', 'Vegan',
  'Vegetarian', 'Vietnamese', 'Western',
];

export const SORT_OPTIONS = [
  ['relevance', 'Relevance'],
  ['fastest', 'Fastest delivery'],
  ['distance', 'Distance'],
  ['rating', 'Top rated'],
];

export const parseCuisines = (value) => (value || '').split(',').map((item) => item.trim()).filter(Boolean);