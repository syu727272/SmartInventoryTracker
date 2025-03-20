import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchForm from "@/components/SearchForm";
import SearchResults from "@/components/SearchResults";
import LoginModal from "@/components/LoginModal";
import { Event, SearchParams } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    dateFrom: new Date().toISOString().split('T')[0], // Today
    dateTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day later
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // 検索が実行されたかどうかを追跡するフラグ
  const [searchExecuted, setSearchExecuted] = useState(false);
  
  // イベント検索クエリ - ユーザーがログインしていて、検索が実行された場合のみ有効
  const { data: events, isLoading: isEventsLoading, error } = useQuery<Event[]>({
    queryKey: [
      '/api/events', 
      'dateFrom', searchParams.dateFrom, 
      'dateTo', searchParams.dateTo, 
      'district', searchParams.district
    ],
    enabled: !!user && !!searchParams && searchExecuted,
  });

  const handleSearch = (newParams: SearchParams) => {
    setSearchParams(newParams);
    setSearchExecuted(true); // 検索が実行されたことをマーク
  };

  const handleOpenLogin = (registerMode = false) => {
    setIsRegistering(registerMode);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {isAuthLoading ? (
        // Loading state
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user ? (
        // Authenticated user view - show search and results
        <>
          {/* Search Interface */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              {t("findEvents")}
            </h1>
            <SearchForm onSearch={handleSearch} initialValues={searchParams} />
          </div>

          {/* Search Results - 検索が実行された場合のみ表示 */}
          {searchExecuted ? (
            <SearchResults 
              events={events || []} 
              isLoading={isEventsLoading} 
              error={error instanceof Error ? error : undefined}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("searchHint")}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t("searchDescription")}
              </p>
            </div>
          )}
        </>
      ) : (
        // Unauthenticated user view - show welcome screen
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-bold text-primary mb-6">
            {t("welcomeToEventFinder")}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mb-8">
            {t("welcomeDescription")}
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => handleOpenLogin(false)}
              className="text-lg px-6 py-5"
            >
              {t("login")}
            </Button>
            <Button 
              onClick={() => handleOpenLogin(true)}
              variant="outline" 
              className="text-lg px-6 py-5"
            >
              {t("register")}
            </Button>
          </div>
        </div>
      )}

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
