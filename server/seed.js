require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gosmoothie';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> seed())
  .catch(err=>{ console.error(err); process.exit(1); });

async function seed(){
  console.log('🌱 Seeding database...');
  
  try {
    // Clear existing products
    await Product.deleteMany({});
    
    // High-quality product data with Unsplash URLs
    const products = [
      {
        name: 'Green Goddess',
        description: 'Spinach, kale, avocado, banana, coconut water, and a hint of mint for a refreshing green boost.',
        price: 250,
        image: 'https://images.unsplash.com/photo-1590319033100-9f60a05a1d82?q=80&w=800&auto=format&fit=crop',
        meta: { 
          calories: 245, 
          protein: 6, 
          carbs: 42, 
          fat: 3, 
          fiber: 8,
          sugar: 18,
          ingredients: ['Spinach', 'Kale', 'Avocado', 'Banana', 'Coconut Water', 'Mint']
        }
      },
      {
        name: 'Berry Blast',
        description: 'Strawberries, blueberries, raspberries, Greek yogurt, and honey for an antioxidant-rich treat.',
        price: 300,
        image: 'https://images.unsplash.com/photo-1590319033100-9f60a05a1d82?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3',
        meta: {
          calories: 245,
          protein: 6,
          carbs: 42,
          fat: 3,
          fiber: 8,
          sugar: 26,
          ingredients: ['Strawberries', 'Blueberries', 'Raspberries', 'Greek Yogurt', 'Honey']
        }
      },
      {
        name: 'Tropical Paradise',
        description: 'Mango, pineapple, banana, coconut milk, and a splash of lime for a vacation in a glass.',
        price: 350,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
        meta: {
          calories: 260,
          protein: 5,
          carbs: 48,
          fat: 4,
          fiber: 6,
          sugar: 34,
          ingredients: ['Mango', 'Pineapple', 'Banana', 'Coconut Milk', 'Lime']
        }
      },
      {
        name: 'Carrot Sunrise',
        description: 'Fresh carrots, orange, ginger, and turmeric for an immunity-boosting, vibrant juice.',
        price: 225,
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop',
        meta: {
          calories: 180,
          protein: 3,
          carbs: 36,
          fat: 1,
          fiber: 5,
          sugar: 22,
          ingredients: ['Carrots', 'Orange', 'Ginger', 'Turmeric']
        }
      },
      {
        name: 'Protein Power',
        description: 'Banana, almond milk, cacao, peanut butter, and plant protein for post-workout recovery.',
        price: 350,
        image: 'https://images.unsplash.com/photo-1578270387620-46b29e7b2277?q=80&w=800&auto=format&fit=crop',
        meta: {
          calories: 320,
          protein: 22,
          carbs: 35,
          fat: 10,
          fiber: 6,
          sugar: 20,
          ingredients: ['Banana', 'Almond Milk', 'Cacao', 'Peanut Butter', 'Plant Protein']
        }
      },
      {
        name: 'Green Detox',
        description: 'Cucumber, celery, green apple, lemon, and ginger for a cleansing, refreshing juice.',
        price: 250,
        image: 'https://images.unsplash.com/photo-1553530666-ba2a8e36cd34?q=80&w=800&auto=format&fit=crop',
        meta: {
          calories: 150,
          protein: 2,
          carbs: 30,
          fat: 1,
          fiber: 4,
          sugar: 14,
          ingredients: ['Cucumber', 'Celery', 'Green Apple', 'Lemon', 'Ginger']
        }
      }
    ];
    
    await Product.insertMany(products);
    console.log('✅ ' + products.length + ' products seeded');

    // Clear existing users
    await User.deleteMany({});
    
    // Create demo user
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('password123', 10);
    const demoUser = await User.create({ 
      name: 'Demo User', 
      email: 'demo@local', 
      passwordHash: hash 
    });
    console.log('✅ Demo user created');
    console.log('   Email: demo@local');
    console.log('   Password: password123');

    console.log('✅ Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
}

