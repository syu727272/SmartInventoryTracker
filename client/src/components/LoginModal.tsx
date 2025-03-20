import { useState, useEffect } from "react";
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

  // Login form schema
  const loginSchema = z.object({
    username: z.string().min(3, t("usernameMinLength")).trim(),
    password: z.string().min(6, t("passwordMinLength")),
  });

  // Registration form schema
  const registerSchema = z.object({
    username: z.string().min(3, t("usernameMinLength")).trim(),
    password: z.string().min(6, t("passwordMinLength")),
    confirmPassword: z.string().min(1, "入力が必要です"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsDontMatch"),
    path: ["confirmPassword"],
  });

  type LoginFormValues = z.infer<typeof loginSchema>;
  type RegisterFormValues = z.infer<typeof registerSchema>;

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update forms when language changes
  useEffect(() => {
    loginForm.trigger();
    registerForm.trigger();
  }, [t]);

  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.username, values.password);
      toast({
        title: t("loginSuccessful"),
        description: t("welcomeBack"),
      });
      onClose();
    } catch (error) {
      toast({
        title: t("loginFailed"),
        description: error instanceof Error ? error.message : t("invalidCredentials"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    console.log("Registration values:", values);
    
    // Validate passwords match before submitting
    if (values.password !== values.confirmPassword) {
      registerForm.setError("confirmPassword", {
        type: "manual",
        message: t("passwordsDontMatch")
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await register(values.username, values.password);
      toast({
        title: t("registrationSuccessful"),
        description: t("accountCreated"),
      });
      onClose();
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : t("unableToCreateAccount");
      console.log("Error message:", errorMessage);
      
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
      <DialogContent className="sm:max-w-sm" aria-describedby="login-modal-description">
        <div id="login-modal-description" className="sr-only">
          {isRegistering 
            ? t("registerDescription") 
            : t("loginDescription")}
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

        {!isRegistering ? (
          /* Login Form */
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
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
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("passwordPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => onSwitchMode("register")}
                >
                  {t("register")}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {t("login")}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          /* Register Form */
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
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
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("passwordPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("confirmPasswordPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => onSwitchMode("login")}
                >
                  {t("backToLogin")}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {t("register")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
