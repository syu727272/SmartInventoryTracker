import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";
import LoginModal from "@/components/LoginModal";
import { Button } from "@/components/ui/button";
import {
  User,
  LogOut,
  Heart,
  ChevronDown,
} from "lucide-react";

export default function Header() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLoginClick = () => {
    setIsRegistering(false);
    setIsLoginModalOpen(true);
  };

  const handleRegisterClick = () => {
    setIsRegistering(true);
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-primary font-bold text-xl">
              {t("appName")}
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* Not Logged In State */}
            {!user ? (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={handleLoginClick}
                >
                  {t("login")}
                </Button>
                <Button
                  className="bg-primary text-white hover:bg-indigo-700"
                  onClick={handleRegisterClick}
                >
                  {t("register")}
                </Button>
              </div>
            ) : (
              /* Logged In State */
              <div className="flex items-center space-x-4">
                <Link 
                  href="/favorites"
                  className={`text-gray-700 hover:text-primary flex items-center transition-colors ${location === "/favorites" ? "text-primary" : ""}`}
                >
                  <Heart className="mr-1 h-5 w-5" />
                  {t("favorites")}
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {/* User Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleLogout}
                      >
                        <div className="flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          {t("logout")}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        isRegistering={isRegistering}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchMode={(mode) => setIsRegistering(mode === "register")}
      />
    </header>
  );
}
