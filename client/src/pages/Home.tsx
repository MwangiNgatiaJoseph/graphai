import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { BarChart3, Brain, Lock, Zap, ArrowRight, LogOut } from "lucide-react";

export default function Home() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold">GraphAI</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-slate-400">{user.name || user.email}</span>
                {user.role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/admin")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Admin Panel
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-6 mb-20">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Intelligent Graph Analysis
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Upload any graph or chart—including forex trading charts—and let AI analyze it instantly. Get technical insights, identify patterns, and ask unlimited questions powered by advanced vision technology.
          </p>

          {user ? (
            <Button
              size="lg"
              onClick={() => setLocation("/analyzer")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Analyzing <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {/* Feature 1 */}
          <Card className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Any Graph Type</h3>
            <p className="text-slate-400">
              Upload bar charts, line graphs, pie charts, heatmaps, forex candlestick charts, or any data visualization. Our AI understands them all.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-slate-400">
              Get instant analysis, trend identification, technical indicator recognition, and detailed explanations. Perfect for forex traders and data analysts.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unlimited Questions</h3>
            <p className="text-slate-400">
              Ask as many questions as you want. The AI maintains full context of your conversation throughout.
            </p>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold mb-2">Upload</h3>
              <p className="text-slate-400 text-sm">Upload your graph or chart image</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold mb-2">Analyze</h3>
              <p className="text-slate-400 text-sm">AI analyzes the graph instantly</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold mb-2">Ask</h3>
              <p className="text-slate-400 text-sm">Ask unlimited questions about the data</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                4
              </div>
              <h3 className="font-semibold mb-2">Understand</h3>
              <p className="text-slate-400 text-sm">Get detailed insights and explanations</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-slate-700 rounded-lg p-12">
          <h2 className="text-3xl font-bold">Ready to Analyze Your Graphs?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Start uploading your graphs and get instant AI-powered insights. No limits, no restrictions.
          </p>
          {user ? (
            <Button
              size="lg"
              onClick={() => setLocation("/analyzer")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Analyzer <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In to Start <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>GraphAI © 2026. Powered by advanced AI vision technology.</p>
        </div>
      </footer>
    </div>
  );
}
