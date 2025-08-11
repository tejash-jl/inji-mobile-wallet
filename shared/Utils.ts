import {VCMetadata} from './VCMetadata';
import {NETWORK_REQUEST_FAILED} from './constants';
import {groupBy} from './javascript';
import {Issuers} from './openId4VCI/Utils';
import pako from 'pako';

export const getVCsOrderedByPinStatus = (vcMetadatas: VCMetadata[]) => {
  const [pinned, unpinned] = groupBy(
    vcMetadatas,
    (vcMetadata: VCMetadata) => vcMetadata.isPinned,
  );
  return pinned.concat(unpinned);
};

export enum VCShareFlowType {
  SIMPLE_SHARE = 'simple share',
  MINI_VIEW_SHARE = 'mini view share',
  MINI_VIEW_SHARE_WITH_SELFIE = 'mini view share with selfie',
  MINI_VIEW_QR_LOGIN = 'mini view qr login',
  OPENID4VP = 'OpenID4VP',
  MINI_VIEW_SHARE_OPENID4VP = 'OpenID4VP share from mini view',
  MINI_VIEW_SHARE_WITH_SELFIE_OPENID4VP = 'OpenID4VP share with selfie from mini view',
}

export enum VCItemContainerFlowType {
  QR_LOGIN = 'qr login',
  VC_SHARE = 'vc share',
  VP_SHARE = 'vp share',
}

export interface CommunicationDetails {
  phoneNumber: string;
  emailId: string;
}

export const isMosipVC = (issuer: string) => {
  return issuer === Issuers.Mosip || issuer === Issuers.MosipOtp;
};

export const isMockVC = (issuer: string) => {
  return issuer.toLowerCase().startsWith('mock');
};

export const parseJSON = (input: any) => {
  let result = null;
  try {
    result = JSON.parse(input);
  } catch (e) {
    console.warn('Error occurred while parsing JSON ', e);
    result = JSON.parse(JSON.stringify(input));
  }
  return result;
};

export const isNetworkError = (error: string) => {
  return error.includes(NETWORK_REQUEST_FAILED);
};

export const decodeEncodedList = (encodedList: string): Uint8Array => {
  console.log('Input encodedList:', encodedList);
  const base64url = encodedList.startsWith('u')
    ? encodedList.slice(1)
    : encodedList;
  console.log('Processed base64url:', base64url);
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  console.log('Calculated padding length:', padding.length);
  const padded = base64url + padding;
  console.log('Padded base64url:', padded, 'length:', padded.length);
  const decoded = Buffer.from(padded, 'base64');
  console.log('Decoded buffer:', decoded, 'length:', decoded.length);
  try {
    console.log('Attempting to inflate decoded buffer...');
    const inflated = pako.ungzip(decoded);
    console.log(
      'Successfully inflated data:',
      inflated,
      'length:',
      inflated.length,
    );
    return inflated;
  } catch (e) {
    console.error('Inflation error:', e);
    console.error('Error details:', {
      message: e instanceof Error ? e.message : String(e),
      decodedLength: decoded.length,
      inputLength: encodedList.length,
    });
    throw new Error(
      `Failed to inflate decoded data in decodeEncodedList: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
};

export const isIndexRevoked = (
  index: number,
  bitArray: Uint8Array,
): boolean => {
  console.log('Input index:', index);
  console.log('Input bitArray length:', bitArray.length);

  const byteIndex = Math.floor(index / 8);
  console.log('Calculated byteIndex:', byteIndex);

  const bitIndex = index % 8;
  console.log('Calculated bitIndex:', bitIndex);

  if (byteIndex >= bitArray.length) {
    console.error('Index out of bounds:', {
      byteIndex,
      arrayLength: bitArray.length,
    });
    throw new Error(
      `Index ${index} out of bounds for bit array of length ${bitArray.length}`,
    );
  }

  const targetByte = bitArray[byteIndex];
  console.log('Target byte value:', targetByte);

  return ((targetByte >> (7 - bitIndex)) & 1) === 1;
};
