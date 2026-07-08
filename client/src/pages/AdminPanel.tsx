import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { skipToken } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ArrowLeft, Search, Eye } from "lucide-react";
import { Streamdown } from "streamdown";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const getAllSessionsQuery = trpc.admin.getAllSessions.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const getSessionDetailQuery = trpc.admin.getSessionDetail.useQuery(
    selectedSessionId ? { sessionId: selectedSessionId } : skipToken,
    { enabled: !!selectedSessionId && !!user && user.role === "admin" }
  );

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      toast.error("Access denied. Admin only.");
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const filteredSessions = getAllSessionsQuery.data?.filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-slate-400">Manage all graph analysis sessions</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 p-4 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-4">Sessions</h2>

              {/* Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {getAllSessionsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-5 h-5" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No sessions found</p>
                ) : (
                  filteredSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSessionId === session.id
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      }`}
                    >
                      <p className="font-medium truncate">{session.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  Total Sessions: <span className="text-white font-semibold">{filteredSessions.length}</span>
                </p>
              </div>
            </Card>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            {selectedSessionId ? (
              getSessionDetailQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="w-8 h-8" />
                </div>
              ) : getSessionDetailQuery.data ? (
                <div className="space-y-6">
                  {/* Session Info */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Session Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-400">Title</p>
                        <p className="text-white font-medium">{getSessionDetailQuery.data.session.title}</p>
                      </div>
                      {getSessionDetailQuery.data.session.description && (
                        <div>
                          <p className="text-sm text-slate-400">Description</p>
                          <p className="text-slate-200">{getSessionDetailQuery.data.session.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-slate-400">Created</p>
                        <p className="text-slate-200">
                          {new Date(getSessionDetailQuery.data.session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Messages</p>
                        <p className="text-slate-200">{getSessionDetailQuery.data.messages.length}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Graph Image */}
                  {getSessionDetailQuery.data.session.imageUrl && (
                    <Card className="bg-slate-800 border-slate-700 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Graph Image</h3>
                      <img
                        src={getSessionDetailQuery.data.session.imageUrl}
                        alt="Graph"
                        className="w-full rounded-lg border border-slate-600 max-h-96 object-contain"
                      />
                    </Card>
                  )}

                  {/* Conversation */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Conversation</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {getSessionDetailQuery.data.messages.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No messages yet</p>
                      ) : (
                        getSessionDetailQuery.data.messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-700 text-slate-100"
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {msg.role === "user" ? "User" : "AI"}
                            </p>
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <p className="text-slate-400">Failed to load session details</p>
              )
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-12 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a session to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
