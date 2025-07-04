import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext} from 'react';
import {
  ActivityLogEvents,
  selectActivities,
  selectIsRefreshing,
  selectWellknownIssuerMap,
} from '../../machines/activityLog';
import {GlobalContext} from '../../shared/GlobalContext';

export function useHistoryTab() {
  const {appService} = useContext(GlobalContext);
  const activityLogService = appService.children.get('activityLog')!!;
  const wellknownIssuerMap = useSafeSelector(
    activityLogService,
    selectWellknownIssuerMap,
  );

  return {
    activities: useSafeSelector(activityLogService, selectActivities),

    isRefreshing: useSafeSelector(activityLogService, selectIsRefreshing),

    getWellKnownIssuerMap: (issuerName: string) => {
      return wellknownIssuerMap[issuerName] ?? null;
    },

    REFRESH: () => activityLogService.send(ActivityLogEvents.REFRESH()),
  };
}
