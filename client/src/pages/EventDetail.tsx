import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Event } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Heart, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EventDetail() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/event/:id");
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);

  // Query for event details
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${params?.id}`],
    enabled: !!params?.id,
    onSuccess: (data) => {
      if (user && data) {
        checkIfFavorite(data.id);
      }
    }
  });

  // Query to check if event is favorited
  const checkIfFavorite = async (eventId: string) => {
    try {
      const response = await apiRequest("GET", `/api/favorites/check/${eventId}`, undefined);
      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  // Mutation for toggling favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !event) return;
      
      if (isFavorite) {
        return apiRequest("DELETE", `/api/favorites/${event.id}`, undefined);
      } else {
        return apiRequest("POST", `/api/favorites/${event.id}`, undefined);
      }
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      toast({
        title: isFavorite ? "Event removed from favorites" : "Event added to favorites",
        description: isFavorite ? "This event has been removed from your favorites" : "This event has been added to your favorites",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update favorites",
        variant: "destructive",
      });
    }
  });

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-error mb-4">{t("error")}</h1>
            <p className="text-gray-600 mb-6">
              {error instanceof Error ? error.message : "Failed to load event details"}
            </p>
            <Button onClick={() => setLocation('/')}>{t("returnHome")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const title = language === "ja" ? event.titleJa : event.titleEn;
  const description = language === "ja" ? event.descriptionJa : event.descriptionEn;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 md:h-80 lg:h-96">
          <img 
            src={event.imageUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
          <Button
            variant="ghost"
            className="absolute top-4 left-4 bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-800"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToSearch")}
          </Button>
          {user && (
            <Button
              variant="ghost"
              className={`absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 ${isFavorite ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
              onClick={() => toggleFavoriteMutation.mutate()}
              disabled={toggleFavoriteMutation.isPending}
            >
              <Heart className="h-6 w-6" fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
          
          <div className="flex flex-wrap gap-y-3 gap-x-6 mb-6">
            <div className="flex items-center text-gray-600">
              <Calendar className="mr-2 h-5 w-5 text-gray-400" />
              <span>
                {event.startDate}
                {event.endDate && ` - ${event.endDate}`}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="mr-2 h-5 w-5 text-gray-400" />
              <span>{event.location}</span>
            </div>
          </div>
          
          <div className="prose max-w-none mb-8">
            <p className="text-gray-700">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
