require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Wireless Mouse', sku: 'ELEC-MS-101', category: 'Electronics', price: 799, quantity: 45, reorderLevel: 15, supplier: 'Logitech India' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-204', category: 'Electronics', price: 2499, quantity: 30, reorderLevel: 10, supplier: 'boAt' },
  { name: 'Smartphone', sku: 'ELEC-PH-310', category: 'Electronics', price: 18999, quantity: 12, reorderLevel: 5, supplier: 'Samsung India' },
  { name: 'USB-C Hub', sku: 'ELEC-HB-415', category: 'Electronics', price: 1299, quantity: 4, reorderLevel: 8, supplier: 'Anker' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-501', category: 'Apparel', price: 499, quantity: 60, reorderLevel: 20, supplier: 'Allen Solly' },
  { name: 'Denim Jeans', sku: 'APRL-JN-512', category: 'Apparel', price: 1999, quantity: 6, reorderLevel: 10, supplier: "Levi's" },
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-820', category: 'Furniture', price: 6499, quantity: 8, reorderLevel: 3, supplier: 'Godrej Interio' },
  { name: 'Spiral Notebook', sku: 'STNY-NB-701', category: 'Stationery', price: 60, quantity: 150, reorderLevel: 50, supplier: 'Classmate' },
  { name: 'Marker Set', sku: 'STNY-MK-720', category: 'Stationery', price: 250, quantity: 35, reorderLevel: 12, supplier: 'Camlin' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-901', category: 'Grocery', price: 650, quantity: 3, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-910', category: 'Grocery', price: 899, quantity: 25, reorderLevel: 8, supplier: 'Figaro' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
