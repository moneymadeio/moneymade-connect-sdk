import { MoneymadeConnect } from '../src/sdk';

const publicKey = 'publicKey';
const privateKey = 'privateKey';
const payload = 'eyJ1c2VySWQiOiJzb21lIGlkIn0=';
const body = { userId: 'some id' };
const signature = '996d7f8c4c038ba65898196c7b6b68315ec0374d0d561ac07f6f9221716eacb6';

const sdk = new MoneymadeConnect({ publicKey, privateKey });

const mockReq = (body = {}, query = {}) => ({
  body,
  method: 'POST',
  query,
  headers: {},
});

const mockRes = () => ({
  set() { return this; },
  send() { return this; },
  status(status: number) {
    this.status = status;

    return this;
  },
  addExpect(foo) {
    this.send = foo;
    this.json = foo;

    return this;
  }
});

describe('Constructor should throw error', () => {
  it('if no private key presented', () => {
    const run = () => new MoneymadeConnect({
      publicKey: 'publicKey',
      privateKey: null,
    });

    expect(run).toThrow();
  });

  it('if no public key presented', () => {
    const run = () => new MoneymadeConnect({
      publicKey: null,
      privateKey: 'privateKey',
    });

    expect(run).toThrow();
  });
});

describe(`makeSignature`, () => {
  it('should generate correct signature', () => {
    const sdk = new MoneymadeConnect({ publicKey, privateKey });

    expect(sdk.makeSignature(payload)).toStrictEqual(signature);
  });
});

describe('makeBodySignature', () => {
  it('should generate correct signature', () => {

    expect(sdk.makeBodySignature(body)).toStrictEqual(signature);
  });
});

describe('objectToBase64 should return', () => {
  it(`correct base64 coded string`, () => {
    expect(sdk.objectToBase64(body)).toStrictEqual(payload);
  });
});

describe('base64ToObject should return', () => {
  it(`correct object decoded from base64`, () => {
    expect(sdk.base64ToObject(payload)).toStrictEqual(body);
  });
});

describe('expressMiddleware should return', () => {
  it(`message="Body must contain payload field!" if missed payload`, async () => {
    const req = mockReq();
    const res = mockRes().addExpect(response => {
      expect(response).toStrictEqual({ message: 'Body must contain payload field!' });
    });

    await sdk.expressMiddleware()(req, res, null);
  });

  it(`message="Body must contain signature field!" if missed payload`, async () => {
    const req = mockReq({ payload: 'payload' });
    const res = mockRes().addExpect(response => {
      expect(response).toStrictEqual({ message: 'Body must contain signature field!' });
    });

    await sdk.expressMiddleware()(req, res, null);
  });

  it(`message="Signature not valid" with wrong payload and signature`, async () => {
    const req = mockReq({ payload: 'payload', signature: 'signature' });
    const res = mockRes().addExpect(response => {
      expect(response).toStrictEqual({ message: 'Signature not valid' });
    });

    await sdk.expressMiddleware()(req, res, null);
  });

  it(`Call next() if signature validation passed`, async () => {
    const req = mockReq({ payload, signature });
    const res = mockRes().addExpect(() => expect(1).toBe(2));

    await sdk.expressMiddleware()(req, res, () => {
      expect(1).toBe(1);
    });
  });
});


