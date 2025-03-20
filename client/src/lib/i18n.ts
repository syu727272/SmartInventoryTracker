import React, { createContext, useState, useContext, ReactNode } from "react";

// Define available languages
type Language = "ja" | "en";

// Define translation dictionary
type TranslationDict = {
  [key: string]: {
    ja: string;
    en: string;
  };
};

// Base translations for the application
const translations: TranslationDict = {
  appName: {
    ja: "東京イベントファインダー",
    en: "Tokyo Event Finder"
  },
  login: {
    ja: "ログイン",
    en: "Login"
  },
  register: {
    ja: "登録",
    en: "Register"
  },
  logout: {
    ja: "ログアウト",
    en: "Logout"
  },
  favorites: {
    ja: "お気に入り",
    en: "Favorites"
  },
  profile: {
    ja: "プロフィール",
    en: "Profile"
  },
  findEvents: {
    ja: "東京のイベントを探す",
    en: "Find Events in Tokyo"
  },
  dateRange: {
    ja: "日付範囲",
    en: "Date Range"
  },
  district: {
    ja: "地域",
    en: "District"
  },
  allDistricts: {
    ja: "すべての地域",
    en: "All Districts"
  },
  search: {
    ja: "検索",
    en: "Search"
  },
  searchResults: {
    ja: "検索結果",
    en: "Search Results"
  },
  showing: {
    ja: "表示",
    en: "Showing"
  },
  of: {
    ja: "件中",
    en: "of"
  },
  viewDetails: {
    ja: "詳細を見る",
    en: "View Details"
  },
  loadMore: {
    ja: "もっと見る",
    en: "Load More"
  },
  noResults: {
    ja: "検索結果がありません",
    en: "No Results Found"
  },
  tryAgain: {
    ja: "検索条件を変更して、もう一度お試しください。",
    en: "Please try changing your search criteria."
  },
  password: {
    ja: "パスワード",
    en: "Password"
  },
  confirmPassword: {
    ja: "パスワード（確認）",
    en: "Confirm Password"
  },
  username: {
    ja: "ユーザー名",
    en: "Username"
  },
  backToLogin: {
    ja: "ログイン画面へ",
    en: "Back to Login"
  },
  favoriteEvents: {
    ja: "お気に入りイベント",
    en: "Favorite Events"
  },
  backToSearch: {
    ja: "検索に戻る",
    en: "Back to Search"
  },
  noFavorites: {
    ja: "お気に入りが登録されていません",
    en: "No Favorites Yet"
  },
  addFavoriteHint: {
    ja: "気に入ったイベントのハートアイコンをクリックして、お気に入りに追加しましょう。",
    en: "Click the heart icon on events you like to add them to your favorites."
  },
  error: {
    ja: "エラーが発生しました",
    en: "An Error Occurred"
  },
  pageNotFound: {
    ja: "ページが見つかりませんでした。",
    en: "The page you're looking for cannot be found."
  },
  returnHome: {
    ja: "ホームに戻る",
    en: "Return Home"
  },
  about: {
    ja: "サービスについて",
    en: "About"
  },
  terms: {
    ja: "利用規約",
    en: "Terms of Service"
  },
  privacy: {
    ja: "プライバシーポリシー",
    en: "Privacy Policy"
  },
  contact: {
    ja: "お問い合わせ",
    en: "Contact"
  },
  contactMsg: {
    ja: "ご質問やご意見がございましたら、お気軽にお問い合わせください。",
    en: "If you have any questions or feedback, please feel free to contact us."
  },
  home: {
    ja: "ホーム",
    en: "Home"
  },
  links: {
    ja: "リンク",
    en: "Links"
  },
  wards23: {
    ja: "23区",
    en: "23 Wards"
  },
  tamaRegion: {
    ja: "多摩地域",
    en: "Tama Region"
  },
  loginDescription: {
    ja: "あなたのアカウントにログインしてください",
    en: "Log in to your account"
  },
  registerDescription: {
    ja: "新しいアカウントを作成してください",
    en: "Create a new account"
  }
};

// Context interface
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ja");

  // Translation function
  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: contextValue },
    children
  );
}

// Custom hook for using the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}