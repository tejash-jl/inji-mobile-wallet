import React from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-elements';
import { Theme } from './ui/styleUtils';

const RevokedIcon: React.FC = () => {
  return (
    <View style={Theme.Styles.verificationStatusIconContainer}>
      <View style={Theme.Styles.verificationStatusIconInner}>
        <Icon
          // name="file-cancel"
          // type="material-community"
          // color={Theme.Colors.RevokedIcon}
          name="close-circle"
          type="material-community"
          color="red"
          size={12}
        />
      </View>
    </View>
  );
};

export default RevokedIcon;
