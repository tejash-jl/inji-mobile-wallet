import React from 'react';
import {VCDetailView, VCItemDetailsProps} from './Views/VCDetailView';

export const VcDetailsContainer: React.FC<
  VCItemDetailsProps & {
    onModalDismissWithCleanup?: () => void;
    navigation?: any;
  }
> = props => {
  return (
    <VCDetailView
      {...props}
      onModalDismissWithCleanup={props.onModalDismissWithCleanup}
      navigation={props.navigation}
    />
  );
};
