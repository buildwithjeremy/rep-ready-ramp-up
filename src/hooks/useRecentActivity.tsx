import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityFilterOption, ActivitySortOption, SortOrder, EnrichedActivityLog } from '@/types/activity';
import { enrichActivityLog, filterActivities, sortActivities } from '@/utils/activityUtils';

export interface ActivityLog {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  user_id: string | null;
  user_name?: string;
}

export function useRecentActivity(initialLimit: number = 1000) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterByAction, setFilterByAction] = useState<ActivityFilterOption>('all');
  const [filterByTrainer, setFilterByTrainer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<ActivitySortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [limit, setLimit] = useState(initialLimit);

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent activity logs with limit
      const { data: logs, error: logsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (logsError) throw logsError;

      // Get unique user IDs to fetch names
      const userIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean) || [])];
      
      // Fetch user names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Enrich logs with user names
      const enrichedLogs = logs?.map(log => ({
        ...log,
        user_name: log.user_id ? profileMap.get(log.user_id) : undefined
      })) || [];

      setActivities(enrichedLogs);
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process activities with enrichment, filtering, and sorting
  const processedActivities: EnrichedActivityLog[] = useMemo(() => {
    const enriched = activities.map(enrichActivityLog);
    const filtered = filterActivities(enriched, filterByAction, filterByTrainer);
    const sorted = sortActivities(filtered, sortBy, sortOrder);
    return sorted;
  }, [activities, filterByAction, filterByTrainer, sortBy, sortOrder]);

  return { 
    activities: processedActivities, 
    loading, 
    error, 
    refetch: fetchActivities,
    filterByAction,
    setFilterByAction,
    filterByTrainer,
    setFilterByTrainer,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    limit,
    setLimit
  };
}
