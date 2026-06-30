import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Gauge, 
  ShieldAlert, 
  Wrench, 
  Lightbulb, 
  Target, 
  ThumbsUp, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  MapPin, 
  Layers, 
  Activity,
  CheckCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { AIPrediction, CommunityInsightsReport, User } from "../types";

interface AICommunityInsightsProps {
  currentUser: User;
  language: 'en' | 'hi';
}

export default function AICommunityInsights({ currentUser, language }: AICommunityInsightsProps) {
  const [report, setReport] = useState<CommunityInsightsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchInsights = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const res = await fetch("/api/ai/community-insights");
      if (!res.ok) throw new Error("Failed to load community insights");
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading insights");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleVote = async (predictionId: string) => {
    if (!report) return;

    // Optimistically update the UI
    const updatedPredictions = report.predictions.map(p => {
      if (p.id === predictionId) {
        const hasVoted = p.userVoted;
        return {
          ...p,
          userVoted: !hasVoted,
          votesCount: (p.votesCount || 0) + (hasVoted ? -1 : 1)
        };
      }
      return p;
    });
    setReport({ ...report, predictions: updatedPredictions });

    try {
      const res = await fetch("/api/ai/community-insights/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: predictionId })
      });
      if (!res.ok) throw new Error("Failed to register vote");
    } catch (err) {
      // Revert optimism if error
      fetchInsights();
    }
  };

  const handleGenerateWorkOrder = async (predictionId: string) => {
    try {
      const res = await fetch("/api/ai/community-insights/work-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: predictionId,
          userId: currentUser.id,
          userName: currentUser.name
        })
      });
      if (!res.ok) throw new Error("Failed to trigger work order");
      const data = await res.json();
      
      // Update local predictions array
      if (report) {
        const updated = report.predictions.map(p => {
          if (p.id === predictionId) {
            return { ...p, workOrderGenerated: true };
          }
          return p;
        });
        setReport({ ...report, predictions: updated });
      }

      setSuccessMessage(`Preemptive Work Order created successfully! A civic task [ID: ${data.issue?.id}] has been logged in the portal.`);
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err: any) {
      alert(err.message || "Could not generate work order.");
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <Brain className="w-6 h-6 text-emerald-500 absolute top-3 left-3 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {language === 'en' ? 'Initializing AI Community Insights Model...' : 'AI कम्युनिटी इनसाइट्स मॉडल शुरू हो रहा है...'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
            Analyzing historical frequency, spatial clusters, and regional saturation indicators...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-3xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <div>
          <h3 className="font-bold text-slate-900 dark:text-red-400">Error Loading Predictive Insights</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</p>
        </div>
        <button 
          onClick={() => fetchInsights()}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // Filter logic
  const filteredPredictions = report?.predictions.filter(p => {
    const matchesCategory = activeCategory === "All" || p.category.toLowerCase().includes(activeCategory.toLowerCase()) || activeCategory.toLowerCase().includes(p.category.toLowerCase());
    const matchesConfidence = p.confidence >= minConfidence;
    return matchesCategory && matchesConfidence;
  }) || [];

  const categories = ["All", "Water Leakage", "Road Damage", "Garbage", "Streetlight Failure"];

  return (
    <div className="space-y-6">
      
      {/* 1. FUTURISTIC HERO BANNER */}
      <div className="bg-[#131315] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-slate-800/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white rounded-2xl shadow-lg shadow-emerald-950/40">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                  {language === 'en' ? 'AI Community Insights' : 'AI कम्युनिटी इनसाइट्स'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight mt-1">
                  AI Predictive Insights
                </h2>
              </div>
            </div>
            
            <button
              onClick={() => fetchInsights(true)}
              disabled={isRefreshing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Recalculating...' : 'Refresh Engine'}</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
            {report?.summary || "Analyzing community issue densities, meteorological variables, and valve stress indices using deep learning synthesis to predict next-week local civic breakdowns."}
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/60 mt-2">
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Engine Status: <strong className="text-emerald-400 font-extrabold">Active (Gemini 3.5)</strong></span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Model Reference Date: <strong className="text-slate-300">{report?.generationDate ? new Date(report.generationDate).toLocaleDateString() : 'N/A'}</strong></span>
            </span>
            <span className="flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Predictions Generated: <strong className="text-slate-300">{report?.predictions.length || 0} Clusters</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. PERSISTENT SUCCESS BANNER */}
      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-3 text-emerald-800 dark:text-emerald-400"
        >
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-bold block">Preemptive Action Logged</strong>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </motion.div>
      )}

      {/* 3. FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                activeCategory === cat
                  ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
                  : "bg-transparent border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {cat === "All" ? (language === 'en' ? 'All Categories' : 'सभी श्रेणियां') : cat}
            </button>
          ))}
        </div>

        {/* Confidence threshold slider */}
        <div className="flex items-center space-x-3 min-w-[200px]">
          <span className="text-xs text-slate-500 font-bold shrink-0">Min Confidence:</span>
          <input 
            type="range" 
            min="0" 
            max="90" 
            step="10" 
            value={minConfidence} 
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none dark:bg-slate-800"
          />
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 w-8 text-right">
            {minConfidence}%+
          </span>
        </div>
      </div>

      {/* 4. PREDICTIONS LIST GRID */}
      {filteredPredictions.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No predictions match current filters</p>
          <p className="text-xs text-slate-500">Try choosing a different category or lowering the minimum confidence percentage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPredictions.map((prediction, index) => {
            const hasCriticalRisk = prediction.confidence >= 85;
            
            return (
              <motion.div
                key={prediction.id || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white dark:bg-[#18181a] border rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  hasCriticalRisk 
                    ? "border-red-200/60 dark:border-red-950/30 hover:shadow-red-500/5 hover:border-red-400" 
                    : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Prediction Header */}
                <div className="p-5 sm:p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono border px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                      prediction.category.includes('Water') ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40' :
                      prediction.category.includes('Road') || prediction.category.includes('Pothole') ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40' :
                      prediction.category.includes('Garbage') ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40' :
                      'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                    }`}>
                      {prediction.category}
                    </span>

                    <span className="flex items-center space-x-1 text-[11px] font-bold text-slate-500 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prediction.wardOrZone}</span>
                    </span>
                  </div>

                  {/* Prediction Title with Alert icon */}
                  <div className="flex items-start space-x-2.5">
                    <span className="mt-1 shrink-0">
                      {hasCriticalRisk ? (
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                      {prediction.title}
                    </h3>
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Gauge className="w-3.5 h-3.5" />
                        <span>Confidence Level</span>
                      </span>
                      <span className={`font-mono ${hasCriticalRisk ? 'text-red-500 dark:text-red-400' : 'text-emerald-500'}`}>
                        {prediction.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          hasCriticalRisk 
                            ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-sm" 
                            : "bg-gradient-to-r from-emerald-500 to-teal-500"
                        }`}
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-3.5">
                    
                    {/* Reason */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider font-mono">
                        Reason & Data Correlation
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {prediction.reason}
                      </p>
                    </div>

                    {/* Suggested Action */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-1">
                      <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider font-mono flex items-center space-x-1">
                        <Wrench className="w-3 h-3" />
                        <span>Suggested Action</span>
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {prediction.suggestedAction}
                      </p>
                    </div>

                    {/* Expected Impact */}
                    <div className="space-y-1 bg-gradient-to-r from-emerald-500/5 to-transparent p-3.5 rounded-2xl border border-emerald-500/10">
                      <span className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-wider font-mono flex items-center space-x-1">
                        <Target className="w-3 h-3 text-emerald-500" />
                        <span>Expected Impact</span>
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {prediction.expectedImpact}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50 dark:bg-[#1a1a1c] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVote(prediction.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                      prediction.userVoted
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${prediction.userVoted ? 'fill-current' : ''}`} />
                    <span>
                      {prediction.userVoted ? 'Verified' : 'Verify Prediction'} ({prediction.votesCount || 0})
                    </span>
                  </button>

                  {/* Officer Work Order Button */}
                  {(currentUser.role === 'officer' || currentUser.role === 'admin') && (
                    <button
                      disabled={prediction.workOrderGenerated}
                      onClick={() => handleGenerateWorkOrder(prediction.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
                        prediction.workOrderGenerated
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-not-allowed"
                          : "bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>
                        {prediction.workOrderGenerated ? 'Preemptive Active' : 'Dispatch Preemptive Work Order'}
                      </span>
                    </button>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* 5. EDUCATIONAL BLOCK ON PREDICTIVE CIVIC PLANNING */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200 font-extrabold block">What is Preemptive Civic Action?</strong>
            <span>By leveraging historical reports, weather indexes, and community validation, Community Hero enables the civic board to dispatch crew to solve problems before they even affect residents.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
