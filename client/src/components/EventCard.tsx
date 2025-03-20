import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MapPin } from "lucide-react";

interface EventCardProps {
  event: Event;
  isFavorite?: boolean;
}

export default function EventCard({ event, isFavorite: initialIsFavorite = false }: EventCardProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  const title = language === "ja" ? event.titleJa : event.titleEn;
  const description = language === "ja" ? event.descriptionJa : event.descriptionEn;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("You must be logged in to favorite events");
      }
      
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to add favorites",
        variant: "destructive",
      });
      return;
    }
    
    toggleFavoriteMutation.mutate();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="relative">
        <img 
          src={event.imageUrl} 
          alt={title} 
          className="w-full h-48 object-cover" 
        />
        {user && (
          <Button
            variant="ghost"
            className={`absolute top-2 right-2 p-1.5 bg-white bg-opacity-70 rounded-full hover:bg-opacity-100 transition-all ${isFavorite ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
            onClick={handleFavoriteClick}
            disabled={toggleFavoriteMutation.isPending}
          >
            <Heart fill={isFavorite ? "currentColor" : "none"} />
          </Button>
        )}
      </div>
      
      <div className="p-4 flex-grow">
        <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2">
          {title}
        </h3>
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Calendar className="text-gray-400 mr-1 h-4 w-4" />
          <span>
            {event.startDate}
            {event.endDate && ` - ${event.endDate}`}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="text-gray-400 mr-1 h-4 w-4" />
          <span>{event.location}</span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {description}
        </p>
      </div>
      
      <div className="px-4 pb-4">
        <Link href={`/event/${event.id}`} className="block">
          <Button className="w-full bg-primary hover:bg-indigo-700">
            {t("viewDetails")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
