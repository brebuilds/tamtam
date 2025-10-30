#!/usr/bin/env python3
"""
Import TamerX Remanufactured Products
Designed for the MASTER - ENABLED CSV export
"""

import csv
import os
import sys
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values
import re

def generate_id():
    """Generate a unique ID"""
    import random
    import string
    return ''.join(random.choices(string.ascii_letters + string.digits, k=21))

def parse_price(price_str):
    """Convert price string like '$1,800.00' to cents (integer)"""
    if not price_str or str(price_str).strip() == '':
        return None
    # Remove $, commas, spaces
    cleaned = re.sub(r'[$,\s]', '', str(price_str).strip())
    try:
        dollars = float(cleaned)
        return int(dollars * 100)  # Convert to cents
    except (ValueError, TypeError):
        return None

def parse_weight(weight_str):
    """Parse weight string to float"""
    if not weight_str or str(weight_str).strip() == '':
        return None
    try:
        return float(str(weight_str).strip())
    except (ValueError, TypeError):
        return None

def clean_text(text):
    """Clean and normalize text fields"""
    if not text or str(text).strip() == '' or str(text).strip().lower() in ['nan', 'none', 'null']:
        return None
    return str(text).strip()

def parse_engines(row):
    """Extract all engine types from ENGINE columns"""
    engines = []
    # There are multiple ENGINE columns (looks like columns 21-27)
    for i in range(21, 28):
        if i < len(row):
            engine = clean_text(row[i])
            if engine and engine not in engines:
                engines.append(engine)
    return ', '.join(engines) if engines else None

def import_products(csv_file_path, db_url):
    """Import products from CSV"""
    
    print(f"🔍 Reading CSV file: {csv_file_path}")
    print(f"📦 This file contains TamerX remanufactured diesel parts\n")
    
    products = []
    skipped = 0
    
    with open(csv_file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        
        # Skip first row (timestamp/metadata)
        next(reader)
        
        # Read header row
        headers = next(reader)
        print(f"📋 Found {len(headers)} columns in CSV")
        
        for line_num, row in enumerate(reader, start=3):
            if len(row) < 10:  # Skip empty/incomplete rows
                continue
            
            # Get key fields
            sku = clean_text(row[5]) if len(row) > 5 else None  # SKU
            name = clean_text(row[6]) if len(row) > 6 else None  # NAME
            
            if not sku:
                skipped += 1
                continue
            
            # Extract all fields
            additional_notes = clean_text(row[7]) if len(row) > 7 else None
            application_notes = clean_text(row[8]) if len(row) > 8 else None
            part_number = clean_text(row[9]) if len(row) > 9 else None
            product_category = clean_text(row[10]) if len(row) > 10 else None
            type_field = clean_text(row[11]) if len(row) > 11 else None
            year = clean_text(row[14]) if len(row) > 14 else None
            primary_oem = clean_text(row[15]) if len(row) > 15 else None
            additional_oem = clean_text(row[16]) if len(row) > 16 else None
            manufacturer = clean_text(row[18]) if len(row) > 18 else None
            make = clean_text(row[19]) if len(row) > 19 else None
            engines = parse_engines(row)
            condition = clean_text(row[27]) if len(row) > 27 else None
            is_reman = clean_text(row[28]) if len(row) > 28 else None
            
            # Pricing
            price = parse_price(row[37]) if len(row) > 37 else None
            vendor_cost = parse_price(row[39]) if len(row) > 39 else None
            actual_cost = parse_price(row[40]) if len(row) > 40 else None
            weight = parse_weight(row[44]) if len(row) > 44 else None
            
            # Core exchange info
            has_core = clean_text(row[46]) if len(row) > 46 else None
            core_price = parse_price(row[47]) if len(row) > 47 else None
            
            # Build description
            description_parts = []
            if additional_notes:
                description_parts.append(additional_notes)
            if application_notes:
                description_parts.append(f"Application: {application_notes}")
            if manufacturer:
                description_parts.append(f"Manufacturer: {manufacturer}")
            if condition:
                description_parts.append(f"Condition: {condition}")
            if is_reman and is_reman.lower() == 'yes':
                description_parts.append("⚙️ Remanufactured In-House")
            if has_core and has_core.lower() == 'yes' and core_price:
                description_parts.append(f"Core Exchange: ${core_price/100:.2f}")
            
            description = ' | '.join(description_parts) if description_parts else None
            
            # Build application string
            application_parts = []
            if make:
                application_parts.append(make)
            if engines:
                application_parts.append(engines)
            if year:
                application_parts.append(f"({year})")
            
            application = ' '.join(application_parts) if application_parts else None
            
            # Build comments (for OEM numbers)
            comments_parts = []
            if primary_oem:
                comments_parts.append(f"OEM: {primary_oem}")
            if additional_oem:
                comments_parts.append(f"Alt OEM: {additional_oem}")
            if part_number and part_number != sku:
                comments_parts.append(f"Part#: {part_number}")
            
            comments = ' | '.join(comments_parts) if comments_parts else None
            
            # Use actual_cost if available, otherwise vendor_cost
            cost = actual_cost if actual_cost else vendor_cost
            
            # Create product object
            product = {
                'id': generate_id(),
                'sku': sku,
                'name': name[:255] if name else f"{type_field} {sku}"[:255],
                'description': description,
                'category': product_category[:128] if product_category else "Remanufactured",
                'application': application[:255] if application else None,
                'years': year[:100] if year else None,
                'oe_number': primary_oem[:255] if primary_oem else None,
                'comments': comments,
                'unit_price': price,
                'unit_cost': cost,
                'stock_quantity': 0,  # Start at 0, update manually
                'reorder_point': 5,
                'status': 'active',
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
            }
            
            products.append(product)
            
            # Show progress
            if len(products) % 50 == 0:
                print(f"   Processed {len(products)} products...")
    
    print(f"\n✅ Successfully parsed {len(products)} products")
    if skipped > 0:
        print(f"⚠️  Skipped {skipped} rows (missing SKU)")
    
    if len(products) == 0:
        print("❌ No products found in CSV!")
        return
    
    # Show sample
    print("\n📦 Sample product:")
    sample = products[0]
    print(f"   SKU: {sample['sku']}")
    print(f"   Name: {sample['name']}")
    print(f"   Category: {sample['category']}")
    print(f"   Application: {sample['application']}")
    if sample['unit_price']:
        print(f"   Price: ${sample['unit_price']/100:.2f}")
    if sample['unit_cost']:
        print(f"   Cost: ${sample['unit_cost']/100:.2f}")
        if sample['unit_price']:
            profit = sample['unit_price'] - sample['unit_cost']
            margin = (profit / sample['unit_price']) * 100
            print(f"   Margin: {margin:.1f}%")
    
    # Connect to database
    print(f"\n🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        print("✅ Connected successfully")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\nMake sure:")
        print("  1. Database is running (docker-compose up -d)")
        print("  2. DATABASE_URL is set in .env")
        print("  3. Run: pnpm run db:push")
        return
    
    # Check for existing SKUs
    print("\n🔍 Checking for duplicate SKUs...")
    skus = [p['sku'] for p in products]
    cur.execute("SELECT sku FROM products WHERE sku = ANY(%s)", (skus,))
    existing_skus = set(row[0] for row in cur.fetchall())
    
    if existing_skus:
        print(f"⚠️  Found {len(existing_skus)} existing SKUs in database")
        print(f"   Examples: {', '.join(list(existing_skus)[:3])}")
        
        response = input("\n❓ What should we do?\n   [s] Skip duplicates and import only new products\n   [u] Update existing products with new data\n   [c] Cancel import\n   Choice (s/u/c): ")
        
        if response.lower() == 'c':
            print("❌ Import cancelled")
            return
        elif response.lower() == 'u':
            print("📝 Will update existing products...")
            # TODO: Implement update logic
            print("⚠️  Update mode not yet implemented. Skipping duplicates instead.")
            products = [p for p in products if p['sku'] not in existing_skus]
        else:
            print("⏭️  Skipping duplicates...")
            products = [p for p in products if p['sku'] not in existing_skus]
        
        print(f"📦 Will import {len(products)} new products")
    
    if len(products) == 0:
        print("ℹ️  No new products to import")
        cur.close()
        conn.close()
        return
    
    # Prepare insert query
    insert_query = """
        INSERT INTO products (
            id, sku, name, description, category, application, years, oe_number, comments,
            unit_price, unit_cost, stock_quantity, reorder_point, status,
            created_at, updated_at
        ) VALUES %s
    """
    
    # Prepare values
    values = [
        (
            p['id'], p['sku'], p['name'], p['description'], p['category'],
            p['application'], p['years'], p['oe_number'], p['comments'],
            p['unit_price'], p['unit_cost'], p['stock_quantity'], p['reorder_point'],
            p['status'], p['created_at'], p['updated_at']
        )
        for p in products
    ]
    
    # Execute batch insert
    print(f"\n💾 Inserting {len(products)} products into database...")
    try:
        execute_values(cur, insert_query, values)
        conn.commit()
        print(f"✅ Successfully imported {len(products)} products!")
    except Exception as e:
        conn.rollback()
        print(f"❌ Import failed: {e}")
        print("\nTroubleshooting:")
        print("  - Check if database schema is up to date")
        print("  - Run: pnpm run db:push")
        print("  - Verify DATABASE_URL is correct")
        return
    finally:
        cur.close()
        conn.close()
    
    # Summary
    print("\n" + "="*60)
    print("🎉 Import Complete!")
    print("="*60)
    print(f"\n📊 Import Statistics:")
    print(f"   Total products imported: {len(products)}")
    print(f"   Products with pricing: {sum(1 for p in products if p['unit_price'])}")
    print(f"   Products with cost data: {sum(1 for p in products if p['unit_cost'])}")
    print(f"   Average price: ${sum(p['unit_price'] or 0 for p in products) / len(products) / 100:.2f}")
    
    categories = {}
    for p in products:
        cat = p['category'] or 'Unknown'
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n📦 Products by Category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:5]:
        print(f"   {cat}: {count}")
    
    print(f"\n🚀 Next Steps:")
    print(f"   1. Start the app: pnpm run dev")
    print(f"   2. Visit: http://localhost:5000")
    print(f"   3. Go to Parts Database to see your products")
    print(f"   4. Update stock quantities as needed")

def main():
    print("="*60)
    print("  TamerX Remanufactured Products Importer")
    print("="*60 + "\n")
    
    # Get database URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("\nTo fix this:")
        print("  1. Create/edit .env file in project root")
        print("  2. Add: DATABASE_URL=postgresql://user:pass@host:port/dbname")
        print("  3. Or for local Docker: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres")
        sys.exit(1)
    
    # Get CSV file path
    if len(sys.argv) < 2:
        print("❌ Please provide CSV file path")
        print("\nUsage:")
        print(f"  python {os.path.basename(__file__)} <path-to-csv>")
        print("\nExample:")
        print(f"  python {os.path.basename(__file__)} data/tamerx-reman.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        print(f"\nMake sure the file exists at: {os.path.abspath(csv_file)}")
        sys.exit(1)
    
    # Run import
    import_products(csv_file, db_url)

if __name__ == '__main__':
    main()

