import React, { useState, useEffect } from 'react';
import { GlobalContext, GlobalServices } from '../shared/GlobalContext';
import { interpret } from 'xstate';
import { appMachine } from '../machines/app';
import { AppService } from '../shared/types/xstateTypes';

export const GlobalContextProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [appService, setAppService] = useState<AppService>(() => interpret(appMachine).start());

  useEffect(() => {
    return () => {
      appService.stop();
    };
  }, [appService]);

  const contextValue: GlobalServices = {
    appService,
    setAppService,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};
