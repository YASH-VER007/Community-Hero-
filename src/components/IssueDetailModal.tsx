import React, { useState } from "react";
import { 
  X, 
  MapPin, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Heart, 
  Users, 
  Sparkles, 
  MessageSquare, 
  Upload, 
  Shield,
  Activity,
  Award,
  Building,
  User,
  Check,
  Eye,
  FileCheck2,
  Calendar,
  Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Issue, Comment, UserRole, IssueStatus } from "../types";

interface IssueDetailModalProps {
  issue: Issue;
  currentUser: { id: string; name: string; role: UserRole };
  onClose: () => void;
  onRefresh: () => void;
  lang: 'en' | 'hi';
}

export default function IssueDetailModal({ issue, currentUser, onClose, onRefresh, lang }: IssueDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Verification evidence states
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);

  // Municipal Officer resolution states
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionProof, setResolutionProof] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<IssueStatus>(issue.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Convert evidence image file to base64
  const handleEvidenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenceImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Convert resolution proof image file to base64
  const handleResolutionProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionProof(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);

  const handleThresholdChange = async (newThreshold: number) => {
    setIsUpdatingThreshold(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/verification-threshold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: newThreshold })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error updating threshold:", err);
    } finally {
      setIsUpdatingThreshold(false);
    }
  };

  // Trigger upvote API
  const handleUpvote = async () => {
    setIsUpvoting(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpvoting(false);
    }
  };

  // Trigger verification API
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          evidenceImageUrl: evidenceImage || "",
          description: evidenceText || "Citizen confirmation"
        })
      });
      if (res.ok) {
        setEvidenceText("");
        setEvidenceImage(null);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  // Trigger comment API
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          text: commentText
        })
      });
      if (res.ok) {
        setCommentText("");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Trigger Official Status resolution API
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      const payload = {
        status: targetStatus,
        progress: targetStatus === "Resolved" ? 100 : targetStatus === "In Progress" ? 60 : targetStatus === "Assigned" ? 40 : 15,
        assignedOfficerId: currentUser.role === 'officer' ? currentUser.id : undefined,
        assignedOfficerName: currentUser.role === 'officer' ? currentUser.name : undefined,
        resolutionProofUrl: resolutionProof || undefined,
        resolutionComment: resolutionComment || undefined
      };

      const res = await fetch(`/api/issues/${issue.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setResolutionComment("");
        setResolutionProof(null);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColorClass = (st: typeof issue.status) => {
    switch (st) {
      case "Reported": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Verified": return "bg-sky-100 text-sky-800 border-sky-200";
      case "Assigned": return "bg-purple-100 text-purple-800 border-purple-200";
      case "In Progress": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Resolved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Closed": return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Lifecycle levels
  const steps: { label: string; key: typeof issue.status }[] = [
    { label: lang === 'en' ? "Reported" : "दर्ज", key: "Reported" },
    { label: lang === 'en' ? "Verified" : "सत्यापित", key: "Verified" },
    { label: lang === 'en' ? "Assigned" : "नियुक्त", key: "Assigned" },
    { label: lang === 'en' ? "In Progress" : "चालू", key: "In Progress" },
    { label: lang === 'en' ? "Resolved" : "समाधानित", key: "Resolved" },
    { label: lang === 'en' ? "Closed" : "बंद", key: "Closed" }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === issue.status);

  const getDepartmentName = (cat: string) => {
    switch (cat) {
      case 'Pothole':
      case 'Road Damage':
        return lang === 'en' ? "Municipal Road & Highway Commission" : "नगर सड़क और राजमार्ग आयोग";
      case 'Garbage':
      case 'Garbage Collection':
      case 'Drainage Problem':
        return lang === 'en' ? "Sanitation & Waste Utilities Authority" : "स्वच्छता और अपशिष्ट उपयोगिता प्राधिकरण";
      case 'Water Leakage':
        return lang === 'en' ? "Metropolitan Water Board & Sewerage" : "महानगर जल बोर्ड और सीवरेज";
      case 'Street Light Problem':
      case 'Streetlight Failure':
      case 'Traffic Signal':
      case 'Traffic Signal Issue':
        return lang === 'en' ? "Department of Grid Electricals & Lights" : "ग्रिड इलेक्ट्रिकल और लाइट विभाग";
      case 'Public Safety':
        return lang === 'en' ? "Civic Protection & Safety Unit" : "नागरिक सुरक्षा और सुरक्षा इकाई";
      default:
        return lang === 'en' ? "Municipal Services Desk" : "नगर पालिका सेवा डेस्क";
    }
  };

  const departmentName = issue.aiDepartment || getDepartmentName(issue.category);

  const getStageTimestamp = (stageKey: string) => {
    const history = issue.timelineHistory;
    if (history) {
      if (stageKey === 'Submitted' && history.reportedAt) return history.reportedAt;
      if (stageKey === 'Under Review' && history.verifiedAt) return history.verifiedAt;
      if (stageKey === 'Assigned To Department' && history.assignedAt) return history.assignedAt;
      if (stageKey === 'Work Started' && history.inProgressAt) return history.inProgressAt;
      if (stageKey === 'Resolved' && history.resolvedAt) return history.resolvedAt;
      if (stageKey === 'Citizen Verified' && history.closedAt) return history.closedAt;
    }

    const baseDate = new Date(issue.date || "2026-06-20T10:30:00.000Z");
    const now = new Date();

    const addHours = (date: Date, hours: number) => {
      const d = new Date(date.getTime() + hours * 3600 * 1000);
      return d > now ? now : d;
    };

    switch (stageKey) {
      case 'Submitted':
        return baseDate.toISOString();
      case 'Under Review':
        return (issue.status !== 'Reported') ? addHours(baseDate, 2).toISOString() : undefined;
      case 'Assigned To Department':
        return (['Assigned', 'In Progress', 'Resolved', 'Closed'].includes(issue.status)) ? addHours(baseDate, 6).toISOString() : undefined;
      case 'Work Started':
        return (['In Progress', 'Resolved', 'Closed'].includes(issue.status)) ? addHours(baseDate, 14).toISOString() : undefined;
      case 'Resolved':
        return (['Resolved', 'Closed'].includes(issue.status)) ? (issue.resolvedDate || addHours(baseDate, 24).toISOString()) : undefined;
      case 'Citizen Verified':
        return (issue.status === 'Closed') ? addHours(new Date(issue.resolvedDate || baseDate), 4).toISOString() : undefined;
      default:
        return undefined;
    }
  };

  const getStageStatus = (stageKey: string): 'completed' | 'current' | 'pending' => {
    const statusOrder = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    const currentStatusIndex = statusOrder.indexOf(issue.status);

    const stageMapping: Record<string, number> = {
      'Submitted': 0,
      'Under Review': 1,
      'Assigned To Department': 2,
      'Work Started': 3,
      'Resolved': 4,
      'Citizen Verified': 5,
    };

    const stageIndex = stageMapping[stageKey];
    if (stageIndex < currentStatusIndex) return 'completed';
    if (stageIndex === currentStatusIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      
      {/* Outer container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-955">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-sm font-bold bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 rounded-lg px-2.5 py-1">
              {issue.id}
            </span>
            <span className={`text-xs font-extrabold border rounded-full px-3 py-1 ${getStatusColorClass(issue.status)}`}>
              {issue.status}
            </span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">• Verification Score: <strong className="text-slate-800 dark:text-white">{issue.verificationScore}/100</strong></span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left column: Image & Metadata */}
            <div className="space-y-4">
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <img 
                  src={issue.imageUrl} 
                  alt={issue.title} 
                  className="w-full h-64 object-cover" 
                />
                <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur text-white px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span> Noida Sector Grid</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {issue.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center space-x-1.5">
                  <span>Reported by <strong>{issue.reporterName}</strong></span>
                  <span>• {new Date(issue.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </p>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {issue.description}
                </div>
              </div>

              {/* Location Detail block */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                <MapPin className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{lang === 'en' ? 'Address details' : 'पता विवरण'}</h4>
                  <p>{issue.coordinates.address}</p>
                </div>
              </div>

              {/* GEMINI STRUCTURAL TAGS */}
              {issue.aiSummary && (
                <div className="bg-[#1D1D1F] text-white p-5 rounded-3xl space-y-4 border border-slate-800">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs font-mono tracking-wider uppercase">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>Gemini AI Structural Recommendation Analysis</span>
                  </div>
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <strong className="text-slate-400 uppercase text-[10px] font-mono tracking-widest block">AI Problem Synthesis</strong>
                      <p className="text-slate-200 italic">"{issue.aiSummary}"</p>
                    </div>
                    <div>
                      <strong className="text-slate-400 uppercase text-[10px] font-mono tracking-widest block">Suggested Engineering Action</strong>
                      <p className="text-slate-200">{issue.aiSuggestedAction}</p>
                    </div>
                    <div>
                      <strong className="text-slate-400 uppercase text-[10px] font-mono tracking-widest block">Estimated Civic Benefit</strong>
                      <p className="text-slate-200">{issue.aiEstimatedImpact}</p>
                    </div>
                    {issue.aiDepartment && (
                      <div>
                        <strong className="text-slate-400 uppercase text-[10px] font-mono tracking-widest block">Suggested Department Routing</strong>
                        <p className="text-slate-200 font-bold flex items-center space-x-1.5 mt-0.5">
                          <span>🏛️ {issue.aiDepartment}</span>
                          {issue.aiConfidence && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono px-1.5 py-0.5 rounded font-black tracking-wide">
                              {issue.aiConfidence}% CONFIDENCE
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Right column: Timeline, Voting, Comments, and Actions */}
            <div className="space-y-6">
              
              {/* 1. LIFECYCLE TIMELINE TRACKING */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>{lang === 'en' ? 'Civic Resolution Timeline' : 'नागरिक समाधान समयरेखा'}</span>
                  </h3>
                  <span className="text-[10px] font-mono font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-2 py-0.5 rounded-full">
                    {lang === 'en' ? 'TRANSPARENCY HUB' : 'पारदर्शिता केंद्र'}
                  </span>
                </div>

                <div className="space-y-6 relative pl-5.5 border-l-2 border-slate-200 dark:border-slate-800 ml-3 pt-2">
                  {[
                    {
                      key: 'Submitted',
                      label: lang === 'en' ? 'Submitted' : 'शिकायत दर्ज',
                      description: lang === 'en' ? 'Complaint successfully logged onto city portal.' : 'शिकायत सफलतापूर्वक नागरिक पोर्टल पर दर्ज की गई।',
                      icon: Check,
                      color: 'blue'
                    },
                    {
                      key: 'Under Review',
                      label: lang === 'en' ? 'Under Review' : 'समीक्षा के तहत',
                      description: lang === 'en' ? 'Verification checks initiated by community volunteers.' : 'सामुदायिक स्वयंसेवकों द्वारा सत्यापन प्रक्रिया शुरू की गई।',
                      icon: Eye,
                      color: 'yellow'
                    },
                    {
                      key: 'Assigned To Department',
                      label: lang === 'en' ? 'Assigned To Department' : 'विभाग को सौंपा गया',
                      description: lang === 'en' ? 'Routed for official administrative resolution.' : 'आधिकारिक प्रशासनिक समाधान के लिए प्रेषित।',
                      icon: Building,
                      color: 'yellow'
                    },
                    {
                      key: 'Work Started',
                      label: lang === 'en' ? 'Work Started' : 'कार्य आरंभ',
                      description: lang === 'en' ? 'Physical repairs and engineering deployment active.' : 'भौतिक मरम्मत और इंजीनियरिंग तैनाती सक्रिय है।',
                      icon: Activity,
                      color: 'yellow'
                    },
                    {
                      key: 'Resolved',
                      label: lang === 'en' ? 'Resolved' : 'समाधानित',
                      description: lang === 'en' ? 'Official resolution posted with photo proof.' : 'तस्वीर प्रमाण के साथ आधिकारिक समाधान पोस्ट किया गया।',
                      icon: CheckCircle,
                      color: 'green'
                    },
                    {
                      key: 'Citizen Verified',
                      label: lang === 'en' ? 'Citizen Verified' : 'नागरिक सत्यापित',
                      description: lang === 'en' ? 'Citizen verified the resolution and closed the case.' : 'नागरिक ने समाधान को सत्यापित किया और मामला बंद कर दिया।',
                      icon: Award,
                      color: 'green'
                    }
                  ].map((st, sIdx) => {
                    const statusState = getStageStatus(st.key);
                    const isCompleted = statusState === 'completed';
                    const isCurrent = statusState === 'current';
                    const isPending = statusState === 'pending';
                    const timestamp = getStageTimestamp(st.key);

                    let dotColorClass = '';
                    let ringColorClass = '';
                    let textColorClass = '';
                    let cardBgClass = '';

                    if (isPending) {
                      dotColorClass = 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700';
                      ringColorClass = 'ring-transparent';
                      textColorClass = 'text-slate-400';
                      cardBgClass = 'bg-slate-100/40 dark:bg-slate-900/20 opacity-50';
                    } else if (isCurrent) {
                      if (st.color === 'green') {
                        dotColorClass = 'bg-emerald-600 text-white border-emerald-500';
                        ringColorClass = 'ring-4 ring-emerald-100 dark:ring-emerald-950/50';
                        textColorClass = 'text-emerald-800 dark:text-emerald-400';
                        cardBgClass = 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30';
                      } else if (st.color === 'blue') {
                        dotColorClass = 'bg-blue-600 text-white border-blue-500';
                        ringColorClass = 'ring-4 ring-blue-100 dark:ring-blue-950/50';
                        textColorClass = 'text-blue-800 dark:text-blue-400';
                        cardBgClass = 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30';
                      } else {
                        dotColorClass = 'bg-amber-500 text-white border-amber-400';
                        ringColorClass = 'ring-4 ring-amber-100 dark:ring-amber-950/50';
                        textColorClass = 'text-amber-800 dark:text-amber-400';
                        cardBgClass = 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30';
                      }
                    } else {
                      if (st.color === 'green') {
                        dotColorClass = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/60';
                        textColorClass = 'text-slate-800 dark:text-slate-200';
                        cardBgClass = 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800';
                      } else if (st.color === 'blue') {
                        dotColorClass = 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-900/60';
                        textColorClass = 'text-slate-800 dark:text-slate-200';
                        cardBgClass = 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800';
                      } else {
                        dotColorClass = 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900/60';
                        textColorClass = 'text-slate-800 dark:text-slate-200';
                        cardBgClass = 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800';
                      }
                    }

                    const IconComponent = st.icon;

                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: sIdx * 0.08 }}
                        key={st.key} 
                        className="relative"
                      >
                        <span className={`absolute -left-[32px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center ring-offset-2 dark:ring-offset-slate-950 ${dotColorClass} ${ringColorClass} transition-all duration-300 shrink-0 z-10`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </span>

                        <div className={`p-4 rounded-2xl border transition-all duration-200 ${cardBgClass}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <span className={`font-black tracking-tight text-sm ${textColorClass}`}>
                              {st.label}
                            </span>
                            {timestamp && (
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {st.description}
                          </p>

                          {!isPending && (
                            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/40 space-y-3">
                              {st.key === 'Submitted' && (
                                <div className="flex items-center space-x-3.5">
                                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm relative group">
                                    <img src={issue.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="Before" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="text-xs">
                                    <p className="font-bold text-slate-700 dark:text-slate-300">{lang === 'en' ? 'Original Evidence Photo' : 'मूल साक्ष्य फोटो'}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Size: ~140KB • PNG format</p>
                                  </div>
                                </div>
                              )}

                              {st.key === 'Under Review' && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-slate-100/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/20">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">{lang === 'en' ? 'Verification Index' : 'सत्यापन सूचकांक'}</span>
                                    <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">{issue.verificationScore}/100 Score</p>
                                  </div>
                                  <div className="bg-slate-100/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/20">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">{lang === 'en' ? 'Citizen Signatures' : 'नागरिक हस्ताक्षर'}</span>
                                    <p className="font-extrabold text-slate-800 dark:text-white text-sm mt-0.5">{issue.verifications} Verified Signatures</p>
                                  </div>
                                </div>
                              )}

                              {st.key === 'Assigned To Department' && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-755 dark:text-slate-300">
                                    <Building className="w-4 h-4 text-indigo-500" />
                                    <span>{departmentName}</span>
                                  </div>
                                  <div className="flex items-center space-x-2.5 bg-slate-100/40 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/10">
                                    <div className="w-6.5 h-6.5 rounded-full bg-slate-200 dark:bg-slate-850 border border-slate-350 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                      <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">{lang === 'en' ? 'Assigned Officer' : 'नियुक्त अधिकारी'}</span>
                                      <p className="font-bold text-slate-850 dark:text-slate-150">{issue.assignedOfficerName || (lang === 'en' ? "Awaiting Command Desk Assignment" : "कमांड डेस्क आवंटन की प्रतीक्षा")}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {st.key === 'Work Started' && (
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between font-bold text-[11px] text-slate-650 dark:text-slate-300">
                                    <span>{lang === 'en' ? 'Engineering Progress' : 'इंजीनियरिंग प्रगति'}</span>
                                    <span className="font-mono text-amber-500">{issue.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }} 
                                      animate={{ width: `${issue.progress}%` }} 
                                      transition={{ duration: 0.8, ease: "easeOut" }} 
                                      className="bg-amber-500 h-full rounded-full" 
                                    />
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                    🔧 {lang === 'en' ? 'Materials and field teams synchronized. Live telemetry online.' : 'सामग्री और क्षेत्र टीमें सिंक्रनाइज़ की गईं। लाइव टेलीमेट्री ऑनलाइन।'}
                                  </div>
                                </div>
                              )}

                              {st.key === 'Resolved' && (
                                <div className="space-y-3 text-xs">
                                  {issue.resolutionComment && (
                                    <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 p-2.5 rounded-xl text-slate-800 dark:text-slate-200 italic leading-relaxed">
                                      "{issue.resolutionComment}"
                                    </div>
                                  )}
                                  
                                  <div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">{lang === 'en' ? 'Before & After Comparison' : 'पहले और बाद का तुलनात्मक साक्ष्य'}</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-20 shadow-sm">
                                        <img src={issue.imageUrl} className="w-full h-full object-cover" alt="Before" referrerPolicy="no-referrer" />
                                        <div className="absolute top-1 left-1.5 bg-red-650/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                                          {lang === 'en' ? 'Before' : 'पहले'}
                                        </div>
                                      </div>
                                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-20 shadow-sm">
                                        <img 
                                          src={issue.resolutionProofUrl || "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=600&q=80"} 
                                          className="w-full h-full object-cover" 
                                          alt="After" 
                                          referrerPolicy="no-referrer" 
                                        />
                                        <div className="absolute top-1 left-1.5 bg-emerald-650/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                                          {lang === 'en' ? 'After' : 'बाद में'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {st.key === 'Citizen Verified' && (
                                <div className="text-[11px] text-slate-600 dark:text-slate-350 bg-emerald-500/5 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/10">
                                  <p className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
                                    <Sparkle className="w-3.5 h-3.5 animate-spin" />
                                    <span>{lang === 'en' ? 'Case Closed with Honor Badges' : 'मामला सम्मान बैज के साथ बंद हुआ'}</span>
                                  </p>
                                  <p className="mt-1">{lang === 'en' ? 'Reporter rewarded +50 Points. Citizen review completes verification audit.' : 'रिपोर्टर को +50 पॉइंट मिले। नागरिक समीक्षा ने सत्यापन ऑडिट पूरा किया।'}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* 2. ACTIONS PANEL: VOTE AND VERIFY */}
              <div className="flex gap-3">
                
                {/* Upvote */}
                <button
                  type="button"
                  onClick={handleUpvote}
                  disabled={isUpvoting}
                  className={`flex-1 py-3.5 border rounded-xl flex items-center justify-center space-x-2.5 text-sm font-bold transition-all ${
                    issue.upvotedBy.includes(currentUser.id)
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${issue.upvotedBy.includes(currentUser.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  <span>{issue.upvotedBy.includes(currentUser.id) ? 'Upvoted' : 'Upvote'} ({issue.upvotes})</span>
                </button>

                {/* Verify click check */}
                {!issue.verifiedBy.includes(currentUser.id) && (
                  <button
                    onClick={() => {
                      document.getElementById("community-verification-hub")?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 text-xs transition-all shadow-sm"
                  >
                    <Users className="w-4 h-4 text-white" />
                    <span>{lang === 'en' ? 'Verify Issue (+15 Pts)' : 'मुद्दे को सत्यापित करें'}</span>
                  </button>
                )}
              </div>

              {/* 3. COMMUNITY VERIFICATION HUB */}
              <div id="community-verification-hub" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <Users className="w-4 h-4" />
                      <span>{lang === 'en' ? 'Civic Auditing' : 'नागरिक ऑडिटिंग'}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-0.5">
                      {lang === 'en' ? 'Community Verification Hub' : 'सामुदायिक सत्यापन केंद्र'}
                    </h4>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold shrink-0">
                    👍 {issue.verifications} {issue.verifications === 1 ? (lang === 'en' ? 'Citizen' : 'नागरिक') : (lang === 'en' ? 'Citizens' : 'नागरिकों')}
                  </div>
                </div>

                {/* Verification Progress Banner */}
                <div className="space-y-2 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      {lang === 'en' ? 'Verification Progress' : 'सत्यापन प्रगति'}
                    </span>
                    <span className="text-slate-900 dark:text-white font-mono">
                      {issue.verifications} / {issue.verificationThreshold || 5} {lang === 'en' ? 'Citizens Verified' : 'नागरिकों द्वारा सत्यापित'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (issue.verifications / (issue.verificationThreshold || 5)) * 100)}%` }}
                    />
                  </div>

                  {/* Configurable Threshold for admin / officer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500 font-semibold">
                      {lang === 'en' ? 'Threshold Target:' : 'लक्ष्य सीमा:'}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <select
                        disabled={isUpdatingThreshold}
                        value={issue.verificationThreshold || 5}
                        onChange={(e) => handleThresholdChange(Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {[2, 3, 5, 10, 15, 20, 30].map(val => (
                          <option key={val} value={val}>{val} {lang === 'en' ? 'Citizens' : 'नागरिक'}</option>
                        ))}
                      </select>
                      {isUpdatingThreshold && (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Community Verified Badge Status */}
                {issue.verifications >= (issue.verificationThreshold || 5) && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 dark:from-amber-500/5 dark:to-emerald-500/5 border border-amber-500/30 p-4 rounded-2xl flex items-center space-x-3 text-xs shadow-sm"
                  >
                    <Award className="w-8 h-8 text-amber-500 shrink-0 animate-bounce" />
                    <div>
                      <span className="font-black text-amber-600 dark:text-amber-400 block tracking-tight text-sm">
                        ✨ {lang === 'en' ? 'Community Verified' : 'समुदाय सत्यापित'} ✨
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        {lang === 'en' 
                          ? 'This issue has reached its civic peer-review threshold and is awarded full community authenticity.'
                          : 'यह मुद्दा नागरिक सहकर्मी-समीक्षा सीमा तक पहुंच गया है और इसे पूर्ण सामुदायिक प्रामाणिकता प्रदान की गई है।'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Latest Verification Stats */}
                {issue.evidence && issue.evidence.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 text-xs space-y-3">
                    <span className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px] block">
                      {lang === 'en' ? 'Latest Verification Audit' : 'नवीनतम सत्यापन ऑडिट'}
                    </span>
                    
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-250">
                            {issue.evidence[issue.evidence.length - 1].userName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            • {new Date(issue.evidence[issue.evidence.length - 1].date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-350 italic">
                          "{issue.evidence[issue.evidence.length - 1].description}"
                        </p>
                      </div>

                      {issue.evidence.some(e => e.imageUrl) && (
                        <div className="shrink-0 space-y-1 text-center">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Photo</span>
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                            <img 
                              src={[...issue.evidence].reverse().find(e => e.imageUrl)?.imageUrl || ""} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              alt="Latest Evidence" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Verification Form Actions */}
                {!issue.verifiedBy.includes(currentUser.id) ? (
                  <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/20 p-4 rounded-2xl space-y-4">
                    <div className="text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-sm">
                        {lang === 'en' ? 'Verify This Issue' : 'इस मुद्दे को सत्यापित करें'}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        {lang === 'en' 
                          ? 'Help fellow citizens and municipal officers. Confirm this issue is genuine to earn +15 Points!'
                          : 'साथी नागरिकों और नगर अधिकारियों की मदद करें। +15 अंक अर्जित करने के लिए पुष्टि करें कि यह मुद्दा वास्तविक है!'}
                      </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-3.5">
                      <textarea
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        placeholder={lang === 'en' ? "Add supporting comments or field notes..." : "सहायक टिप्पणी या फील्ड नोट जोड़ें..."}
                        rows={2}
                        className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEvidenceImageUpload}
                            className="hidden"
                            id="evidence-file-input"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById("evidence-file-input")?.click()}
                            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-semibold flex items-center space-x-2 bg-white dark:bg-slate-950 shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{evidenceImage ? (lang === 'en' ? "Field Image Loaded" : "तस्वीर अपलोड हो गई") : (lang === 'en' ? "Add Field Photo" : "तस्वीर जोड़ें")}</span>
                          </button>
                          
                          {evidenceImage && (
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                              <img src={evidenceImage} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isVerifying}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                        >
                          <span>👍 {lang === 'en' ? 'I Confirm This Issue' : 'मैं इस मुद्दे की पुष्टि करता हूँ'}</span>
                          {isVerifying && (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-500/10 p-4 rounded-2xl flex items-center space-x-3 text-xs">
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-800 dark:text-emerald-400 block">
                        {lang === 'en' ? 'You verified this issue' : 'आपने इस मुद्दे को सत्यापित कर दिया है'}
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'en' 
                          ? 'Thank you! You have earned +15 Points for supporting this civic verification.'
                          : 'धन्यवाद! आपने इस नागरिक सत्यापन का समर्थन करने के लिए +15 अंक अर्जित किए हैं।'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. MUNICIPAL OFFICER CONTROLS (IF LOGGED USER ROLE IS OFFICER/ADMIN) */}
              {(currentUser.role === 'officer' || currentUser.role === 'admin') && (
                <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/40 p-5 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-sm text-emerald-900 dark:text-emerald-400">
                      <Shield className="w-5 h-5 text-emerald-700" />
                      <span>Municipal Official Command Panel</span>
                    </div>
                    <span className="text-xs font-mono bg-emerald-200 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-350 px-2.5 py-1 rounded-lg font-bold uppercase">Officer Access</span>
                  </div>

                  <form onSubmit={handleStatusUpdate} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3.5 text-sm">
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1.5">Update Status</label>
                        <select
                          value={targetStatus}
                          onChange={(e) => setTargetStatus(e.target.value as IssueStatus)}
                          className="w-full p-3 border border-emerald-300 dark:border-emerald-900/40 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1.5">Current Assignment</label>
                        <p className="p-3 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs bg-white dark:bg-slate-900 font-semibold truncate text-slate-850 dark:text-slate-200">
                          {issue.assignedOfficerName || "None Assigned (Click save to assign yourself)"}
                        </p>
                      </div>
                    </div>

                    {/* Resolution Proof Upload fields */}
                    {targetStatus === "Resolved" && (
                      <div className="space-y-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/20">
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1.5">Resolution Comments</label>
                          <textarea
                            value={resolutionComment}
                            onChange={(e) => setResolutionComment(e.target.value)}
                            placeholder="Describe how the problem was repaired (paving crew, water valves spliced, etc.)..."
                            rows={2}
                            className="w-full text-sm p-3 border border-emerald-300 dark:border-emerald-900/40 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-1.5">Resolution Photo Proof</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleResolutionProofUpload}
                            className="hidden"
                            id="resolution-proof-input"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById("resolution-proof-input")?.click()}
                            className="px-4 py-2 border border-emerald-300 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-xs font-bold flex items-center space-x-2 bg-white dark:bg-slate-900"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{resolutionProof ? "Resolution Proof Image Attached" : "Upload Resolution Photo"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-3">
                      <button
                        type="submit"
                        disabled={isUpdatingStatus}
                        className="px-6 py-3 bg-[#1D1D1F] hover:bg-slate-800 text-white rounded-xl text-sm font-extrabold shadow disabled:opacity-40 transition-colors"
                      >
                        Save Commanded Parameters
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 5. USER COMMENTS & FEEDBACK */}
              <div className="space-y-3.5">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center space-x-2.5">
                  <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span>Citizen Discussion Feed ({issue.comments?.length || 0})</span>
                </h3>

                {/* Comments List */}
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {issue.comments && issue.comments.length > 0 ? (
                    issue.comments.map((c: Comment) => (
                      <div key={c.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{c.userName}</span>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
                            {new Date(c.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No comments posted yet. Be the first to share details!</p>
                  )}
                </div>

                {/* Add Comment input form */}
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-45"
                  >
                    Post
                  </button>
                </form>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
