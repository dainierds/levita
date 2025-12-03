
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ELDER' | 'PREACHER' | 'MUSIC' | 'AUDIO' | 'TECH' | 'MEMBER' | 'VISITOR';

export type EventType = 'SERVICE' | 'MEETING' | 'WORKSHOP' | 'OTHER';

export interface ChurchEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  location: string;
  activeInBanner: boolean;
  targetAudience: 'PUBLIC' | 'MEMBERS_ONLY' | 'STAFF_ONLY' | 'ELDERS_ONLY'; // Updated field
  bannerGradient?: string; // e.g. "from-indigo-500 to-purple-500"
  description: string;
}

export type LiturgyItemType = 'WORSHIP' | 'PREACHING' | 'GENERAL';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface LiturgyItem {
  id: string;
  type: LiturgyItemType;
  title: string;
  durationMinutes: number;
  notes?: string;
  attachments?: Attachment[];
  // Worship specific
  key?: string;
  youtubeLink?: string;
  youtubeLinks?: string[];
  // Preaching specific
  preacher?: string;
  scripture?: string;
}

export interface ServiceTeam {
  elder: string;
  preacher: string;
  musicDirector: string;
  audioOperator: string;
  teamName?: string;
}

export interface ServicePlan {
  id: string;
  title: string;
  date: string;
  startTime: string; // HH:mm
  isActive: boolean; // "Live" status
  team: ServiceTeam;
  items: LiturgyItem[];
  tenantId?: string;
  isRosterDraft?: boolean; // If true, created by RosterView and hidden from Planner until promoted
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  pin?: string; // New field for Member authentication
  tenantId?: string; // For multi-tenancy
  photoUrl?: string;
  status: 'ACTIVE' | 'PENDING_PASSWORD_CHANGE';
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface ChurchSettings {
  churchName?: string;
  address?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  meetingDays: DayOfWeek[];
  meetingTimes: Partial<Record<DayOfWeek, string>>;
  preachingDays: DayOfWeek[];
  rosterFrequency: 'Semanal' | 'Quincenal' | 'Mensual';
  rosterDays: DayOfWeek[];
  rosterAutoNotifications: boolean;
  memberPin?: string; // PIN for member access
  teams?: ShiftTeam[];
}

export interface ShiftTeam {
  id: string;
  name: string;
  members: Partial<ServiceTeam>;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  targetUserId?: string | 'ALL'; // New field for targeting
}

// --- SUPER ADMIN & TENANCY ---

export type SubscriptionTier = 'BASIC' | 'GOLD' | 'PLATINUM';

export interface ChurchTenant {
  id: string;
  name: string;
  pastorName: string;
  pastorEmail: string;
  tier: SubscriptionTier;
  status: 'ACTIVE' | 'BLOCKED';
  joinedDate: string;
  settings?: ChurchSettings;
}

// Feature Flags based on Tier
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  BASIC: ['dashboard', 'planner', 'users', 'team'],
  GOLD: ['dashboard', 'planner', 'users', 'events', 'roster', 'settings', 'notifications', 'team', 'sermons'],
  PLATINUM: ['dashboard', 'planner', 'users', 'events', 'roster', 'settings', 'notifications', 'ai_assistant', 'live_translation', 'team', 'sermons', 'statistics']
};

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  BASIC: 50,
  GOLD: 200,
  PLATINUM: 10000 // Effectively unlimited
};

export interface AppState {
  events: ChurchEvent[];
  plans: ServicePlan[];
  userRole: Role;
}

export interface Invitation {
  id: string; // The unique code/token
  tenantId: string;
  role: Role;
  suggestedName: string;
  status: 'PENDING' | 'USED';
  createdAt: string;
  createdBy: string;
}
