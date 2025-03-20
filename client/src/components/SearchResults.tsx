import { useState, useEffect, useRef, useCallback } from "react";
import { Event } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

interface SearchResultsProps {
  events: Event[];
  isLoading: boolean;
  error?: Error;
  initialPageSize?: number;
}

export default function SearchResults({ 
  events, 
  isLoading, 
  error,
  initialPageSize = 20 
}: SearchResultsProps) {
  const { t } = useLanguage();
  const [displayedEvents, setDisplayedEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const loader = useRef<HTMLDivElement>(null);
  const hasMore = displayedEvents.length < events.length;

  useEffect(() => {
    // Reset pagination when events change
    setPage(1);
    setDisplayedEvents(events.slice(0, initialPageSize));
  }, [events, initialPageSize]);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    
    const nextPage = page + 1;
    const nextEvents = events.slice(0, nextPage * initialPageSize);
    
    setDisplayedEvents(nextEvents);
    setPage(nextPage);
  }, [isLoading, page, events, initialPageSize]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const currentLoader = loader.current;
    
    if (!currentLoader || !hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );
    
    observer.observe(currentLoader);
    
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-error mb-2">Error</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading && displayedEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {t("searchResults")}
          </h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <SearchX className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {t("noResults")}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {t("tryAgain")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {t("searchResults")} ({events.length})
        </h2>
        {events.length > 0 && (
          <div className="text-sm text-gray-500">
            {t("showing")}: 1-{Math.min(displayedEvents.length, events.length)} {t("of")} {events.length}
          </div>
        )}
      </div>
      
      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Loader Reference Element */}
      {hasMore && !isLoading && (
        <div ref={loader} className="flex justify-center py-4">
          <Button
            variant="outline"
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={loadMore}
          >
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
