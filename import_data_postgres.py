#!/usr/bin/env python3
"""
TamerX Database Import Script - PostgreSQL/Supabase Version
Imports data from Access database CSV exports into PostgreSQL
"""

import csv
import sys
import os
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_batch

# Increase CSV field size limit for large fields
csv.field_size_limit(sys.maxsize)

# Database connection from environment
DATABASE_URL = os.getenv('DATABASE_URL', '')

def parse_database_url(url):
    """Parse PostgreSQL connection string"""
    # Format: postgres://user:pass@host:port/dbname
    # or: postgresql://user:pass@host:port/dbname
    if not (url.startswith('postgres://') or url.startswith('postgresql://')):
        raise ValueError("Invalid DATABASE_URL format. Must start with postgres:// or postgresql://")

    return url  # psycopg2 can use the URL directly

def get_db_connection():
    """Create database connection"""
    url = parse_database_url(DATABASE_URL)
    return psycopg2.connect(url)

def clean_value(value, max_length=None):
    """Clean and truncate values for database insertion"""
    if value is None or value == '' or value == 'N/A' or value == 'None':
        return None

    # Remove binary data indicators
    if isinstance(value, str) and ('����' in value or 'Document' in value[:50]):
        return None

    value = str(value).strip()

    # Handle multi-line values that might cause issues
    if '\n' in value or '\r' in value:
        value = value.replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ')

    if max_length and len(value) > max_length:
        value = value[:max_length]

    return value if value else None

def import_products(conn, csv_file):
    """Import quality master table as products"""
    cursor = conn.cursor()

    print(f"\n{'='*80}")
    print(f"IMPORTING PRODUCTS from {csv_file}")
    print(f"{'='*80}\n")

    imported = 0
    skipped = 0
    errors = 0

    with open(csv_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)

        batch = []
        batch_size = 500  # Smaller batches for PostgreSQL

        for row_num, row in enumerate(reader, 1):
            try:
                # Extract and clean data
                quality_num = clean_value(row.get('Quality #'), 100)
                precision_num = clean_value(row.get('Precision #'), 100)

                if not quality_num and not precision_num:
                    skipped += 1
                    continue

                # Create SKU from quality number
                sku = quality_num or precision_num

                product_data = {
                    'id': str(uuid.uuid4()),
                    'sku': sku,
                    'name': clean_value(row.get('Application'), 255) or f"Product {sku}",
                    'description': None,
                    'category': 'Steering Rack',
                    'precision_number': precision_num,
                    'quality_number': quality_num,
                    'driver_bellow': clean_value(row.get('Driver Bellow'), 100),
                    'passenger_bellow': clean_value(row.get('Passenger Bellow'), 100),
                    'tie_rod_driver': clean_value(row.get('Tie Rod Driver'), 100),
                    'tie_rod_passenger': clean_value(row.get('Tie Rod Passenger'), 100),
                    'cast_number': clean_value(row.get('CAST NUMBER'), 100),
                    'application': clean_value(row.get('Application'), 255),
                    'pressure_fitting': clean_value(row.get('pressure fitting'), 100),
                    'return_fitting': clean_value(row.get('Return Fitting'), 100),
                    'rack_sim_adapter': clean_value(row.get('Rack Sim Adapter / Driver side'), 100),
                    'rack_sim_stop': clean_value(row.get('Rack Sim Stop /Pass Side'), 100),
                    'cutter': clean_value(row.get('Cutter'), 100),
                    'bushing': clean_value(row.get('Bushing'), 100),
                    'base': clean_value(row.get('base'), 100),
                    'installer': clean_value(row.get('Installer'), 100),
                    'sleeve': clean_value(row.get('Sleeve'), 100),
                    'timing': clean_value(row.get('Timing'), 50),
                    'years': clean_value(row.get('Years'), 100),
                    'ups': clean_value(row.get('UPS'), 100),
                    'lps': clean_value(row.get('LPS'), 100),
                    'mcs': clean_value(row.get('MCS'), 100),
                    'bhs': clean_value(row.get('BHS'), 100),
                    'pt_x4': clean_value(row.get('PT X 4'), 100),
                    'ppt': clean_value(row.get('PPT'), 100),
                    'o_rings': clean_value(row.get('O RINGS'), 500),
                    'other_parts': clean_value(row.get('OTHER'), 500),
                    'bushing_driver': clean_value(row.get('Bushing Driver'), 100),
                    'bushing_passenger': clean_value(row.get('Bushing passenger'), 100),
                    'bushing_insert': clean_value(row.get('Bushing insert'), 100),
                    'turns': clean_value(row.get('Turns'), 50),
                    'oal': clean_value(row.get('OAL'), 50),
                    'comments': clean_value(row.get('Comments'), 1000),
                    'oe_number': clean_value(row.get('OE number'), 255),
                    'stock_quantity': 0,
                    'reorder_point': 5,
                    'unit_cost': None,
                    'unit_price': None,
                    'status': 'active'
                }

                batch.append(product_data)

                # Insert batch
                if len(batch) >= batch_size:
                    insert_product_batch(cursor, batch)
                    imported += len(batch)
                    print(f"Progress: {imported:,} products imported, {skipped:,} skipped, {errors} errors")
                    batch = []
                    conn.commit()

            except Exception as e:
                errors += 1
                if errors < 10:  # Only print first 10 errors
                    print(f"Error on row {row_num}: {e}")
                continue

        # Insert remaining batch
        if batch:
            insert_product_batch(cursor, batch)
            imported += len(batch)
            conn.commit()

    cursor.close()

    print(f"\n{'='*80}")
    print(f"PRODUCTS IMPORT COMPLETE")
    print(f"{'='*80}")
    print(f"Imported: {imported:,}")
    print(f"Skipped: {skipped:,}")
    print(f"Errors: {errors}")
    print(f"{'='*80}\n")

    return imported, skipped, errors

def insert_product_batch(cursor, batch):
    """Insert a batch of products using PostgreSQL syntax"""
    if not batch:
        return

    sql = """
    INSERT INTO products (
        id, sku, name, description, category, precision_number, quality_number,
        driver_bellow, passenger_bellow, tie_rod_driver, tie_rod_passenger,
        cast_number, application, pressure_fitting, return_fitting,
        rack_sim_adapter, rack_sim_stop, cutter, bushing, base, installer,
        sleeve, timing, years, ups, lps, mcs, bhs, pt_x4, ppt, o_rings,
        other_parts, bushing_driver, bushing_passenger, bushing_insert,
        turns, oal, comments, oe_number, stock_quantity, reorder_point,
        unit_cost, unit_price, status, created_at, updated_at
    ) VALUES (
        %(id)s, %(sku)s, %(name)s, %(description)s, %(category)s, %(precision_number)s, %(quality_number)s,
        %(driver_bellow)s, %(passenger_bellow)s, %(tie_rod_driver)s, %(tie_rod_passenger)s,
        %(cast_number)s, %(application)s, %(pressure_fitting)s, %(return_fitting)s,
        %(rack_sim_adapter)s, %(rack_sim_stop)s, %(cutter)s, %(bushing)s, %(base)s, %(installer)s,
        %(sleeve)s, %(timing)s, %(years)s, %(ups)s, %(lps)s, %(mcs)s, %(bhs)s, %(pt_x4)s, %(ppt)s, %(o_rings)s,
        %(other_parts)s, %(bushing_driver)s, %(bushing_passenger)s, %(bushing_insert)s,
        %(turns)s, %(oal)s, %(comments)s, %(oe_number)s, %(stock_quantity)s, %(reorder_point)s,
        %(unit_cost)s, %(unit_price)s, %(status)s, NOW(), NOW()
    )
    ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        application = EXCLUDED.application,
        updated_at = NOW()
    """

    execute_batch(cursor, sql, batch, page_size=100)

def main():
    """Main import process"""
    print("\n" + "="*80)
    print("TAMERX DATABASE IMPORT - PostgreSQL/Supabase")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")

    try:
        # Check for CSV file argument
        csv_file = sys.argv[1] if len(sys.argv) > 1 else 'quality_master.csv'

        if not os.path.exists(csv_file):
            print(f"❌ ERROR: CSV file not found: {csv_file}")
            print(f"Usage: python3 {sys.argv[0]} <csv_file>")
            sys.exit(1)

        # Connect to database
        print("Connecting to Supabase database...")
        conn = get_db_connection()
        print("✓ Connected\n")

        # Import products
        imported, skipped, errors = import_products(conn, csv_file)

        # Close connection
        conn.close()

        print("\n" + "="*80)
        print("IMPORT COMPLETE")
        print("="*80)
        print(f"Total Products: {imported:,}")
        print(f"Skipped: {skipped:,}")
        print(f"Errors: {errors}")
        print(f"Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")

    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
