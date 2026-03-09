# Database Migration: Add is_hybrid Column

## Problem
The application is trying to use the `is_hybrid` column in the `classes` table, but it doesn't exist in the database yet.

## Solution
Run the migration SQL file to add the missing column.

## Steps to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy the contents of `add_is_hybrid_column.sql` and paste it into the editor
6. Click **Run** to execute the migration

### Option 2: Using SQL Editor in Supabase Studio
1. Open your Supabase project
2. Go to the **SQL Editor** tab
3. Create a new query
4. Paste the following SQL:

```sql
-- Add the is_hybrid column to the classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN NOT NULL DEFAULT false;

-- Add a comment to document the column
COMMENT ON COLUMN public.classes.is_hybrid IS 'Indicates if the course is delivered in hybrid mode (both physical and online)';
```

5. Execute the query

## What This Migration Does
- Adds a new `is_hybrid` column to the `classes` table
- Sets the column type to BOOLEAN
- Sets the default value to `false`
- Makes the column NOT NULL
- Adds a descriptive comment

## After Migration
The application will now support three course delivery modes:
1. **Physical Only** (default): `is_online = false`, `is_hybrid = false`
2. **Online Only**: `is_online = true`, `is_hybrid = false`
3. **Hybrid (Physical + Online)**: `is_online = false`, `is_hybrid = true`

## Verification
After running the migration, you can verify it was successful by running:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'classes' AND column_name = 'is_hybrid';
```

You should see the `is_hybrid` column listed with type `boolean` and default `false`.
