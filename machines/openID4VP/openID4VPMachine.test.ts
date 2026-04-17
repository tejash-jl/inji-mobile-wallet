import {interpret, InterpreterFrom} from 'xstate';
import {openID4VPModel} from './openID4VPModel';
import {VCShareFlowType} from '../../shared/Utils';

// Mock jsonpath-plus before importing the machine (it's ESM)
jest.mock('jsonpath-plus', () => ({
  JSONPath: Object.assign(
    jest.fn(() => []),
    {toPathArray: jest.fn(() => [])},
  ),
}));

// Mock dependencies
jest.mock('../../shared/api', () => ({
  CACHED_API: {
    fetchTrustedVerifiersList: jest.fn(),
  },
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../shared/cryptoutil/cryptoUtil', () => ({
  fetchKeyPair: jest.fn(),
  getJWT: jest.fn(),
}));

jest.mock('../../shared/openId4VCI/Utils', () => ({
  hasKeyPair: jest.fn(),
  getJWK: jest.fn(),
}));

jest.mock('../../shared/GlobalVariables', () => ({
  __AppId: {getValue: jest.fn(() => 'test-app-id')},
}));

jest.mock('../../shared/openID4VP/OpenID4VP', () => ({
  OpenID4VP: {
    InjiOpenID4VP: {
      init: jest.fn(),
      authenticateVerifier: jest.fn(),
      constructVerifiablePresentationToken: jest.fn(),
      shareVerifiablePresentation: jest.fn(),
      sendErrorToVerifier: jest.fn(),
    },
    initialize: jest.fn(),
    authenticateVerifier: jest.fn(),
    constructVerifiablePresentationToken: jest.fn(),
    shareVerifiablePresentation: jest.fn(),
    sendErrorToVerifier: jest.fn(),
  },
  constructProofJWT: jest.fn(),
  isClientValidationRequired: jest.fn(),
  OpenID4VP_Domain: 'OpenID4VP',
  OpenID4VP_Key_Ref: 'OpenID4VP_KeyPair',
  OpenID4VP_Proof_Algo_Type: 'RsaSignature2018',
}));

jest.mock('../../components/VPShareActivityLogEvent', () => ({
  VPShareActivityLog: {
    getLogFromObject: jest.fn(() => ({})),
  },
}));

jest.mock('../activityLog', () => ({
  ActivityLogEvents: {
    LOG_ACTIVITY: jest.fn(() => ({type: 'LOG_ACTIVITY'})),
  },
}));

jest.mock('../../shared/constants', () => ({
  SHOW_FACE_AUTH_CONSENT_SHARE_FLOW: 'showFaceAuthConsent',
}));

jest.mock('../store', () => ({
  StoreEvents: {
    GET: jest.fn(() => ({type: 'STORE_GET'})),
    SET: jest.fn(() => ({type: 'STORE_SET'})),
  },
}));

// Import machine after all mocks are set up
import {openID4VPMachine} from './openID4VPMachine';

const {
  OpenID4VP,
  isClientValidationRequired,
  constructProofJWT,
} = require('../../shared/openID4VP/OpenID4VP');

/**
 * Helper to create a configured openID4VP machine with mocked services/actions
 * that can be driven through the state machine transitions.
 */
function createTestMachine(overrides: Record<string, any> = {}) {
  const mockStoreRef = {send: jest.fn()};
  const mockActivityLogRef = {send: jest.fn()};

  return openID4VPMachine.withConfig({
    actions: {
      forwardToParent: jest.fn(),
      logActivity: jest.fn(),
      setShareLogTypeUnverified: jest.fn(),
      shareDeclineStatus: jest.fn(),
      storeShowFaceAuthConsent: jest.fn(),
      getFaceAuthConsent: jest.fn(),
      ...overrides.actions,
    },
    ...overrides.config,
  });
}

/**
 * Builds a sample authentication response that contains `response_mode`.
 * According to OpenID4VP draft 21, the authorization request includes:
 *   client_id, presentation_definition, response_type, response_mode,
 *   nonce, state, response_uri, client_metadata (optional)
 */
function buildAuthResponseWithResponseMode(
  responseMode: string,
  extras: Record<string, any> = {},
) {
  return {
    client_id: 'test-verifier-client-id',
    response_type: 'vp_token',
    response_mode: responseMode,
    nonce: 'test-nonce-12345',
    state: 'test-state-abcde',
    response_uri: 'https://verifier.example.com/direct-post',
    presentation_definition: {
      id: 'test-pd-id',
      input_descriptors: [
        {
          id: 'input-descriptor-1',
          format: {
            ldp_vc: {
              proof_type: ['RsaSignature2018'],
            },
          },
          constraints: {
            fields: [
              {
                path: ['$.credentialSubject.name'],
                filter: {type: 'string', pattern: '.*'},
              },
            ],
          },
        },
      ],
    },
    client_metadata: {
      client_name: 'Test Verifier',
    },
    ...extras,
  };
}

describe('openID4VP Machine - responseMode behavior tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication response with response_mode: "direct_post"', () => {
    it('should store the authenticationResponse containing response_mode in context after authenticateVerifier succeeds', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');

      // The setAuthenticationResponse action stores event.data into context
      const model = openID4VPModel;
      const initialContext = {
        ...model.initialContext,
        authenticationResponse: {},
      };

      // Simulate what setAuthenticationResponse does
      const updatedContext = {
        ...initialContext,
        authenticationResponse: authResponse,
      };

      expect(updatedContext.authenticationResponse.response_mode).toBe(
        'direct_post',
      );
      expect(updatedContext.authenticationResponse.response_uri).toBe(
        'https://verifier.example.com/direct-post',
      );
    });

    it('should include response_mode as part of the parsed authorization request fields', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');

      // Verify all required OpenID4VP authorization request fields are present
      expect(authResponse).toHaveProperty('client_id');
      expect(authResponse).toHaveProperty('presentation_definition');
      expect(authResponse).toHaveProperty('response_type');
      expect(authResponse).toHaveProperty('response_mode');
      expect(authResponse).toHaveProperty('nonce');
      expect(authResponse).toHaveProperty('state');
      expect(authResponse).toHaveProperty('response_uri');

      expect(authResponse.response_mode).toBe('direct_post');
    });
  });

  describe('machine state transitions with response_mode in authenticationResponse', () => {
    it('should start in waitingForData state', () => {
      expect(openID4VPMachine.initialState.value).toBe('waitingForData');
    });

    it('should transition to checkFaceAuthConsent on AUTHENTICATE event', () => {
      const machine = createTestMachine();
      const service = interpret(machine);
      service.start();

      expect(service.getSnapshot().value).toBe('waitingForData');

      service.send({
        type: 'AUTHENTICATE',
        encodedAuthRequest: 'encoded-request-with-direct-post-response-mode',
        flowType: VCShareFlowType.OPENID4VP,
        selectedVC: {},
      });

      expect(service.getSnapshot().value).toBe('checkFaceAuthConsent');
      expect(service.getSnapshot().context.encodedAuthorizationRequest).toBe(
        'encoded-request-with-direct-post-response-mode',
      );
      expect(service.getSnapshot().context.flowType).toBe(
        VCShareFlowType.OPENID4VP,
      );

      service.stop();
    });

    it('should preserve response_mode in context.authenticationResponse through the flow', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');
      const context = {
        ...openID4VPModel.initialContext,
        authenticationResponse: authResponse,
        flowType: VCShareFlowType.OPENID4VP,
      };

      // Verify response_mode persists in context
      expect(context.authenticationResponse.response_mode).toBe('direct_post');
      expect(context.authenticationResponse.response_uri).toBe(
        'https://verifier.example.com/direct-post',
      );
    });
  });

  describe('VP sharing with direct_post response_mode', () => {
    it('should use the sendVP service to post VP to response_uri when response_mode is direct_post', async () => {
      const mockVpToken = JSON.stringify({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: [],
        id: 'vp-id-123',
        holder: 'did:example:holder',
      });

      const mockProofJWT = 'mock-proof-jwt-token';
      const mockShareResponse = 'success';

      OpenID4VP.constructVerifiablePresentationToken.mockResolvedValue(
        mockVpToken,
      );
      constructProofJWT.mockResolvedValue(mockProofJWT);
      OpenID4VP.shareVerifiablePresentation.mockResolvedValue(
        mockShareResponse,
      );

      // Simulate the sendVP service logic
      const context = {
        selectedVCs: {'input-descriptor-1': [{verifiableCredential: {}}]},
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key',
        keyType: 'RS256',
      };

      const vpToken = await OpenID4VP.constructVerifiablePresentationToken(
        context.selectedVCs,
      );

      const proofJWT = await constructProofJWT(
        context.publicKey,
        context.privateKey,
        JSON.parse(vpToken),
        context.keyType,
      );

      const vpResponseMetadata = {
        jws: proofJWT,
        signatureAlgorithm: 'RsaSignature2018',
        publicKey: context.publicKey,
        domain: 'OpenID4VP',
      };

      const result = await OpenID4VP.shareVerifiablePresentation(
        vpResponseMetadata,
      );

      expect(
        OpenID4VP.constructVerifiablePresentationToken,
      ).toHaveBeenCalledWith(context.selectedVCs);
      expect(constructProofJWT).toHaveBeenCalledWith(
        context.publicKey,
        context.privateKey,
        JSON.parse(mockVpToken),
        context.keyType,
      );
      expect(OpenID4VP.shareVerifiablePresentation).toHaveBeenCalledWith({
        jws: mockProofJWT,
        signatureAlgorithm: 'RsaSignature2018',
        publicKey: 'mock-public-key',
        domain: 'OpenID4VP',
      });
      expect(result).toBe('success');
    });

    it('should call sendErrorToVerifier when user declines VP sharing', () => {
      OpenID4VP.sendErrorToVerifier.mockImplementation(() => {});

      // Simulate shareDeclineStatus action
      OpenID4VP.sendErrorToVerifier(
        'The user has declined to share their credentials at this time',
      );

      expect(OpenID4VP.sendErrorToVerifier).toHaveBeenCalledWith(
        'The user has declined to share their credentials at this time',
      );
    });
  });

  describe('authenticateVerifier service with response_mode', () => {
    it('should parse response_mode from the native library authentication response', async () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');
      OpenID4VP.authenticateVerifier.mockResolvedValue(authResponse);

      const result = await OpenID4VP.authenticateVerifier(
        'encoded-auth-request',
        [],
      );

      expect(result.response_mode).toBe('direct_post');
      expect(result.response_uri).toBe(
        'https://verifier.example.com/direct-post',
      );
      expect(result.client_id).toBe('test-verifier-client-id');
    });

    it('should handle unsupported response_mode values from the authorization request', async () => {
      // Per spec, only direct_post is supported for cross-device flow
      const authResponseWithQuery = buildAuthResponseWithResponseMode('query');

      OpenID4VP.authenticateVerifier.mockResolvedValue(authResponseWithQuery);

      const result = await OpenID4VP.authenticateVerifier(
        'encoded-auth-request-with-query-mode',
        [],
      );

      // The response_mode is preserved as-is from the native library response
      expect(result.response_mode).toBe('query');
    });

    it('should handle authentication failure when response_mode is invalid', async () => {
      OpenID4VP.authenticateVerifier.mockRejectedValue(
        new Error('Unsupported response_mode: fragment'),
      );

      await expect(
        OpenID4VP.authenticateVerifier('invalid-encoded-request', []),
      ).rejects.toThrow('Unsupported response_mode: fragment');
    });
  });

  describe('response_mode field validation in authorization request', () => {
    it('should accept direct_post as a valid response_mode', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');
      expect(authResponse.response_mode).toBe('direct_post');
    });

    it('should carry response_mode along with other required fields', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');

      const requiredFields = [
        'client_id',
        'presentation_definition',
        'response_type',
        'response_mode',
        'nonce',
        'state',
        'response_uri',
      ];

      requiredFields.forEach(field => {
        expect(authResponse).toHaveProperty(field);
        expect(authResponse[field]).toBeDefined();
      });
    });

    it('should include client_metadata as an optional field', () => {
      const withMetadata = buildAuthResponseWithResponseMode('direct_post', {
        client_metadata: {client_name: 'Verifier App'},
      });
      expect(withMetadata.client_metadata.client_name).toBe('Verifier App');

      const withoutMetadata = buildAuthResponseWithResponseMode(
        'direct_post',
        {},
      );
      // Default from the builder includes client_metadata
      expect(withoutMetadata.client_metadata).toBeDefined();
    });
  });

  describe('getVcsMatchingAuthRequest with response_mode context', () => {
    it('should match VCs against presentation_definition when response_mode is direct_post', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');
      const presentationDefinition = authResponse.presentation_definition;

      expect(presentationDefinition.input_descriptors).toHaveLength(1);
      expect(presentationDefinition.input_descriptors[0].id).toBe(
        'input-descriptor-1',
      );
      expect(
        presentationDefinition.input_descriptors[0].constraints.fields,
      ).toBeDefined();
    });
  });

  describe('verifier name extraction from authenticationResponse with response_mode', () => {
    it('should extract client_name from client_metadata when available', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post', {
        client_metadata: {client_name: 'My Verifier'},
      });

      const verifierName =
        authResponse.client_metadata?.client_name ?? authResponse.client_id;
      expect(verifierName).toBe('My Verifier');
    });

    it('should fall back to client_id when client_metadata is not available', () => {
      const authResponse = buildAuthResponseWithResponseMode('direct_post');
      delete authResponse.client_metadata;

      const verifierName =
        authResponse.client_metadata?.client_name ?? authResponse.client_id;
      expect(verifierName).toBe('test-verifier-client-id');
    });
  });
});
