# RLS Policy Fix for Optimized Functions

## Problem
The optimized Supabase functions are returning 403 Forbidden errors because Row Level Security (RLS) policies haven't been properly configured for the database functions we created.

## Current Status
- ❌ `get_user_projects_with_stats` function returns 403 Forbidden
- ❌ `get_user_dashboard_stats` function returns 403 Forbidden
- ✅ Regular table queries work fine
- ✅ Infinite loop in project screen fixed

## Quick Fix - Run in Supabase SQL Editor

```sql
-- Grant execute permissions on the optimized functions
GRANT EXECUTE ON FUNCTION public.get_user_projects_with_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_user_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations_with_counts(uuid) TO authenticated;

-- Ensure materialized views have proper RLS policies
ALTER TABLE public.user_dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for materialized views
CREATE POLICY "Users can view their own dashboard stats" ON public.user_dashboard_stats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own project activity" ON public.project_activity_summary
  FOR SELECT USING (user_id = auth.uid());

-- Grant permissions on materialized views
GRANT SELECT ON public.user_dashboard_stats TO authenticated;
GRANT SELECT ON public.project_activity_summary TO authenticated;
```

## Re-enable Optimized Functions

After running the SQL above, you can re-enable the optimized functions by:

1. Uncommenting the optimized code in `utils/projectService.ts`
2. Restoring the imports for `OptimizedQueries` and `PerformanceMonitor`
3. Replacing the temporary fallback implementations

## Test
After applying the fixes:
1. Go to the projects screen
2. Check the console - you should see successful calls to the optimized functions
3. No more 403 Forbidden errors
4. Faster loading times due to optimized queries

## Status
- ✅ Infinite loop fixed in project screen
- ⏳ RLS policies need to be applied in Supabase
- ⏳ Optimized functions temporarily disabled until RLS is fixed 