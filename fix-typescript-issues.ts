// Comprehensive TypeScript fixes for PortfolioForge
// This script addresses all identified TypeScript issues

// 1. Fix Dashboard.tsx unused imports and variables
const dashboardFixes = `
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Plus,
  FileText,
  Layers,
  FolderOpen,
  HardDrive
} from 'lucide-react'
import Button from '../components/ui/Button'
import MetricCard, { type MetricData } from '../components/dashboard/MetricCard'
import ProjectStatusCard, { type ProjectStatus } from '../components/dashboard/ProjectStatusCard'
import { useNotifications } from '../contexts/NotificationContext'
`;

// 2. Fix Projects.tsx unused imports
const projectsFixes = `
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Calendar, 
  User, 
  Search,
  Filter,
  Eye,
  Edit3,
  MoreVertical,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react'
import Button from '../components/ui/Button'
`;

// 3. Fix ProjectEditor.tsx unused imports
const projectEditorFixes = `
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Eye, Download, ArrowLeft, FileText, Palette, Sparkles, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AssetManager from '../components/AssetManager'
import GrapesJSEditor from '../components/GrapesJSEditor'
import { createCaseStudyBlocks, buildCaseStudyTemplate, type ProjectMeta } from '../utils/caseStudyTemplates'
import type { ProjectAsset } from '../types/asset'
`;

// 4. Fix AssetManagement.tsx unused imports
const assetManagementFixes = `
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AssetManager from '../components/AssetManager'
import Button from '../components/ui/Button'
import type { ProjectAsset } from '../types/asset'
`;

// 5. Fix PortfolioEditorPage.tsx unused imports
const portfolioEditorFixes = `
import { useState } from 'react'
import GrapesJSEditor from '../components/GrapesJSEditor'
import { createPortfolioBlocks } from '../utils/portfolioTemplates'
`;

// 6. Fix SimpleAssetManager.tsx unused imports
const simpleAssetManagerFixes = `
import { useState } from 'react'
import { Upload, Search, Grid, List, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import type { ProjectAsset } from '../types/asset'
`;

// 7. Fix Breadcrumbs.tsx unused imports
const breadcrumbsFixes = `
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
`;

// 8. Fix index.ts imports
const indexFixes = `
// Export all components and utilities
export { default as Button } from './components/ui/Button'
export { default as Input } from './components/ui/Input'
export { default as Card } from './components/ui/Card'
export { default as Modal } from './components/ui/Modal'
export { default as LoadingSpinner } from './components/ui/LoadingSpinner'

// Export contexts
export { ThemeProvider, useTheme } from './contexts/ThemeContext'
export { NotificationProvider, useNotifications } from './contexts/NotificationContext'

// Export types
export type { ProjectAsset, EnhancedAsset, AssetFilter, BulkOperation } from './types/asset'
export type { GrapesJSBlock, GrapesJSEditorProps } from './types/grapes'

// Export utilities
export { createCaseStudyBlocks, buildCaseStudyTemplate } from './utils/caseStudyTemplates'
export { loadGrapesJS } from './utils/grapesLoader'
`;

export {
  dashboardFixes,
  projectsFixes,
  projectEditorFixes,
  assetManagementFixes,
  portfolioEditorFixes,
  simpleAssetManagerFixes,
  breadcrumbsFixes,
  indexFixes
};
