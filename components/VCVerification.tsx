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
import { Platform, View } from 'react-native';
import RevokedIcon from './RevokedIcon';

export const VCVerification: React.FC<VCVerificationProps> = ({
  vcMetadata,
  display,
  vcStatus,
  textColor
}) => {
  // const {t} = useTranslation('VcDetails');
  // console.log("VCVerification:", vcMetadata, "\tvcMetadata.verificationErrorCode :", vcMetadata.verificationErrorCode);
  // const statusText = !vcMetadata.isVerified
  //   ? vcMetadata.verificationErrorCode === 'REVOKED'
  //     ? t('Revoked')
  //     : t('pending')
  //   : vcMetadata.isExpired
  //     ? t('expired')
  //     : t('valid');

  // const statusIcon = vcMetadata.isVerified
  //   ? (vcMetadata.isExpired
  //       ? <PendingIcon />
  //       : <VerifiedIcon />)
  //   : (vcMetadata.verificationErrorCode === 'REVOKED'
  //       ? <RevokedIcon />
  //       : <PendingIcon />);

  // const { t } = useTranslation('VcDetails');
  // console.log("vcStatus VCVerification:", vcStatus);
  // const statusText = vcMetadata.isVerified
  //   ? vcMetadata.isExpired
  //     ? t('expired')
  //     : vcStatus === 'revoked' ? t('revoked') : t('valid')
  //   : t('pending');

  //   console.log("vcMetadata.isVerified :",vcMetadata.isVerified, "StatusText : ", statusText)

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

  // const { t } = useTranslation('VcDetails');
  // let statusText;
  // if (!vcMetadata.isVerified) {
  //   statusText = vcMetadata.verificationErrorCode === 'REVOKED' || vcStatus === 'revoked'
  //     ? t('revoked')
  //     : t('pending');
  // } else if (vcMetadata.isExpired) {
  //   statusText = t('expired');
  // } else {
  //   statusText = t('valid');
  // }

  // let statusIcon;
  // if (!vcMetadata.isVerified) {
  //   statusIcon = vcMetadata.verificationErrorCode === 'REVOKED' || vcStatus === 'revoked'
  //     ? <RevokedIcon />
  //     : <PendingIcon />;
  // } else if (vcMetadata.isExpired) {
  //   statusIcon = <PendingIcon />;
  // } else {
  //   statusIcon = <VerifiedIcon />;
  // }

  const { t } = useTranslation('VcDetails');
  let statusText: string;
  let statusIcon: React.ReactNode;

  if (Platform.OS === 'ios') {
    console.log("vcStatus VCVerification:", vcStatus);

    statusText = vcMetadata.isVerified
      ? vcMetadata.isExpired
        ? t('expired')
        : vcStatus === 'revoked'
          ? t('revoked')
          : t('valid')
      : t('pending');

    console.log("vcMetadata.isVerified:", vcMetadata.isVerified, "StatusText:", statusText);

    statusIcon = vcMetadata.isVerified
      ? (vcMetadata.isExpired
        ? <PendingIcon />
        : vcStatus === 'revoked'
          ? <RevokedIcon />
          : <VerifiedIcon />)
      : <PendingIcon />;
  } else {
    if (!vcMetadata.isVerified) {
      statusText = vcMetadata.verificationErrorCode === 'REVOKED' || vcStatus === 'revoked'
        ? t('revoked')
        : t('pending');
    } else if (vcMetadata.isExpired) {
      statusText = t('expired');
    } else {
      statusText = t('valid');
    }

    if (!vcMetadata.isVerified) {
      statusIcon = vcMetadata.verificationErrorCode === 'REVOKED' || vcStatus === 'revoked'
        ? <RevokedIcon />
        : <PendingIcon />;
    } else if (vcMetadata.isExpired) {
      statusIcon = <PendingIcon />;
    } else {
      statusIcon = <VerifiedIcon />;
    }
  }
  return (
    <Row
      {...testIDProps('verified')}
      style={{
        alignItems: 'center',
      }}>
      <React.Fragment>
        {vcStatus !== undefined && statusIcon}
        {
          vcStatus !== undefined && (
            <Text
              testID="verificationStatus"
              //color={display.getTextColor(Theme.Colors.Details)}
              color={textColor}
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
  textColor?: string;
}
