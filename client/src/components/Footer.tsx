import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("appName")}
            </h3>
            <p className="text-gray-300 text-sm">
              {t.language === "ja" 
                ? "東京都内のイベント情報を簡単に検索できるサービスです。" 
                : "A service that makes it easy to find events in Tokyo."}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("links")}
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-white transition-colors">
                  {t("favorites")}
                </Link>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  {t("terms")}
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">
                  {t("privacy")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("contact")}
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              {t("contactMsg")}
            </p>
            <a 
              href="mailto:contact@tokyoeventfinder.example.com" 
              className="text-primary hover:text-indigo-400 transition-colors"
            >
              contact@tokyoeventfinder.example.com
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Tokyo Event Finder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
