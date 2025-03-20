import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  isRegistering: boolean;
  onClose: () => void;
  onSwitchMode: (mode: "login" | "register") => void;
}

export default function LoginModal({ 
  isOpen, 
  isRegistering, 
  onClose, 
  onSwitchMode 
}: LoginModalProps) {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ログインフォームのスキーマ
  const loginSchema = z.object({
    username: z.string()
      .min(3, t("usernameMinLength"))
      .trim(),
    password: z.string()
      .min(6, t("passwordMinLength")),
  });

  // 登録フォームのスキーマ
  const registerSchema = z.object({
    username: z.string()
      .min(3, t("usernameMinLength"))
      .trim(),
    password: z.string()
      .min(6, t("passwordMinLength")),
    confirmPassword: z.string()
      .min(1, t("confirmPasswordMinLength")),
  }).refine(
    (data) => data.password === data.confirmPassword, 
    {
      message: t("passwordsDontMatch"),
      path: ["confirmPassword"], 
    }
  );

  type LoginFormValues = z.infer<typeof loginSchema>;
  type RegisterFormValues = z.infer<typeof registerSchema>;

  // ログインフォーム
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange", // リアルタイム検証
  });

  // 登録フォーム
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // リアルタイム検証
  });

  // ログインハンドラー
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", values.username);
      await login(values.username, values.password);
      
      toast({
        title: t("loginSuccessful"),
        description: t("welcomeBack"),
      });
      
      onClose();
    } catch (error) {
      console.error("Login error:", error);
      
      // エラーメッセージを改善
      let errorTitle = t("loginFailed");
      let errorMessage = t("invalidCredentials");
      let registerHint = false;
      
      // エラーメッセージのパターンを確認
      const errorStr = error instanceof Error ? error.message : String(error);
      console.log("Error message:", errorStr);
      
      if (errorStr.includes("User is not registered") || 
          errorStr.includes("401: User is not registered")) {
        errorMessage = t("userNotRegistered");
        errorTitle = t("loginFailed");
        registerHint = true;
      } else if (errorStr.includes("Incorrect password") || 
                errorStr.includes("401: Incorrect password")) {
        errorMessage = t("incorrectPassword");
        errorTitle = t("loginFailed");
      } else {
        errorMessage = errorStr;
      }
      
      // トースト通知を表示
      // 直接DOMにトースト要素を追加して確実に表示する
      const toastDiv = document.createElement('div');
      toastDiv.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white p-4 rounded shadow-lg';
      toastDiv.innerHTML = `
        <div class="font-bold">${errorTitle}</div>
        <div>${errorMessage}</div>
      `;
      document.body.appendChild(toastDiv);
      
      // 5秒後に削除
      setTimeout(() => {
        if (document.body.contains(toastDiv)) {
          document.body.removeChild(toastDiv);
        }
      }, 5000);
      
      // 通常のトーストも試みる
      console.log("Displaying toast with:", {
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
      const result = toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      console.log("Toast result:", result);
      
      // ユーザーが登録されていない場合は登録を促すメッセージも表示
      if (registerHint) {
        setTimeout(() => {
          toast({
            title: t("register"),
            description: t("registerFirst"),
          });
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 登録ハンドラー
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    // サーバーに送信するデータ (confirmPasswordを除く)
    const userData = {
      username: values.username,
      password: values.password
    };
    
    console.log("Submitting registration data:", userData);
    
    setIsLoading(true);
    try {
      await register(userData.username, userData.password);
      toast({
        title: t("registrationSuccessful"),
        description: t("accountCreated"),
      });
      onClose();
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : t("unableToCreateAccount");
      
      if (errorMessage.includes("Username already taken")) {
        registerForm.setError("username", {
          type: "manual",
          message: t("usernameAlreadyTaken")
        });
      } else {
        toast({
          title: t("registrationFailed"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="login-modal-description"
      >
        <div id="login-modal-description" className="sr-only">
          {isRegistering ? t("registerDescription") : t("loginDescription")}
        </div>
        
        <DialogHeader className="bg-primary px-4 py-2 text-white rounded-t-md -mt-4 -mx-4 mb-4">
          <div className="flex justify-between items-center">
            <DialogTitle>
              {isRegistering ? t("register") : t("login")}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-gray-200 hover:bg-transparent"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isRegistering ? (
          <RegisterFormContent 
            form={registerForm}
            onSubmit={onRegisterSubmit}
            isLoading={isLoading}
            onSwitchMode={() => onSwitchMode("login")}
          />
        ) : (
          <LoginFormContent 
            form={loginForm}
            onSubmit={onLoginSubmit}
            isLoading={isLoading}
            onSwitchMode={() => onSwitchMode("register")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ログインフォームのコンテンツ
function LoginFormContent({
  form,
  onSubmit,
  isLoading,
  onSwitchMode
}: {
  form: ReturnType<typeof useForm<any>>;
  onSubmit: (values: any) => void;
  isLoading: boolean;
  onSwitchMode: () => void;
}) {
  const { t } = useLanguage();
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("username")}</FormLabel>
              <FormControl>
                <Input placeholder={t("usernamePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={t("passwordPlaceholder")} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between pt-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={onSwitchMode}
          >
            {t("register")}
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? "..." : t("login")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// 登録フォームのコンテンツ
function RegisterFormContent({
  form,
  onSubmit,
  isLoading,
  onSwitchMode
}: {
  form: ReturnType<typeof useForm<any>>;
  onSubmit: (values: any) => void;
  isLoading: boolean;
  onSwitchMode: () => void;
}) {
  const { t } = useLanguage();
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("username")}</FormLabel>
              <FormControl>
                <Input placeholder={t("usernamePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={t("passwordPlaceholder")} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("confirmPassword")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={t("confirmPasswordPlaceholder")} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between pt-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={onSwitchMode}
          >
            {t("backToLogin")}
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? "..." : t("register")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
