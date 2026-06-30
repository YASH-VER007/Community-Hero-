import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  MapPin, 
  Sparkles, 
  Mic, 
  AlertTriangle, 
  CornerDownRight, 
  ArrowRight,
  HelpCircle,
  FileText
} from "lucide-react";
import { IssueCategory, IssueSeverity } from "../types";
import L from "leaflet";
import { getFallbackAddress, reverseGeocode } from "./InteractiveMap";

interface ReportIssueFormProps {
  userId: string;
  userName: string;
  droppedCoords: { lat: number; lng: number; address: string } | null;
  onSuccess: () => void;
  lang: 'en' | 'hi';
}

export default function ReportIssueForm({ userId, userName, droppedCoords, onSuccess, lang }: ReportIssueFormProps) {
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("Pothole");
  const [severity, setSeverity] = useState<IssueSeverity>("Medium");
  const [address, setAddress] = useState(droppedCoords?.address || "Sector 15, Noida");
  const [lat, setLat] = useState(droppedCoords?.lat || 28.5355);
  const [lng, setLng] = useState(droppedCoords?.lng || 77.3910);

  // Map and Marker references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Synchronize dropped coordinates prop
  useEffect(() => {
    if (droppedCoords) {
      setLat(droppedCoords.lat);
      setLng(droppedCoords.lng);
      setAddress(droppedCoords.address);
      if (mapRef.current) {
        mapRef.current.setView([droppedCoords.lat, droppedCoords.lng], 14);
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([droppedCoords.lat, droppedCoords.lng]);
      }
    }
  }, [droppedCoords]);

  // Handle manual selection re-focus
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 14);
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    // Create Draggable Marker
    const pinIcon = L.divIcon({
      className: 'custom-report-pin',
      html: `
        <div class="relative flex items-center justify-center animate-bounce">
          <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg text-white">
            <span class="text-xs">📍</span>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon })
      .addTo(map);

    markerRef.current = marker;

    // Handle Drag End event
    marker.on("dragend", (e: any) => {
      const position = e.target.getLatLng();
      const newLat = parseFloat(position.lat.toFixed(5));
      const newLng = parseFloat(position.lng.toFixed(5));
      setLat(newLat);
      setLng(newLng);

      reverseGeocode(newLat, newLng, (resolvedAddress) => {
        setAddress(resolvedAddress);
      });
    });

    // Map Click Handler to reposition marker and reverse geocode
    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickedLat = parseFloat(e.latlng.lat.toFixed(5));
      const clickedLng = parseFloat(e.latlng.lng.toFixed(5));
      setLat(clickedLat);
      setLng(clickedLng);

      marker.setLatLng([clickedLat, clickedLng]);

      reverseGeocode(clickedLat, clickedLng, (resolvedAddress) => {
        setAddress(resolvedAddress);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  const [imageFile, setImageFile] = useState<string | null>(null);
  
  // AI Generated placeholders
  const [aiSummary, setAiSummary] = useState("");
  const [aiSuggestedAction, setAiSuggestedAction] = useState("");
  const [aiEstimatedImpact, setAiEstimatedImpact] = useState("");
  const [department, setDepartment] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [analyzedForImage, setAnalyzedForImage] = useState<string | null>(null);

  // Loading states
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isPolishingVoice, setIsPolishingVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger auto-analysis when image is set to guarantee reporting in under 10 seconds
  useEffect(() => {
    if (imageFile && imageFile !== analyzedForImage) {
      handleAIMagicAnalyze(imageFile);
    } else if (!imageFile) {
      setAiSummary("");
      setAiSuggestedAction("");
      setAiEstimatedImpact("");
      setDepartment("");
      setConfidence(null);
      setAnalysisError(null);
      setAnalyzedForImage(null);
    }
  }, [imageFile, analyzedForImage]);

  // Standard Noida Sector Locations for custom select dropdown
  const presetLocations = [
    { address: "Sector 15 Metro Station Approach Road, Noida", lat: 28.5355, lng: 77.3910 },
    { address: "Sector 22 Market Crossing, Block B, Noida", lat: 28.5410, lng: 77.4020 },
    { address: "Sector 19 Commercial Plaza Main Lane, Noida", lat: 28.5290, lng: 77.3820 },
    { address: "Sector 12 Residential Park Sidewalk, Noida", lat: 28.5312, lng: 77.3754 }
  ];

  const handlePresetSelect = (idx: number) => {
    const loc = presetLocations[idx];
    setAddress(loc.address);
    setLat(loc.lat);
    setLng(loc.lng);
  };

  const compressImage = (base64Str: string, maxWidth = 768, maxHeight = 768): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  // Convert uploaded image file to base64
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressed = await compressImage(rawBase64);
        setImageFile(compressed);
      } catch (err) {
        console.error("Compression failed, using original:", err);
        setImageFile(rawBase64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  // Drag-and-drop helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Real voice speech recognition state and error
  const [rawSpeechText, setRawSpeechText] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const recognitionRef = useRef<any>(null);
  const simIntervalRef = useRef<any>(null);
  const latestSpeechTextRef = useRef("");
  const hadErrorRef = useRef(false);

  // Keep latest speech text ref updated to prevent stale closures in browser event callbacks
  React.useEffect(() => {
    latestSpeechTextRef.current = rawSpeechText;
  }, [rawSpeechText]);

  // Clean up all timers and active listeners on unmount
  React.useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Voice report polisher using Gemini API with Real webkitSpeechRecognition
  const handleVoicePolishing = async () => {
    setShowVoiceAssistant(true);
    setSpeechError("");
    setRawSpeechText("");
    hadErrorRef.current = false;

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(lang === 'en' 
        ? "Web Speech API is not supported in this browser. Running interactive simulation below:" 
        : "यह ब्राउज़र वेब स्पीच एपीआई का समर्थन नहीं करता है। नीचे सिम्युलेटर चल रहा है:"
      );
      simulateSpeech();
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = lang === 'en' ? 'en-IN' : 'hi-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setRawSpeechText(currentText);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        hadErrorRef.current = true;
        if (event.error === 'not-allowed') {
          setSpeechError(lang === 'en' 
            ? "Microphone access blocked. Click manual simulation or enable mic permissions." 
            : "माइक एक्सेस ब्लॉक है। कृपया माइक अनुमति सक्षम करें।"
          );
        } else {
          setSpeechError(lang === 'en' ? `Speech Error: ${event.error}` : `त्रुटि: ${event.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Automatically polish transcript on silence timeout if text exists and no error occurred
        if (!hadErrorRef.current) {
          const currentText = latestSpeechTextRef.current;
          if (currentText.trim()) {
            triggerPolishWithText(currentText);
          } else {
            setSpeechError(lang === 'en' ? "No speech detected. Please try again or type manually." : "कोई आवाज़ नहीं मिली।");
          }
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      console.error(e);
      simulateSpeech();
    }
  };

  const handleStopListening = () => {
    // If simulation is running, stop it and polish immediately
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
      setIsListening(false);
      const currentText = latestSpeechTextRef.current;
      if (currentText.trim()) {
        triggerPolishWithText(currentText);
      } else {
        setSpeechError(lang === 'en' ? "No speech detected. Please try again or type manually." : "कोई आवाज़ नहीं मिली।");
      }
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  const simulateSpeech = () => {
    // Stop any active real speech instances first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    setIsListening(true);
    setSpeechError(""); // Clear previous blocked status instantly upon clicking manual simulation!
    setRawSpeechText("");

    const sampleText = lang === 'en'
      ? "yes there is a really deep leakage spraying clean water on sector twelve road next to block market and a big puddle of mud has formed causing heavy traffic jam several children slipped on bicycles please send workers to repair it"
      : "हाँ भैया सेक्टर १२ की सड़क पर बहुत बड़ा रिसाव हो रहा है साफ पीने का पानी बह रहा है और पूरी सड़क कीचड़ से भर गई है गाड़ियों का जाम लग रहा है कई बच्चे साइकिल से गिर गए तुरंत मरम्मत की जरूरत है";

    let words = sampleText.split(" ");
    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        setRawSpeechText(prev => prev + (prev ? " " : "") + words[index]);
        index++;
      } else {
        clearInterval(interval);
        simIntervalRef.current = null;
        setIsListening(false);
        triggerPolishWithText(sampleText);
      }
    }, 120);

    simIntervalRef.current = interval;
  };

  const triggerPolishWithText = async (text: string) => {
    if (!text) return;
    setIsPolishingVoice(true);
    try {
      const res = await fetch("/api/ai/voice-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speechText: text })
      });
      const data = await res.json();
      if (data.title && data.description) {
        setTitle(data.title);
        setDescription(data.description);
      }
    } catch (e) {
      console.error("Failed to polish voice text:", e);
      setTitle(lang === 'en' ? "Water Main Pipeline Rupture" : "पानी की पाइपलाइन रिसाव");
      setDescription(text);
    } finally {
      setIsPolishingVoice(false);
    }
  };

  // Gemini Vision API analyzer
  const handleAIMagicAnalyze = async (imgToAnalyze?: string) => {
    const targetImage = imgToAnalyze || imageFile;
    if (!targetImage) {
      alert(lang === 'en' ? "Please upload an issue image first!" : "कृपया पहले एक समस्या की तस्वीर अपलोड करें!");
      return;
    }

    setIsAnalyzingImage(true);
    setAnalysisError(null);
    setAnalysisStep(0);

    // Set up step-by-step progress simulation for interactive visual excitement
    const interval = setInterval(() => {
      setAnalysisStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 350);

    try {
      const base64Parts = targetImage.split(",");
      const base64Data = base64Parts[1];
      const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";

      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64Data, mimeType })
      });

      if (!res.ok) {
        throw new Error("API responded with code " + res.status);
      }

      const data = await res.json();
      clearInterval(interval);
      setAnalysisStep(5);

      if (data.category) {
        setCategory(data.category);
        setSeverity(data.severity);
        setDepartment(data.department || "");
        setConfidence(data.confidence || 93);
        if (data.title) setTitle(data.title);
        if (data.summary) {
          setAiSummary(data.summary);
          setDescription(data.summary); // pre-populate description with clean summary
        }
        if (data.suggestedAction) setAiSuggestedAction(data.suggestedAction);
        if (data.estimatedImpact) setAiEstimatedImpact(data.estimatedImpact);
        setAnalyzedForImage(targetImage);
      }
    } catch (e: any) {
      clearInterval(interval);
      console.error("AI Magic Analysis failed:", e);
      setAnalysisError(lang === 'en'
        ? "We encountered a temporary connection disruption. Please verify connectivity and retry."
        : "कनेक्शन में समस्या आई। कृपया जांचें और पुनः प्रयास करें।"
      );
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Submit report to server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert(lang === 'en' ? "Please fill out the title and description!" : "कृपया शीर्षक और विवरण भरें!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        category,
        severity,
        coordinates: { lat, lng, address },
        imageUrl: imageFile || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
        reporterId: userId,
        reporterName: userName,
        aiSummary: aiSummary || description.substring(0, 80) + "...",
        aiSuggestedAction: aiSuggestedAction || "Dispatch municipal inspect crew to field coordinates.",
        aiEstimatedImpact: aiEstimatedImpact || "Restores safe vehicular throughput and improves localized structural safety indices.",
        aiDepartment: department,
        aiConfidence: confidence
      };

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert("Failed to submit issue");
      }
    } catch (e) {
      console.error("Submit failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: IssueCategory[] = [
    "Pothole", "Water Leakage", "Streetlight Failure", "Garbage Collection", 
    "Drainage Problem", "Road Damage", "Public Safety", "Traffic Signal", "Others"
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-w-3xl mx-auto animate-in fade-in duration-300 text-slate-800 dark:text-slate-100">
      
      {/* Header with quick voice trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
            {lang === 'en' ? "Report a Hyperlocal Issue" : "नई समस्या दर्ज करें"}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{lang === 'en' ? "Provide photos and descriptive coordinates for municipal repair crews" : "नगर निगम मरम्मत दल के लिए तस्वीरें और विवरण प्रदान करें"}</p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isListening && (
            <button
              type="button"
              onClick={handleStopListening}
              className="px-4 py-2.5 text-xs font-black rounded-xl bg-slate-900 dark:bg-slate-850 border border-slate-700/80 text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              {lang === 'en' ? "Stop & Polish" : "रोकें और एआई पॉलिश करें"}
            </button>
          )}
          <button
            type="button"
            onClick={isListening ? handleStopListening : handleVoicePolishing}
            disabled={isPolishingVoice}
            className={`px-5 py-3 text-sm font-bold rounded-xl border flex items-center space-x-2 transition-all shadow-sm ${
              isListening 
                ? 'bg-red-500 border-red-500 text-white animate-pulse'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'text-white' : 'text-rose-500'}`} />
            <span>
              {isListening 
                ? (lang === 'en' ? "Listening..." : "सुन रहा हूँ...") 
                : isPolishingVoice 
                  ? (lang === 'en' ? "AI Polishing..." : "एआई सुधार रहा है...")
                  : (lang === 'en' ? "Voice Report (AI)" : "आवाज़ से रिपोर्ट करें")
              }
            </span>
          </button>
        </div>
      </div>

      {/* Voice Assistant Transcription Panel */}
      {showVoiceAssistant && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-3 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-indigo-100/50 dark:border-indigo-900/20 pb-2">
            <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-slate-450'}`}></span>
              <span>{lang === 'en' ? "Live Voice Transcription Feed" : "लाइव वॉयस ट्रांसक्रिप्शन फ़ीड"}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowVoiceAssistant(false)}
              className="text-xs text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold"
            >
              {lang === 'en' ? "Close Helper" : "सहायक बंद करें"}
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] text-indigo-550 dark:text-indigo-300 font-black uppercase tracking-wider">
              {lang === 'en' ? "What the app hears you saying (See your words live below):" : "एप्लिकेशन जो सुन रहा है (अपनी आवाज़ को नीचे लाइव देखें):"}
            </p>
            <textarea
              value={rawSpeechText}
              onChange={(e) => setRawSpeechText(e.target.value)}
              placeholder={lang === 'en' ? "Speak clearly into your microphone... Or click 'Simulate Demo Input' to test the AI system!" : "माइक में साफ़ बोलें... या स्वचालित परीक्षण करने के लिए 'डेमो इनपुट' पर क्लिक करें!"}
              className="w-full p-3 border border-indigo-200 dark:border-indigo-900/40 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              rows={3}
            />
          </div>

          {speechError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/20">
              {speechError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={simulateSpeech}
              className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
            >
              {lang === 'en' ? "⚡ Simulate Demo Input" : "⚡ डेमो इनपुट का अनुकरण करें"}
            </button>
            {rawSpeechText.trim() && (
              <button
                type="button"
                onClick={() => triggerPolishWithText(rawSpeechText)}
                disabled={isPolishingVoice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                <span>{isPolishingVoice ? (lang === 'en' ? "Polishing..." : "सुधार रहा है...") : (lang === 'en' ? "✨ Apply AI Polishing" : "✨ एआई पॉलिश लागू करें")}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* IMAGE UPLOAD CONTAINER & DRAG AND DROP */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {lang === 'en' ? "Upload Photo of Problem (तस्वीर)" : "तस्वीर अपलोड करें"}
          </label>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragOver 
                ? 'border-emerald-600 bg-emerald-50/10' 
                : imageFile 
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20' 
                  : 'border-slate-300 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-950'
            }`}
          >
            {imageFile ? (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <img 
                  src={imageFile} 
                  alt="Uploaded issue" 
                  className="max-h-64 w-full object-cover shadow-sm transition-all duration-500" 
                />
                
                {/* AI Laser Scanner Overlay */}
                {isAnalyzingImage && (
                  <div className="absolute inset-0 bg-slate-900/65 flex flex-col items-center justify-center p-4">
                    {/* Laser Line */}
                    <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-[0_0_15px_#10b981] animate-[bounce_2.5s_infinite]"></div>
                    
                    {/* Pulsing Core */}
                    <div className="relative z-10 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-5 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-3">
                      <div className="relative w-12 h-12 flex items-center justify-center bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-6 h-6 animate-spin" />
                      </div>
                      
                      <div className="space-y-1 w-full">
                        <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Gemini Civic Lens</span>
                        <h4 className="text-xs font-bold text-white">
                          {analysisStep === 0 && (lang === 'en' ? "Initializing Gemini model..." : "जेमिनी मॉडल शुरू हो रहा है...")}
                          {analysisStep === 1 && (lang === 'en' ? "Scanning pixels for anomalies..." : "विसंगतियों के लिए स्कैनिंग...")}
                          {analysisStep === 2 && (lang === 'en' ? "Categorizing problem signature..." : "समस्या के प्रकार का वर्गीकरण...")}
                          {analysisStep === 3 && (lang === 'en' ? "Routing responsible department..." : "ज़िम्मेदार विभाग की खोज...")}
                          {analysisStep === 4 && (lang === 'en' ? "Synthesizing civic narrative..." : "शिकायत सारांश तैयार हो रहा है...")}
                        </h4>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                          style={{ width: `${(analysisStep + 1) * 20}%` }}
                        ></div>
                      </div>

                      <span className="text-[9px] text-slate-400 font-mono">STEP {analysisStep + 1} OF 5</span>
                    </div>
                  </div>
                )}
                
                {/* Control buttons overlay below the image */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-250 dark:border-slate-800 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-red-200 dark:border-red-900/40"
                  >
                    {lang === 'en' ? 'Remove Image' : 'तस्वीर हटाएं'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAIMagicAnalyze()}
                    disabled={isAnalyzingImage}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>{lang === 'en' ? "Re-Analyze with AI" : "एआई से पुनः विश्लेषण"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="p-3 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm text-slate-600 dark:text-slate-400">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'en' ? "Drag and drop your image, or click to browse" : "फ़ोटो खींचें या फ़ाइल चुनें"}
                </p>
                <p className="text-xs text-slate-550 dark:text-slate-400">Supports PNG, JPG, JPEG. Auto-location metadata sync ready.</p>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden" 
            />
          </div>
        </div>

        {/* Gemini AI Civic Detection Hub */}
        {(aiSummary || isAnalyzingImage || analysisError) && (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/85 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white font-sans font-bold text-sm">
                <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>{lang === 'en' ? "GEMINI AI CIVIC DETECTION HUB" : "जेमिनी एआई नागरिक जांच केंद्र"}</span>
              </div>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full font-mono animate-pulse uppercase">
                {isAnalyzingImage ? (lang === 'en' ? "ANALYZING" : "विश्लेषण जारी") : (lang === 'en' ? "ACTIVE SECURE" : "सुरक्षित सक्रिय")}
              </span>
            </div>
            
            {isAnalyzingImage ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono text-center max-w-md">
                  <span>{lang === 'en' ? "Gemini is inspecting visual layers, mapping civil hazard categories, estimating severity, and routing the responsible municipal department..." : "जेमिनी विजुअल परतों की जांच कर रहा है, नागरिक खतरों का वर्गीकरण कर रहा है, गंभीरता का आकलन कर रहा है और जिम्मेदार विभाग खोज रहा है..."}</span>
                </div>
              </div>
            ) : analysisError ? (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-rose-800 dark:text-rose-400 text-sm leading-relaxed">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">{lang === 'en' ? "AI Analysis Disrupted" : "एआई विश्लेषण बाधित"}</span>
                    <span className="text-xs">{analysisError}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAIMagicAnalyze()}
                  className="px-4 py-2 shrink-0 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  {lang === 'en' ? "Retry Analysis" : "पुनः प्रयास करें"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Visual Indicators Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* Category Detection Card */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">Detected Category</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🛠️</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{category}</span>
                    </div>
                  </div>

                  {/* Severity Estimation Card */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">Estimated Severity</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">⚠️</span>
                      <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-md ${
                        severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                        severity === 'High' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        severity === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {severity}
                      </span>
                    </div>
                  </div>

                  {/* Department suggestion Card */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">Suggested Department</span>
                    <div className="flex items-center space-x-1.5 overflow-hidden">
                      <span className="text-sm">🏛️</span>
                      <span className="font-bold text-slate-900 dark:text-white text-[10px] truncate" title={department}>
                        {department || (lang === 'en' ? "Not detected" : "पता नहीं चला")}
                      </span>
                    </div>
                  </div>

                  {/* Confidence Gauge Card */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-1">AI Confidence Score</span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">📈</span>
                        <span className="font-black text-slate-900 dark:text-white text-xs">{confidence ? `${confidence}%` : "92%"}</span>
                      </div>
                      <div className="w-8 h-1 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden shrink-0 ml-1">
                        <div 
                          className={`h-full rounded-full ${
                            (confidence || 92) >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${confidence || 92}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Tactical Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[9px] tracking-wider block font-sans">AI Structural Summary</span>
                    <p className="italic">"{aiSummary}"</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[9px] tracking-wider block font-sans">Suggested Action Plan</span>
                    <p>{aiSuggestedAction}</p>
                  </div>
                </div>

                <p className="text-[9px] text-slate-500 text-center italic">
                  {lang === 'en' ? "AI parameters are pre-filled instantly for speed. You may adjust and refine any field in the manual editor below." : "त्वरित गति के लिए एआई मापदंड तुरंत पहले से भरे गए हैं। आप नीचे मैन्युअल संपादक में किसी भी क्षेत्र को समायोजित और परिष्कृत कर सकते हैं।"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* MAIN FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Complaint Title' : 'शीर्षक'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === 'en' ? "e.g., Severe Pothole near Sector 15 Highway Exit" : "जैसे, सेक्टर 15 राजमार्ग के पास गड्ढा"}
                className="w-full px-4 py-3.5 text-sm border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Category' : 'श्रेणी'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full p-3.5 border border-slate-300 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900">{cat}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Severity Index' : 'तीव्रता'}
              </label>
              <div className="flex gap-2">
                {(["Critical", "High", "Medium", "Low"] as IssueSeverity[]).map(sev => (
                  <button
                    type="button"
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${
                      severity === sev
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Department */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Responsible Department' : 'ज़िम्मेदार विभाग'}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={lang === 'en' ? "e.g., Roads & Infrastructure Department" : "जैसे, लोक निर्माण विभाग"}
                className="w-full px-4 py-3.5 text-sm border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Detailed Description' : 'विस्तृत विवरण'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder={lang === 'en' ? "Please describe the size, impact, and safety hazards..." : "विवरण दर्ज करें..."}
                className="w-full px-4 py-3.5 text-sm border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
              />

              {rawSpeechText && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>{lang === 'en' ? "Your Spoken Words (Unpolished):" : "आपकी मूल आवाज़ इनपुट:"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDescription(rawSpeechText)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-extrabold text-[10px] uppercase tracking-wider"
                    >
                      {lang === 'en' ? "Use Raw Speech" : "मूल आवाज़ का उपयोग करें"}
                    </button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-900 font-medium">
                    "{rawSpeechText}"
                  </p>
                </div>
              )}
            </div>

            {/* Location Address */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Problem Location Address' : 'समस्या स्थल का पता'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3.5 text-sm border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
              />
            </div>
          </div>

        </div>

        {/* LIVE OPENSTREETMAP FOR LOCATION AREAS */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {lang === 'en' ? 'Select Location on Live Map' : 'लाइव नक्शे पर स्थान चुनें'}
            </label>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full font-mono animate-pulse">
              {lang === 'en' ? 'Drag Marker or Click Map to Update Location' : 'पिन खींचें या जीपीएस बदलने के लिए नक्शे पर क्लिक करें'}
            </span>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 relative bg-slate-50 dark:bg-slate-950 shadow-inner z-0">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isPolishingVoice || isAnalyzingImage}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            id="submit-report-form"
          >
            <span>{isSubmitting ? (lang === 'en' ? "Logging complaint..." : "दर्ज हो रहा है...") : (lang === 'en' ? "Log Public Complaint" : "शिकायत दर्ज करें")}</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>

      </form>

    </div>
  );
}
