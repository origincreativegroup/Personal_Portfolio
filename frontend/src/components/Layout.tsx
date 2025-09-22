import { ReactNode } from 'react'
import ModernSidebar from './navigation/ModernSidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return <ModernSidebar>{children}</ModernSidebar>
}