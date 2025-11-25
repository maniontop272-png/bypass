import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UIDEntry {
  uid: string;
  expiry: number;
  status: string;
  remainingHours: number;
  expiryDate: string;
}

export default function DeleteUID() {
  const { toast } = useToast();
  const [uids, setUids] = useState<UIDEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUID, setSelectedUID] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!selectedUID) return;

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/uids/${selectedUID}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete UID");

      toast({ title: "✓ UID Deleted", description: `UID ${selectedUID} removed successfully` });
      setSelectedUID(null);
      loadUIDs();
    } catch (error: any) {
      toast({ title: "✗ Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white">Delete UID</h1>
          <p className="text-gray-400 mt-2">Permanently remove UIDs from the system</p>
        </div>

        <Card className="border-red-500/20 bg-red-900/10 backdrop-blur">
          <CardHeader>
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-red-300">Warning</CardTitle>
                <CardDescription className="text-red-200/70">Deleting a UID is permanent and cannot be undone</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Select UID to Delete</CardTitle>
            <CardDescription className="text-gray-400">Choose which UID you want to remove</CardDescription>
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
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-gray-950/50 hover:border-white/30 transition-all"
                    data-testid={`uid-row-${uid.uid}`}
                  >
                    <div className="flex-1">
                      <p className="text-lg font-mono text-white">{uid.uid}</p>
                      <p className="text-sm text-gray-400">Status: {uid.status} • {uid.remainingHours}h left</p>
                    </div>
                    <AlertDialog open={selectedUID === uid.uid} onOpenChange={(open) => !open && setSelectedUID(null)}>
                      <Button
                        onClick={() => setSelectedUID(uid.uid)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        data-testid={`button-delete-${uid.uid}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                      {selectedUID === uid.uid && (
                        <AlertDialogContent className="border-white/20 bg-black backdrop-blur">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-300">
                              Are you sure you want to delete UID <span className="font-mono text-white">{uid.uid}</span>? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">
                              Delete UID
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
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
