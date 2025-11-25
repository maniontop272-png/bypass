import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

// Particle component
function Particle({ delay, duration }: { delay: number; duration: number }) {
  return (
    <div
      className="absolute w-1 h-1 bg-white rounded-full"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        opacity: Math.random() * 0.5 + 0.3,
      }}
    />
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }))
  );

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const result = await res.json();
      localStorage.setItem("authToken", result.token);
      localStorage.setItem("username", data.username);
      window.dispatchEvent(new Event("login-success"));
      toast({ title: "Login successful!", description: "Welcome back!" });
      setTimeout(() => setLocation("/dashboard"), 100);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-black fixed inset-0 flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { opacity: 0.5; }
          50% { transform: translateY(-100px) translateX(30px); opacity: 0.7; }
          75% { opacity: 0.4; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
        }
      `}</style>

      {/* Animated particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <Particle key={p.id} delay={p.delay} duration={p.duration} />
        ))}
      </div>

      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-30" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-white/8 rounded-full blur-3xl animate-pulse opacity-20" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Main container with centered card */}
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8">
        <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto border border-white/30 bg-black/80 backdrop-blur-2xl shadow-2xl shadow-white/20 hover:border-white/50 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none"></div>

        <CardHeader className="space-y-2 text-center pb-6 relative">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white to-gray-200 flex items-center justify-center shadow-lg shadow-white/40">
              <div className="text-lg font-black text-black">UID</div>
            </div>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold text-white tracking-tight">UID Whitelist</CardTitle>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80 text-xs md:text-sm font-medium block">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter username"
                        className="bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 h-10 md:h-11 text-sm md:text-base"
                        {...field}
                        disabled={isLoading}
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80 text-xs md:text-sm font-medium block">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        className="bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 h-10 md:h-11 text-sm md:text-base"
                        {...field}
                        disabled={isLoading}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 md:h-11 bg-white text-black font-semibold hover:bg-gray-100 active:scale-95 transition-all duration-200 text-sm md:text-base"
                data-testid="button-login"
              >
                <LogIn className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
