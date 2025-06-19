# Database Migration Guide for Enhanced Project Creation

## Overview
This guide explains the database changes needed to support the enhanced project creation form with all the new fields you requested.

## Required Database Changes

### 1. New Columns in `projects` Table
The following columns need to be added to the existing `projects` table:

- `category` (VARCHAR(100)) - Project category
- `priority` (VARCHAR(20)) - Priority level (low, medium, high)
- `edc_date` (DATE) - Estimated Date of Completion
- `fud_date` (DATE) - Follow Up Date
- `budget` (DECIMAL(12,2)) - Project budget
- `project_owner` (VARCHAR(255)) - Project owner name/identifier
- `project_lead` (VARCHAR(255)) - Project lead name/identifier

### 2. New Tables
Three new tables will be created:

- `project_team_members` - For managing team member assignments
- `project_resources` - For storing tools, dependencies, and resources
- `project_categories` - For predefined project categories

### 3. Enhanced Features
- Proper indexing for better query performance
- Row Level Security (RLS) policies for data protection
- Triggers for automatic timestamp updates
- Enhanced views for optimized queries

## Migration Steps

### Option 1: Manual Migration (Recommended)
1. Open your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL script from `scripts/updateProjectSchema.sql`
4. Execute the script
5. Verify that all tables and columns were created successfully

### Option 2: Automated Migration (Advanced)
```bash
# Run the migration script
node scripts/runProjectSchemaMigration.js
```

## SQL Script Location
The complete SQL migration script is available at:
- `scripts/updateProjectSchema.sql`
- `scripts/runProjectSchemaMigration.js` (Node.js runner)

## New Form Fields Supported

### Basic Project Information
- ✅ Project Name (existing)
- ✅ Project Description (existing)
- ✅ Category (new - dropdown with predefined options)
- ✅ Priority (new - Low/Medium/High)
- ✅ EDC Date (new - calendar picker)
- ✅ FUD Date (new - calendar picker)
- ✅ Status (enhanced - now includes 'on_hold')
- ✅ Budget (new - decimal input)

### Team & Resources Section
- ✅ Project Owner (new - dropdown from team members)
- ✅ Project Lead (new - dropdown from team members)
- ✅ Team Members (new - multi-select)
- ✅ Tools Needed (new - multi-input)
- ✅ Dependencies (new - multi-input)

## Database Schema Changes Summary

### Modified Tables
- `projects` - Added 7 new columns for commonly queried fields
- Enhanced status constraint to include 'on_hold'

### New Tables
- `project_team_members` - Team member management
- `project_resources` - Tools and dependencies
- `project_categories` - Category definitions

### Indexes Added
- `idx_projects_category` - For category filtering
- `idx_projects_priority` - For priority filtering
- `idx_projects_edc_date` - For date-based queries
- `idx_projects_status` - For status filtering
- `idx_projects_user_id` - For user-based queries

### Views Created
- `enhanced_projects` - Optimized view with calculated fields

## Testing the Migration

After running the migration:

1. **Test Project Creation**: Create a new project with all fields filled
2. **Verify Data Storage**: Check that all fields are properly saved
3. **Test Team Assignment**: Add team members to projects
4. **Test Resource Management**: Add tools and dependencies
5. **Test Filtering**: Filter projects by category, priority, etc.

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove new columns (CAUTION: This will delete data)
ALTER TABLE projects DROP COLUMN IF EXISTS category;
ALTER TABLE projects DROP COLUMN IF EXISTS priority;
ALTER TABLE projects DROP COLUMN IF EXISTS edc_date;
ALTER TABLE projects DROP COLUMN IF EXISTS fud_date;
ALTER TABLE projects DROP COLUMN IF EXISTS budget;
ALTER TABLE projects DROP COLUMN IF EXISTS project_owner;
ALTER TABLE projects DROP COLUMN IF EXISTS project_lead;

-- Drop new tables (CAUTION: This will delete all data)
DROP TABLE IF EXISTS project_resources;
DROP TABLE IF EXISTS project_team_members;
DROP TABLE IF EXISTS project_categories;

-- Drop views
DROP VIEW IF EXISTS enhanced_projects;
```

## Support

If you encounter any issues during migration:

1. Check the Supabase logs for detailed error messages
2. Verify that all required permissions are set
3. Ensure your database user has the necessary privileges
4. Review the RLS policies if data access issues occur

## Next Steps

1. Run the migration script
2. Test the enhanced project creation form
3. Verify all fields are working correctly
4. Customize categories and priorities as needed
5. Set up team member invitations if required 