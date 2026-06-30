import React, { useState } from "react";
import { 
  Shield, 
  MapPin, 
  Award, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Heart,
  MessageSquare,
  Smartphone,
  UserCheck,
  LogOut,
  Mail,
  Lock,
  User
} from "lucide-react";
import { auth, syncUserProfile, logAnalyticsEvent } from "../lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";

interface LandingPageProps {
  onStartReporting: () => void;
  onOpenMap: () => void;
  onOpenChat: () => void;
  onOpenTour: () => void;
  lang: 'en' | 'hi';
  fbUser: any;
  onAuthSuccess: (user: any) => void;
  onLogout: () => void;
  onOpenAuthModal: (defaultTab?: "login" | "register") => void;
}

export default function LandingPage({ 
  onStartReporting, 
  onOpenMap, 
  onOpenChat, 
  onOpenTour, 
  lang,
  fbUser,
  onAuthSuccess,
  onLogout,
  onOpenAuthModal
}: LandingPageProps) {
  // Direct Quick Auth state
  const [quickAuthTab, setQuickAuthTab] = useState<"register" | "login">("register");
  const [qFullName, setQFullName] = useState("");
  const [qEmail, setQEmail] = useState("");
  const [qPassword, setQPassword] = useState("");
  const [qLoading, setQLoading] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickSuccess, setQuickSuccess] = useState("");

  const handleQuickGoogleSignIn = async () => {
    try {
      setQLoading(true);
      setQuickError("");
      setQuickSuccess("");
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const synced = await syncUserProfile(result.user, result.user.displayName || "");
      if (synced) {
        onAuthSuccess(synced);
        setQuickSuccess(lang === 'en' ? "Google connected successfully! Welcome to the Hero Grid!" : "गूगल सफलतापूर्वक कनेक्ट हो गया है!");
        logAnalyticsEvent(synced.id, "landing_quick_google_login", { email: synced.email });
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/operation-not-allowed") {
        setQuickError(lang === 'en' ? "Google Sign-In is not enabled. Please enable it in Firebase." : "गूगल लॉगिन अभी सक्षम नहीं है।");
      } else {
        setQuickError(e.message || "Failed Google login.");
      }
    } finally {
      setQLoading(false);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qEmail || !qPassword) {
      setQuickError(lang === 'en' ? "Please fill out all required fields." : "कृपया सभी आवश्यक फ़ील्ड भरें।");
      return;
    }
    if (quickAuthTab === "register" && !qFullName) {
      setQuickError(lang === 'en' ? "Full name is required to register." : "रजिस्ट्रेशन के लिए नाम आवश्यक है।");
      return;
    }
    if (qPassword.length < 6) {
      setQuickError(lang === 'en' ? "Password must be at least 6 characters." : "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।");
      return;
    }

    try {
      setQLoading(true);
      setQuickError("");
      setQuickSuccess("");

      if (quickAuthTab === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, qEmail, qPassword);
        const synced = await syncUserProfile(userCredential.user, qFullName);
        if (synced) {
          onAuthSuccess(synced);
          setQuickSuccess(lang === 'en' ? "Account created successfully! Welcome!" : "खाता सफलतापूर्वक बन गया है!");
          setQFullName("");
          setQEmail("");
          setQPassword("");
          logAnalyticsEvent(synced.id, "landing_quick_register", { email: synced.email });
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, qEmail, qPassword);
        const synced = await syncUserProfile(userCredential.user);
        if (synced) {
          onAuthSuccess(synced);
          setQuickSuccess(lang === 'en' ? "Logged in successfully!" : "लॉग इन हो गया!");
          setQEmail("");
          setQPassword("");
          logAnalyticsEvent(synced.id, "landing_quick_login", { email: synced.email });
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === "auth/operation-not-allowed") {
        setQuickError(lang === 'en' ? "This provider is not enabled in Firebase Console yet." : "यह लॉगिन माध्यम अभी सक्षम नहीं है।");
      } else if (e.code === "auth/weak-password") {
        setQuickError(lang === 'en' ? "Password should be at least 6 characters." : "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।");
      } else {
        setQuickError(e.message || "Auth action failed.");
      }
    } finally {
      setQLoading(false);
    }
  };
  return (
    <div className="bg-[#F5F5F7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#1D1D1F] text-white py-20 lg:py-32 px-4">
        {/* Background vectors */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-large" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-large)" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-slate-800 border border-slate-700/60 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-semibold shadow-sm animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{lang === 'en' ? 'AI-POWERED CIVIC ENGAGEMENT PLATFORM' : 'एआई-संचालित नागरिक सहयोग मंच'}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-sans">
            {lang === 'en' 
              ? "Empowering Citizens to Build Better Communities" 
              : "बेहतर समुदाय के निर्माण के लिए नागरिकों को सशक्त बनाना"}
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {lang === 'en'
              ? "Report potholes, broken streetlights, water leakages, and garbage in 3 seconds. Supported by Gemini AI, local volunteers, and municipal teams."
              : "सड़क के गड्ढे, टूटी स्ट्रीटलाइट, पानी का रिसाव और कचरा सिर्फ 3 सेकंड में दर्ज करें। जेमिनी एआई, स्वयंसेवकों और नगर निगम द्वारा समर्थित।"}
          </p>

          <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onStartReporting}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl shadow-sm transition-all duration-300 flex items-center justify-center space-x-2"
              id="hero-report-btn"
            >
              <span>{lang === 'en' ? "Report an Issue Now" : "समस्या दर्ज करें"}</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onOpenMap}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700/60 transition-all duration-300 flex items-center justify-center space-x-2"
              id="hero-map-btn"
            >
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>{lang === 'en' ? "Explore Interactive Map" : "नक्शा देखें"}</span>
            </button>
            {!fbUser ? (
              <button
                onClick={() => onOpenAuthModal("register")}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all duration-300 flex items-center justify-center space-x-2"
                id="hero-auth-btn"
              >
                <UserCheck className="w-5 h-5 text-indigo-200" />
                <span>{lang === 'en' ? "Sign In / Register" : "लॉग इन / रजिस्टर"}</span>
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-8 py-4 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 font-semibold rounded-xl border border-rose-800/40 transition-all duration-300 flex items-center justify-center space-x-2"
                id="hero-logout-btn"
              >
                <LogOut className="w-5 h-5 text-rose-400" />
                <span>{lang === 'en' ? "Sign Out" : "साइन आउट करें"}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* LIVE STATISTICS */}
      <section className="bg-white py-12 border-y border-gray-200/80 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="text-3xl font-black text-[#1D1D1F] font-mono">1,482+</div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {lang === 'en' ? 'Reported Complaints' : 'कुल शिकायतें'}
              </p>
            </div>
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="text-3xl font-black text-emerald-600 font-mono">1,241+</div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {lang === 'en' ? 'Resolved Issues' : 'समाधान किया गया'}
              </p>
            </div>
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="text-3xl font-black text-emerald-600 font-mono">84%</div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {lang === 'en' ? 'Resolution Rate' : 'समाधान दर'}
              </p>
            </div>
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="text-3xl font-black text-emerald-600 font-mono">2.4 Days</div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {lang === 'en' ? 'Avg Repair Time' : 'औसत समाधान समय'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATED DIRECT REGISTRATION & SIGN IN SECTION */}
      <section className="py-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white px-4 border-b border-indigo-900/30">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3.5 py-1 text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'en' ? "Durable Cloud Profile & Rewards" : "क्लाउड प्रोफाइल और पुरस्कार"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {lang === 'en' ? "Join Our Premier Civic Portal" : "हमारे प्रमुख नागरिक पोर्टल से जुड़ें"}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {lang === 'en'
                ? "Register a direct, real Firebase Authentication account in seconds to earn 100 immediate bonus points! Track upvotes on your reports, unlock real-time sector telemetry, and earn prestige badges."
                : "त्वरित खाता बनाकर सीधे 100 बोनस अंक प्राप्त करें! अपनी रिपोर्ट पर वोट ट्रैक करें, सेक्टर्स की रियल-टाइम टेलीमेट्री देखें और बैज जीतें।"}
            </p>
            
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center space-x-2 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{lang === 'en' ? "Durable persistence across all browser sessions" : "सभी ब्राउज़र सत्रों में स्थायी रूप से डेटा सुरक्षित"}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{lang === 'en' ? "Google Authentication and direct Email support" : "गूगल और डायरेक्ट ईमेल सपोर्ट उपलब्ध"}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{lang === 'en' ? "Earn 100 Pts on Sign Up • 100 Pts on Referrals" : "साइन अप करने पर 100 अंक • रेफरल पर 100 अंक"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 border border-indigo-100 dark:border-indigo-950/50">
            {fbUser ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-indigo-600 bg-indigo-50 flex items-center justify-center">
                  <img 
                    src={fbUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"} 
                    alt="Success" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                    {lang === 'en' ? "Active Citizen Account Secured!" : "सक्रिय नागरिक खाता सुरक्षित!"}
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">
                    {lang === 'en' ? `Connected as ${fbUser.displayName || fbUser.email}` : `कनेक्टेड: ${fbUser.displayName || fbUser.email}`}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed font-semibold">
                  {lang === 'en'
                    ? "✓ Your reports and profile are securely tied to your Google/Email credentials. You can view full analytics in the User Management & Analytics tab!"
                    : "✓ आपकी रिपोर्ट और प्रोफ़ाइल क्रेडेंशियल्स सुरक्षित हैं। आप यूजर मैनेजमेंट और एनालिटिक्स टैब में पूरी रिपोर्ट देख सकते हैं!"}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition-colors border border-rose-100 dark:border-rose-900/40 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{lang === 'en' ? "Sign Out" : "साइन आउट"}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAuthTab("register");
                      setQuickError("");
                      setQuickSuccess("");
                    }}
                    className={`flex-1 pb-2 text-center text-xs font-black uppercase border-b-2 transition-all ${
                      quickAuthTab === "register" ? "border-indigo-600 text-indigo-600 font-extrabold animate-pulse" : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {lang === 'en' ? "Register Account" : "रजिस्टर करें"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAuthTab("login");
                      setQuickError("");
                      setQuickSuccess("");
                    }}
                    className={`flex-1 pb-2 text-center text-xs font-black uppercase border-b-2 transition-all ${
                      quickAuthTab === "login" ? "border-indigo-600 text-indigo-600 font-extrabold animate-pulse" : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {lang === 'en' ? "Log In" : "लॉग इन"}
                  </button>
                </div>

                {quickError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 rounded-xl text-[11px] font-semibold leading-relaxed">
                    {quickError}
                  </div>
                )}
                {quickSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-[11px] font-semibold leading-relaxed">
                    {quickSuccess}
                  </div>
                )}

                <form className="space-y-3" onSubmit={handleQuickSubmit}>
                  {quickAuthTab === "register" && (
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">{lang === 'en' ? "Full Name" : "पूरा नाम"}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={qFullName}
                          onChange={(e) => setQFullName(e.target.value)}
                          placeholder="e.g. Yash Verma"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">{lang === 'en' ? "Email Address" : "ईमेल"}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={qEmail}
                        onChange={(e) => setQEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">{lang === 'en' ? "Password (at least 6 chars)" : "पासवर्ड (न्यूनतम ६ अक्षर)"}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={qPassword}
                        onChange={(e) => setQPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={qLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15"
                  >
                    {qLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>
                          {quickAuthTab === "register" 
                            ? (lang === 'en' ? "Claim 100 Points & Register" : "100 अंक प्राप्त करें और रजिस्टर करें")
                            : (lang === 'en' ? "Sign In Securely" : "सुरक्षित लॉगिन करें")}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-2.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">or connect using</span>
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickGoogleSignIn}
                  disabled={qLoading}
                  className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm"
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
            )}
          </div>
        </div>
      </section>

      {/* EASY ONBOARDING / DEVICE HELP HERO CARD */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          {/* Subtle background vectors */}
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <Smartphone className="w-80 h-80 text-white" />
          </div>
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-emerald-100">
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span>{lang === 'en' ? "NO INSTALLATION REQUIRED" : "कोई ऐप डाउनलोड की ज़रूरत नहीं"}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
              {lang === 'en' ? "Is this app too hectic for new users? Not at all!" : "क्या नया होने के कारण यह ऐप कठिन लग रहा है? बिल्कुल नहीं!"}
            </h2>
            
            <p className="text-emerald-50 text-sm sm:text-base leading-relaxed">
              {lang === 'en' 
                ? "We designed Community Hero specifically so that elderly neighbors, busy office-goers, and any local citizen can report issues instantly. You don't need to type anything or download any heavy apps!"
                : "हमने कम्युनिटी हीरो को विशेष रूप से इस तरह डिजाइन किया है कि बुजुर्ग पड़ोसी, व्यस्त नौकरीपेशा लोग और कोई भी स्थानीय नागरिक तुरंत समस्याओं की रिपोर्ट कर सके।"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs text-emerald-100">
              <div className="flex items-start space-x-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-emerald-300 font-bold">📲 1-Tap Mobile Launch</span>
                <p className="text-[11px] text-emerald-100/90 mt-0.5">{lang === 'en' ? "Add to your phone's home screen in 3 seconds from Chrome/Safari." : "क्रोम/सफारी से सीधे फोन स्क्रीन पर शॉर्टकट बनाएं।"}</p>
              </div>
              <div className="flex items-start space-x-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-emerald-300 font-bold">🎙️ Speak & Report</span>
                <p className="text-[11px] text-emerald-100/90 mt-0.5">{lang === 'en' ? "Just tap 'Speak' and talk. Gemini AI auto-fills everything." : "बस बोलें और जेमिनी एआई शिकायत दर्ज कर देगा।"}</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={onOpenTour}
                className="px-6 py-3 bg-white text-emerald-950 hover:bg-emerald-50 font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md active:scale-95"
              >
                <span>{lang === 'en' ? "📖 Open 1-Minute Device Guide" : "📖 1-मिनट की सरल गाइड खोलें"}</span>
                <ArrowRight className="w-4 h-4 text-emerald-950" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              {lang === 'en' ? "How Community Hero Works" : "कम्युनिटी हीरो कैसे काम करता है"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm">
              {lang === 'en'
                ? "A streamlined, transparent loop from reporting to municipal resolution."
                : "दर्ज करने से लेकर नगर निगम के समाधान तक एक सुव्यवस्थित और पारदर्शी प्रक्रिया।"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm relative group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                {lang === 'en' ? "Snap and Upload" : "तस्वीर लें और भेजें"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {lang === 'en'
                  ? "Citizen uploads an image of the pothole or leakage. Gemini AI automatically detects category and predicts severity instantly."
                  : "नागरिक सड़क के गड्ढे या पानी के रिसाव की तस्वीर अपलोड करते हैं। जेमिनी एआई तुरंत श्रेणी की पहचान करता है।"}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm relative group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                {lang === 'en' ? "Community Verifies" : "समुदाय सत्यापन करता है"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {lang === 'en'
                  ? "Nearby citizens and local volunteers verify the issue, upvote it, and upload additional evidence. Upvotes speed up priority."
                  : "आस-पास के नागरिक और स्वयंसेवक समस्या का सत्यापन करते हैं। अधिक वोट मिलने पर काम जल्दी शुरू होता है।"}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm relative group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                {lang === 'en' ? "Municipal Repair" : "त्वरित समाधान"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {lang === 'en'
                  ? "Local municipal officers view high-priority complaints, repair them, and upload clear photo proof of resolution."
                  : "स्थानीय नगर निगम अधिकारी शिकायत देखते हैं, मरम्मत करते हैं और समाधान की स्पष्ट तस्वीर प्रमाण के रूप में अपलोड करते हैं।"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REWARDS & GAMIFICATION */}
      <section className="bg-[#1D1D1F] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center space-x-1.5 bg-slate-850 border border-slate-700/60 px-3 py-1 rounded-full text-xs text-emerald-400 font-semibold">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'en' ? 'GAMIFICATION ENGINE ACTIVE' : 'पुरस्कार प्रणाली सक्रिय'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight">
              {lang === 'en' ? "Become Your Neighborhood's Savior" : "अपने पड़ोस के रक्षक बनें"}
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              {lang === 'en'
                ? "Every action counts. File reports, upvote neighbors, and verify field works to earn points and climb the monthly leaderboards. Receive honorable badges and recognized community titles."
                : "आपकी हर कार्रवाई महत्वपूर्ण है। रिपोर्ट दर्ज करें, पड़ोसियों की शिकायत का सत्यापन करें और अंक अर्जित करके लीडरबोर्ड पर आगे बढ़ें।"}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-3 font-mono">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase">{lang === 'en' ? 'Report Issue' : 'शिकायत करें'}</h4>
                  <p className="text-xs text-emerald-400 font-bold">+30 Points</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase">{lang === 'en' ? 'Verify Complaint' : 'सत्यापन करें'}</h4>
                  <p className="text-xs text-emerald-400 font-bold">+15 Points</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase">{lang === 'en' ? 'Resolution' : 'समाधान पर'}</h4>
                  <p className="text-xs text-emerald-400 font-bold">+50 Points</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase">{lang === 'en' ? 'Evidence added' : 'प्रमाण देने पर'}</h4>
                  <p className="text-xs text-emerald-400 font-bold">+20 Points</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Badges grid */}
          <div className="w-full md:w-96 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-4 text-center">
              <div className="text-3xl mb-1">🏅</div>
              <h4 className="font-bold text-slate-100 text-xs">Community Hero</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'en' ? 'Top tier contributor' : 'सर्वोच्च नागरिक पुरस्कार'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-4 text-center">
              <div className="text-3xl mb-1">📸</div>
              <h4 className="font-bold text-slate-100 text-xs">Active Reporter</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'en' ? 'Logged 5+ verified reports' : '5+ सत्यापित शिकायतें'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-4 text-center">
              <div className="text-3xl mb-1">⚙️</div>
              <h4 className="font-bold text-slate-100 text-xs">Problem Solver</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'en' ? 'Assisted in rapid repair' : 'समस्या निवारण में सहायक'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-4 text-center">
              <div className="text-3xl mb-1">🛡️</div>
              <h4 className="font-bold text-slate-100 text-xs">City Guardian</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'en' ? 'Highest leaderboard honor' : 'अग्रणी नगर रक्षक'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS & SUCCESS STORIES */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              {lang === 'en' ? "Voices of the Community" : "नागरिकों के अनुभव"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm">
              {lang === 'en'
                ? "Real stories of rapid transformations across local sectors."
                : "स्थानीय सेक्टरों से वास्तविक जन-सुधार की सच्ची कहानियां।"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed">
                {lang === 'en'
                  ? `"I reported a broken water pipe spraying on the road using this app. Within 2 hours, 5 neighbors verified it, and Rajesh from the water department resolved it the next morning! Unbelievable response!"`
                  : `"मैंने सड़क पर पानी की मुख्य पाइप फटने की शिकायत इस ऐप पर दर्ज की थी। सिर्फ 2 घंटे में पड़ोसियों ने सत्यापन किया और अगले ही दिन जल बोर्ड की टीम ने आकर इसे ठीक कर दिया!"`}
              </p>
              <div className="flex items-center space-x-3 mt-6">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Priya Patel</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Sector 12 Resident' : 'सेक्टर 12 निवासी'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed">
                {lang === 'en'
                  ? `"As a local officer, we used to get scattered handwritten complaints. Now, Community Hero lists exact GPS locations and priorities sorted by upvotes and Gemini severity scores. It saves us days of paperwork."`
                  : `"एक सरकारी अधिकारी के रूप में, हमें बहुत बिखरी हुई शिकायतें मिलती थीं। अब, कम्युनिटी हीरो जीपीएस लोकेशन और वोटिंग के आधार पर प्राथमिकता तय करता है। हमारे कई दिनों का काम बच जाता है।"`}
              </p>
              <div className="flex items-center space-x-3 mt-6">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80" 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Rajesh Kumar</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Municipal Officer, Road Dept' : 'नगर निगम अधिकारी'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-[#1D1D1F] text-white py-16 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold font-sans tracking-tight">
            {lang === 'en' ? "Be the Hero Your Neighborhood Needs" : "अपने पड़ोस के हीरो बनें"}
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            {lang === 'en'
              ? "Join hands with thousands of active citizens, local volunteers, and city planners to make our city safe, clean, and beautiful."
              : "शहर को सुरक्षित, स्वच्छ और सुंदर बनाने के लिए हजारों नागरिकों और स्वयंसेवकों के साथ जुड़ें।"}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onStartReporting}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md"
            >
              {lang === 'en' ? "Submit Your First Report" : "अपनी पहली शिकायत दर्ज करें"}
            </button>
            <button
              onClick={onOpenChat}
              className="px-8 py-3.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-white font-semibold rounded-xl transition-all"
            >
              {lang === 'en' ? "Talk to HeroBot Assistant" : "हीरोबॉट से बात करें"}
            </button>
          </div>
        </div>
      </section>
      
    </div>
  );
}
