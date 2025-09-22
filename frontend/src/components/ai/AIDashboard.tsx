import React, { useState, useEffect } from 'react'
import {
  Sparkles, Lightbulb, Target, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react'
import { cn } from '../../shared/utils'
import Card from '../ui/Card'
import { aiIntegrationService } from '../../services/aiIntegrationService'
import { ProjectAsset } from '../../types/asset'
import { Project, CaseStudy, GeneratedNarrative } from '../../types/portfolio'

interface AIDashboardProps {
  assets: ProjectAsset[];
  projects: Project[];
  caseStudies?: CaseStudy[];
  narratives?: GeneratedNarrative[];
  className?: string;
}

export default function AIDashboard({
  assets,
  projects,
  caseStudies = [],
  narratives = [],
  className,
}: AIDashboardProps) {
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const aiService = React.useMemo(() => aiIntegrationService, []);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const fetchedInsights = await aiService.generatePortfolioInsights(assets, projects);
        setInsights(fetchedInsights);
      } catch (error) {
        console.error('Failed to fetch AI insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [assets, projects, caseStudies, narratives, aiService]);

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <RefreshCw size={32} className="animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-text-secondary dark:text-text-secondary-dark">Generating AI insights...</p>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle size={32} className="text-warning-500 mx-auto mb-4" />
        <p className="text-text-secondary dark:text-text-secondary-dark">No AI insights available at the moment.</p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-3">
        <Sparkles size={28} className="text-primary-500" /> AI Dashboard
      </h2>

      {/* AI Insights */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark flex items-center gap-2 mb-4">
          <Lightbulb size={24} className="text-yellow-500" /> AI Insights
        </h3>
        <div className="space-y-4">
          {insights.map((insight: any, index: number) => (
            <div key={insight.id || index} className="flex items-start p-4 rounded-lg bg-surface-secondary dark:bg-surface-secondary-dark">
              <div className={cn(
                'flex-shrink-0 mt-1 mr-3 p-2 rounded-full',
                insight.type === 'trend' && 'bg-blue-100 dark:bg-blue-900',
                insight.type === 'recommendation' && 'bg-yellow-100 dark:bg-yellow-900',
                insight.type === 'optimization' && 'bg-green-100 dark:bg-green-900',
                insight.type === 'warning' && 'bg-red-100 dark:bg-red-900'
              )}>
                {insight.type === 'trend' && <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />}
                {insight.type === 'recommendation' && <Lightbulb size={20} className="text-yellow-600 dark:text-yellow-400" />}
                {insight.type === 'optimization' && <Target size={20} className="text-green-600 dark:text-green-400" />}
                {insight.type === 'warning' && <AlertCircle size={20} className="text-red-600 dark:text-red-400" />}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-text-primary dark:text-text-primary-dark">{insight.title}</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">{insight.description}</p>
                {insight.actions && insight.actions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary-dark mb-1">Suggested actions:</p>
                    <ul className="text-xs text-text-secondary dark:text-text-secondary-dark space-y-1">
                      {insight.actions.map((action: string, actionIndex: number) => (
                        <li key={actionIndex} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-primary-500 rounded-full"></span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}