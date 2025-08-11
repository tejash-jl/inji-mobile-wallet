import React, { useEffect, useState } from 'react';
import { Icon } from 'react-native-elements';
import { Column } from '../../components/ui';
import { Theme } from '../../components/ui/styleUtils';
import { HomeRouteProps } from '../../routes/routeTypes';
import { MyVcsTab } from './MyVcsTab';
import { ReceivedVcsTab } from './ReceivedVcsTab';
import { ViewVcModal } from './ViewVcModal';
import { useHomeScreen } from './HomeScreenController';
import { TabRef } from './HomeScreenMachine';
import { ActorRefFrom } from 'xstate';
import LinearGradient from 'react-native-linear-gradient';
import { ErrorMessageOverlay } from '../../components/MessageOverlay';
import { Pressable, TouchableOpacity } from 'react-native';
import testIDProps from '../../shared/commonUtil';
import { BannerNotificationContainer } from '../../components/BannerNotificationContainer';
import { VCItemMachine } from '../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';
import { VerifiableCredential } from '../../machines/VerifiableCredential/VCMetaMachine/vc';
import { useTranslation } from 'react-i18next';
import { Copilot } from '../../components/ui/Copilot';
import Modal from 'react-native-modal';
import { Text } from '../../components/ui';
import { useConsoleAuthData } from '../ResetPasscode/ResetPasscodeFunction';
import { BOTTOM_TAB_ROUTES } from '../../routes/routesConstants';
import { useFocusEffect } from '@react-navigation/native';
import Storage, { MMKV } from '../../shared/storage';
import { decryptJson, encryptJson } from '../../shared/cryptoutil/cryptoUtil';
import { GlobalContext } from '../../shared/GlobalContext';
import { Platform } from 'react-native';
import { decodeEncodedList, isIndexRevoked } from '../../shared/Utils';


export const HomeScreen: React.FC<
  HomeRouteProps & { navigationRef?: any }
> = props => {
  const [activateBackupModalVisible, setActivateBackupModalVisible] =
    useState(false);
  const controller = useHomeScreen(props);
  const { t } = useTranslation();

  const logAuthData = useConsoleAuthData();
  const [vcStatuses, setVcStatuses] = useState<Record<string, string>>({});

  const selectedVcKey = controller.selectedVc
    ?.getSnapshot?.()
    ?.context?.vcMetadata?.getVcKey?.();
  const selectedVcStatus = selectedVcKey
    ? vcStatuses[selectedVcKey]
    : undefined;

  console.log('selectedVcStatus : ', selectedVcStatus);

  useEffect(() => {
    if (controller.IssuersService) {
      navigateToIssuers();
    }
  }, [controller.IssuersService]);

  // New useEffect to listen to IssuersService and backupRestore machine state changes
  useEffect(() => {
    if (!controller.IssuersService && !controller.backupRestoreService) return;

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    if (controller.IssuersService && controller.backupRestoreService) {
      const combinedSubscription = controller.IssuersService.subscribe(
        issuersState => {
          controller.backupRestoreService.subscribe(backupRestoreState => {
            if (
              issuersState.matches('storing') &&
              backupRestoreState.matches('init')
            ) {
              setActivateBackupModalVisible(true);
            }
          });
        },
      );
      subscriptions.push(combinedSubscription);
    }

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [controller.IssuersService, controller.backupRestoreService]);

  const useSetVCsStatus = () => {
    const { appService } = React.useContext(GlobalContext);
    const storeService = appService.children.get('store');
    const encryptionKey =
      storeService?.getSnapshot()?.context?.encryptionKey || '';

    const setVCsStatus = async () => {
      try {
        const keys = await MMKV.indexer.strings.getKeys();
        const filteredKeys = keys.filter(key => key.startsWith('VC_'));
        const statusMap: Record<string, string> = {};
        if (filteredKeys.length > 0) {
          for (const key of filteredKeys) {
            const vcData = await Storage.getItem(key, encryptionKey);
            if (vcData) {
              const decryptedValue = await decryptJson(encryptionKey, vcData);

              console.log(`Decrypted value for key '${key}':`, decryptedValue);
              const credentialStatus = await checkCredentialStatus(
                decryptedValue,
              );
              console.log('checkCredentialStatus : ', credentialStatus?.status);
              statusMap[key] = credentialStatus?.status || 'unknown';
            }
          }
          setVcStatuses(statusMap);
        }
      } catch (error) {
        console.error('Error fetching MMKV keys or values:', error);
      }
    };

    return setVCsStatus;
  };

  const checkCredentialStatus = async (decryptedValue: string) => {
    const credentialStatus =
      JSON.parse(decryptedValue)?.verifiableCredential?.credential
        ?.credentialStatus;

    if (!credentialStatus) {
      throw new Error('Credential status information is not available');
    }
    const statusListCredentialUrl = credentialStatus.id;
    const statusListIndex = parseInt(credentialStatus.statusListIndex);

    let statusListVcJson;
    try {
      const response = await fetch(statusListCredentialUrl);
      console.log('statusListCredentialUrl:', statusListCredentialUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch status list credential: ${response.status} ${response.statusText}`);
      }
      statusListVcJson = await response.json();
      console.log('statusListVcJson:', statusListVcJson);
    } catch (error) {
      console.error('Error fetching status list credential:', error);
      throw error;
    }

    const encodedList = statusListVcJson?.credentialSubject?.encodedList;
    if (!encodedList) {
      throw new Error('Missing encodedList in status list credential');
    }

    const bitArray = decodeEncodedList(encodedList);
    const revoked = isIndexRevoked(statusListIndex, bitArray);
    return {
      status: revoked ? 'revoked' : 'valid',
      index: statusListIndex,
      listUrl: statusListCredentialUrl,
    };
  };

  const setVCsStatus = useSetVCsStatus();
  useFocusEffect(
    React.useCallback(() => {
      //console.log('---------------------------------HomeScreen focused------------------------------');
      setVCsStatus();
      const timeoutId = setTimeout(() => {
        setVCsStatus();
      }, 3000);
      return () => {
        clearTimeout(timeoutId);
      };
    }, []),
  );

  const navigateToIssuers = () => {
    props.navigation.navigate('IssuersScreen', {
      service: controller.IssuersService,
    });
  };

  const DownloadFABIcon: React.FC = () => {
    const plusIcon = (
      <Icon
        {...testIDProps('plusIcon')}
        accessible={true}
        name={'plus'}
        type={'entypo'}
        size={36}
        color={Theme.Colors.whiteText}
      />
    );
    return (
      <LinearGradient
        colors={Theme.Colors.gradientBtn}
        start={Theme.LinearGradientDirection.start}
        end={Theme.LinearGradientDirection.end}
        style={Theme.Styles.downloadFabIconContainer}>
        <Pressable
          onPress={async () => {
            //console.log('Download button pressed');
            //props.navigation.navigate('BackupAndRestore');
            // props.navigation.navigate('Setting');
            //console.log('Download button pressed : ', props.navigationRef?.current);
            //props.navigationRef?.current?.navigate('Settings');
            //await logAuthData();
            controller.GOTO_ISSUERS();
            //resetMachinesToInitialState();
          }}
          {...testIDProps('downloadCardButton')}
          accessible={false}
          style={({ pressed }) =>
            pressed
              ? Theme.Styles.downloadFabIconPressed
              : Theme.Styles.downloadFabIconNormal
          }>
          {plusIcon}
        </Pressable>
      </LinearGradient>
    );
  };

  return (
    <>
      <React.Fragment>
        <BannerNotificationContainer />
        <Column fill backgroundColor={Theme.Colors.lightGreyBackgroundColor}>
          {controller.haveTabsLoaded && (
            <Column fill>
              <MyVcsTab
                isVisible={controller.activeTab === 0}
                service={controller.tabRefs.myVcs}
                vcItemActor={controller.selectedVc}
                vcStatuses={vcStatuses}
                setVCsStatus={setVCsStatus}
              />
              <ReceivedVcsTab
                isVisible={controller.activeTab === 1}
                service={controller.tabRefs.receivedVcs}
                vcItemActor={controller.selectedVc}
              />
            </Column>
          )}
        </Column>

        <Copilot
          title={t('copilot:downloadTitle')}
          description={t('copilot:downloadMessage')}
          order={2}
          targetStyle={Theme.Styles.downloadFabIconCopilotContainer}
          children={<DownloadFABIcon />}
        />

        <ErrorMessageOverlay
          translationPath={'MyVcsTab'}
          isVisible={controller.isMinimumStorageLimitReached}
          error={'errors.storageLimitReached'}
          onDismiss={controller.DISMISS}
        />
        {controller.selectedVc && (
          <ViewVcModal
            isVisible={controller.isViewingVc}
            onDismiss={controller.DISMISS_MODAL}
            vcItemActor={controller.selectedVc}
            activeTab={controller.activeTab}
            flow="downloadedVc"
            navigation={props.navigation}
            vcStatus={selectedVcStatus}
          />
        )}
      </React.Fragment>
      <Modal
        isVisible={activateBackupModalVisible}
        onBackdropPress={() => {
          setActivateBackupModalVisible(false);
        }}
        onBackButtonPress={() => {
          setActivateBackupModalVisible(false);
        }}
        backdropOpacity={0.5}>
        <Column
          style={{
            height: Platform.OS === 'android' ? '33%' : 'auto',
            backgroundColor: 'white',
            width: '100%',
            borderRadius: 10,
            padding: 20,
          }}>
          <Text
            testID="BackupSuggestion"
            style={{
              marginTop: 10,
            }}
            align="left"
            color={Theme.Colors.blackIcon}
            weight="semibold"
            size="large">
            {t('copilot:backupCard')}
          </Text>
          <Text
            testID="BackupSuggestionText"
            style={{
              marginTop: 20,
              paddingHorizontal: 0,
            }}
            align="left"
            color={Theme.Colors.blackIcon}
            weight="regular"
            size="mediumSmall">
            {t('copilot:backupSuggestionTitle')}
          </Text>
          <LinearGradient
            colors={Theme.Colors.gradientBtn}
            start={Theme.LinearGradientDirection.start}
            end={Theme.LinearGradientDirection.end}
            style={{
              alignSelf: 'flex-end',
              marginTop: 15,
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 10,
            }}>
            <TouchableOpacity
              onPress={() => {
                setActivateBackupModalVisible(false);
                props.navigation.navigate(BOTTOM_TAB_ROUTES.settings, {
                  showDataBackup: true,
                });
              }}>
              <Text
                testID="GoToBackup"
                align="center"
                color={Theme.Colors.whiteText}
                weight="semibold"
                size="mediumSmall">
                {t('copilot:goToBackupBtnTitle')}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Column>
      </Modal>
    </>
  );
};

export interface HomeScreenTabProps {
  isVisible: boolean;
  service: TabRef;
  vcItemActor: ActorRefFrom<typeof VCItemMachine>;
  vc: VerifiableCredential | Credential;
  vcStatuses: Record<string, string>;
  setVCsStatus: () => Promise<void>;
}
