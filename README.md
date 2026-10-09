# Inventory and Data Management System

Node.js + Express + MongoDB (Mongoose) + dotenv.

- Run
```bash
npm install
# edit .env if needed (PORT, MONGO_URI); MongoDB must be running
npm run seed     # optional sample data
npm start        # http://localhost:5000
```

- Endpoints (base: `/api/products`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create product (201) |
| GET | `/` | List with filter / sort / pagination |
| GET | `/low-stock` | Items where quantity <= reorderLevel (aggregation) |
| GET | `/summary` | Category-wise summary (aggregation) |
| GET | `/:id` | Single product |
| PUT | `/:id` | Update product details (partial body allowed) |
| PATCH | `/:id/stock` | `{ "change": 10 }` restock, `{ "change": -3 }` sale |
| DELETE | `/:id` | Delete product |

- List query params
`category`, `supplier`, `search` (name), `minPrice`, `maxPrice`, `inStock=true|false`,
`sort` (e.g. `-price,name`), `page` (default 1), `limit` (default 10, max 100).

Example: `GET /api/products?category=Electronics&minPrice=500&sort=-price&page=1&limit=5`

- Sample POST body
```json
{ "name": "Gel Pen Pack of 15", "sku": "STNY-PN-713", "category": "Stationery", "price": 120, "quantity": 40, "reorderLevel": 20, "supplier": "Cello Pens" }
```

- Error format
`{ "message": "...", "errors": [{ "field": "...", "message": "..." }] }`
Status codes: 400 validation/bad input, 404 not found, 409 duplicate SKU, 500 server error.
