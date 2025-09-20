import type { ComponentType, SVGProps } from 'react';
import {
  LayoutDashboard,
  User,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Upload,
  PlusCircle,
  Folder,
  Image as ImageIcon,
  Video,
  Music2,
  File as FileIcon,
  Type,
  Blocks,
  Rocket,
  BadgeCheck,
  ShieldCheck,
  History,
  MessageSquare,
  BarChart2,
  TrendingUp,
  Share2,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { clsx } from 'clsx';

type IconName =
  | 'dashboard'
  | 'profile'
  | 'resume'
  | 'analytics'
  | 'notifications'
  | 'settings'
  | 'upload'
  | 'new-project'
  | 'add-to-project'
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'add-block'
  | 'drag-block'
  | 'text-block'
  | 'free'
  | 'tier2'
  | 'tier3'
  | 'admin'
  | 'learning'
  | 'subscriptions'
  | 'success'
  | 'error'
  | 'loading'
  | 'share'
  | 'search'
  | 'filter';

const iconMap: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  dashboard: LayoutDashboard,
  profile: User,
  resume: FileText,
  analytics: BarChart3,
  notifications: Bell,
  settings: Settings,
  upload: Upload,
  'new-project': PlusCircle,
  'add-to-project': PlusCircle,
  folder: Folder,
  image: ImageIcon,
  video: Video,
  audio: Music2,
  document: FileIcon,
  'add-block': PlusCircle,
  'drag-block': Blocks,
  'text-block': Type,
  free: Rocket,
  tier2: BadgeCheck,
  tier3: ShieldCheck,
  admin: ShieldCheck,
  learning: History,
  subscriptions: MessageSquare,
  success: TrendingUp,
  error: BarChart2,
  loading: Loader2,
  share: Share2,
  search: Search,
  filter: Filter,
};

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

export const Icon = ({ name, className, ...props }: IconProps) => {
  const Component = iconMap[name];
  return <Component className={clsx('h-4 w-4', className)} {...props} />;
};
