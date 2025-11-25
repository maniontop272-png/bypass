import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, LogOut, RefreshCw, Zap, Clock, CheckCircle, XCircle } from "lucide-react";

interface UIDEntry {
  uid: string;
  expiry: number;
  status: string;
  remainingHours: number;
  expiryDate: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uids, setUids] = useState<UIDEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUid, setNewUid] = useState("");
  const [newHours, setNewHours] = useState("24");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteUid, setDeleteUid] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) setLocation("/login");
    loadUIDs();
    loadStats();
  }, [token, setLocation]);

  const loadUIDs = async () => {
    try {
      const res = await fetch("/api/uids", {
        headers: { Authorization: `Bearer ${token}` },
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

  const loadStats = async () => {
    try {
      const res = await fetch("/api/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Stats error:", error);
    }
  };

  const handleAddUID = async () => {
    if (!newUid.trim()) {
      toast({ title: "Error", description: "Please enter a UID", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/uids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: newUid, hours: parseInt(newHours) }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add UID");
      }

      toast({ title: "Success", description: `UID ${newUid} added successfully` });
      setNewUid("");
      setNewHours("24");
      loadUIDs();
      loadStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUID = async () => {
    if (!deleteUid) return;

    try {
      const res = await fetch(`/api/uids/${deleteUid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete UID");

      toast({ title: "Success", description: `UID ${deleteUid} deleted` });
      setDeleteUid(null);
      loadUIDs();
      loadStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setLocation("/login");
  };

  const handleRefresh = () => {
    loadUIDs();
    loadStats();
  };

  const handleCleanup = async () => {
    try {
      const res = await fetch("/api/cleanup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to cleanup");
      const data = await res.json();
      toast({ title: "Success", description: `Removed ${data.deletedCount} expired UID(s)` });
      loadUIDs();
      loadStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Animated background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40 animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">UID Whitelist Manager</h1>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur hover:shadow-white/10 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Total UIDs</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-gradient-to-br from-green-900/20 to-black/50 backdrop-blur hover:shadow-green-500/10 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-green-400">Active</p>
                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-gradient-to-br from-red-900/20 to-black/50 backdrop-blur hover:shadow-red-500/10 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-red-400">Expired</p>
                <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add UID Form */}
        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Add New UID</CardTitle>
            <CardDescription>Create a new UID with expiry duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter UID (e.g., 123456789)"
                value={newUid}
                onChange={(e) => setNewUid(e.target.value)}
                className="bg-gray-950/80 border-white/20 text-white placeholder:text-gray-600 focus:border-white/50"
                disabled={isAdding}
                data-testid="input-uid"
              />
              <Input
                type="number"
                placeholder="Hours"
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
                className="w-24 bg-gray-950/80 border-white/20 text-white focus:border-white/50"
                disabled={isAdding}
                data-testid="input-hours"
              />
              <Button
                onClick={handleAddUID}
                disabled={isAdding}
                className="bg-gradient-to-r from-white to-gray-300 text-black hover:from-gray-100 hover:to-gray-200 font-semibold shadow-lg shadow-white/20"
                data-testid="button-add-uid"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAdding ? "Adding..." : "Add UID"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* UIDs List */}
        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">UIDs</CardTitle>
              <CardDescription>Manage your whitelisted UIDs</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleCleanup}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-cleanup"
              >
                <Zap className="w-4 h-4" />
                Cleanup
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading UIDs...</p>
              </div>
            ) : uids.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No UIDs yet. Add one to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uids.map((uid) => (
                  <div
                    key={uid.uid}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-gray-950/50 hover:border-white/30 hover:bg-gray-900/50 transition-all duration-300 group"
                    data-testid={`uid-row-${uid.uid}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-mono text-white">{uid.uid}</p>
                        <Badge
                          className={
                            uid.status === "active"
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : "bg-red-500/20 text-red-300 border-red-500/30"
                          }
                          variant="outline"
                        >
                          {uid.status === "active" ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Expired
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {uid.remainingHours > 0 ? `${uid.remainingHours}h remaining` : "Expired"}
                      </p>
                    </div>
                    <div className="text-right space-y-1 mr-4">
                      <p className="text-xs text-gray-500 font-mono">{new Date(uid.expiryDate).toLocaleString()}</p>
                    </div>
                    <Button
                      onClick={() => setDeleteUid(uid.uid)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      data-testid={`button-delete-${uid.uid}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteUid !== null} onOpenChange={(open) => !open && setDeleteUid(null)}>
        <AlertDialogContent className="border-white/20 bg-black backdrop-blur">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete UID</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete UID <span className="font-mono text-white">{deleteUid}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUID}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
