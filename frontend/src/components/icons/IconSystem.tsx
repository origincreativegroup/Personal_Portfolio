import {
  DashboardIcon,
  ProjectsIcon,
  AssetsIcon,
  PortfolioEditorIcon,
  NewProjectIcon,
  UploadIcon,
  SettingsIcon,
  SearchIcon,
  FilterIcon,
  NotificationIcon
} from './ForgeIcons'
import FolderIcon from './FolderIcon'

export interface IconProps {
  className?: string
  size?: number
}

// Main icon mapping system
export const iconMap = {
  // Navigation icons
  dashboard: DashboardIcon,
  projects: ProjectsIcon,
  assets: AssetsIcon,
  'portfolio-editor': PortfolioEditorIcon,

  // Action icons
  'new-project': NewProjectIcon,
  upload: UploadIcon,
  search: SearchIcon,
  filter: FilterIcon,

  // System icons
  settings: SettingsIcon,
  notifications: NotificationIcon,

  // Folder icon with variants
  folder: FolderIcon
} as const

export type IconName = keyof typeof iconMap

// Icon component that maps names to components
interface ForgeIconProps extends IconProps {
  name: IconName
  variant?: string
}

export function ForgeIcon({ name, className = '', size = 24, variant, ...props }: ForgeIconProps) {
  const IconComponent = iconMap[name]

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`)
    return null
  }

  // Special handling for folder icon variants
  if (name === 'folder' && variant) {
    return (
      <FolderIcon
        className={className}
        size={size}
        variant={variant as any}
        {...props}
      />
    )
  }

  return (
    <IconComponent
      className={className}
      size={size}
      {...props}
    />
  )
}

// Utility function to get icon component by name
export function getIcon(name: IconName) {
  return iconMap[name]
}

// Export individual icons for direct use
export {
  DashboardIcon,
  ProjectsIcon,
  AssetsIcon,
  PortfolioEditorIcon,
  NewProjectIcon,
  UploadIcon,
  SettingsIcon,
  SearchIcon,
  FilterIcon,
  NotificationIcon,
  FolderIcon
}