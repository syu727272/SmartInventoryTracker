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
  },
  usernamePlaceholder: {
    ja: "ユーザー名を入力",
    en: "Enter username"
  },
  passwordPlaceholder: {
    ja: "パスワードを入力",
    en: "Enter password"
  },
  confirmPasswordPlaceholder: {
    ja: "パスワードを再入力",
    en: "Confirm password"
  },
  loginSuccessful: {
    ja: "ログイン成功",
    en: "Login successful"
  },
  welcomeBack: {
    ja: "おかえりなさい！",
    en: "Welcome back!"
  },
  loginFailed: {
    ja: "ログイン失敗",
    en: "Login failed"
  },
  invalidCredentials: {
    ja: "認証情報が無効です",
    en: "Invalid credentials"
  },
  registrationSuccessful: {
    ja: "登録成功",
    en: "Registration successful"
  },
  accountCreated: {
    ja: "アカウントが作成されました",
    en: "Your account has been created"
  },
  registrationFailed: {
    ja: "登録失敗",
    en: "Registration failed"
  },
  unableToCreateAccount: {
    ja: "アカウントを作成できません",
    en: "Unable to create account"
  },
  usernameAlreadyTaken: {
    ja: "ユーザー名はすでに使用されています",
    en: "Username already taken"
  },
  passwordsDontMatch: {
    ja: "パスワードが一致しません",
    en: "Passwords don't match"
  },
  usernameMinLength: {
    ja: "ユーザー名は3文字以上である必要があります",
    en: "Username must be at least 3 characters"
  },
  passwordMinLength: {
    ja: "パスワードは6文字以上である必要があります",
    en: "Password must be at least 6 characters"
  },
  confirmPasswordMinLength: {
    ja: "確認用パスワードは6文字以上である必要があります",
    en: "Confirm password must be at least 6 characters"
  },
  welcomeToEventFinder: {
    ja: "東京イベントファインダーへようこそ",
    en: "Welcome to Tokyo Event Finder"
  },
  welcomeDescription: {
    ja: "ログインして東京の最新イベントを検索・お気に入り登録しましょう。あなたの興味に合わせたイベント情報をご提供します。",
    en: "Login to search and save your favorite events in Tokyo. We'll help you discover events that match your interests."
  },
  searchHint: {
    ja: "検索してイベントを見つけよう",
    en: "Search to find events"
  },
  searchDescription: {
    ja: "上記の検索フォームから日付と地域を選択して「検索」ボタンをクリックすると、条件に合ったイベントが表示されます。",
    en: "Select dates and district in the search form above, then click the 'Search' button to find events that match your criteria."
  },
  userNotRegistered: {
    ja: "ユーザーが登録されていません",
    en: "User is not registered"
  },
  incorrectPassword: {
    ja: "パスワードが正しくありません",
    en: "Incorrect password"
  },
  registerFirst: {
    ja: "まだアカウントをお持ちでない場合は、登録してください",
    en: "If you don't have an account yet, please register first"
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