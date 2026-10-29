# Development of an Integrated Warehouse and Inventory Management System for Dueñas Stores

## Project Overview
**Dueñas Inventory** is a web-based inventory management system designed specifically for Dueñas Store to replace manual paper-based record-keeping. Built using HTML, CSS, JavaScript, and IndexedDB (browser-based local database), it works offline and stores all data securely in the user's browser. No complex server setup required — simple, affordable, and effective for small retail operations.

## Problem Statement
Dueñas Store previously relied on manual inventory management — handwritten logs and physical record books. This approach is time-consuming, prone to counting errors, makes it difficult to track stock movement accurately, identify low-stock items before they run out, and retrieve historical transaction records quickly when needed.

## Objectives
1. Provide real-time inventory visibility with automatic stock updates
2. Simplify recording of stock-in deliveries and stock-out sales
3. Alert store owners when items run low or approach expiration dates
4. Maintain a complete searchable log of all inventory transactions
5. Generate instant inventory summaries and valuation reports

## System Features

### Dashboard Overview
- Total inventory count and monetary valuation
- Quick summary: low stock items, out-of-stock, and expiring items
- At-a-glance store status at login

### Items & Stock Management
- Add, edit, and remove inventory items
- Organize items by category (Grains & Rice, Beverages, Dairy & Bakery, Condiments, Personal Care)
- Set minimum stock levels for automatic reorder reminders

### Stock Operations
- **Stock-In**: Record supplier deliveries and restock events
- **Stock-Out**: Record sales and items leaving the store
- Automatic quantity recalculation after every transaction

### Real-Time Alerts
- **Low Stock Warnings**: Highlights items below minimum required quantity
- **Expiration Watch**: Tracks items nearing or past expiration dates
- Quick "+ Restock" button for items needing replenishment

### Stock Logs & History
- Complete chronological record of all stock changes
- Filterable transaction history with dates and responsible person
- Track sales, deliveries, and restock events separately

### Summary Reports
- Inventory valuation by category
- Full stock count and value summary
- Export-ready data for record-keeping
