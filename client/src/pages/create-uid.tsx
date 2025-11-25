import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertCircle } from "lucide-react";

const createUIDSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  hours: z.coerce.number().min(1, "Hours must be at least 1").max(8760, "Max 1 year"),
});

type CreateUIDForm = z.infer<typeof createUIDSchema>;

export default function CreateUID() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateUIDForm>({
    resolver: zodResolver(createUIDSchema),
    defaultValues: { uid: "", hours: 24 },
  });

  const onSubmit = async (data: CreateUIDForm) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/uids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create UID");
      }

      toast({ title: "✓ UID Created", description: `UID ${data.uid} created successfully` });
      form.reset();
    } catch (error: any) {
      toast({ title: "✗ Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Create New UID</CardTitle>
            <CardDescription className="text-gray-400">Add a UID to the whitelist</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="uid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">UID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 123456789"
                          className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                          data-testid="input-uid"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Expiry Duration (Hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="24"
                          className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                          data-testid="input-hours"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-black hover:bg-white/90"
                  data-testid="button-create"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isLoading ? "Creating..." : "Create UID"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
