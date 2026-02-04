export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ELDER' | 'PREACHER' | 'MUSIC' | 'AUDIO' | 'TECH' | 'MEMBER' | 'VISITOR' | 'TEACHER' | 'BOARD' | 'LEADER';

export type EventType = 'SERVICE' | 'MEETING' | 'WORKSHOP' | 'OTHER';

export interface ChurchEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time: string;
  type: EventType;
  location: string;
  activeInBanner: boolean;
  targetAudience: 'PUBLIC' | 'MEMBERS_ONLY' | 'STAFF_ONLY' | 'ELDERS_ONLY';
  bannerGradient?: string;
  description: string;
  address?: string;
  placeName?: string;
  imageUrl?: string;
  storyStyle?: 'poster' | 'pill' | 'ribbon';
}

export interface PrayerRequest {
  id: string;
  author: string;
  content: string;
  date: string;
  status: 'PENDING' | 'READ' | 'ARCHIVED';
  tenantId: string;
}

export type LiturgyItemType = 'WORSHIP' | 'PREACHING' | 'GENERAL';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface LinkItem {
  url: string;
  label: string;
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
  links?: LinkItem[];
  // Preaching specific
  preacher?: string;
  scripture?: string;
}

export interface ServiceTeam {
  elder: string;
  preacher: string;
  musicDirector: string;
  audioOperator: string;
  sabbathSchoolTeacher?: string;
  teamName?: string;
  musicians?: string[];
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
  secondaryRoles?: Role[]; // Allows multiple permissions without multiple accounts
  assignedJobIds?: string[]; // IDs of customJobRoles defined in ChurchSettings
  pin?: string; // New field for Member authentication
  tenantId?: string; // For multi-tenancy
  photoUrl?: string;
  department?: 'MUSIC' | 'KIDS' | 'USHERS' | 'MEDIA' | 'OTHER'; // Categorization
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
  // New: Day-based Volunteer Pools
  // Structure: { "Domingo": { "elder": ["id1", "id2"], "preacher": ["id3"] } }
  dayPools?: Record<string, Record<string, string[]>>;
  activeTeamId?: string;
  musicMinistryPin?: string; // New field for Music Ministry access
  youtubeChannelId?: string; // YouTube Channel ID for Live Stream (e.g. UC...)
  isLive?: boolean; // Manual override status for "Live Now" banner
}

export interface ShiftTeam {
  id: string;
  name: string;
  date?: string; // New field for date-based duty teams
  members: Partial<ServiceTeam>;
}

export interface MusicTeam {
  id: string;
  date: string;
  memberIds: string[]; // User IDs of the 6 singers/musicians
  soloist1?: string[]; // IDs of soloists for Service 1
  soloist2?: string[]; // IDs of soloists for Service 2
  note?: string;
  tenantId: string;
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
  GOLD: ['dashboard', 'planner', 'users', 'events', 'roster', 'settings', 'notifications', 'team', 'sermons', 'music_dept', 'voting_admin'],
  PLATINUM: ['dashboard', 'planner', 'users', 'events', 'roster', 'settings', 'notifications', 'ai_assistant', 'live_translation', 'team', 'sermons', 'statistics', 'music_dept', 'voting_admin']
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

// --- VOTING MODULE ---
export interface VoteOption {
  id: string;
  label: string;
  color: string; // 'green' | 'red' | 'blue' | 'gray' etc.
}

export interface VotingSession {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: 'PRE_VOTE' | 'OPEN' | 'CLOSED'; // PRE_VOTE = Setup, OPEN = Voting Live, CLOSED = Revealed
  options: VoteOption[];

  // Quorum & Participation
  totalPossibleVoters: number; // e.g. 20
  presentMemberIds: string[]; // List of User IDs marked as present

  // Voting State
  totalVotesCast: number; // Counter only
  votedUserIds: string[]; // To prevent double voting, but separated from choice

  // Results (Only populated/meaningful if status is CLOSED or for internal counting, 
  // but frontend should NOT show if OPEN)
  results: Record<string, number>; // optionId -> count

  createdAt: string;
  closedAt?: string;
}
