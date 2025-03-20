import { useRoute, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function Error() {
  const [match, params] = useRoute("/error/:type");
  const [_, setLocation] = useLocation();
  const { t } = useLanguage();

  if (!match) {
    return null;
  }

  let title = t("error");
  let message = "";

  // Handle different error types
  switch (params?.type) {
    case "404":
      title = "404 - " + t("pageNotFound");
      message = t("pageNotFound");
      break;
    case "403":
      title = "403 - Forbidden";
      message = "You don't have permission to access this resource.";
      break;
    case "500":
      title = "500 - Server Error";
      message = "An internal server error occurred. Please try again later.";
      break;
    case "unauthorized":
      title = "Unauthorized";
      message = "You need to be logged in to access this page.";
      break;
    default:
      message = "An unexpected error occurred.";
  }

  return (
    <div className="min-h-[calc(100vh-200px)] w-full flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-lg mx-auto">
        <div className="mb-6 flex justify-center">
          <AlertCircle className="h-16 w-16 text-error" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        <Button 
          className="inline-flex items-center"
          onClick={() => setLocation("/")}
        >
          <Home className="mr-2 h-4 w-4" />
          {t("returnHome")}
        </Button>
      </div>
    </div>
  );
}
