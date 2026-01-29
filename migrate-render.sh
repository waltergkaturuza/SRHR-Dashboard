#!/bin/bash
# Migration script for Render.com
# Run this script in the Render Shell to add youth representative columns

echo "========================================="
echo "Youth Representative Migration Script"
echo "========================================="
echo ""
echo "This will add youth representative columns to district_boundaries table"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Run the migration
echo "Running migration..."
psql $DATABASE_URL -f database/add_youth_rep_columns.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify columns were added: \d district_boundaries"
    echo "2. Add youth representative data via Admin Dashboard"
    echo "3. Or run seed script: psql \$DATABASE_URL -f database/seed_youth_reps.sql"
else
    echo ""
    echo "❌ Migration failed. Check the error messages above."
    exit 1
fi
