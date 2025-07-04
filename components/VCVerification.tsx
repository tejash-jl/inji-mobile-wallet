import testIDProps from '../shared/commonUtil';
import {Display} from './VC/common/VCUtils';
import VerifiedIcon from './VerifiedIcon';
import {Row, Text} from './ui';
import {Theme} from './ui/styleUtils';
import React from 'react';
import {useTranslation} from 'react-i18next';
import PendingIcon from './PendingIcon';
import {VCMetadata} from '../shared/VCMetadata';
import RevokedIcon from './RevokedIcon';

export const VCVerification: React.FC<VCVerificationProps> = ({
  vcMetadata,
  display,
}) => {
  const {t} = useTranslation('VcDetails');
  const statusText = !vcMetadata.isVerified
    ? vcMetadata.verificationErrorCode === 'REVOKED'
      ? t('Revoked')
      : t('pending')
    : vcMetadata.isExpired
      ? t('expired')
      : t('valid');

  const statusIcon = vcMetadata.isVerified
    ? (vcMetadata.isExpired
        ? <PendingIcon />
        : <VerifiedIcon />)
    : (vcMetadata.verificationErrorCode === 'REVOKED'
        ? <RevokedIcon />
        : <PendingIcon />);
  return (
    <Row
      {...testIDProps('verified')}
      style={{
        alignItems: 'center',
      }}>
      <React.Fragment>
        {statusIcon}
        <Text
          testID="verificationStatus"
          color={display.getTextColor(Theme.Colors.Details)}
          style={Theme.Styles.verificationStatus}>
          {statusText}
        </Text>
      </React.Fragment>
    </Row>
  );
};

export interface VCVerificationProps {
  vcMetadata: VCMetadata;
  display: Display;
}
