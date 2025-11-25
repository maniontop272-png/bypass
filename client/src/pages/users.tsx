import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Shield, AlertTriangle, Copy, Check } from "lucide-react";

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username max 20 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(30, "Password max 30 characters"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface User {
  username: string;
  role: "admin" | "user";
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([{ username: "admin", role: "admin" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedUser, setCopiedUser] = useState<string | null>(null);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const username = localStorage.getItem("username");
    setIsAdmin(username === "admin");
  };

  const onSubmit = async (data: CreateUserForm) => {
    if (!isAdmin) {
      toast({ title: "Error", description: "Only admins can create users", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create user");
      }

      toast({
        title: "✓ User Created",
        description: `${data.username} created successfully`,
      });

      setUsers([...users, { username: data.username, role: "user" }]);
      form.reset();
    } catch (error: any) {
      toast({
        title: "✗ Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, user: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUser(user);
    setTimeout(() => setCopiedUser(null), 2000);
    toast({ title: "Copied!", description: `${text} copied to clipboard` });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-8 flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
        </div>
        <Card className="border-red-500/30 bg-red-900/10 backdrop-blur max-w-md relative z-10">
          <CardHeader>
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-red-300">Access Denied</CardTitle>
                <CardDescription className="text-red-200/70 mt-1">Only admins can manage users. Please login as admin.</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-2">Create and manage user accounts (Admin Only)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create User Form */}
          <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Create New User</CardTitle>
              <CardDescription className="text-gray-400">Add a new user account to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john_doe"
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 h-10"
                            data-testid="input-username"
                            {...field}
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
                        <FormLabel className="text-white/70">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 h-10"
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-black hover:bg-white/90 h-10 font-semibold"
                    data-testid="button-create"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isLoading ? "Creating..." : "Create User"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-white/20 bg-gradient-to-br from-blue-900/20 to-black/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Important Information</CardTitle>
              <CardDescription className="text-gray-400">Follow these guidelines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white/80 font-medium">Username</p>
                    <p className="text-gray-400 text-sm">3-20 characters, alphanumeric only</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white/80 font-medium">Password</p>
                    <p className="text-gray-400 text-sm">Minimum 6 characters for security</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white/80 font-medium">User Role</p>
                    <p className="text-gray-400 text-sm">All new users get "user" role</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              System Users ({users.length})
            </CardTitle>
            <CardDescription className="text-gray-400">All registered users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div
                  key={user.username}
                  className="flex flex-col p-4 rounded-lg border border-white/10 bg-gray-950/50 hover:border-white/30 transition-all duration-300 group"
                  data-testid={`user-card-${user.username}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-lg font-medium text-white font-mono">{user.username}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {user.role === "admin" ? "Administrator" : "Regular User"}
                      </p>
                    </div>
                    {user.role === "admin" ? (
                      <Shield className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    ) : (
                      <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-white/10">
                    {user.role === "admin" ? (
                      <div className="flex-1 px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30 text-center">
                        <span className="text-xs text-purple-300 font-medium">Admin</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => copyToClipboard(user.username, user.username)}
                        className="flex-1 px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-xs text-blue-300 font-medium flex items-center justify-center gap-1 group"
                        title="Copy username"
                      >
                        {copiedUser === user.username ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
