import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import EventCard from "@/components/EventCard";
import { Event } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

export default function Favorites() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Query for favorites
  const { data: favorites, isLoading, error } = useQuery<Event[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t("favoriteEvents")}
          </h1>
          <Button
            variant="ghost"
            className="flex items-center text-primary hover:text-indigo-700"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("backToSearch")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error text-lg">
              {error instanceof Error ? error.message : "Error loading favorites"}
            </p>
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {t("noFavorites")}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {t("addFavoriteHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
