import { useSafeSelector } from '../shared/hooks/useSafeSelector';;
import { useContext } from 'react';
import {
  selectAuthorized,
  selectLanguagesetup,
  selectUnauthorized,
} from '../machines/auth';
import { GlobalContext } from '../shared/GlobalContext';

export function useAppLayout() {
  const { appService } = useContext(GlobalContext);
  const authService = appService.children.get('auth');
  const isLanguagesetup = useSafeSelector(authService, selectLanguagesetup);
  return {
    isAuthorized: useSafeSelector(authService, selectAuthorized),
    isUnAuthorized: useSafeSelector(authService, selectUnauthorized),
    isLanguagesetup,
  };
}
