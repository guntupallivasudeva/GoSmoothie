function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function image(name) {
  const slug = slugify(name);
  return `/server/images/generated-menu/${slug}-card.jpg`;
}

const products = [
  {
    "category": "Smoothies",
    "name": "Green Goddess Smoothie",
    "type": "Vegetarian",
    "price": 250,
    "description": "Spinach, kale, avocado, banana, coconut water, and mint for a clean green boost.",
    "meta": {
      "calories": 240,
      "protein": 6,
      "carbs": 41,
      "fat": 4,
      "fiber": 8,
      "sugar": 18,
      "ingredients": []
    },
    "isFeatured": true,
    "featuredOrder": 1
  },
  {
    "category": "Smoothies",
    "name": "Berry Blast Smoothie",
    "type": "Vegetarian",
    "price": 280,
    "description": "Strawberries, blueberries, raspberries, yogurt, and honey for a vibrant antioxidant blend.",
    "meta": {
      "calories": 260,
      "protein": 7,
      "carbs": 45,
      "fat": 3,
      "fiber": 7,
      "sugar": 24,
      "ingredients": []
    },
    "isFeatured": true,
    "featuredOrder": 2
  },
  {
    "category": "Smoothies",
    "name": "Tropical Paradise Smoothie",
    "type": "Vegetarian",
    "price": 300,
    "description": "Mango, pineapple, banana, coconut milk, and lime for a bright tropical lift.",
    "meta": {
      "calories": 275,
      "protein": 5,
      "carbs": 52,
      "fat": 4,
      "fiber": 6,
      "sugar": 32,
      "ingredients": []
    },
    "isFeatured": true,
    "featuredOrder": 3
  },
  {
    "category": "Smoothies",
    "name": "Carrot Sunrise Smoothie",
    "type": "Vegetarian",
    "price": 220,
    "description": "Carrot, orange, ginger, and turmeric blended into a fresh sunrise-style drink.",
    "meta": {
      "calories": 180,
      "protein": 3,
      "carbs": 36,
      "fat": 1,
      "fiber": 5,
      "sugar": 22,
      "ingredients": []
    },
    "isFeatured": true,
    "featuredOrder": 4
  },
  {
    "category": "Smoothies",
    "name": "Protein Power Smoothie",
    "type": "Vegetarian",
    "price": 300,
    "description": "Banana, almond milk, cacao, peanut butter, and plant protein for post-workout recovery.",
    "meta": {
      "calories": 320,
      "protein": 22,
      "carbs": 35,
      "fat": 10,
      "fiber": 6,
      "sugar": 20,
      "ingredients": []
    },
    "isFeatured": true,
    "featuredOrder": 5
  },
  {
    "category": "Smoothies",
    "name": "Green Detox Smoothie",
    "type": "Vegetarian",
    "price": 240,
    "description": "Cucumber, celery, green apple, lemon, and ginger for a crisp detox blend.",
    "meta": {
      "calories": 150,
      "protein": 2,
      "carbs": 32,
      "fat": 1,
      "fiber": 7,
      "sugar": 14,
      "ingredients": []
    },
    "isFeatured": true,
    "featuredOrder": 6
  },
  {
    "category": "Smoothies",
    "name": "Mango Mint Refresher Smoothie",
    "type": "Vegetarian",
    "price": 260,
    "description": "Mango, mint, yogurt, and a citrus finish for a cool and silky refresher.",
    "meta": {
      "calories": 210,
      "protein": 5,
      "carbs": 39,
      "fat": 2,
      "fiber": 4,
      "sugar": 26,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 7
  },
  {
    "category": "Smoothies",
    "name": "Strawberry Banana Sunrise Smoothie",
    "type": "Vegetarian",
    "price": 230,
    "description": "A classic strawberry-banana blend with yogurt for a smooth breakfast-style drink.",
    "meta": {
      "calories": 220,
      "protein": 6,
      "carbs": 40,
      "fat": 2,
      "fiber": 5,
      "sugar": 23,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 8
  },
  {
    "category": "Smoothies",
    "name": "Pineapple Kale Power Smoothie",
    "type": "Vegetarian",
    "price": 270,
    "description": "Pineapple, kale, banana, and coconut water for a bright green energy blend.",
    "meta": {
      "calories": 205,
      "protein": 4,
      "carbs": 42,
      "fat": 1,
      "fiber": 6,
      "sugar": 27,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 9
  },
  {
    "category": "Smoothies",
    "name": "Chocolate Peanut Recovery Smoothie",
    "type": "Vegetarian",
    "price": 300,
    "description": "Cacao, banana, peanut butter, oats, and milk for a rich recovery shake.",
    "meta": {
      "calories": 330,
      "protein": 18,
      "carbs": 38,
      "fat": 12,
      "fiber": 6,
      "sugar": 18,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 10
  },
  {
    "category": "Salads",
    "name": "Mediterranean Crunch Salad",
    "type": "Vegetarian",
    "price": 180,
    "description": "Cucumber, tomato, olives, feta, chickpeas, and leafy greens with a light lemon dressing.",
    "meta": {
      "calories": 190,
      "protein": 6,
      "carbs": 18,
      "fat": 11,
      "fiber": 7,
      "sugar": 6,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 1
  },
  {
    "category": "Salads",
    "name": "Chicken Caesar Salad",
    "type": "Non-Vegetarian",
    "price": 260,
    "description": "Grilled chicken, romaine lettuce, parmesan, and croutons with a classic Caesar finish.",
    "meta": {
      "calories": 280,
      "protein": 24,
      "carbs": 10,
      "fat": 16,
      "fiber": 5,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 2
  },
  {
    "category": "Salads",
    "name": "Rainbow Quinoa Salad",
    "type": "Vegetarian",
    "price": 220,
    "description": "Quinoa, cucumber, bell pepper, corn, herbs, and a light citrus vinaigrette.",
    "meta": {
      "calories": 210,
      "protein": 8,
      "carbs": 28,
      "fat": 8,
      "fiber": 6,
      "sugar": 5,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 3
  },
  {
    "category": "Salads",
    "name": "Grilled Salmon Power Salad",
    "type": "Non-Vegetarian",
    "price": 300,
    "description": "Grilled salmon, spinach, avocado, cucumber, and pumpkin seeds with a lemon dill dressing.",
    "meta": {
      "calories": 310,
      "protein": 27,
      "carbs": 12,
      "fat": 18,
      "fiber": 5,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 4
  },
  {
    "category": "Salads",
    "name": "Tandoori Paneer Garden Salad",
    "type": "Vegetarian",
    "price": 240,
    "description": "Tandoori paneer cubes, lettuce, onions, tomatoes, and mint yogurt drizzle.",
    "meta": {
      "calories": 260,
      "protein": 16,
      "carbs": 14,
      "fat": 15,
      "fiber": 4,
      "sugar": 5,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 5
  },
  {
    "category": "Salads",
    "name": "Thai Peanut Crunch Salad",
    "type": "Vegetarian",
    "price": 210,
    "description": "Cabbage, carrot, cucumber, herbs, and peanut dressing with crunchy roasted seeds.",
    "meta": {
      "calories": 230,
      "protein": 7,
      "carbs": 20,
      "fat": 13,
      "fiber": 6,
      "sugar": 8,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 6
  },
  {
    "category": "Salads",
    "name": "Turkey Avocado Protein Salad",
    "type": "Non-Vegetarian",
    "price": 280,
    "description": "Turkey breast, avocado, mixed greens, tomatoes, and cucumbers with a mustard dressing.",
    "meta": {
      "calories": 285,
      "protein": 25,
      "carbs": 11,
      "fat": 16,
      "fiber": 6,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 7
  },
  {
    "category": "Salads",
    "name": "Kale Avocado Super Salad",
    "type": "Vegetarian",
    "price": 200,
    "description": "Kale, avocado, cucumber, sunflower seeds, and apples with a light herb dressing.",
    "meta": {
      "calories": 180,
      "protein": 5,
      "carbs": 15,
      "fat": 11,
      "fiber": 7,
      "sugar": 5,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 8
  },
  {
    "category": "Salads",
    "name": "Beetroot Feta Fresh Salad",
    "type": "Vegetarian",
    "price": 190,
    "description": "Roasted beetroot, feta, arugula, walnuts, and balsamic glaze for a bright earthy bowl.",
    "meta": {
      "calories": 200,
      "protein": 7,
      "carbs": 16,
      "fat": 12,
      "fiber": 5,
      "sugar": 8,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 9
  },
  {
    "category": "Salads",
    "name": "Smoked Chicken Cobb Salad",
    "type": "Non-Vegetarian",
    "price": 290,
    "description": "Smoked chicken, egg, avocado, tomatoes, greens, and a creamy herb dressing.",
    "meta": {
      "calories": 320,
      "protein": 26,
      "carbs": 12,
      "fat": 20,
      "fiber": 5,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 10
  },
  {
    "category": "Ice Creams",
    "name": "Mango Lime Sorbet",
    "type": "Vegetarian",
    "price": 120,
    "description": "A bright mango sorbet with a squeeze of lime for a refreshing tropical finish.",
    "meta": {
      "calories": 140,
      "protein": 1,
      "carbs": 34,
      "fat": 0,
      "fiber": 2,
      "sugar": 28,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 1
  },
  {
    "category": "Ice Creams",
    "name": "Dark Chocolate Almond Gelato",
    "type": "Vegetarian",
    "price": 160,
    "description": "Silky chocolate gelato with toasted almonds and a rich, balanced finish.",
    "meta": {
      "calories": 220,
      "protein": 4,
      "carbs": 24,
      "fat": 11,
      "fiber": 4,
      "sugar": 18,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 2
  },
  {
    "category": "Ice Creams",
    "name": "Vanilla Bean Frozen Yogurt",
    "type": "Vegetarian",
    "price": 130,
    "description": "Classic vanilla frozen yogurt with a creamy texture and a light tang.",
    "meta": {
      "calories": 170,
      "protein": 6,
      "carbs": 24,
      "fat": 5,
      "fiber": 1,
      "sugar": 18,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 3
  },
  {
    "category": "Ice Creams",
    "name": "Strawberry Basil Sorbet",
    "type": "Vegetarian",
    "price": 125,
    "description": "Fresh strawberry sorbet with basil for a bright and fragrant dessert.",
    "meta": {
      "calories": 135,
      "protein": 1,
      "carbs": 31,
      "fat": 0,
      "fiber": 2,
      "sugar": 26,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 4
  },
  {
    "category": "Ice Creams",
    "name": "Pistachio Kulfi",
    "type": "Vegetarian",
    "price": 150,
    "description": "Indian-style pistachio kulfi with a dense, creamy finish and nutty notes.",
    "meta": {
      "calories": 210,
      "protein": 5,
      "carbs": 22,
      "fat": 11,
      "fiber": 1,
      "sugar": 19,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 5
  },
  {
    "category": "Ice Creams",
    "name": "Coconut Chia Ice Cream",
    "type": "Vegetarian",
    "price": 140,
    "description": "A lighter coconut ice cream with chia seeds and a smooth tropical profile.",
    "meta": {
      "calories": 180,
      "protein": 3,
      "carbs": 20,
      "fat": 10,
      "fiber": 3,
      "sugar": 14,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 6
  },
  {
    "category": "Ice Creams",
    "name": "Espresso Fudge Gelato",
    "type": "Vegetarian",
    "price": 170,
    "description": "Espresso-infused gelato with a fudge ripple for a rich after-meal dessert.",
    "meta": {
      "calories": 230,
      "protein": 4,
      "carbs": 26,
      "fat": 12,
      "fiber": 2,
      "sugar": 20,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 7
  },
  {
    "category": "Ice Creams",
    "name": "Black Forest Protein Gelato",
    "type": "Vegetarian",
    "price": 180,
    "description": "Chocolate gelato with cherry notes and a boosted protein profile.",
    "meta": {
      "calories": 240,
      "protein": 8,
      "carbs": 25,
      "fat": 10,
      "fiber": 3,
      "sugar": 18,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 8
  },
  {
    "category": "Ice Creams",
    "name": "Rose Cardamom Kulfi",
    "type": "Vegetarian",
    "price": 145,
    "description": "Floral rose and warm cardamom folded into a classic creamy kulfi.",
    "meta": {
      "calories": 205,
      "protein": 4,
      "carbs": 21,
      "fat": 11,
      "fiber": 1,
      "sugar": 17,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 9
  },
  {
    "category": "Ice Creams",
    "name": "Salted Caramel Banana Nice Cream",
    "type": "Vegetarian",
    "price": 155,
    "description": "Frozen banana nice cream with a salted caramel finish and soft texture.",
    "meta": {
      "calories": 175,
      "protein": 3,
      "carbs": 30,
      "fat": 4,
      "fiber": 3,
      "sugar": 21,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 10
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Watermelon Mint Cooler",
    "type": "Vegetarian",
    "price": 100,
    "description": "Cold watermelon juice with mint for a clean, hydrating summer-style drink.",
    "meta": {
      "calories": 95,
      "protein": 1,
      "carbs": 24,
      "fat": 0,
      "fiber": 1,
      "sugar": 20,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 1
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Winter Citrus Glow Juice",
    "type": "Vegetarian",
    "price": 110,
    "description": "Orange, grapefruit, and lemon create a bright citrus blend with a crisp finish.",
    "meta": {
      "calories": 115,
      "protein": 2,
      "carbs": 28,
      "fat": 0,
      "fiber": 2,
      "sugar": 22,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 2
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Pineapple Cucumber Cooler",
    "type": "Vegetarian",
    "price": 105,
    "description": "Pineapple, cucumber, and lime make a crisp, hydrating cooler.",
    "meta": {
      "calories": 100,
      "protein": 1,
      "carbs": 25,
      "fat": 0,
      "fiber": 1,
      "sugar": 21,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 3
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Orange Carrot Ginger Juice",
    "type": "Vegetarian",
    "price": 115,
    "description": "Orange, carrot, and ginger create a bright seasonal juice with a warm kick.",
    "meta": {
      "calories": 120,
      "protein": 2,
      "carbs": 29,
      "fat": 0,
      "fiber": 2,
      "sugar": 24,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 4
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Mango Passion Sunset Smoothie",
    "type": "Vegetarian",
    "price": 180,
    "description": "Mango, passionfruit, and yogurt in a creamy, sunset-colored smoothie.",
    "meta": {
      "calories": 210,
      "protein": 5,
      "carbs": 40,
      "fat": 2,
      "fiber": 4,
      "sugar": 29,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 5
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Berry Antioxidant Splash",
    "type": "Vegetarian",
    "price": 175,
    "description": "Blueberry, strawberry, and raspberry blend into a vibrant antioxidant drink.",
    "meta": {
      "calories": 170,
      "protein": 3,
      "carbs": 38,
      "fat": 1,
      "fiber": 5,
      "sugar": 24,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 6
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Apple Celery Reset Juice",
    "type": "Vegetarian",
    "price": 95,
    "description": "Apple, celery, and lemon keep this lighter reset juice crisp and clean.",
    "meta": {
      "calories": 90,
      "protein": 1,
      "carbs": 22,
      "fat": 0,
      "fiber": 2,
      "sugar": 18,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 7
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Peach Ginger Glow Smoothie",
    "type": "Vegetarian",
    "price": 185,
    "description": "Peach, yogurt, and ginger blend into a smooth, softly spiced drink.",
    "meta": {
      "calories": 200,
      "protein": 6,
      "carbs": 36,
      "fat": 2,
      "fiber": 4,
      "sugar": 25,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 8
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Beetroot Lemon Detox Juice",
    "type": "Vegetarian",
    "price": 110,
    "description": "Beetroot, lemon, and apple deliver a bright, earthy detox-style juice.",
    "meta": {
      "calories": 105,
      "protein": 2,
      "carbs": 24,
      "fat": 0,
      "fiber": 2,
      "sugar": 19,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 9
  },
  {
    "category": "Seasonal Fruit Juices / Smoothies",
    "name": "Muskmelon Lime Chiller",
    "type": "Vegetarian",
    "price": 100,
    "description": "Sweet muskmelon and lime create a mellow summer chiller.",
    "meta": {
      "calories": 95,
      "protein": 1,
      "carbs": 23,
      "fat": 0,
      "fiber": 1,
      "sugar": 20,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 10
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Tofu Power Rice Bowl",
    "type": "Vegetarian",
    "price": 230,
    "description": "Brown rice, tofu, edamame, broccoli, carrots, and sesame for steady energy.",
    "meta": {
      "calories": 290,
      "protein": 17,
      "carbs": 38,
      "fat": 9,
      "fiber": 6,
      "sugar": 5,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 1
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Grilled Chicken Protein Bowl",
    "type": "Non-Vegetarian",
    "price": 290,
    "description": "Brown rice, grilled chicken, avocado, greens, and herbs with a balanced savory profile.",
    "meta": {
      "calories": 300,
      "protein": 28,
      "carbs": 32,
      "fat": 8,
      "fiber": 5,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 2
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Paneer Tikka Rice Bowl",
    "type": "Vegetarian",
    "price": 240,
    "description": "Brown rice with paneer tikka, peppers, onions, and mint yogurt.",
    "meta": {
      "calories": 305,
      "protein": 18,
      "carbs": 34,
      "fat": 10,
      "fiber": 5,
      "sugar": 6,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 3
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Salmon Teriyaki Rice Bowl",
    "type": "Non-Vegetarian",
    "price": 300,
    "description": "Salmon, brown rice, edamame, sesame, and teriyaki glaze for a savory bowl.",
    "meta": {
      "calories": 330,
      "protein": 27,
      "carbs": 30,
      "fat": 13,
      "fiber": 5,
      "sugar": 7,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 4
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Chickpea Avocado Rice Bowl",
    "type": "Vegetarian",
    "price": 220,
    "description": "Brown rice, chickpeas, avocado, cucumber, and herbs with a tahini drizzle.",
    "meta": {
      "calories": 280,
      "protein": 13,
      "carbs": 36,
      "fat": 9,
      "fiber": 8,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 5
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Egg White Veg Rice Bowl",
    "type": "Non-Vegetarian",
    "price": 210,
    "description": "Egg whites, rice, greens, and vegetables for a lighter high-protein bowl.",
    "meta": {
      "calories": 240,
      "protein": 20,
      "carbs": 26,
      "fat": 6,
      "fiber": 4,
      "sugar": 3,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 6
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Tempeh Sesame Rice Bowl",
    "type": "Vegetarian",
    "price": 235,
    "description": "Tempeh, rice, shredded cabbage, carrots, and sesame with a ginger glaze.",
    "meta": {
      "calories": 295,
      "protein": 16,
      "carbs": 33,
      "fat": 11,
      "fiber": 6,
      "sugar": 5,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 7
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Turkey Veggie Rice Bowl",
    "type": "Non-Vegetarian",
    "price": 280,
    "description": "Turkey breast, brown rice, broccoli, carrots, and herbs with a lean finish.",
    "meta": {
      "calories": 310,
      "protein": 29,
      "carbs": 31,
      "fat": 7,
      "fiber": 5,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 8
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Black Bean Power Bowl",
    "type": "Vegetarian",
    "price": 200,
    "description": "Black beans, rice, corn, salsa, avocado, and greens for a filling meat-free bowl.",
    "meta": {
      "calories": 270,
      "protein": 12,
      "carbs": 39,
      "fat": 8,
      "fiber": 9,
      "sugar": 5,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 9
  },
  {
    "category": "Protein Rice Bowls",
    "name": "Spiced Lentil Brown Rice Bowl",
    "type": "Vegetarian",
    "price": 190,
    "description": "Brown rice and spiced lentils with greens, herbs, and a light yogurt dressing.",
    "meta": {
      "calories": 260,
      "protein": 14,
      "carbs": 34,
      "fat": 6,
      "fiber": 8,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 10
  },
  {
    "category": "Healthy Snacks",
    "name": "Roasted Chickpea Crunch",
    "type": "Vegetarian",
    "price": 90,
    "description": "Spiced roasted chickpeas with seeds and herbs for a crunchy protein snack.",
    "meta": {
      "calories": 110,
      "protein": 5,
      "carbs": 16,
      "fat": 3,
      "fiber": 5,
      "sugar": 2,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 1
  },
  {
    "category": "Healthy Snacks",
    "name": "Egg White Veggie Bites",
    "type": "Non-Vegetarian",
    "price": 140,
    "description": "Baked egg white bites with spinach and peppers for a quick high-protein option.",
    "meta": {
      "calories": 150,
      "protein": 13,
      "carbs": 6,
      "fat": 7,
      "fiber": 2,
      "sugar": 2,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 2
  },
  {
    "category": "Healthy Snacks",
    "name": "Almond Energy Bites",
    "type": "Vegetarian",
    "price": 100,
    "description": "No-bake almond and oat bites with dates and seeds for clean energy.",
    "meta": {
      "calories": 130,
      "protein": 4,
      "carbs": 15,
      "fat": 6,
      "fiber": 3,
      "sugar": 8,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 3
  },
  {
    "category": "Healthy Snacks",
    "name": "Greek Yogurt Berry Cup",
    "type": "Vegetarian",
    "price": 120,
    "description": "Greek yogurt layered with mixed berries and a light granola crunch.",
    "meta": {
      "calories": 160,
      "protein": 10,
      "carbs": 20,
      "fat": 4,
      "fiber": 3,
      "sugar": 12,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 4
  },
  {
    "category": "Healthy Snacks",
    "name": "Paneer Pepper Skewers",
    "type": "Vegetarian",
    "price": 150,
    "description": "Lightly grilled paneer with peppers and herbs for a savory snack plate.",
    "meta": {
      "calories": 180,
      "protein": 12,
      "carbs": 8,
      "fat": 11,
      "fiber": 2,
      "sugar": 4,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 5
  },
  {
    "category": "Healthy Snacks",
    "name": "Chicken Mini Skewers",
    "type": "Non-Vegetarian",
    "price": 180,
    "description": "Lean chicken skewers with herbs and spices for a quick protein boost.",
    "meta": {
      "calories": 170,
      "protein": 18,
      "carbs": 3,
      "fat": 9,
      "fiber": 1,
      "sugar": 1,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 6
  },
  {
    "category": "Healthy Snacks",
    "name": "Seed & Nut Trail Mix",
    "type": "Vegetarian",
    "price": 80,
    "description": "A simple mix of nuts, seeds, and dried fruit for on-the-go snacking.",
    "meta": {
      "calories": 140,
      "protein": 4,
      "carbs": 12,
      "fat": 9,
      "fiber": 3,
      "sugar": 7,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 7
  },
  {
    "category": "Healthy Snacks",
    "name": "Hummus Veg Sticks",
    "type": "Vegetarian",
    "price": 110,
    "description": "Carrot, cucumber, and celery sticks with creamy hummus for dipping.",
    "meta": {
      "calories": 120,
      "protein": 4,
      "carbs": 14,
      "fat": 5,
      "fiber": 5,
      "sugar": 5,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 8
  },
  {
    "category": "Healthy Snacks",
    "name": "Oat Banana Protein Cookie",
    "type": "Vegetarian",
    "price": 95,
    "description": "Soft-baked oat and banana cookie with a modest protein boost.",
    "meta": {
      "calories": 150,
      "protein": 5,
      "carbs": 20,
      "fat": 5,
      "fiber": 3,
      "sugar": 9,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 9
  },
  {
    "category": "Healthy Snacks",
    "name": "Tuna Corn Lettuce Cups",
    "type": "Non-Vegetarian",
    "price": 170,
    "description": "Tuna salad with sweet corn in crisp lettuce cups for a light savory snack.",
    "meta": {
      "calories": 165,
      "protein": 17,
      "carbs": 8,
      "fat": 7,
      "fiber": 2,
      "sugar": 2,
      "ingredients": []
    },
    "isFeatured": false,
    "featuredOrder": 10
  }
];

module.exports = products.map(product => ({
  ...product,
  image: image(product.name)
}));
