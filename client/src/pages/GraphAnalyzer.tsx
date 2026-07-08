import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { skipToken } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Upload, Send, ArrowLeft, Loader2, X, Camera } from "lucide-react";
import { Streamdown } from "streamdown";
import CameraCapture from "@/components/CameraCapture";

export default function GraphAnalyzer() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState("image/png");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [messageInput, setMessageInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createSessionMutation = trpc.graphs.createSession.useMutation();
  const sendMessageMutation = trpc.graphs.sendMessage.useMutation();
  const listSessionsQuery = trpc.graphs.listSessions.useQuery();
  const getSessionQuery = trpc.graphs.getSession.useQuery(
    sessionId ? { sessionId } : skipToken,
    { enabled: !!sessionId }
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load session messages when fetched
  useEffect(() => {
    if (getSessionQuery.data?.messages && sessionId) {
      const loadedMessages = getSessionQuery.data.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      setMessages(loadedMessages);
    }
  }, [getSessionQuery.data?.messages, sessionId]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageBase64(base64);
      setImagePreview(base64);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleCreateSession = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!imageBase64) {
      toast.error("Please upload an image");
      return;
    }

    try {
      const result = await createSessionMutation.mutateAsync({
        title,
        description,
        imageBase64,
        imageMimeType,
      });

      setSessionId(result.sessionId);
      setMessages([]);
      toast.success("Graph session created successfully");
    } catch (error) {
      toast.error("Failed to create session");
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !sessionId) return;

    const userMessage = messageInput;
    setMessageInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const result = await sendMessageMutation.mutateAsync({
        sessionId,
        message: userMessage,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: result.aiMessage }]);
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleNewSession = () => {
    setSessionId(null);
    setTitle("");
    setDescription("");
    setImageBase64(null);
    setImagePreview(null);
    setMessages([]);
    setMessageInput("");
  };

  const handleLoadSession = (id: number) => {
    setSessionId(id);
  };

  // Upload phase
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        {/* Sidebar - Previous Sessions */}
        <div className="w-64 border-r border-slate-700 bg-slate-800 p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Previous Sessions</h3>
          {listSessionsQuery.isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner className="w-4 h-4" />
            </div>
          ) : listSessionsQuery.data && listSessionsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {listSessionsQuery.data.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleLoadSession(session.id)}
                  className="w-full text-left p-2 rounded text-sm text-slate-300 hover:bg-slate-700 transition-colors truncate"
                  title={session.title}
                >
                  {session.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No previous sessions</p>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-2">GraphAI</h1>
              <p className="text-slate-400">Upload your graph and start analyzing</p>
            </div>

            <Card className="bg-slate-800 border-slate-700 p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Graph Title
                  </label>
                  <Input
                    placeholder="e.g., Q3 Sales Performance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    placeholder="Add context about this graph..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Upload Graph Image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full rounded-lg border border-slate-600 max-h-96 object-contain"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview(null);
                          setImageBase64(null);
                        }}
                        className="absolute top-2 right-2 bg-slate-700 border-slate-600 hover:bg-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`w-full border-2 border-dashed rounded-lg p-8 transition-colors ${
                        dragActive
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-300 font-medium">
                        {dragActive ? "Drop your image here" : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-slate-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                      </button>
                      <Button
                        onClick={() => setShowCamera(true)}
                        variant="outline"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture with Camera
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCreateSession}
                  disabled={createSessionMutation.isPending || !title.trim() || !imageBase64}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
                >
                  {createSessionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Session...
                    </>
                  ) : (
                    "Start Analysis"
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
        {/* Camera Capture Modal */}
        {showCamera && (
          <CameraCapture
            onCapture={(base64, mimeType) => {
              setImageBase64(base64);
              setImagePreview(base64);
              setImageMimeType(mimeType);
              setShowCamera(false);
              toast.success("Photo captured successfully!");
            }}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>
    );
  }

  // Chat phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {getSessionQuery.data?.session?.title || "Loading..."}
            </h1>
            <p className="text-sm text-slate-400">
              {getSessionQuery.data?.session?.description || "Graph Analysis Session"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewSession}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="max-w-4xl mx-auto w-full space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">
                    Ask me anything about your graph. I can analyze trends, interpret data, and answer questions.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-2xl rounded-lg p-4 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-100 rounded-lg p-4">
                    <Spinner className="w-5 h-5" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-700 p-4 bg-slate-800">
            <div className="max-w-4xl mx-auto flex gap-2">
              <Textarea
                placeholder="Ask a question about the graph..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSendMessage();
                  }
                }}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-80 border-l border-slate-700 bg-slate-800 p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Graph Image</h3>
          {getSessionQuery.data?.session?.imageUrl && (
            <img
              src={getSessionQuery.data.session.imageUrl}
              alt="Graph"
              className="w-full rounded-lg border border-slate-600"
            />
          )}
        </div>
      </div>
    </div>
  );
}
