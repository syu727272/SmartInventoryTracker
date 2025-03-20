import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "ja" ? "en" : "ja");
  };

  return (
    <Button
      variant="ghost"
      className="flex items-center text-gray-700 hover:text-primary transition-colors"
      onClick={toggleLanguage}
    >
      <Globe className="h-4 w-4 mr-1" />
      {language === "ja" ? "EN" : "JP"}
    </Button>
  );
}
