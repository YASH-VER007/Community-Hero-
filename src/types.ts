export type UserRole = 'citizen' | 'volunteer' | 'officer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
  badges: string[];
  avatar: string;
  phone?: string;
  joinedDate: string;
}

export type IssueCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Water Leakage'
  | 'Street Light Problem'
  | 'Traffic Signal Issue'
  | 'Fallen Tree'
  | 'Other'
  | 'Streetlight Failure'
  | 'Garbage Collection'
  | 'Drainage Problem'
  | 'Road Damage'
  | 'Public Safety'
  | 'Traffic Signal'
  | 'Others';

export type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type IssueStatus =
  | 'Reported'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export interface Coordinates {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  date: string;
}

export interface Evidence {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  description: string;
  date: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  reporterId: string;
  reporterName: string;
  upvotes: number;
  upvotedBy: string[]; // User IDs
  verifications: number;
  verifiedBy: string[]; // User IDs
  verificationThreshold?: number; // target threshold for verification
  verificationScore: number; // calculated score
  coordinates: Coordinates;
  imageUrl: string;
  date: string;
  progress: number; // 0 - 100
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  resolutionProofUrl?: string;
  resolutionComment?: string;
  resolvedDate?: string;
  comments: Comment[];
  evidence: Evidence[];
  aiSummary?: string;
  aiSuggestedAction?: string;
  aiEstimatedImpact?: string;
  aiDepartment?: string;
  aiConfidence?: number;
  timelineHistory?: {
    reportedAt?: string;
    verifiedAt?: string;
    assignedAt?: string;
    inProgressAt?: string;
    resolvedAt?: string;
    closedAt?: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  date: string;
  read: boolean;
  type: 'verification' | 'status_change' | 'resolved' | 'comment' | 'points';
  issueId?: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  role: UserRole;
  points: number;
  badgesCount: number;
  solvedCount: number;
  avatar: string;
}

export interface RiskHotspot {
  id: string;
  lat: number;
  lng: number;
  category: IssueCategory;
  riskScore: number; // 0 - 100
  description: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface PredictiveReport {
  summary: string;
  hotspots: RiskHotspot[];
  recommendations: string[];
  generationDate: string;
}

export interface AIPrediction {
  id: string;
  title: string;
  confidence: number;
  category: IssueCategory;
  reason: string;
  suggestedAction: string;
  expectedImpact: string;
  wardOrZone: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  coordinates: {
    lat: number;
    lng: number;
  };
  votesCount?: number;
  userVoted?: boolean;
  workOrderGenerated?: boolean;
}

export interface CommunityInsightsReport {
  summary: string;
  predictions: AIPrediction[];
  generationDate: string;
}

