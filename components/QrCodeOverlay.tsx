import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, Overlay } from 'react-native-elements';
import { Centered, Column, Row, Text, Button } from './ui';
import QRCode from 'react-native-qrcode-svg';
import { Theme } from './ui/styleUtils';
import { DefaultTheme } from './ui/themes/DefaultTheme';
import { useTranslation } from 'react-i18next';
import testIDProps from '../shared/commonUtil';
import { SvgImage } from './ui/svg';
import { NativeModules } from 'react-native';
import { VerifiableCredential } from '../machines/VerifiableCredential/VCMetaMachine/vc';
import { DEFAULT_ECL, MAX_QR_DATA_LENGTH } from '../shared/constants';
import { VCMetadata } from '../shared/VCMetadata';
import { shareImageToAllSupportedApps } from '../shared/sharing/imageUtils';
import { ShareOptions } from 'react-native-share';
import { BOTTOM_TAB_ROUTES } from '../routes/routesConstants';

export const QrCodeOverlay: React.FC<QrCodeOverlayProps> = props => {
  const { RNPixelpassModule } = NativeModules;
  const { t } = useTranslation('VcDetails');
  const [qrString, setQrString] = useState('');
  const [qrError, setQrError] = useState(false);
  const [isQRLoading, setIsQRLoding] = useState(true);
  const base64ImageType = 'data:image/png;base64,';
  const { RNSecureKeystoreModule } = NativeModules;

  async function getQRData(): Promise<string> {
    let qrData: string;
    try {
      const keyData = await RNSecureKeystoreModule.getData(props.meta.id);
      if (keyData[1] && keyData.length > 0) {
        qrData = keyData[1];
      } else {
        throw new Error('No key data found');
      }
    } catch {
      const { credential } = props.verifiableCredential;

      if (credential?.validUntil === null) {
        delete credential?.validUntil;
      }

      qrData = await RNPixelpassModule.generateQRData(
        JSON.stringify(credential),
        '',
      );
      await RNSecureKeystoreModule.storeData(props.meta.id, qrData);
    }
    return qrData;
  }

  let qrRef = useRef(null);

  function handleShareQRCodePress() {
    if (qrRef.current) {
      qrRef.current.toDataURL(dataURL => {
        shareImage(`${base64ImageType}${dataURL}`);
      });
    }
  }

  async function shareImage(base64String: string) {
    const options: ShareOptions = {
      url: base64String,
    };
    const shareStatus = await shareImageToAllSupportedApps(options);
    if (!shareStatus) {
      console.error('Error while sharing QR code::');
    }
  }

  function onQRError() {
    console.warn('Data is too big');
    setQrError(true);
  }

  useEffect(() => {
    (async () => {
      const qrData = await getQRData();
      if (qrData?.length < MAX_QR_DATA_LENGTH) {
        setQrString(qrData);
      } else {
        setQrError(true);
      }
      setIsQRLoding(false);
    })();
  }, []);

  const [isQrOverlayVisible, setIsQrOverlayVisible] = useState(false);

  const toggleQrOverlay = () => setIsQrOverlayVisible(!isQrOverlayVisible);

  const vcShareView = () => {
    console.log('Share button pressed');
    if (props.onModalDismissWithCleanup) {
      props.onModalDismissWithCleanup();
    }
    props.navigation.navigate(BOTTOM_TAB_ROUTES.share);
  };

  return !isQRLoading && (qrString != '' && !qrError ? (
    <React.Fragment>
      <View testID="qrCodeView" style={Theme.QrCodeStyles.QrView}>
        <Pressable
          {...testIDProps('qrCodePressable')}
          accessible={false}
          onPress={toggleQrOverlay}>
          <QRCode
            {...testIDProps('qrCode')}
            size={92}
            value={qrString}
            backgroundColor={Theme.Colors.QRCodeBackgroundColor}
            ecl={DEFAULT_ECL}
            onError={onQRError}
          />
          <View
            testID="magnifierZoom"
            style={[Theme.QrCodeStyles.magnifierZoom]}>
            {SvgImage.MagnifierZoom()}
          </View>
        </Pressable>
      </View>

      <Overlay
        isVisible={isQrOverlayVisible}
        onBackdropPress={toggleQrOverlay}
        overlayStyle={{ padding: 1, borderRadius: 21 }}>
        <Column style={Theme.QrCodeStyles.expandedQrCode}>
          <Row pY={20} style={Theme.QrCodeStyles.QrCodeHeader}>
            <Text
              testID="qrCodeHeader"
              align="center"
              style={Theme.TextStyles.header}
              weight="bold">
              {t('qrCodeHeader')}
            </Text>
            <Icon
              {...testIDProps('qrCodeCloseIcon')}
              name="close"
              onPress={toggleQrOverlay}
              color={Theme.Colors.Details}
              size={32}
            />
          </Row>
          <Centered testID="qrCodeDetails" pY={30}>
            <QRCode
              {...testIDProps('qrCodeExpandedView')}
              size={300}
              value={qrString}
              backgroundColor={Theme.Colors.QRCodeBackgroundColor}
              ecl={DEFAULT_ECL}
              quietZone={10}
              onError={onQRError}
              getRef={data => (qrRef.current = data)}
            />
            <Button
              testID="share"
              styles={Theme.QrCodeStyles.shareQrCodeButton}
              title={t('shareQRCode')}
              type="gradient"
              icon={
                <Icon
                  name="share-variant-outline"
                  type="material-community"
                  size={24}
                  color="white"
                />
              }
              onPress={handleShareQRCodePress}
            />
          </Centered>
        </Column>
      </Overlay>
    </React.Fragment>
  ) : (
    <View testID="vcShareView" style={Theme.QrCodeStyles.VCShareDetailView}>
      <Pressable
        {...testIDProps('qrCodePressable')}
        accessible={false}
        onPress={vcShareView}>
        <Column
          testID="qrCodeFailedDetails"
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ marginBottom: 4 }}>{SvgImage.FailedLoadQRIcon()}</View>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              fontWeight: '700',
              color: '#FF0009',
            }}>
            {t('failedLoadingQRReaction')}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 10,
              fontWeight: '400',
              color: '#000000',
              textAlign: 'center',
              lineHeight: 12,
              paddingHorizontal: 15,
            }}>
            {t('failedLoadingQRMessage')}
          </Text>
          <View style={{ marginTop: 8 }}>{SvgImage.FailedQRShare()}</View>
        </Column>
      </Pressable>
    </View>
  ));
};

interface QrCodeOverlayProps {
  verifiableCredential: VerifiableCredential;
  meta: VCMetadata;
  navigation?: any;
  onSharePress?: () => void;
  onModalDismissWithCleanup?: () => void;
}
