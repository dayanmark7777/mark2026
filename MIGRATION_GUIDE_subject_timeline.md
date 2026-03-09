# Database Migration: Add subject_timeline Column

## Problem
The application needs to track detailed information for each subject in a class (Lecturer, Status, Start Date, End Date), but the `classes` table does not have a column for this.

## Solution
Run the migration SQL file to add the missing column.

## Steps to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy the contents of `add_subject_timeline_column.sql` and paste it into the editor
6. Click **Run** to execute the migration

### Option 2: Using SQL Editor in Supabase Studio
1. Open your Supabase project
2. Go to the **SQL Editor** tab
3. Create a new query
4. Paste the following SQL:

```sql
-- Add the subject_timeline column to the classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS subject_timeline JSONB DEFAULT '{}'::jsonb;
```

## What This Migration Does
- Adds a new `subject_timeline` column to the `classes` table
- Sets the column type to JSONB
- Sets the default value to an empty JSON object `{}`

## Structure of subject_timeline JSON
The `subject_timeline` stores subject-specific details. Keys are subject names.

```json
{
  "Subject Name 1": {
    "lecturerId": "uuid-...",
    "status": "Ongoing", // or "Completed", "Vacant", "Scheduled"
    "startDate": "2024-01-01",
    "endDate": "2024-06-01"
  }
}
```
