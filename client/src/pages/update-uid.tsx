import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Clock } from "lucide-react";

const updateUIDSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  hours: z.coerce.number().min(1, "Hours must be at least 1"),
});

type UpdateUIDForm = z.infer<typeof updateUIDSchema>;

interface UIDEntry {
  uid: string;
  expiry: number;
  status: string;
  remainingHours: number;
  expiryDate: string;
}

export default function UpdateUID() {
  const { toast } = useToast();
  const [uids, setUids] = useState<UIDEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<UpdateUIDForm>({
    resolver: zodResolver(updateUIDSchema),
    defaultValues: { uid: "", hours: 24 },
  });

  useEffect(() => {
    loadUIDs();
  }, []);

  const loadUIDs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/uids", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load UIDs");
      const data = await res.json();
      setUids(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateUIDForm) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/uids/${data.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ hours: data.hours }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update UID");
      }

      toast({ title: "✓ UID Extended", description: "Expiry duration updated successfully" });
      form.reset();
      loadUIDs();
    } catch (error: any) {
      toast({ title: "✗ Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white">Update UID Expiry</h1>
          <p className="text-gray-400 mt-2">Extend the expiration time of existing UIDs</p>
        </div>

        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Extend UID Duration</CardTitle>
            <CardDescription className="text-gray-400">Select a UID and add more hours to its expiry</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="uid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Select UID</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border border-white/20 bg-white/5 text-white rounded px-3 py-2"
                          data-testid="select-uid"
                        >
                          <option value="">Choose a UID...</option>
                          {uids.map(u => (
                            <option key={u.uid} value={u.uid}>
                              {u.uid} - {u.status} ({u.remainingHours}h left)
                            </option>
                          ))}
                        </select>
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
                      <FormLabel className="text-white/70">Additional Hours</FormLabel>
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
                  disabled={isUpdating || !form.watch("uid")}
                  className="w-full bg-white text-black hover:bg-white/90"
                  data-testid="button-update"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isUpdating ? "Updating..." : "Update UID"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Available UIDs</CardTitle>
            <CardDescription className="text-gray-400">Select one to extend its expiry time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading UIDs...</div>
            ) : uids.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No UIDs available</div>
            ) : (
              <div className="space-y-2">
                {uids.map((uid) => (
                  <div
                    key={uid.uid}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-gray-950/50 hover:border-white/30"
                    data-testid={`uid-row-${uid.uid}`}
                  >
                    <div className="flex-1">
                      <p className="text-lg font-mono text-white">{uid.uid}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span>Status: {uid.status}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{uid.remainingHours}h left</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => form.setValue("uid", uid.uid)}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      data-testid={`button-select-${uid.uid}`}
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
