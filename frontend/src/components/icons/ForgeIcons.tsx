interface IconProps {
  className?: string
  size?: number
}

// Dashboard Icon - Geometric forge flame rising from anvil
export function DashboardIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Anvil base */}
      <path
        d="M4 18H20C20.5523 18 21 18.4477 21 19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19C3 18.4477 3.44772 18 4 18Z"
        fill="#5a3cf4"
      />
      {/* Anvil body */}
      <path
        d="M6 12H18C18.5523 12 19 12.4477 19 13V18H5V13C5 12.4477 5.44772 12 6 12Z"
        fill="#5a3cf4"
      />
      {/* Forge flame */}
      <path
        d="M12 4C12 4 8 8 8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11C16 8 12 4 12 4Z"
        fill="#cbc0ff"
      />
      {/* Inner flame */}
      <path
        d="M12 6C12 6 10 8 10 10C10 11.1046 10.8954 12 12 12C13.1046 12 14 11.1046 14 10C14 8 12 6 12 6Z"
        fill="#5a3cf4"
      />
    </svg>
  )
}

// Projects Icon - Minimal anvil awaiting metal
export function ProjectsIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Anvil base */}
      <rect x="4" y="16" width="16" height="2" rx="1" fill="#5a3cf4" />
      {/* Anvil body */}
      <path
        d="M6 10H18C18.5523 10 19 10.4477 19 11V16H5V11C5 10.4477 5.44772 10 6 10Z"
        fill="#5a3cf4"
      />
      {/* Anvil horn */}
      <path
        d="M17 8C18.1046 8 19 8.89543 19 10V11H17V8Z"
        fill="#5a3cf4"
      />
      {/* Highlight */}
      <rect x="6" y="11" width="12" height="1" fill="#cbc0ff" fillOpacity="0.6" />
    </svg>
  )
}

// Assets Icon - Vector crate with forge stamp
export function AssetsIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Crate box */}
      <path
        d="M4 8L12 4L20 8V18C20 18.5523 19.5523 19 19 19H5C4.44772 19 4 18.5523 4 18V8Z"
        fill="#5a3cf4"
      />
      {/* Crate top */}
      <path
        d="M4 8L12 4L20 8L12 12L4 8Z"
        fill="#cbc0ff"
      />
      {/* Forge stamp/mark */}
      <circle cx="12" cy="14" r="2" fill="#cbc0ff" fillOpacity="0.8" />
      <path
        d="M12 13V15M11 14H13"
        stroke="#5a3cf4"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Portfolio Editor Icon - Mask/helmet shape
export function PortfolioEditorIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Helmet shape */}
      <path
        d="M12 3C8.68629 3 6 5.68629 6 9V12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12V9C18 5.68629 15.3137 3 12 3Z"
        fill="#5a3cf4"
      />
      {/* Visor */}
      <ellipse cx="12" cy="10" rx="4" ry="2" fill="#cbc0ff" />
      {/* Forge marks */}
      <circle cx="9" cy="10" r="0.5" fill="#5a3cf4" />
      <circle cx="15" cy="10" r="0.5" fill="#5a3cf4" />
      {/* Helmet ridge */}
      <path
        d="M8 7C8 7 10 6 12 6C14 6 16 7 16 7"
        stroke="#cbc0ff"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

// New Project Icon - Plus over forge brick
export function NewProjectIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Forge brick */}
      <rect x="6" y="10" width="12" height="8" rx="2" fill="#5a3cf4" />
      <rect x="6" y="10" width="12" height="2" rx="1" fill="#cbc0ff" />
      {/* Plus sign */}
      <circle cx="12" cy="8" r="4" fill="#cbc0ff" />
      <path
        d="M12 6V10M10 8H14"
        stroke="#5a3cf4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Upload Icon - Ingot being dropped into forge
export function UploadIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Forge opening */}
      <path
        d="M4 16H20C20.5523 16 21 16.4477 21 17V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V17C3 16.4477 3.44772 16 4 16Z"
        fill="#5a3cf4"
      />
      {/* Ingot */}
      <rect x="10" y="4" width="4" height="8" rx="1" fill="#cbc0ff" />
      {/* Motion lines */}
      <path
        d="M8 12L8 14M16 12L16 14M12 12L12 14"
        stroke="#cbc0ff"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Sparks */}
      <circle cx="7" cy="16" r="1" fill="#cbc0ff" fillOpacity="0.6" />
      <circle cx="17" cy="16" r="1" fill="#cbc0ff" fillOpacity="0.6" />
    </svg>
  )
}

// Settings Icon - Cogwheel from hammer shapes
export function SettingsIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Center gear */}
      <circle cx="12" cy="12" r="3" fill="#5a3cf4" />
      <circle cx="12" cy="12" r="1.5" fill="#cbc0ff" />
      {/* Gear teeth (simplified hammer shapes) */}
      <rect x="11" y="4" width="2" height="4" rx="1" fill="#5a3cf4" />
      <rect x="11" y="16" width="2" height="4" rx="1" fill="#5a3cf4" />
      <rect x="4" y="11" width="4" height="2" ry="1" fill="#5a3cf4" />
      <rect x="16" y="11" width="4" height="2" ry="1" fill="#5a3cf4" />

      {/* Diagonal teeth */}
      <rect x="7.8" y="6.8" width="2" height="2.8" rx="1" fill="#5a3cf4" transform="rotate(45 8.8 8.2)" />
      <rect x="14.2" y="6.8" width="2" height="2.8" rx="1" fill="#5a3cf4" transform="rotate(-45 15.2 8.2)" />
      <rect x="7.8" y="14.4" width="2" height="2.8" rx="1" fill="#5a3cf4" transform="rotate(-45 8.8 15.8)" />
      <rect x="14.2" y="14.4" width="2" height="2.8" rx="1" fill="#5a3cf4" transform="rotate(45 15.2 15.8)" />
    </svg>
  )
}

// Search Icon - Monocle magnifying glass held by tongs
export function SearchIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Magnifying glass lens */}
      <circle cx="11" cy="11" r="6" stroke="#5a3cf4" strokeWidth="2" fill="#cbc0ff" fillOpacity="0.1" />
      <circle cx="11" cy="11" r="3" stroke="#5a3cf4" strokeWidth="1" fill="none" />
      {/* Handle/tongs */}
      <path
        d="M21 21L16.65 16.65"
        stroke="#5a3cf4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Tong grip */}
      <path
        d="M19 19L21 21M17 17L19 19"
        stroke="#cbc0ff"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Filter Icon - Sieve with sparks
export function FilterIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Sieve frame */}
      <path
        d="M6 6H18C18.5523 6 19 6.44772 19 7V10L12 17L5 10V7C5 6.44772 5.44772 6 6 6Z"
        fill="#5a3cf4"
      />
      {/* Sieve holes */}
      <circle cx="10" cy="8" r="0.5" fill="#cbc0ff" />
      <circle cx="12" cy="8" r="0.5" fill="#cbc0ff" />
      <circle cx="14" cy="8" r="0.5" fill="#cbc0ff" />
      <circle cx="9" cy="10" r="0.5" fill="#cbc0ff" />
      <circle cx="11" cy="10" r="0.5" fill="#cbc0ff" />
      <circle cx="13" cy="10" r="0.5" fill="#cbc0ff" />
      <circle cx="15" cy="10" r="0.5" fill="#cbc0ff" />
      {/* Sparks dripping through */}
      <circle cx="11" cy="19" r="1" fill="#cbc0ff" fillOpacity="0.8" />
      <circle cx="13" cy="20" r="1" fill="#cbc0ff" fillOpacity="0.6" />
      <circle cx="9" cy="20" r="1" fill="#cbc0ff" fillOpacity="0.4" />
    </svg>
  )
}

// Notification Icon - Bell with spark
export function NotificationIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Bell body */}
      <path
        d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"
        fill="#5a3cf4"
      />
      {/* Bell clapper */}
      <path
        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke="#5a3cf4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Spark above */}
      <circle cx="14" cy="4" r="1.5" fill="#cbc0ff" />
      <path
        d="M14 2.5V5.5M12.5 4H15.5"
        stroke="#cbc0ff"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </svg>
  )
}