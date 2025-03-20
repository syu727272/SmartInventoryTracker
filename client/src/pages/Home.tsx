import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchForm from "@/components/SearchForm";
import SearchResults from "@/components/SearchResults";
import LoginModal from "@/components/LoginModal";
import { Event, SearchParams } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    dateFrom: new Date().toISOString().split('T')[0], // Today
    dateTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days later
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Query for events
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['/api/events', searchParams.dateFrom, searchParams.dateTo, searchParams.district],
    enabled: !!searchParams,
  });

  const handleSearch = (newParams: SearchParams) => {
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Interface */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {t("findEvents")}
        </h1>
        <SearchForm onSearch={handleSearch} initialValues={searchParams} />
      </div>

      {/* Search Results */}
      <SearchResults 
        events={events || []} 
        isLoading={isLoading} 
        error={error instanceof Error ? error : undefined}
      />

      {/* Login/Register Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        isRegistering={isRegistering}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchMode={(mode) => setIsRegistering(mode === 'register')}
      />
    </div>
  );
}
