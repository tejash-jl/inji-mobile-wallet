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
  const base64url = encodedList.startsWith('u')
    ? encodedList.slice(1)
    : encodedList;
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const padded = base64url + padding;
  console.log('Padded base64url:', padded);

  const decoded = Buffer.from(padded, 'base64');

  // Assign the result of pako.inflate to a variable
  const inflatedData = pako.inflate(decoded);

  // Check if the result is a Uint8Array before returning it
  if (inflatedData instanceof Uint8Array) {
    console.log('Decoded and inflated data:', inflatedData);

    // Print the entire bit array
    printBitArray(inflatedData);

    return inflatedData;
  }

  // If the result is not a Uint8Array, throw an error
  throw new Error('Failed to decode the encoded list into a Uint8Array.');
};
// Function to print the bit representation of a Uint8Array

// export const isIndexRevoked = (
//   index,
//   bitArray,
// ) => {
//   const byteIndex = Math.floor(index / 8);
//   const bitIndex = index % 8;

//   if (byteIndex >= bitArray.length) {
//     throw new Error(
//       `Index ${index} out of bounds for bit array of length ${bitArray.length}`,
//     );
//   }

//   const targetByte = bitArray[byteIndex];
//   // Check if the bit at bitIndex is set (1)
//   // If the bit is set, it means the index is revoked
//   // If the bit is not set, it means the index is valid
//   return ((targetByte >> (7 - bitIndex)) & 1) === 1;
// };

export const isIndexRevoked = (
  index: number,
  bitArray: Uint8Array,
): boolean => {
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;

  if (byteIndex >= bitArray.length) {
    throw new Error(
      `Index ${index} out of bounds for bit array of length ${
        bitArray.length * 8
      }`,
    );
  }

  const byte = bitArray[byteIndex];
  console.log(`Byte at index ${byteIndex}:`, byte);
  const bit = (byte >> (7 - bitIndex)) & 1;
  console.log(`Index: ${index}, Byte: ${byte}, Bit: ${bit}`);
  if (index === 2224) {
    console.log(`Found the bit at index 2913! It's value is: ${bit}`);
  }

  return bit === 1;
};

const printBitArray = (bitArray: Uint8Array) => {
  console.log('Bit Array Representation:');
  for (let i = 0; i < bitArray.length; i++) {
    // Convert each byte to binary and pad with leading zeros
    const binaryString = bitArray[i].toString(2).padStart(8, '0');
    console.log(`Byte ${i}: ${binaryString}`);
  }
};
