import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Edit,
  Settings,
  User,
  HelpCircle,
  Bell,
  Sparkles,
  Bot
} from 'lucide-react'
import ThemeToggle from '../ThemeToggle'

interface SidebarProps {
  children?: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FileText },
  { name: 'Assets', href: '/assets', icon: FolderOpen },
  { name: 'Portfolio Editor', href: '/portfolio/editor', icon: Edit },
  { name: 'AI Tools', href: '/portfolio/ai', icon: Sparkles }
]

export default function ModernSidebar({ children }: SidebarProps) {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-900 font-bold text-sm">PF</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">PortfolioForge</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${active ? 'text-yellow-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="space-y-2">
              <Link
                to="/help"
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                <HelpCircle className="w-5 h-5 mr-3 text-gray-400" />
                Help & Support
              </Link>
              <Link
                to="/settings"
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-3 text-gray-400" />
                Settings
              </Link>
            </div>
          </div>
        </nav>

        {/* Bottom User Section */}
        <div className="p-4 border-t border-gray-100">
          {/* Notifications */}
          <div className="mb-4">
            <button className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200">
              <div className="relative">
                <Bell className="w-5 h-5 mr-3 text-gray-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              Notifications
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">John Doe</div>
                <div className="text-xs text-gray-500 truncate">john@example.com</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Link
                to="/profile"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Manage Account →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {children}
      </div>
    </div>
  )
}