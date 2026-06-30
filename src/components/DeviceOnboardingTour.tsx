import React, { useState } from "react";
import { 
  X, 
  Smartphone, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Mic, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  Award, 
  MessageSquare,
  Compass
} from "lucide-react";

interface DeviceOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function DeviceOnboardingTour({ isOpen, onClose, lang }: DeviceOnboardingTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      icon: <Smartphone className="w-12 h-12 text-emerald-600 animate-bounce" />,
      title: lang === 'en' ? "Open on Any Mobile Device" : "किसी भी मोबाइल पर तुरंत चालू करें",
      description: lang === 'en' 
        ? "No heavy App Store or Play Store downloads needed! Just scan the QR code or share the URL, open it in Chrome/Safari on your phone, and tap 'Add to Home Screen' to use it like a native app."
        : "कोई भारी ऐप स्टोर या प्ले स्टोर डाउनलोड करने की ज़रूरत नहीं! बस अपने फोन के क्रोम या सफारी ब्राउज़र में लिंक खोलें और 'Add to Home Screen' पर क्लिक करें।",
      steps: lang === 'en' ? [
        "Open link on Safari or Chrome on your phone",
        "Tap the 'Share' or 'Menu' icon",
        "Select 'Add to Home Screen' for instant 1-tap launch!"
      ] : [
        "अपने फ़ोन के सफारी या क्रोम ब्राउज़र में लिंक खोलें",
        "शेयर (Share) या तीन बिंदुओं (Menu) वाले विकल्प पर क्लिक करें",
        "स्क्रीन पर तुरंत ऐप की तरह चलाने के लिए 'Add to Home Screen' चुनें!"
      ]
    },
    {
      icon: <div className="flex space-x-3 items-center">
        <Camera className="w-10 h-10 text-emerald-500" />
        <Mic className="w-10 h-10 text-emerald-600 animate-pulse" />
      </div>,
      title: lang === 'en' ? "Zero Typing: Just Speak or Snap!" : "बिना टाइपिंग: बस बोलें या फ़ोटो लें!",
      description: lang === 'en'
        ? "Local citizens don't need to fill long forms. Reporting a pothole or garbage pile takes only 3 seconds using our Gemini AI voice analyzer."
        : "नागरिकों को लंबे फॉर्म भरने की जरूरत नहीं है। हमारे जेमिनी एआई वॉयस एनालाइज़र की मदद से आप सिर्फ 3 सेकंड में शिकायत दर्ज कर सकते हैं।",
      steps: lang === 'en' ? [
        "Go to 'Report Issue' tab",
        "Tap 'Tap to Speak' and say 'Huge pothole on Sector 15 road'",
        "Or simply upload a photo — AI automatically categorizes and locates it!"
      ] : [
        "'समस्या दर्ज करें' (Report Issue) टैब पर जाएं",
        "माइक बटन दबाएं और बोलें: 'सेक्टर 15 रोड पर बड़ा गड्ढा है'",
        "या बस एक फोटो अपलोड करें — एआई अपने आप जगह और श्रेणी चुन लेगा!"
      ]
    },
    {
      icon: <MapPin className="w-12 h-12 text-emerald-600" />,
      title: lang === 'en' ? "Easy 1-Tap Map Tracking & Votes" : "नक्शे पर 1-टैप ट्रैकिंग और वोट",
      description: lang === 'en'
        ? "Check existing local complaints in your Sector at a glance. You don't need to report duplicate issues — just upvote to alert officials!"
        : "अपने क्षेत्र की सभी समस्याओं को एक नज़र में देखें। एक ही समस्या दोबारा दर्ज करने की ज़रूरत नहीं है — बस वोट करें!",
      steps: lang === 'en' ? [
        "Open 'Interactive Map' to see color-coded problem dots",
        "Green dots are Resolved, red/orange are open problems",
        "Tap any dot to upvote or verify it to earn community reward points (+15 Pts)"
      ] : [
        "सभी रंगीन समस्या बिंदुओं को देखने के लिए 'इंटरैक्टिव नक्शा' खोलें",
        "हरे बिंदु हल की गई और लाल/नारंगी खुली हुई समस्याएं हैं",
        "किसी भी बिंदु पर टैप करें और उसे सत्यापित (Verify) करके अंक (+15 Pts) कमाएं"
      ]
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-emerald-600" />,
      title: lang === 'en' ? "Meet HeroBot: Your 24/7 Companion" : "हीरोबॉट: आपका 24/7 मददगार साथी",
      description: lang === 'en'
        ? "Too busy or confused? Tap HeroBot on the bottom right. Ask in simple English or Hindi about any local problem, leaderboard status, or points."
        : "जल्दी में हैं या कुछ समझ नहीं आ रहा? नीचे दाईं ओर 'हीरोबॉट' पर टैप करें। सरल हिंदी या अंग्रेजी में अपनी समस्या या अंकों के बारे में पूछें।",
      steps: lang === 'en' ? [
        "Tap the green floating 'HeroBot' button at the bottom right",
        "Ask 'What is status of sector 15 repair?' or 'How can I earn badges?'",
        "HeroBot answers immediately, bilingual and super friendly!"
      ] : [
        "नीचे दाईं ओर तैरते हुए हरे 'हीरोबॉट' बटन पर टैप करें",
        "पूछें 'सेक्टर 15 की समस्या कब हल होगी?' या 'मुझे बैज कैसे मिलेंगे?'",
        "हीरोबॉट तुरंत सरल हिंदी और अंग्रेजी में जवाब देगा!"
      ]
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col relative max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress header bar */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-5.5 h-5.5 text-emerald-600 animate-spin-slow" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm font-mono uppercase tracking-wider">
              {lang === 'en' ? "Quick Device Setup Guide" : "त्वरित मोबाइल गाइड & जानकारी"}
            </span>
          </div>
          <span className="font-mono text-sm font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Slide Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          <div className="flex justify-center py-4">
            {slides[currentSlide].icon}
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              {slides[currentSlide].title}
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed max-w-md mx-auto">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Bullet steps card */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100/80 dark:border-slate-800/60 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              {lang === 'en' ? "How to use" : "इस्तेमाल करने का आसान तरीका"}
            </h4>
            <ul className="space-y-3">
              {slides[currentSlide].steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-3 text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
              currentSlide === 0 
                ? 'opacity-0 pointer-events-none' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{lang === 'en' ? 'Back' : 'पीछे'}</span>
          </button>

          {/* Micro dots */}
          <div className="flex space-x-2">
            {slides.map((_, i) => (
              <span 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide ? 'bg-emerald-600 w-4' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center space-x-2 shadow transition-all"
          >
            <span>{currentSlide === slides.length - 1 ? (lang === 'en' ? 'Start Using!' : 'चलो शुरू करें!') : (lang === 'en' ? 'Next' : 'आगे')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
