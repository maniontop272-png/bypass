import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      <div className="text-center relative z-10 space-y-6">
        <div className="inline-flex p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">404</h1>
        <p className="text-xl text-gray-300">Page Not Found</p>
        <p className="text-gray-400 max-w-md">The page you're looking for doesn't exist or has been moved.</p>

        <Button
          onClick={() => setLocation("/dashboard")}
          className="bg-gradient-to-r from-white to-gray-300 text-black hover:from-gray-100 hover:to-gray-200 font-semibold shadow-lg shadow-white/20"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
