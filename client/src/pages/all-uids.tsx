import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UIDEntry {
  uid: string;
  expiry: number;
  status: string;
  remainingHours: number;
  expiryDate: string;
}

export default function AllUIDs() {
  const { toast } = useToast();
  const [uids, setUids] = useState<UIDEntry[]>([]);
  const [filteredUids, setFilteredUids] = useState<UIDEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  useEffect(() => {
    loadUIDs();
  }, []);

  useEffect(() => {
    setFilteredUids(uids.filter(uid => uid.uid.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [searchQuery, uids]);

  const loadUIDs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/uids", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load UIDs");
      const data = await res.json();
      setUids(data);

      const statsRes = await fetch("/api/stats", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white">All UIDs</h1>
          <p className="text-gray-400 mt-2">View all whitelisted UIDs in the system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
            <CardContent className="pt-6">
              <p className="text-gray-400 text-sm">Total UIDs</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-white/20 bg-gradient-to-br from-green-900/20 to-black/50 backdrop-blur">
            <CardContent className="pt-6">
              <p className="text-green-400 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="border-white/20 bg-gradient-to-br from-red-900/20 to-black/50 backdrop-blur">
            <CardContent className="pt-6">
              <p className="text-red-400 text-sm">Expired</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{stats.expired}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                data-testid="input-search"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading UIDs...</div>
            ) : filteredUids.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {searchQuery ? "No UIDs match your search" : "No UIDs found"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUids.map((uid) => (
                  <div
                    key={uid.uid}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-gray-950/50 hover:border-white/30"
                    data-testid={`uid-row-${uid.uid}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-lg font-mono text-white">{uid.uid}</p>
                        <Badge className={uid.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"} variant="outline">
                          {uid.status === "active" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {uid.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {uid.remainingHours > 0 ? `${uid.remainingHours}h remaining` : "Expired"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-mono">{new Date(uid.expiryDate).toLocaleString()}</p>
                    </div>
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
