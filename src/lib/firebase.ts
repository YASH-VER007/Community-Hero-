import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment, 
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";

// Firebase Applet Configuration loaded dynamically
const firebaseConfig = {
  apiKey: "AIzaSyCWisdEy5b1veVaB5Xx2ApX5yUpdAlPP60",
  authDomain: "hazel-galaxy-953sn.firebaseapp.com",
  projectId: "hazel-galaxy-953sn",
  storageBucket: "hazel-galaxy-953sn.firebasestorage.app",
  messagingSenderId: "894277799235",
  appId: "1:894277799235:web:3e1965b2028a7e901a33f6",
  firestoreDatabaseId: "ai-studio-777115b2-4a0c-4eec-bd31-651629c70881"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Define Helper: Detect user location from browser timezone or IP-based hints
const getDeviceDetails = () => {
  const ua = navigator.userAgent;
  let deviceType = "Desktop";
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = "Tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) {
    deviceType = "Mobile";
  }

  let browserType = "Unknown Browser";
  if (ua.indexOf("Firefox") > -1) browserType = "Firefox";
  else if (ua.indexOf("SamsungBrowser") > -1) browserType = "Samsung Browser";
  else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browserType = "Opera";
  else if (ua.indexOf("Trident") > -1) browserType = "Internet Explorer";
  else if (ua.indexOf("Edge") > -1) browserType = "Microsoft Edge";
  else if (ua.indexOf("Chrome") > -1) browserType = "Google Chrome";
  else if (ua.indexOf("Safari") > -1) browserType = "Apple Safari";

  const userLocation = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown Location";

  return { deviceType, browserType, userLocation };
};

// Generate referral code based on email or random characters
const generateReferralCode = (email: string) => {
  const prefix = email.split("@")[0].substring(0, 4).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${rand}`;
};

// Update/Log User Profile in Firestore with visit statistics and gamification
export const syncUserProfile = async (firebaseUser: FirebaseUser, fullName?: string, referredByCode?: string) => {
  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    let userDoc;
    try {
      userDoc = await getDoc(userRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
      return null;
    }
    const { deviceType, browserType, userLocation } = getDeviceDetails();
    const nowStr = new Date().toISOString();

    let referralCode = generateReferralCode(firebaseUser.email || "hero");

    if (!userDoc.exists()) {
      // 1. Initial Visit/Registration setup
      const initialPoints = 100; // starting gift
      const pointsLog: any[] = [{ amount: initialPoints, reason: "Registration Welcome Gift", date: nowStr }];
      
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: fullName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Anonymous Hero",
        role: firebaseUser.email?.toLowerCase() === "yashverma2123@gmail.com" ? "admin" : "citizen",
        points: initialPoints,
        badges: ["Citizen Onboarded"],
        joinedDate: nowStr,
        lastLoginTime: nowStr,
        avatar: firebaseUser.photoURL || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&w=120&h=120&q=80`,
        phone: firebaseUser.phoneNumber || "",
        referralCode: referralCode,
        referredBy: referredByCode || "",
        totalReferrals: 0,
        loginCount: 1,
        deviceType,
        browserType,
        userLocation,
        firstVisitTime: nowStr,
        lastVisitTime: nowStr,
        totalVisits: 1,
        loginHistory: [nowStr],
        pointsHistory: pointsLog
      };

      try {
        await setDoc(userRef, userData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }

      // 2. Track Referral if provided
      if (referredByCode) {
        await handleReferralLinking(firebaseUser.uid, referredByCode, userData.name);
      }

      // Log registration analytics
      await logAnalyticsEvent(firebaseUser.uid, "registration", { email: firebaseUser.email });
      return userData;
    } else {
      // 1. Returning user login updates
      const currentData = userDoc.data();
      const loginHistory = currentData.loginHistory || [];
      loginHistory.push(nowStr);

      const updatedData = {
        lastLoginTime: nowStr,
        lastVisitTime: nowStr,
        loginCount: (currentData.loginCount || 0) + 1,
        totalVisits: (currentData.totalVisits || 0) + 1,
        loginHistory,
        deviceType,
        browserType,
        userLocation
      };

      try {
        await updateDoc(userRef, updatedData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }
      
      // Log login event
      await logAnalyticsEvent(firebaseUser.uid, "login", { email: firebaseUser.email });
      
      return { ...currentData, ...updatedData };
    }
  } catch (error) {
    console.error("Error syncing user profile with firestore:", error);
    return null;
  }
};

// Handle Referral System logic: connect users and distribute referral points
const handleReferralLinking = async (newUserId: string, referrerCode: string, newUserName: string) => {
  try {
    // Locate the referrer
    const q = query(collection(db, "users"), where("referralCode", "==", referrerCode));
    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "users_by_referral");
      return;
    }
    
    if (!querySnapshot.empty) {
      const referrerDoc = querySnapshot.docs[0];
      const referrerData = referrerDoc.data();
      const referrerId = referrerDoc.id;
      const nowStr = new Date().toISOString();

      // Update referrer user model: award 100 points
      const referrerPoints = (referrerData.points || 0) + 100;
      const pointsHistory = referrerData.pointsHistory || [];
      pointsHistory.push({ amount: 100, reason: `Referred ${newUserName}`, date: nowStr });

      const newReferralCount = (referrerData.totalReferrals || 0) + 1;
      const badges = referrerData.badges || [];
      if (newReferralCount >= 1 && !badges.includes("Community Evangelist")) {
        badges.push("Community Evangelist");
      }
      if (newReferralCount >= 5 && !badges.includes("Referral Guru")) {
        badges.push("Referral Guru");
      }

      try {
        await updateDoc(doc(db, "users", referrerId), {
          points: referrerPoints,
          totalReferrals: newReferralCount,
          pointsHistory,
          badges
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${referrerId}`);
      }

      // Insert new entry inside referrals database collection
      try {
        await addDoc(collection(db, "referrals"), {
          referrerId,
          referredId: newUserId,
          referrerName: referrerData.name,
          referredName: newUserName,
          date: nowStr,
          pointsAwarded: true
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "referrals");
      }

      // Send Firebase-level inside-app Notification to referrer
      try {
        await addDoc(collection(db, "notifications"), {
          userId: referrerId,
          text: `🎉 Great job! ${newUserName} joined using your referral link. You earned 100 Points!`,
          date: nowStr,
          read: false,
          type: "points",
          issueId: ""
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "notifications");
      }

      // Optionally send notifications to user when milestone met
      if (newReferralCount === 1 || newReferralCount === 5 || newReferralCount === 10) {
        try {
          await addDoc(collection(db, "notifications"), {
            userId: referrerId,
            text: `🏆 Milestone Reached! You have successfully referred ${newReferralCount} heroes! Badge awarded!`,
            date: nowStr,
            read: false,
            type: "verification",
            issueId: ""
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, "notifications_milestone");
        }
      }
    }
  } catch (error) {
    console.error("Error processing referral validation:", error);
  }
};

// Log Firebase-like custom Analytics tracking events in firestore
export const logAnalyticsEvent = async (userId: string | "anonymous", eventType: string, eventData: any = {}) => {
  try {
    const { deviceType, browserType, userLocation } = getDeviceDetails();
    await addDoc(collection(db, "analytics"), {
      userId,
      eventType,
      timestamp: new Date().toISOString(),
      deviceType,
      browserType,
      userLocation,
      ...eventData
    });
  } catch (e) {
    console.error("Error logging analytics event:", e);
  }
};

// Log Issue updates to notify the reporter about progress
export const notifyIssueReporter = async (issueId: string, reporterId: string, text: string, type: 'status_change' | 'resolved' | 'comment') => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId: reporterId,
      text,
      date: new Date().toISOString(),
      read: false,
      type,
      issueId
    });
  } catch (e) {
    console.error("Error triggering user notification:", e);
  }
};

// Reward points globally for user actions
export const rewardUserPoints = async (userId: string, pointsAmount: number, reason: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const currentPoints = data.points || 0;
      const history = data.pointsHistory || [];
      const nowStr = new Date().toISOString();
      
      history.push({ amount: pointsAmount, reason, date: nowStr });
      
      const updatedBadges = [...(data.badges || [])];
      const newPoints = currentPoints + pointsAmount;

      if (newPoints >= 500 && !updatedBadges.includes("Community Hero")) {
        updatedBadges.push("Community Hero");
      }
      if (newPoints >= 1000 && !updatedBadges.includes("Super Protector")) {
        updatedBadges.push("Super Protector");
      }

      await updateDoc(userRef, {
        points: newPoints,
        pointsHistory: history,
        badges: updatedBadges
      });

      // Add a notification about earning points
      await addDoc(collection(db, "notifications"), {
        userId,
        text: `⭐️ You earned ${pointsAmount} Points: ${reason}`,
        date: nowStr,
        read: false,
        type: "points",
        issueId: ""
      });
    }
  } catch (e) {
    console.error("Error rewarding points:", e);
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

