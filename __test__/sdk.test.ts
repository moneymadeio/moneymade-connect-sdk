import { MoneymadeConnect } from '../src/sdk';

const publicKey = 'publicKey';
const privateKey = 'privateKey';
const payload = 'eyJ1c2VySWQiOiJzb21lIGlkIn0=';
const body = { userId: 'some id' };
const signature = '996d7f8c4c038ba65898196c7b6b68315ec0374d0d561ac07f6f9221716eacb6';

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
    const sdk = new MoneymadeConnect({ publicKey, privateKey });

    expect(sdk.makeBodySignature(body)).toStrictEqual(signature);
  });
});
