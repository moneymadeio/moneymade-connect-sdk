jest.mock('node-fetch');

import fetch from 'node-fetch';

import { MoneymadeConnect } from '../src/sdk';

const publicKey = 'publicKey';
const privateKey = 'privateKey';
const payload = 'eyJ1c2VySWQiOiJzb21lIGlkIn0=';
const oauthSignature = '996d7f8c4c038ba65898196c7b6b68315ec0374d0d561ac07f6f9221716eacb6';

const base64Payload = 'eyJ1c2VySWQiOiJhYmNkZWYtYWJjZGVmLWFiY2RlZi1hYmNkZWYtYWJjZGVmIiwiYWNjb3VudHMiOlt7ImlkIjoyLCJuYW1lIjoiUmVwYWlkIiwiYW1vdW50IjoxMDAwfV19';
const signature = 'a604c5d3610dd5e3bf0548c26c75587b92fea1573a6d0921c7969b0913f7771b';
const accessTokenRequestSignature = 'a74ffb54920d18b89f161992599f3f3da98544d0fa3f3aa4c160bb71e60d6c8f';
const accountsOauthRequestSignature = 'b701834eab8e248181ffeed876aaa0c7fcef9da7a73ac5717ee25c105fc5fc2c';
const finishOAuthRequestSignature = 'fa595194c0ba6526dcb2c4063d959cb3b7ed0d8848c7f40ddc491ff3a35805b1';
const payloadObject = {
    "userId": "abcdef-abcdef-abcdef-abcdef-abcdef",
    "accounts": [
        {"id": 2, "name": "Repaid", "amount": 1000.0},
    ],
}

const transactionsObject =  {
  "userId": "abcdef-abcdef-abcdef-abcdef-abcdef",
  "account": [
    {
      "account_id": "d95d2e07-a358-48d2-aa1d-80cb34eefcec",
      "provider_name": "MoneyMade Inc.",
      "transaction": [
        {
          "fees": [
            {
              "amount": 1
            },
            {
              "amount": 0
            },
            {
              "amount": 0
            }
          ],
          "id": 123,
          "amount": 12300,
          "created_at": "2016-03-31T02:38:24.000Z",
          "updated_at": "2017-10-23T18:18:26.248Z"
        },
        {
          "fees": [
            {
              "amount": 0
            },
            {
              "amount": 0
            },
            {
              "amount": 0
            }
          ],
          "id": 1224,
          "amount": -10,
          "created_at": "2016-08-16T15:05:25.003Z",
          "updated_at": "2016-10-04T14:33:36.000Z"
        }
      ]
    }
  ]
}

const transactionsSignature = '7f081302740cf70cc461d9f59564a5ecb0c7e74ddf6e284132083a42d333f1fe';

const redirectUrl = `https://connect-oauth.moneymade.io/api/v1/oauth/finish/callback?oauth-signature=${oauthSignature}`;

const querystring = `signature=${signature}&payload=${base64Payload}`;


let sdk:  MoneymadeConnect;


beforeEach(() => {
  sdk = new MoneymadeConnect({ publicKey, privateKey, version: 'v2' });
});

describe(`getFinishOAuthRedirectUrl`, () => {
  it('should generate correct redirect url', () => {
    expect(sdk.getFinishOAuthRedirectUrl(oauthSignature)).toStrictEqual(redirectUrl);
  });
});

describe(`v2 pushAccounts should be executed`, () => {
  it(`with correct parameters`, async () => {
    await sdk.pushAccounts(payloadObject);
  
    expect(fetch).toHaveBeenCalledWith(
      'https://connect-oauth.moneymade.io/api/v1/data/accounts',
      {
        method: 'POST',
        body: JSON.stringify(payloadObject),
        headers: {
          'Content-Type': 'application/json',
          'api-key': publicKey,
          'request-signature': signature,
        },
      },
    );
  });
});

describe(`v2 pushTransactions should be executed`, () => {
  it(`with correct parameters`, async () => {
    await sdk.pushTransactions(transactionsObject);
  
    expect(fetch).toHaveBeenCalledWith(
      'https://connect-oauth.moneymade.io/api/v1/data/transactions',
      {
        method: 'POST',
        body: JSON.stringify(transactionsObject),
        headers: {
          'Content-Type': 'application/json',
          'api-key': publicKey,
          'request-signature': transactionsSignature,
        },
      },
    );
  });
});

describe(`v2 finishOauth should execute correct finish Oauth request`, () => {
  it('with accessToken', async () => {
    const accessToken = 'accessToken';
    const result = await sdk.finishOauth({
      accessToken: 'accessToken',
      oauthSignature,
    });

    expect(result).toEqual({ redirectUrl });
    expect(fetch).toHaveBeenCalledWith(
      'https://connect-oauth.moneymade.io/api/v1/oauth/finish',
      {
        method: 'POST',
        body: JSON.stringify({ accessToken }),
        headers: {
          'Content-Type': 'application/json',
          'api-key': publicKey,
          'request-signature': accessTokenRequestSignature,
          'oauth-signature': oauthSignature,
        },
      },
    );
  });

  it(`with accounts payload`, async () => {
    const result = await sdk.finishOauth({
      oauthSignature,
      accounts: payloadObject,
    });

    expect(result).toEqual({ redirectUrl });
    expect(fetch).toHaveBeenCalledWith(
      'https://connect-oauth.moneymade.io/api/v1/oauth/finish',
      {
        method: 'POST',
        body: JSON.stringify({ accounts: payloadObject }),
        headers: {
          'Content-Type': 'application/json',
          'api-key': publicKey,
          'request-signature': accountsOauthRequestSignature,
          'oauth-signature': oauthSignature,
        },
      },
    );
  });
});
