import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityFilterControls } from "./activity-filter-controls";
import { ActivityItem } from "./activity-item";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RecentActivityCard() {
  const { 
    activities, 
    loading,
    refetch,
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
  } = useRecentActivity(50);

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <CardTitle>Recent Activity</CardTitle>
          <Badge variant="secondary">{activities.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <ActivityFilterControls
          filterByAction={filterByAction}
          sortBy={sortBy}
          sortOrder={sortOrder}
          limit={limit}
          onFilterChange={setFilterByAction}
          onSortChange={setSortBy}
          onSortOrderToggle={handleSortOrderToggle}
          onLimitChange={setLimit}
        />
        
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading activities...
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">No activities found matching your filters</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setFilterByAction('all');
                    setFilterByTrainer(null);
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
