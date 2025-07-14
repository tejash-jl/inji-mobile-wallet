import testIDProps from '../shared/commonUtil';
import { Display } from './VC/common/VCUtils';
import VerifiedIcon from './VerifiedIcon';
import { Row, Text } from './ui';
import { Theme } from './ui/styleUtils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PendingIcon from './PendingIcon';
import { VCMetadata } from '../shared/VCMetadata';
import { SvgImage } from './ui/svg';
import { View } from 'react-native';
import RevokedIcon from './RevokedIcon';

export const VCVerification: React.FC<VCVerificationProps> = ({
  vcMetadata,
  display,
  vcStatus
}) => {
  const {t} = useTranslation('VcDetails');
  console.log("VCVerification:", vcMetadata, "\tvcMetadata.verificationErrorCode :", vcMetadata.verificationErrorCode);
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

  //const { t } = useTranslation('VcDetails');
  // console.log("vcStatus VCVerification:", vcStatus);
  // const statusText = vcMetadata.isVerified
  //   ? vcMetadata.isExpired
  //     ? t('expired')
  //     : vcStatus === 'revoked' ? t('revoked') : t('valid')
  //   : t('pending');

  // const statusIcon = vcMetadata.isVerified ? (
  //   vcMetadata.isExpired ? (
  //     <PendingIcon />
  //   ) :
  //     vcStatus === 'revoked' ? (
  //       // <View style={{marginRight: 5}}>{SvgImage.RevokedIcon()}</View>
  //       <RevokedIcon />
  //     ) : (
  //       <VerifiedIcon />
  //     )
  // ) : (
  //   <PendingIcon />
  // );
  return (
    <Row
      {...testIDProps('verified')}
      style={{
        alignItems: 'center',
      }}>
      <React.Fragment>
        { vcStatus !== undefined && statusIcon}
        {
          vcStatus !== undefined && (
            <Text
              testID="verificationStatus"
              color={display.getTextColor(Theme.Colors.Details)}
              style={Theme.Styles.verificationStatus}>
              {statusText}
            </Text>
          )
        }

      </React.Fragment>
    </Row>
  );
};

export interface VCVerificationProps {
  vcMetadata: VCMetadata;
  display: Display;
  vcStatus?: string;
}
