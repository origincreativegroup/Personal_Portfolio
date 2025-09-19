import ProjectSyncService from '../services/projectSyncService';

type SchedulerOptions = {
  service: ProjectSyncService;
  intervalMs: number;
};

let timer: NodeJS.Timeout | undefined;

export const registerProjectSyncScheduler = ({ service, intervalMs }: SchedulerOptions) => {
  if (timer) {
    clearInterval(timer);
  }

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    return;
  }

  const executeSync = async () => {
    try {
      await service.syncAll();
    } catch (error) {
      console.error('Scheduled project sync failed:', error);
    }
  };

  timer = setInterval(executeSync, intervalMs);
  executeSync();
};

export const stopProjectSyncScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
};
