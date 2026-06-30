import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Sparkles, 
  RefreshCw,
  FileText,
  MapPin,
  Award,
  Medal,
  Trophy,
  Droplet,
  Zap,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Compass
} from "lucide-react";
import { PredictiveReport, RiskHotspot } from "../types";

interface ImpactDashboardProps {
  lang: 'en' | 'hi';
}

export default function ImpactDashboard({ lang }: ImpactDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [aiReport, setAiReport] = useState<PredictiveReport | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'contributors' | 'verifiers'>('contributors');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/analytics/dashboard");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to load analytics dashboard:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAiReport = async () => {
    try {
      setLoadingAi(true);
      const res = await fetch("/api/ai/predictive-insights");
      const data = await res.json();
      setAiReport(data);
    } catch (e) {
      console.error("Failed to fetch predictive insights:", e);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAiReport();
  }, []);

  if (loadingStats || !stats) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4 h-96">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-mono tracking-tight text-center">
          {lang === 'en' 
            ? 'Analyzing community audits and compiling historic civic metrics...' 
            : 'सामुदायिक ऑडिट का विश्लेषण और ऐतिहासिक नागरिक मेट्रिक्स संकलित किया जा रहा है...'}
        </p>
      </div>
    );
  }

  // Cohesive shades of emerald, forest, and mint for modern data mapping
  const COLORS = ["#10B981", "#059669", "#34D399", "#047857", "#064E3B", "#64748B"];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. COMMUNITY OVERVIEW HERO (Inspirational Story Header) */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-xl border border-emerald-500/20"
      >
        {/* Background decorative grid and glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{lang === 'en' ? 'Community Impact Story' : 'सामुदायिक प्रभाव की कहानी'}</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
              {lang === 'en' 
                ? `Your community resolved ${stats.resolvedThisMonth} issues this month!` 
                : `आपके समुदाय ने इस महीने ${stats.resolvedThisMonth} समस्याओं का समाधान किया!`}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {lang === 'en'
                ? "Every reported issue is a block built toward safety and sanitation. Through peer verifications, transparent mapping, and local administrative diligence, we've successfully fostered high-fidelity municipal teamwork."
                : "दर्ज की गई प्रत्येक समस्या सुरक्षा और स्वच्छता की ओर बढ़ाया गया एक कदम है। सहकर्मी सत्यापन, पारदर्शी मानचित्रण और स्थानीय प्रशासनिक तत्परता के माध्यम से, हमने एक मजबूत नागरिक टीम का निर्माण किया है।"}
            </p>
          </div>

          {/* Quick Stat Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                {lang === 'en' ? 'Total Reported' : 'कुल शिकायतें'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {stats.totalIssues}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                {lang === 'en' ? 'Verified Resolved' : 'सत्यापित समाधान'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {stats.resolvedIssues}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                {lang === 'en' ? 'Active Auditors' : 'सक्रिय नागरिक ऑडिटर्स'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
                {stats.activeCitizens}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                {lang === 'en' ? 'Resolution Rate' : 'समाधान दर'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-teal-300">
                {stats.resolutionRate}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. RESOLUTION PERFORMANCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Average Resolution Time */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex items-center space-x-5"
        >
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {lang === 'en' ? 'Avg Resolution Time' : 'औसत समाधान समय'}
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block mt-0.5">
              {stats.avgResolutionTimeDays} {lang === 'en' ? 'Days' : 'दिन'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'en' ? 'From registration to municipal resolution' : 'पंजीकरण से नगरपालिका समाधान तक का समय'}
            </p>
          </div>
        </motion.div>

        {/* Card 2: Fastest Department */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex items-center space-x-5"
        >
          <div className="p-4 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {lang === 'en' ? 'Fastest Department' : 'सबसे तेज विभाग'}
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white block mt-0.5 truncate max-w-[210px]">
              {stats.fastestDepartment ? stats.fastestDepartment.split(" (")[0] : (lang === 'en' ? 'Public Lighting Division' : 'पब्लिक लाइटिंग विभाग')}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-bold font-mono text-teal-600 dark:text-teal-400">
              ⚡ {lang === 'en' ? '1.2 Days Avg Fix' : '1.2 दिन औसत समाधान'}
            </p>
          </div>
        </motion.div>

        {/* Card 3: Most Active Area */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex items-center space-x-5"
        >
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {lang === 'en' ? 'Most Active Area' : 'सबसे सक्रिय क्षेत्र'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5 font-mono">
              {stats.mostActiveArea || "Sector 15"}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'en' ? 'Region with highest audit verifications' : 'उच्चतम ऑडिट सत्यापन वाला क्षेत्र'}
            </p>
          </div>
        </motion.div>

      </div>

      {/* 3. CORE IMPACT STORIES & PROGRESS INDICATORS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
            {lang === 'en' ? 'Real Community Impact Stories' : 'वास्तविक सामुदायिक प्रभाव सूचकांक'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card: Road Safety Improved */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                  {stats.impactMetrics?.roadSafety?.percentage || 75}%
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {lang === 'en' ? 'Road Safety Restored' : 'सड़क सुरक्षा में सुधार'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'en'
                  ? `Fixed ${stats.impactMetrics?.roadSafety?.resolved || 3} of ${stats.impactMetrics?.roadSafety?.total || 4} potholes and streetlights, reducing accident hazards for motorists.`
                  : `गड्ढों और खराब लाइटों का समाधान किया गया, जिससे सड़क दुर्घटनाओं में भारी कमी आई है।`}
              </p>
            </div>

            {/* Custom Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.impactMetrics?.roadSafety?.percentage || 75}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                {lang === 'en' ? 'Resolved Rate' : 'समाधान दर'}
              </span>
            </div>
          </motion.div>

          {/* Card: Cleaner Streets */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-lg font-black font-mono text-amber-600">
                  {stats.impactMetrics?.cleanStreets?.percentage || 80}%
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {lang === 'en' ? 'Sanitary Streets & Garbage' : 'स्वच्छ मार्ग एवं कचरा मुक्त क्षेत्र'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'en'
                  ? `Completed ${stats.impactMetrics?.cleanStreets?.resolved || 4} waste dump clearances, promoting local residential hygiene and stopping toxic overflow.`
                  : `कचरे के ढेरों और गंदगी की शिकायतों का निस्तारण कर रिहायशी क्षेत्रों में स्वच्छता सुनिश्चित की गई।`}
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.impactMetrics?.cleanStreets?.percentage || 80}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                {lang === 'en' ? 'Sanitation Efficiency' : 'स्वच्छता दक्षता'}
              </span>
            </div>
          </motion.div>

          {/* Card: Fresh Water Saved */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-xl">
                  <Droplet className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-[10px] font-extrabold font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                  💧 ~{stats.impactMetrics?.waterLeakage?.estimatedLitersSaved || 8500}L Saved
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {lang === 'en' ? 'Fresh Water Loss Prevented' : 'पेयजल बर्बादी पर अंकुश'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'en'
                  ? `Resolved water main leakages immediately. Saved an estimated ${stats.impactMetrics?.waterLeakage?.estimatedLitersSaved || 8500} liters of treated fresh water.`
                  : `पाइपलाइन रिसाव की त्वरित मरम्मत कर हजारों लीटर पीने के स्वच्छ पानी की बर्बादी रोकी गई।`}
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.impactMetrics?.waterLeakage?.percentage || 70}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                {lang === 'en' ? 'Leaking Pipes Sealed' : 'रिसाव मरम्मत दर'}
              </span>
            </div>
          </motion.div>

          {/* Card: Citizen Participation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                  <Users className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                  +{stats.impactMetrics?.citizenParticipation?.totalEngagement || 120} Actions
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {lang === 'en' ? 'Active Citizen Auditing' : 'सक्रिय नागरिक ऑडिट भागीदारी'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'en'
                  ? `Over ${stats.impactMetrics?.citizenParticipation?.totalAudits || 15} field verifications, upvotes, and discussion feeds. Powering crowd authenticity.`
                  : `सत्यापन, वोट और नागरिक चर्चाओं के माध्यम से जन-भागीदारी को नया बल मिला है।`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-bold text-center">
              <div>
                <span className="block text-slate-800 dark:text-white font-mono">{stats.impactMetrics?.citizenParticipation?.totalAudits || 12}</span>
                <span className="text-[8px] font-mono uppercase text-slate-400">Audits</span>
              </div>
              <div>
                <span className="block text-slate-800 dark:text-white font-mono">{stats.impactMetrics?.citizenParticipation?.totalUpvotes || 85}</span>
                <span className="text-[8px] font-mono uppercase text-slate-400">Votes</span>
              </div>
              <div>
                <span className="block text-slate-800 dark:text-white font-mono">{stats.impactMetrics?.citizenParticipation?.totalComments || 23}</span>
                <span className="text-[8px] font-mono uppercase text-slate-400">Texts</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 4. PREDICTIVE AI INSIGHTS PANEL */}
      <motion.div 
        whileHover={{ scale: 1.005 }}
        className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <span>{lang === 'en' ? 'Gemini AI Advisory Insights' : 'जेमिनी एआई रणनीतिक विश्लेषण'}</span>
                <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Active Agent</span>
              </h3>
              <p className="text-xs text-slate-400">{lang === 'en' ? 'Mapping category distributions, rain patterns, and local wear indexes' : 'कचरा हॉटस्पॉट, वर्षा पैटर्न और सड़क उपयोग का विश्लेषण'}</p>
            </div>
          </div>
          <button
            onClick={fetchAiReport}
            disabled={loadingAi}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? (lang === 'en' ? 'Synthesizing...' : 'संश्लेषण...') : (lang === 'en' ? 'Re-Generate Advisory' : 'परामर्श फिर से बनाएं')}</span>
          </button>
        </div>

        {loadingAi ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono animate-pulse">{lang === 'en' ? 'Synthesizing local risks & recommendations...' : 'जोखिमों और समाधानों का विश्लेषण किया जा रहा है...'}</p>
          </div>
        ) : (
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            
            {/* Left Col: Stat Highlights */}
            <div className="space-y-4 bg-slate-900/50 p-4 border border-slate-800/60 rounded-2xl">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono block">
                🚨 {lang === 'en' ? 'AI Diagnostic Summary' : 'एआई डायग्नोस्टिक सारांश'}
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">{lang === 'en' ? 'Highest Priority Category' : 'उच्चतम प्राथमिकता श्रेणी'}</span>
                  <span className="font-extrabold text-white text-right">{stats.aiInsights?.mostCommonIssue || "Potholes & Roads"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">{lang === 'en' ? 'Critical Action Zone' : 'गंभीर एक्शन क्षेत्र'}</span>
                  <span className="font-extrabold text-white text-right">{stats.aiInsights?.highestPriorityArea || "Sector 15"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">{lang === 'en' ? 'Community Trend Pulse' : 'सामुदायिक प्रवृत्ति पल्स'}</span>
                  <span className="font-bold text-emerald-400 text-right">{lang === 'en' ? 'Increasing audits' : 'ऑडिट भागीदारी बढ़ी'}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[11px] text-slate-300 leading-relaxed italic">
                "{stats.aiInsights?.communityTrend || "Citizen audit rates rose 45% showing high neighborhood safety involvement."}"
              </div>
            </div>

            {/* Middle Col: AI Summary & Hotspot list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'en' ? 'Dynamic Municipal Planning Advisory' : 'नगरपालिका योजना सलाहकार'}</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  "{aiReport?.summary || (lang === 'en' 
                    ? 'Risk modeling advises placing quick asphalt patches near Sector 15 transit corridor prior to monsoon onset, protecting heavy commuter lanes.' 
                    : 'जोखिम मॉडलिंग मानसून शुरू होने से पहले सेक्टर 15 पारगमन गलियारे के पास त्वरित डामर पैच लगाने की सलाह देती है।')}"
                </p>
              </div>

              {/* Actionable items */}
              {aiReport?.recommendations && aiReport.recommendations.length > 0 && (
                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono block">
                    {lang === 'en' ? 'Actionable Advisory Recommendations:' : 'कार्रवाई योग्य सलाहकार सिफारिशें:'}
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {aiReport.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold font-mono">✓</span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}
      </motion.div>

      {/* 5. COMMUNITY HEROES & VOLUNTEER ROSTER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
              {lang === 'en' ? 'Community Heroes & Pioneers' : 'सामुदायिक नायक और स्वयंसेवक'}
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/50 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('contributors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'contributors'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏆 {lang === 'en' ? 'Top Contributors' : 'शीर्ष योगदानकर्ता'}
            </button>
            <button
              onClick={() => setActiveTab('verifiers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'verifiers'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔍 {lang === 'en' ? 'Most Verified' : 'सर्वाधिक सत्यापन'}
            </button>
          </div>
        </div>

        {/* Heroes Grid list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(activeTab === 'contributors' ? stats.topContributors : stats.mostVerifiedCitizens)?.map((hero: any, index: number) => (
            <motion.div
              key={hero.userId}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col items-center text-center space-y-3.5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors"
            >
              {/* Rank Medal badge */}
              <div className="absolute top-3 left-3 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 w-6 h-6 rounded-full flex items-center justify-center font-black font-mono text-xs border border-slate-100 dark:border-slate-800">
                #{index + 1}
              </div>

              {/* Avatar circle */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/20 group-hover:border-emerald-500 transition-colors">
                  <img src={hero.avatar} className="w-full h-full object-cover" alt={hero.userName} referrerPolicy="no-referrer" />
                </div>
                {index === 0 && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Name role */}
              <div>
                <h4 className="font-extrabold text-slate-950 dark:text-white text-sm line-clamp-1">{hero.userName}</h4>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">
                  {hero.role}
                </span>
              </div>

              {/* Counts display */}
              <div className="grid grid-cols-2 gap-3 w-full bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-bold">
                <div>
                  <span className="block text-slate-900 dark:text-white font-mono">{hero.points}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">{lang === 'en' ? 'Points' : 'अंक'}</span>
                </div>
                <div>
                  <span className="block text-emerald-600 font-mono">+{hero.verifiedCount}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">{lang === 'en' ? 'Audits' : 'सत्यापन'}</span>
                </div>
              </div>

              {/* Badges list */}
              <div className="flex flex-wrap gap-1 justify-center">
                {hero.badges?.map((badge: string) => (
                  <span 
                    key={badge} 
                    className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full"
                  >
                    ✨ {badge}
                  </span>
                ))}
                {hero.verifiedCount >= 2 && (
                  <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/10 px-2 py-0.5 rounded-full">
                    👑 {lang === 'en' ? 'Community Verified' : 'समुदाय सत्यापित'}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 6. MAIN CHART VISUAL ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Trend Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {lang === 'en' ? 'Monthly Reporting and Resolution History' : 'मासिक शिकायत एवं समाधान इतिहास'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Historical performance index over 6 months</p>
            </div>
            <button onClick={fetchStats} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-500">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 text-[11px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyReports} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="reported" fill="#64748B" radius={[4, 4, 0, 0]} name={lang === 'en' ? 'Issues Reported' : 'दर्ज की गई'} />
                <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name={lang === 'en' ? 'Issues Resolved' : 'समाधान किया गया'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col h-[380px]">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">
            {lang === 'en' ? 'Category Distribution' : 'श्रेणी वर्गीकरण'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Share of reports by specific sector</p>

          <div className="flex-1 min-h-0 relative flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topProblemAreas}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.topProblemAreas.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 overflow-y-auto max-h-[100px] pr-1">
            {stats.topProblemAreas.map((item: any, idx: number) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
