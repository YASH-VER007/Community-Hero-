/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import LandingPage from "./components/LandingPage";
import InteractiveMap from "./components/InteractiveMap";
import AIChatDrawer from "./components/AIChatDrawer";
import ImpactDashboard from "./components/ImpactDashboard";
import AICommunityInsights from "./components/AICommunityInsights";
import ReportIssueForm from "./components/ReportIssueForm";
import IssueDetailModal from "./components/IssueDetailModal";
import DeviceOnboardingTour from "./components/DeviceOnboardingTour";
import UserManagementAnalytics from "./components/UserManagementAnalytics";
import { User, Issue, UserRole, Notification, LeaderboardEntry } from "./types";
import { auth, syncUserProfile, logAnalyticsEvent } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { 
  PlusCircle, 
  Map, 
  BarChart2, 
  MessageSquare, 
  Award, 
  Shield, 
  User as UserIcon, 
  Bell, 
  Globe, 
  Trophy, 
  Compass, 
  Eye, 
  CheckSquare, 
  Users, 
  Sparkles,
  RefreshCw,
  Home,
  AlertTriangle,
  Flame,
  Search,
  CheckCircle,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Mail,
  Lock,
  X,
  Menu
} from "lucide-react";

// Define a helper to dynamically determine the initial user profile
const getInitialUser = (): User => {
  const isDev = 
    typeof window !== "undefined" && (
      window.location.hostname.includes("localhost") || 
      window.location.hostname.includes("127.0.0.1") || 
      window.location.href.includes("-dev-")
    );
  
  if (isDev) {
    return {
      id: "u-yash",
      email: "yashverma2123@gmail.com",
      name: "Yash Verma",
      role: "citizen",
      points: 450,
      badges: ["Community Hero", "Active Reporter"],
      joinedDate: "2026-01-10",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&h=120&q=80", // AI-generated smiling Indian man profile (Yash Verma)
      phone: "+91 98765 43210"
    };
  } else {
    return {
      id: "u-guest",
      email: "guest@community.org",
      name: "Guest Citizen",
      role: "citizen",
      points: 10,
      badges: ["Active Citizen"],
      joinedDate: "2026-06-26",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&h=120&q=80" // AI-generated smiling Indian man profile
    };
  }
};

export default function App() {
  // Application State
  const [activeTab, setActiveTab] = useState<"home" | "map" | "report" | "analytics" | "leaderboard" | "portal">("home");
  const [currentUser, setCurrentUser] = useState<User>(() => getInitialUser());

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  
  // Custom dropped coords for Quick Report transition
  const [droppedCoords, setDroppedCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // General controls
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [analyticsViewMode, setAnalyticsViewMode] = useState<'userManagement' | 'impact' | 'insights'>('insights');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);

  // Handle click-outside to close the notifications dropdown automatically
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (isNotificationOpen) {
        const desktopClickedInside = notificationRef.current && notificationRef.current.contains(target);
        const mobileClickedInside = mobileNotificationRef.current && mobileNotificationRef.current.contains(target);
        if (!desktopClickedInside && !mobileClickedInside) {
          setIsNotificationOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Firebase Auth & Modal state
  const [fbUser, setFbUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('register');
  const [mFullName, setMFullName] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mPassword, setMPassword] = useState("");
  const [mLoading, setMLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Listen to Firebase Auth state changes globally
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFbUser(user);
        const synced = await syncUserProfile(user);
        if (synced) {
          setCurrentUser(synced);
        }
      } else {
        setFbUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGlobalLogout = async () => {
    try {
      await signOut(auth);
      setFbUser(null);
      // Reset back to sandbox default safely
      setCurrentUser(getInitialUser());
    } catch (e) {
      console.error(e);
    }
  };

  const handleModalGoogleSignIn = async () => {
    try {
      setMLoading(true);
      setModalError("");
      setModalSuccess("");
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const synced = await syncUserProfile(result.user, result.user.displayName || "");
      if (synced) {
        setCurrentUser(synced);
        setModalSuccess("Google Account authenticated successfully!");
        logAnalyticsEvent(synced.id, "global_modal_google_login", { email: synced.email });
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1500);
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/operation-not-allowed") {
        setModalError("Google Sign-In is not enabled in Firebase Authentication Console.");
      } else {
        setModalError(e.message || "Google auth failed.");
      }
    } finally {
      setMLoading(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mEmail || !mPassword) {
      setModalError("Email and Password are required.");
      return;
    }
    if (authModalTab === "register" && !mFullName) {
      setModalError("Full name is required.");
      return;
    }
    if (mPassword.length < 6) {
      setModalError("Password should be at least 6 characters.");
      return;
    }

    try {
      setMLoading(true);
      setModalError("");
      setModalSuccess("");

      if (authModalTab === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, mEmail, mPassword);
        const synced = await syncUserProfile(userCredential.user, mFullName);
        if (synced) {
          setCurrentUser(synced);
          setModalSuccess("Account created and verified! Welcome!");
          setMFullName("");
          setMEmail("");
          setMPassword("");
          logAnalyticsEvent(synced.id, "global_modal_register", { email: synced.email });
          setTimeout(() => {
            setIsAuthModalOpen(false);
          }, 1500);
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, mEmail, mPassword);
        const synced = await syncUserProfile(userCredential.user);
        if (synced) {
          setCurrentUser(synced);
          setModalSuccess("Logged in successfully!");
          setMEmail("");
          setMPassword("");
          logAnalyticsEvent(synced.id, "global_modal_login", { email: synced.email });
          setTimeout(() => {
            setIsAuthModalOpen(false);
          }, 1500);
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/operation-not-allowed") {
        setModalError("Email/Password provider is not enabled in Firebase Console.");
      } else if (e.code === "auth/weak-password") {
        setModalError("Password is too weak. Firebase requires passwords to be at least 6 characters.");
      } else {
        setModalError(e.message || "Authentication failed. Check credentials.");
      }
    } finally {
      setMLoading(false);
    }
  };

  // Fetch helper with exponential backoff / retry to gracefully handle server boot time
  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 1500): Promise<Response> => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res;
    } catch (e) {
      if (retries > 0) {
        console.warn(`Fetch to ${url} failed. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw e;
    }
  };

  // Fetch functions
  const fetchIssues = async (retries = 3) => {
    try {
      setLoadingIssues(true);
      setIssuesError(null);
      const res = await fetchWithRetry("/api/issues", undefined, retries);
      const data = await res.json();
      setIssues(data);

      // Keep detail open refreshed if synchronized
      if (selectedIssue) {
        const updated = data.find((i: Issue) => i.id === selectedIssue.id);
        if (updated) setSelectedIssue(updated);
      }
    } catch (e: any) {
      console.error("Failed to load issues from server:", e);
      setIssuesError(e.message || String(e));
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetchWithRetry(`/api/notifications/${currentUser.id}`, undefined, 2);
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetchWithRetry("/api/gamification/leaderboard", undefined, 2);
      const data = await res.json();
      setLeaderboard(data);
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    }
  };

  // Sync profile data (especially points/badges changes)
  const syncProfile = async () => {
    try {
      const res = await fetchWithRetry("/api/gamification/leaderboard", undefined, 2);
      const data = await res.json();
      const updatedUser = data.find((u: any) => u.userId === currentUser.id);
      if (updatedUser) {
        setCurrentUser(prev => ({
          ...prev,
          points: updatedUser.points,
          badges: prev.badges // preserve custom list
        }));
      }
    } catch (e) {
      console.error("Failed to sync profile:", e);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchNotifications();
    fetchLeaderboard();
  }, [currentUser.id]);

  // Periodic polling for real-time live notifications simulation
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      syncProfile();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Handle switching roles for sandbox testing
  const handleRoleSandboxSwitch = (newRole: UserRole) => {
    const mockAvatars: { [key in UserRole]: string } = {
      citizen: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&h=120&q=80", // Yash Verma (Indian young man portrait)
      volunteer: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80", // Aarav Sharma (Indian young volunteer portrait)
      officer: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&h=120&q=80", // Rajesh Kumar (Indian male professional officer)
      admin: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80" // Chief Admin Team (Indian female administrator portrait)
    };

    const mockNames: { [key in UserRole]: string } = {
      citizen: "Yash Verma",
      volunteer: "Aarav Sharma",
      officer: "Rajesh Kumar (Municipal Officer)",
      admin: "Chief Admin Team"
    };

    setCurrentUser({
      id: `u-${newRole}`,
      email: `${newRole}@community.gov`,
      name: mockNames[newRole],
      role: newRole,
      points: newRole === 'volunteer' ? 780 : newRole === 'officer' ? 150 : 450,
      badges: newRole === 'volunteer' ? ["Top Volunteer", "Problem Solver", "City Guardian"] : ["Community Hero"],
      joinedDate: "2026-01-10",
      avatar: mockAvatars[newRole]
    });
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDropPinOnMap = (coords: { lat: number; lng: number; address: string }) => {
    setDroppedCoords(coords);
    setActiveTab("report");
  };

  // Quick report submit callback
  const handleReportSuccess = () => {
    setDroppedCoords(null);
    fetchIssues();
    setActiveTab("map"); // bounce back to interactive map
  };

  // Helper dictionary translations
  const t = {
    en: {
      appName: "Community Hero",
      heroSlogan: "Empowering Citizens to Build Better Communities",
      home: "Home",
      map: "Interactive Map",
      report: "Report Issue",
      analytics: "Impact Analytics",
      leaderboard: "Leaderboard",
      portal: "Officer Portal",
      volunteerPortal: "Volunteer Portal",
      adminPortal: "Admin Suite",
      rolesTitle: "Sandbox Tester Engine:",
      citizen: "Citizen View",
      volunteer: "Volunteer View",
      officer: "Officer View",
      admin: "Admin View",
      points: "Points",
      badges: "Badges"
    },
    hi: {
      appName: "कम्युनिटी हीरो",
      heroSlogan: "सशक्त नागरिक, बेहतर समुदाय",
      home: "मुख्य पृष्ठ",
      map: "इंटरैक्टिव नक्शा",
      report: "समस्या दर्ज करें",
      analytics: "प्रभाव विश्लेषण",
      leaderboard: "लीडरबोर्ड",
      portal: "अधिकारी पोर्टल",
      volunteerPortal: "स्वयंसेवक पोर्टल",
      adminPortal: "एडमिन पैनल",
      rolesTitle: "सैंडबॉक्स टेस्टर:",
      citizen: "नागरिक",
      volunteer: "स्वयंसेवक",
      officer: "अधिकारी",
      admin: "एडमिन",
      points: "अंक",
      badges: "बैज"
    }
  }[language];

  // Set to true so hackathon judges can switch roles and fully inspect citizen, volunteer, officer, and admin dashboards!
  const isDeveloperUser = true;

  const mobileLabels = {
    en: {
      home: "Home",
      map: "Map",
      report: "Report",
      analytics: "Impact",
      leaderboard: "Leaders",
      portal: "Portal"
    },
    hi: {
      home: "मुख्य",
      map: "नक्शा",
      report: "दर्ज करें",
      analytics: "प्रभाव",
      leaderboard: "लीडर",
      portal: "पोर्टल"
    }
  }[language];

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-300 overflow-x-hidden w-full ${isDarkMode ? "bg-[#0b0f19] text-[#f8fafc]" : "bg-[#F5F5F7] text-[#1D1D1F]"}`}>
      
      {/* 1. STICKY PREVIEW SANDBOX ROLE CONTROLLER (CRITICAL FOR DEMO TESTING) */}
      {isDeveloperUser && (
        <div className="bg-slate-900 border-b border-slate-800 text-white text-xs px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 z-50 relative shadow-sm max-w-full overflow-hidden">
          <div className="flex items-center space-x-2 shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide text-slate-300 font-mono">{t.rolesTitle}</span>
            <span className="text-slate-400 hidden md:inline">Click any role to test its custom dashboards instantly!</span>
          </div>
          <div className="flex overflow-x-auto max-w-full gap-1.5 py-1 px-0.5 no-scrollbar shrink-0">
            {(["citizen", "volunteer", "officer", "admin"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleSandboxSwitch(r)}
                className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold transition-all shadow-sm border whitespace-nowrap ${
                  currentUser.role === r
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700"
                }`}
              >
                <span className="sm:inline hidden">{r.toUpperCase()} VIEW</span>
                <span className="sm:hidden inline">{r.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. CORE HEADER */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800/80 px-3 py-2.5 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-1.5 sm:space-x-2.5 cursor-pointer hover:opacity-90 shrink-0"
          >
            <div className="p-1.5 sm:p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-[#1D1D1F] dark:text-white tracking-tight text-xs sm:text-base font-sans flex items-center space-x-1">
                <span>{t.appName}</span>
                <span className="text-[9px] bg-emerald-55 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wide">AI</span>
              </h1>
              <p className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium block leading-tight truncate max-w-[140px] xs:max-w-[170px] sm:max-w-none">
                {t.heroSlogan}
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 border ${activeTab === 'home' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-900/40 font-bold' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.home}</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 border ${activeTab === 'map' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-900/40 font-bold' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{t.map}</span>
            </button>

            <button
              onClick={() => setActiveTab("report")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 border ${activeTab === 'report' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-900/40 font-bold' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.report}</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 border ${activeTab === 'analytics' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-900/40 font-bold' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{t.analytics}</span>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 border ${activeTab === 'leaderboard' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-900/40 font-bold' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{t.leaderboard}</span>
            </button>

            {/* Role Portals */}
            {currentUser.role !== 'citizen' && (
              <button
                onClick={() => setActiveTab("portal")}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 border ${activeTab === 'portal' ? 'bg-emerald-600 text-white border-emerald-500 font-bold' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {currentUser.role === 'volunteer' && <Award className="w-3.5 h-3.5 text-emerald-200" />}
                {currentUser.role === 'officer' && <Shield className="w-3.5 h-3.5 text-orange-200" />}
                {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-200" />}
                <span>
                  {currentUser.role === 'volunteer' ? t.volunteerPortal : currentUser.role === 'officer' ? t.portal : t.adminPortal}
                </span>
              </button>
            )}
          </nav>

          {/* User Widgets (Language, Profile Stats, Notifications, Bot drawer) */}
          <div className="flex items-center flex-nowrap space-x-1.5 sm:space-x-2">

            {/* Desktop Widgets (Hidden on mobile) */}
            <div className="hidden md:flex items-center space-x-1.5 sm:space-x-2 flex-nowrap">
              {/* Quick Guide Trigger */}
              <button
                onClick={() => setIsTourOpen(true)}
                className="flex h-8 px-1.5 sm:px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/35 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] sm:text-xs items-center space-x-0.5 sm:space-x-1 shadow-sm rounded-xl transition-all whitespace-nowrap"
                title="Quick Device & App Guide"
              >
                <span className="hidden min-[380px]:inline sm:hidden">{language === 'en' ? "💡 Guide" : "💡 गाइड"}</span>
                <span className="min-[380px]:hidden">💡</span>
                <span className="hidden sm:inline">{language === 'en' ? "💡 Easy Guide" : "💡 सरल गाइड"}</span>
              </button>
              
              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-semibold"
                title="Change Language"
              >
                <Globe className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="font-mono hidden sm:inline ml-1">{language.toUpperCase()}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-semibold"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
              </button>

              {/* Notifications */}
              <div ref={notificationRef} className="relative flex items-center">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 relative flex items-center justify-center"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
                  )}
                </button>

                {/* Dropdown list */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-10 w-72 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xl z-50 space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Community Notifications</h4>
                      <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-slate-555 dark:text-slate-400">Live feed</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            onClick={() => {
                              handleMarkNotificationRead(n.id);
                              // If notification references an issue, let's locate it and open details!
                              const linkedIssue = issues.find(i => i.id === n.issueId);
                              if (linkedIssue) setSelectedIssue(linkedIssue);
                              setIsNotificationOpen(false);
                            }}
                            className={`p-2 rounded-xl text-xs text-left cursor-pointer transition-colors ${n.read ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800' : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'}`}
                          >
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{n.text}</p>
                            <span className="block text-[9px] font-mono text-slate-400 mt-1">
                              {new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic text-center py-4">No notifications yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile points preview / Auth triggers */}
              {!fbUser ? (
                <button
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="h-8 px-2 sm:px-3 bg-indigo-55 dark:bg-indigo-950/45 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/75 dark:hover:bg-indigo-900/45 rounded-xl text-[10px] sm:text-xs font-bold shadow-sm transition-all flex items-center space-x-1 shrink-0 whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              ) : (
                <div 
                  onClick={() => {
                    setActiveTab("analytics");
                  }}
                  className="h-8 flex items-center space-x-1 sm:space-x-2 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl px-2 text-xs font-semibold shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shrink-0"
                  title="Click to view analytics & account"
                >
                  <img 
                    src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80"} 
                    alt={currentUser.name} 
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover shadow-sm" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden sm:block text-left text-[10px]">
                    <p className="text-slate-850 dark:text-slate-200 font-bold truncate max-w-[80px]">{currentUser.name}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{currentUser.points} Pts</p>
                  </div>
                </div>
              )}

              {/* Floating support AI Chat trigger */}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="h-8 px-2 sm:px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all relative flex items-center justify-center space-x-1 text-[10px] sm:text-xs font-bold shrink-0 whitespace-nowrap"
                id="chatbot-trigger"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                <span className="hidden sm:inline">Bot</span>
              </button>
            </div>

            {/* Mobile-Only Widgets (Visible on mobile, hidden on desktop) */}
            <div className="flex md:hidden items-center space-x-1 sm:space-x-1.5 flex-nowrap mr-1">
              {/* Theme Toggle for mobile */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-semibold cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
              </button>

              {/* Notifications for mobile */}
              <div ref={mobileNotificationRef} className="relative flex items-center">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 relative flex items-center justify-center cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
                  )}
                </button>

                {/* Mobile Dropdown list */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-10 w-64 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xl z-50 space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <h4 className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Community Alerts</h4>
                      <span className="text-[8px] font-mono bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-slate-500">Live feed</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            onClick={() => {
                              handleMarkNotificationRead(n.id);
                              const linkedIssue = issues.find(i => i.id === n.issueId);
                              if (linkedIssue) setSelectedIssue(linkedIssue);
                              setIsNotificationOpen(false);
                            }}
                            className={`p-1.5 rounded-lg text-[10px] text-left cursor-pointer transition-colors ${n.read ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800' : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'}`}
                          >
                            <p className="text-slate-700 dark:text-slate-300 leading-tight">{n.text}</p>
                            <span className="block text-[8px] font-mono text-slate-400 mt-0.5">
                              {new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">No notifications yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Menu Toggle (md:hidden) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden h-8 w-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition-all shrink-0 cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>

        </div>
      </header>

      {/* 2b. MOBILE HAMBURGER MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />
          
          {/* Drawer Content */}
          <div className="relative w-[300px] max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest uppercase text-slate-450 dark:text-slate-400">
                {language === 'en' ? "MAIN CHANNELS" : "मुख्य चैनल्स"}
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer"
                title="Close Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Sections */}
            <div className="p-3 space-y-1.5 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center space-x-2.5 text-xs font-semibold border text-left cursor-pointer ${activeTab === 'home' ? 'bg-emerald-55 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/60 dark:border-emerald-900/40 font-bold shadow-xs' : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Home className="w-4 h-4" />
                <span>{language === 'en' ? "Home" : "मुख्य पृष्ठ"}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("map");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center space-x-2.5 text-xs font-semibold border text-left cursor-pointer ${activeTab === 'map' ? 'bg-emerald-55 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/60 dark:border-emerald-900/40 font-bold shadow-xs' : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Map className="w-4 h-4" />
                <span>{language === 'en' ? "Interactive Map" : "इंटरैक्टिव नक्शा"}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("report");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center space-x-2.5 text-xs font-semibold border text-left cursor-pointer ${activeTab === 'report' ? 'bg-emerald-55 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/60 dark:border-emerald-900/40 font-bold shadow-xs' : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'en' ? "Report Issue" : "समस्या दर्ज करें"}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("analytics");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center space-x-2.5 text-xs font-semibold border text-left cursor-pointer ${activeTab === 'analytics' ? 'bg-emerald-55 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/60 dark:border-emerald-900/40 font-bold shadow-xs' : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>{language === 'en' ? "Impact Analytics" : "प्रभाव विश्लेषण"}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("leaderboard");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center space-x-2.5 text-xs font-semibold border text-left cursor-pointer ${activeTab === 'leaderboard' ? 'bg-emerald-55 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100/60 dark:border-emerald-900/40 font-bold shadow-xs' : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Trophy className="w-4 h-4" />
                <span>{language === 'en' ? "Leaderboard" : "लीडरबोर्ड"}</span>
              </button>
            </div>

            {/* App Control Section */}
            <div className="p-3 space-y-2.5 flex-1 bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
                {language === 'en' ? "APP CONTROL" : "ऐप नियंत्रण"}
              </span>
              
              <div className="flex flex-col space-y-2 px-2 text-xs font-semibold">
                {/* Language Switcher */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>{language === 'en' ? "Language" : "भाषा"}</span>
                  </span>
                  <button 
                    onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold font-mono text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-[10px]"
                  >
                    {language.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT WINDOW */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24 md:pb-8 space-y-6">
        
        {/* VIEW ROUTER */}
        {activeTab === "home" && (
          <LandingPage 
            onStartReporting={() => setActiveTab("report")}
            onOpenMap={() => setActiveTab("map")}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenTour={() => setIsTourOpen(true)}
            lang={language}
            fbUser={fbUser}
            onAuthSuccess={(syncedUser) => {
              setCurrentUser(syncedUser);
              fetchNotifications();
            }}
            onLogout={handleGlobalLogout}
            onOpenAuthModal={(defaultTab) => {
              setAuthModalTab(defaultTab || 'register');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {activeTab === "map" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                {language === 'en' ? 'Interactive Community Map Dashboard' : 'कम्युनिटी इंटरैक्टिव नक्शा'}
              </h2>
              <p className="text-xs text-slate-500">Live reporting statuses mapped in real-time across Noida sectors.</p>
            </div>

            {issuesError ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-4 border border-red-100 bg-red-50/50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {language === 'en' ? 'Failed to Load Community Reports' : 'कम्युनिटी रिपोर्ट लोड करने में विफल'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {issuesError.includes("Failed to fetch") 
                      ? (language === 'en' ? 'The local civic server is currently booting up. Please wait a moment and try again.' : 'स्थानीय सिविक सर्वर अभी शुरू हो रहा है। कृपया थोड़ी देर प्रतीक्षा करें और पुनः प्रयास करें।')
                      : (language === 'en' ? 'Could not connect to the server. Please check your connection.' : 'सर्वर से कनेक्ट नहीं हो सका। कृपया अपना कनेक्शन जांचें।')}
                  </p>
                </div>
                <button
                  onClick={() => fetchIssues(3)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>{language === 'en' ? 'Retry Connection' : 'पुनः प्रयास करें'}</span>
                </button>
              </div>
            ) : loadingIssues ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-mono">Loading maps vector points...</p>
              </div>
            ) : (
              <InteractiveMap 
                issues={issues}
                onSelectIssue={(issue) => setSelectedIssue(issue)}
                onDropPin={handleDropPinOnMap}
                lang={language}
              />
            )}
          </div>
        )}

        {activeTab === "report" && (
          <ReportIssueForm
            userId={currentUser.id}
            userName={currentUser.name}
            droppedCoords={droppedCoords}
            onSuccess={handleReportSuccess}
            lang={language}
          />
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl self-start max-w-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setAnalyticsViewMode('insights')}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all ${
                  analyticsViewMode === 'insights'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                AI Community Insights
              </button>
              <button
                onClick={() => setAnalyticsViewMode('userManagement')}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all ${
                  analyticsViewMode === 'userManagement'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Users & Referrals Suite
              </button>
              <button
                onClick={() => setAnalyticsViewMode('impact')}
                className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all ${
                  analyticsViewMode === 'impact'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Predictive AI Impact
              </button>
            </div>

            {analyticsViewMode === 'insights' && (
              <AICommunityInsights 
                currentUser={currentUser}
                language={language}
              />
            )}

            {analyticsViewMode === 'userManagement' && (
              <UserManagementAnalytics 
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                language={language}
              />
            )}

            {analyticsViewMode === 'impact' && (
              <ImpactDashboard 
                lang={language}
              />
            )}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs text-emerald-700 font-semibold shadow-sm">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span>Civic Gamified Standings</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Active Community Leaderboard</h2>
              <p className="text-xs text-slate-500">Earn points by verifying reports, adding evidence, and resolving local complaints.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between font-mono text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <span>Citizen / Volunteer Standings</span>
                <span>Honor Score</span>
              </div>

              <div className="divide-y divide-slate-100">
                {leaderboard.map((entry, index) => (
                  <div key={entry.userId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className={`w-6 text-center font-black font-mono text-xs ${index === 0 ? 'text-emerald-600 text-sm' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        #{index + 1}
                      </span>
                      <img 
                        src={entry.avatar} 
                        alt={entry.userName} 
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{entry.userName}</span>
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${entry.role === 'volunteer' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : entry.role === 'admin' ? 'bg-purple-50 text-purple-800' : 'bg-slate-100 text-slate-600'}`}>
                            {entry.role}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">Joined Noida Hero grid • Solved: {entry.solvedCount} reports</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 font-mono">{entry.points} Pts</p>
                      <p className="text-[10px] text-slate-400">{entry.badgesCount} badges unlocked</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. PORTAL BOARD (ROLE PORTALS COMBINED) */}
        {activeTab === "portal" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* VOLUNTEER SPECIFIC VIEW */}
            {currentUser.role === 'volunteer' && (
              <div className="space-y-6">
                <div className="bg-emerald-50/60 border border-emerald-100/80 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-emerald-900 font-sans tracking-tight">Active Volunteer Quest Board</h2>
                    <p className="text-xs text-emerald-700">Verifying issues triggers authorities and secures communities. Select tasks to gather field photos.</p>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-2xl p-3 text-center self-start md:self-auto shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Your Score</span>
                    <strong className="text-xl font-mono text-slate-900 block">{currentUser.points} Pts</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quests list */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Active Verification Quests</h3>
                    <div className="divide-y divide-slate-100 space-y-3">
                      {issues.filter(i => i.status === "Reported" && !i.verifiedBy.includes(currentUser.id)).map(i => (
                        <div key={i.id} className="pt-3 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[9px] bg-amber-100 text-amber-800 rounded px-1.5 py-0.2 font-bold">{i.id}</span>
                              <span className="text-[10px] font-mono font-bold text-slate-500">{i.verifications}/{i.verificationThreshold || 5} verified</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[200px]">{i.title}</h4>
                            <p className="text-[10px] text-slate-400 truncate">📍 {i.coordinates.address}</p>
                          </div>
                          <button
                            onClick={() => setSelectedIssue(i)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shadow transition-colors flex items-center space-x-1"
                          >
                            <span>Verify (+15)</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leaderboard snippet */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Your Honor Achievements</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <span className="text-[32px]">🏅</span>
                        <h4 className="font-bold text-slate-800 text-xs mt-1">Community Hero</h4>
                        <span className="text-[9px] text-slate-400">Unlocked</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <span className="text-[32px]">🛡️</span>
                        <h4 className="font-bold text-slate-800 text-xs mt-1">City Guardian</h4>
                        <span className="text-[9px] text-slate-400">Unlocked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MUNICIPAL OFFICER SPECIFIC VIEW */}
            {currentUser.role === 'officer' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-orange-900 font-sans tracking-tight">Municipal Repair Command Board</h2>
                    <p className="text-xs text-orange-700">Official field queue of assigned tasks and structural resolution forms.</p>
                  </div>
                  <div className="bg-white border border-orange-200 rounded-xl p-3 text-center self-start md:self-auto shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Assigned Bureau</span>
                    <strong className="text-sm font-black text-slate-900 block">Noida Infrastructure</strong>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-xs text-slate-700">
                    Active Assigned Infrastructure Work Orders
                  </div>
                  <div className="divide-y divide-slate-100">
                    {issues.filter(i => i.status !== "Resolved" && i.status !== "Closed").map(i => (
                      <div key={i.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[9px] bg-slate-900 text-white rounded px-1.5 py-0.2 font-bold">{i.id}</span>
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 rounded uppercase">{i.severity}</span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wide">{i.category}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{i.title}</h4>
                          <p className="text-xs text-slate-500 font-medium">📍 {i.coordinates.address}</p>
                        </div>
                        <button
                          onClick={() => setSelectedIssue(i)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-colors"
                        >
                          Update Status & Repair
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN PORTAL PANEL */}
            {currentUser.role === 'admin' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200/60 p-5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-purple-900 font-sans tracking-tight">Unified Admin Console Suite</h2>
                    <p className="text-xs text-purple-700">Moderate platform complaints, view overall system metrics, and audit abuse flags.</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-purple-900 text-white rounded-xl px-3 py-1.5 uppercase">Admin Role</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* System moderation */}
                  <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">System Complaints Moderation List</h3>
                    <div className="divide-y divide-slate-100">
                      {issues.map(i => (
                        <div key={i.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[9px] bg-slate-100 text-slate-500 rounded px-1.5 font-bold">{i.id}</span>
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[280px]">{i.title}</h4>
                            <p className="text-[10px] text-slate-400">Reporter: {i.reporterName} • Status: {i.status}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedIssue(i)}
                              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded border border-slate-200"
                              title="Inspect Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action quick links */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Active Abuse Warning Logs</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border text-[10px] leading-relaxed text-slate-500">
                        <strong className="text-slate-800 font-semibold block mb-0.5">System Audit Status</strong>
                        All reports conform with the Noida geofence protocols. No abuse reports filed.
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] leading-relaxed text-emerald-800">
                        <strong className="text-emerald-950 font-bold block mb-0.5">✓ Platform Integrity High</strong>
                        Citizen accuracy score remains at 98.4%.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* 4. FLOATING CHATBOT DRAWER SECTION */}
      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        userId={currentUser.id}
        userName={currentUser.name}
        lang={language}
      />

      {/* 5. ACTIVE COMPLAINT MODAL WINDOW */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser}
          onClose={() => setSelectedIssue(null)}
          onRefresh={fetchIssues}
          lang={language}
        />
      )}

      {/* 6. NEW USER GUIDED WALKTHROUGH TOUR */}
      <DeviceOnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        lang={language}
      />

      {/* 7. SECURE AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'en' ? "Access Civic Portal" : "नागरिक पोर्टल प्रवेश"}</span>
                </h3>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-slate-150 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab("register");
                    setModalError("");
                    setModalSuccess("");
                  }}
                  className={`flex-1 pb-2 text-center text-xs font-black uppercase border-b-2 transition-all ${
                    authModalTab === "register" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {language === 'en' ? "Register Account" : "रजिस्टर करें"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab("login");
                    setModalError("");
                    setModalSuccess("");
                  }}
                  className={`flex-1 pb-2 text-center text-xs font-black uppercase border-b-2 transition-all ${
                    authModalTab === "login" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {language === 'en' ? "Log In" : "लॉग इन"}
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold leading-relaxed">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] font-semibold leading-relaxed">
                  {modalSuccess}
                </div>
              )}

              <form className="space-y-3" onSubmit={handleModalSubmit}>
                {authModalTab === "register" && (
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">{language === 'en' ? "Full Name" : "पूरा नाम"}</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={mFullName}
                        onChange={(e) => setMFullName(e.target.value)}
                        placeholder="e.g. Yash Verma"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">{language === 'en' ? "Email Address" : "ईमेल"}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={mEmail}
                      onChange={(e) => setMEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">{language === 'en' ? "Password (at least 6 chars)" : "पासवर्ड (न्यूनतम ६ अक्षर)"}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={mPassword}
                      onChange={(e) => setMPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={mLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15"
                >
                  {mLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>
                        {authModalTab === "register" 
                          ? (language === 'en' ? "Register Account" : "रजिस्टर करें")
                          : (language === 'en' ? "Sign In" : "लॉग इन")}
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[9px] text-slate-400 font-black uppercase tracking-widest">or connect using</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleModalGoogleSignIn}
                disabled={mLoading}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.58-5.17 3.58-8.58z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.15C3.27 21.85 7.42 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.38-2.31V6.54H1.29A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.29 5.46l3.98-3.22z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.27 2.15 1.29 6.54l3.98 3.22c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                <span>Google Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING CHATBOT BUTTON */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="md:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 border-2 border-white/15 animate-bounce"
        title="Live AI Assistant"
        id="chatbot-mobile-floating"
      >
        <MessageSquare className="w-6 h-6 text-emerald-100" />
      </button>

    </div>
  );
}
