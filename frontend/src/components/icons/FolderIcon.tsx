interface FolderIconProps {
  className?: string
  variant?: 'default' | 'open' | 'shared' | 'assets' | 'projects'
  size?: number
}

export default function FolderIcon({
  className = '',
  variant = 'default',
  size = 24
}: FolderIconProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'open':
        return {
          folder: '#60A5FA', // blue-400
          accent: '#3B82F6', // blue-500
          highlight: '#93C5FD' // blue-300
        }
      case 'shared':
        return {
          folder: '#A78BFA', // purple-400
          accent: '#8B5CF6', // purple-500
          highlight: '#C4B5FD' // purple-300
        }
      case 'assets':
        return {
          folder: '#34D399', // emerald-400
          accent: '#10B981', // emerald-500
          highlight: '#6EE7B7' // emerald-300
        }
      case 'projects':
        return {
          folder: '#FBBF24', // amber-400
          accent: '#F59E0B', // amber-500
          highlight: '#FCD34D' // amber-300
        }
      default:
        return {
          folder: '#60A5FA', // blue-400 (default macOS blue)
          accent: '#3B82F6', // blue-500
          highlight: '#93C5FD' // blue-300
        }
    }
  }

  const colors = getVariantStyles()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Folder shadow */}
      <path
        d="M3 6C3 4.89543 3.89543 4 5 4H9L11 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z"
        fill="rgba(0,0,0,0.1)"
        transform="translate(0.5, 0.5)"
      />

      {/* Main folder body */}
      <path
        d="M3 6C3 4.89543 3.89543 4 5 4H9L11 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z"
        fill={colors.folder}
      />

      {/* Folder tab */}
      <path
        d="M3 6C3 4.89543 3.89543 4 5 4H9L11 6H19C20.1046 6 21 6.89543 21 8V9H3V6Z"
        fill={colors.accent}
      />

      {/* Folder highlight */}
      <path
        d="M3 6C3 4.89543 3.89543 4 5 4H9L11 6H19C20.1046 6 21 6.89543 21 8V9H3V6Z"
        fill="url(#folderGradient)"
        fillOpacity="0.3"
      />

      {/* Subtle inner highlight */}
      <rect
        x="4"
        y="9"
        width="16"
        height="1"
        fill={colors.highlight}
        fillOpacity="0.6"
      />

      <defs>
        <linearGradient id="folderGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  )
}