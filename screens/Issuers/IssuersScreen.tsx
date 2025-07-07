import React, {useLayoutEffect, useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {
  FlatList,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  View,
} from 'react-native';
import {Issuer} from '../../components/openId4VCI/Issuer';
import {Error} from '../../components/ui/Error';
import {Header} from '../../components/ui/Header';
import {Button, Column, Row, Text} from '../../components/ui';
import {Theme} from '../../components/ui/styleUtils';
import {RootRouteProps} from '../../routes';
import {HomeRouteProps} from '../../routes/routeTypes';
import {useIssuerScreenController} from './IssuerScreenController';
import {Loader} from '../../components/ui/Loader';
import {isTranslationKeyFound, removeWhiteSpace} from '../../shared/commonUtil';
import {
  ErrorMessage,
  getDisplayObjectForCurrentLanguage,
  Protocols,
} from '../../shared/openId4VCI/Utils';
import {
  getInteractEventData,
  getStartEventData,
  sendInteractEvent,
  sendStartEvent,
} from '../../shared/telemetry/TelemetryUtils';
import {TelemetryConstants} from '../../shared/telemetry/TelemetryConstants';
import {MessageOverlay} from '../../components/MessageOverlay';
import {SearchBar} from '../../components/ui/SearchBar';
import {SvgImage} from '../../components/ui/svg';
import {Icon} from 'react-native-elements';
import {BannerNotificationContainer} from '../../components/BannerNotificationContainer';
import {CredentialTypeSelectionScreen} from './CredentialTypeSelectionScreen';
import Modal from 'react-native-modal';

export const IssuersScreen: React.FC<
  HomeRouteProps | RootRouteProps
> = props => {
  const controller = useIssuerScreenController(props);
  const {t} = useTranslation('IssuersScreen');

  const issuers = controller.issuers;
  let [filteredSearchData, setFilteredSearchData] = useState(issuers);
  const [search, setSearch] = useState('');
  const [tapToSearch, setTapToSearch] = useState(false);
  const [clearSearchIcon, setClearSearchIcon] = useState(false);
  const [isDublicateModalVisible, setIsDublicateModalVisible] = useState(false);
  const showFullScreenError = controller.isError && controller.errorMessageType;

  const isVerificationFailed = controller.verificationErrorMessage !== '';

  const translationKey = `errors.verificationFailed.${controller.verificationErrorMessage}`;

  const verificationErrorMessage = isTranslationKeyFound(translationKey, t)
    ? t(translationKey)
    : t(`errors.verificationFailed.ERR_GENERIC`);

  useEffect(() => {
    const service = props.route.params.service;

    const subscription = service?.subscribe(state => {
      if (state.matches('awaitUserDecision')) {
        setIsDublicateModalVisible(true);
      } else {
        setIsDublicateModalVisible(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, [props.route.params.service.state]);

  useLayoutEffect(() => {
    if (controller.loadingReason || showFullScreenError) {
      props.navigation.setOptions({
        headerShown: false,
      });
    } else {
      props.navigation.setOptions({
        headerShown: true,
        header: props => (
          <Header
            goBack={props.navigation.goBack}
            title={t('title')}
            testID="issuersScreenHeader"
          />
        ),
      });
    }

    if (controller.isStoring) {
      props.navigation.goBack();
    }
  }, [
    controller.loadingReason,
    controller.errorMessageType,
    controller.isStoring,
  ]);

  const onPressHandler = (id: string, protocol: string) => {
    sendStartEvent(
      getStartEventData(TelemetryConstants.FlowType.vcDownload, {id: id}),
    );
    sendInteractEvent(
      getInteractEventData(
        TelemetryConstants.FlowType.vcDownload,
        TelemetryConstants.InteractEventSubtype.click,
        `IssuerType: ${id}`,
      ),
    );
    protocol === Protocols.OTP
      ? controller.DOWNLOAD_ID()
      : controller.SELECTED_ISSUER(id);
  };

  const isGenericError = () => {
    return controller.errorMessageType === ErrorMessage.GENERIC;
  };

  function isBackendError(): boolean {
    return (
      controller.errorMessageType === ErrorMessage.TECHNICAL_DIFFICULTIES ||
      controller.errorMessageType ===
        ErrorMessage.CREDENTIAL_TYPE_DOWNLOAD_FAILURE ||
      controller.errorMessageType ===
        ErrorMessage.AUTHORIZATION_GRANT_TYPE_NOT_SUPPORTED
    );
  }

  const onFocusSearch = () => {
    setTapToSearch(true);
  };

  const clearSearchText = () => {
    filterIssuers('');
    setClearSearchIcon(false);
  };

  const goBack = () => {
    if (
      controller.errorMessageType &&
      controller.loadingReason === 'displayIssuers'
    ) {
      props.navigation.goBack();
    } else {
      controller.RESET_ERROR();
    }
  };

  const getImage = () => {
    if (isGenericError()) {
      return SvgImage.SomethingWentWrong();
    }
    if (isBackendError()) return SvgImage.ErrorOccurred();
    return SvgImage.NoInternetConnection();
  };

  const filterIssuers = (searchText: string) => {
    const filteredData = issuers.filter(item => {
      if (
        getDisplayObjectForCurrentLanguage(item.display)
          ?.title.toLowerCase()
          .includes(searchText.toLowerCase())
      ) {
        return getDisplayObjectForCurrentLanguage(item.display);
      }
    });
    setFilteredSearchData(filteredData);
    setSearch(searchText);
    if (searchText !== '') {
      setClearSearchIcon(true);
    } else {
      setClearSearchIcon(false);
    }
  };
  if (controller.isSelectingCredentialType) {
    return <CredentialTypeSelectionScreen {...props} />;
  }

  if (isVerificationFailed) {
    return (
      <Error
        testID="verificationError"
        isVisible={isVerificationFailed}
        isModal={true}
        alignActionsOnEnd
        title={t('MyVcsTab:errors.verificationFailed.title')}
        message={verificationErrorMessage}
        image={SvgImage.PermissionDenied()}
        showClose={false}
        primaryButtonText="goBack"
        primaryButtonEvent={controller.RESET_VERIFY_ERROR}
        primaryButtonTestID="goBack"
        customStyles={{marginTop: '30%'}}
      />
    );
  }

  if (controller.isBiometricsCancelled) {
    return (
      <MessageOverlay
        isVisible={controller.isBiometricsCancelled}
        minHeight={'auto'}
        title={t('errors.biometricsCancelled.title')}
        message={t('errors.biometricsCancelled.message')}
        onBackdropPress={controller.RESET_ERROR}>
        <Row>
          <Button
            fill
            type="clear"
            title={t('common:cancel')}
            onPress={controller.RESET_ERROR}
            margin={[0, 8, 0, 0]}
          />
          <Button
            testID="tryAgain"
            fill
            title={t('common:tryAgain')}
            onPress={controller.TRY_AGAIN}
          />
        </Row>
      </MessageOverlay>
    );
  }
  if (showFullScreenError) {
    return (
      <Error
        testID={`${controller.errorMessageType}Error`}
        isVisible={controller.errorMessageType !== ''}
        title={t(`errors.${controller.errorMessageType}.title`)}
        message={t(`errors.${controller.errorMessageType}.message`)}
        goBack={goBack}
        tryAgain={controller.TRY_AGAIN}
        image={getImage()}
        showClose
        primaryButtonTestID="tryAgain"
        primaryButtonText={
          controller.errorMessageType != ErrorMessage.TECHNICAL_DIFFICULTIES &&
          controller.errorMessageType !=
            ErrorMessage.AUTHORIZATION_GRANT_TYPE_NOT_SUPPORTED
            ? 'tryAgain'
            : undefined
        }
        primaryButtonEvent={controller.TRY_AGAIN}
        onDismiss={goBack}
      />
    );
  }

  if (controller.loadingReason) {
    return (
      <>
        <Loader
          title={t('loaders.loading')}
          subTitle={t(`loaders.subTitle.${controller.loadingReason}`)}
        />

        <Modal
          //isVisible={props.route.params.service.state.matches('awaitUserDecision')}
          isVisible={isDublicateModalVisible}
          //onBackdropPress={() => {}}
          //onBackButtonPress={() => {}}
          backdropOpacity={0.5}>
          <SafeAreaView
            style={{
              height: Platform.OS === 'android' ? '30%' : 'auto',
              backgroundColor: 'white',
              width: '100%',
              borderRadius: 10,
            }}>
            <Text
              testID="ExistingCredentialConfirm"
              style={{
                marginTop: 30,
              }}
              align="center"
              color={Theme.Colors.blackIcon}
              weight="semibold"
              size="large">
              {t('copilot:existingCredentialTitle')}
            </Text>
            <Text
              testID="ExistingCredentialConfirmText"
              style={{
                marginTop: 20,
                paddingHorizontal: 30,
              }}
              align="left"
              color={Theme.Colors.blackIcon}
              weight="regular"
              size="mediumSmall">
              {t('copilot:existingCredentialDescription')}
            </Text>
            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: '#A7A7A7',
                marginTop: 20,
              }}
            />
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
              }}>
              <TouchableOpacity
                onPress={() =>
                  props.route.params.service.send({
                    type: 'CANCEL_ADD_DUPLICATE',
                  })
                }
                style={{
                  width: '49.5%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  testID="ExistingCredentialCancel"
                  align="center"
                  color={Theme.Colors.forgotPin}
                  weight="semibold"
                  size="large">
                  {t('copilot:existingCredentialButtonDeclineText')}
                </Text>
              </TouchableOpacity>
              <View
                style={{width: 1, height: '100%', backgroundColor: '#A7A7A7'}}
              />
              <TouchableOpacity
                onPress={() => {
                  setIsDublicateModalVisible(false);
                  setTimeout(() => {
                    props.route.params.service.send({
                      type: 'CONFIRM_ADD_DUPLICATE',
                    });
                  }, 300);
                }}
                style={{
                  width: '49.5%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  testID="ExistingCredentialConfirm"
                  align="center"
                  color={Theme.Colors.errorMessage}
                  weight="semibold"
                  size="large">
                  {t('copilot:existingCredentialButtonConfirmText')}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </>
    );
  }

  return (
    <React.Fragment>
      <BannerNotificationContainer />
      {controller.issuers.length > 0 && (
        <Column style={Theme.IssuersScreenStyles.issuerListOuterContainer}>
          <Row
            style={
              tapToSearch
                ? Theme.SearchBarStyles.searchBarContainer
                : Theme.SearchBarStyles.idleSearchBarBottomLine
            }>
            <SearchBar
              searchIconTestID="searchIssuerIcon"
              searchBarTestID="issuerSearchBar"
              search={search}
              placeholder={t('searchByIssuersName')}
              onFocus={onFocusSearch}
              onChangeText={filterIssuers}
              onLayout={() => filterIssuers('')}
            />
            {clearSearchIcon && (
              <Pressable
                onPress={clearSearchText}
                style={Theme.SearchBarStyles.clearSearch}>
                <Icon
                  testID="clearingIssuerSearchIcon"
                  name="circle-with-cross"
                  type="entypo"
                  size={18}
                  color={Theme.Colors.DetailsLabel}
                />
              </Pressable>
            )}
          </Row>
          <Text
            testID="issuersScreenDescription"
            style={{
              ...Theme.TextStyles.regularGrey,
              ...Theme.IssuersScreenStyles.issuersSearchSubText,
            }}>
            {t('description')}
          </Text>
          <Column scroll style={Theme.IssuersScreenStyles.issuersContainer}>
            {controller.issuers.length > 0 && (
              <FlatList
                data={filteredSearchData}
                renderItem={({item}) => (
                  <Issuer
                    testID={removeWhiteSpace(item.credential_issuer)}
                    key={item.credential_issuer}
                    displayDetails={getDisplayObjectForCurrentLanguage(
                      item.display,
                    )}
                    onPress={() =>
                      onPressHandler(item.credential_issuer, item.protocol)
                    }
                    {...props}
                  />
                )}
                numColumns={1}
                keyExtractor={item => item.credential_issuer}
              />
            )}
          </Column>
        </Column>
      )}
    </React.Fragment>
  );
};
