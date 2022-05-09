import * as crypto from 'crypto';
import { default as fetch } from 'node-fetch';

export class MoneymadeConnect {
  private URLS = {
    V1: {
      PRODUCTION_FINISH_OAUTH_URL: 'https://connect.moneymade.io/connect/oauth',
      PRODUCTION_PUSH_ACCOUNTS_API: 'https://connect.moneymade.io/connect/balance',
      PRODUCTION_PUSH_TRANSACTIONS_API: 'https://connect.moneymade.io/connect/transactions',

      DEVELOPMENT_FINISH_OAUTH_URL: 'https://development.connect.moneymade.io/connect/oauth',
      DEVELOPMENT_PUSH_ACCOUNTS_API: 'https://development.connect.moneymade.io/connect/balance',
      DEVELOPMENT_PUSH_TRANSACTIONS_API: 'https://development.connect.moneymade.io/connect/transactions',
    },
    V2: {
      DEVELOPMENT_FINISH_OAUTH_URL: 'https://stage-connect-oauth.moneymade.io/api/v1/oauth/finish',
      DEVELOPMENT_FINISH_REDIRECT_URL: "https://stage-connect-oauth.moneymade.io/api/v1/oauth/finish/callback",
      DEVELOPMENT_PUSH_ACCOUNTS_API: 'https://stage-connect-oauth.moneymade.io/api/v1/data/accounts',
      DEVELOPMENT_PUSH_TRANSACTIONS_API: 'https://stage-connect-oauth.moneymade.io/api/v1/data/transactions',

      PRODUCTION_FINISH_OAUTH_URL: 'https://connect-oauth.moneymade.io/api/v1/oauth/finish',
      PRODUCTION_FINISH_REDIRECT_URL: 'https://connect-oauth.moneymade.io/api/v1/oauth/finish/callback',
      PRODUCTION_PUSH_ACCOUNTS_API: 'https://connect-oauth.moneymade.io/api/v1/data/accounts',
      PRODUCTION_PUSH_TRANSACTIONS_API: 'https://connect-oauth.moneymade.io/api/v1/data/transactions',
    },
  };

  private PUSH_ACCOUNTS_API_URL: string;
  private PUSH_TRANSACTIONS_API_URL: string;
  private FINISH_OAUTH_URL: string;
  private FINISH_REDIRECT_URL: string;

  constructor(private readonly config: MoneymadeConnect.Config) {
    if (!config.privateKey) {
      throw new Error(`Missed 'privateKey' config field or it quals undefined or null`);
    }

    if (!config.publicKey) {
      throw new Error(`Missed 'publicKey' config field or it quals undefined or null`);
    }

    if (!this.config.version) {
      this.config.version = 'v1';
    }

    if (!this.config.env) {
      this.config.env = 'development';
    }

    let URLS: Record<string, string>;
    let env: 'PRODUCTION' | 'DEVELOPMENT'; 

    if (this.config.version === 'v1') {
      URLS = this.URLS.V1;
      env = this.config.env === 'development' ? 'DEVELOPMENT' : 'PRODUCTION';
    } else {
      URLS = this.URLS.V2;
      env = process.env.MONEYMADE_SDK_ENV === 'development' ? 'DEVELOPMENT' : 'PRODUCTION';
    }

    this.PUSH_TRANSACTIONS_API_URL = URLS[`${env}_PUSH_TRANSACTIONS_API`]; 
    this.PUSH_ACCOUNTS_API_URL = URLS[`${env}_PUSH_ACCOUNTS_API`];
    this.FINISH_OAUTH_URL = URLS[`${env}_FINISH_OAUTH_URL`];
    this.FINISH_REDIRECT_URL = URLS[`${env}_FINISH_REDIRECT_URL`];
  }
  
  objectToBase64(obj: any) {
    return Buffer
      .from(JSON.stringify(obj))
      .toString('base64');
  }

  base64ToObject(base64: string) {
    return JSON.parse(
      Buffer
        .from(base64, 'base64')
        .toString('ascii'),
    );
  }

  makeSignature(bodyBase64: string) {
    const { privateKey, publicKey } = this.config;

    return crypto
      .createHmac('sha256', privateKey)
      .update(`${publicKey}${bodyBase64}${publicKey}`)
      .digest('hex');
  }

  makeBodySignature(body: any) {
    return this.makeSignature(this.objectToBase64(body));
  }

  expressMiddleware() {
    return async (req, res, next) => {
      const { payload, oauthSignature } = req.body;

      if (!payload) {
        return res
          .status(400)
          .send({ message: 'Body must contain payload field!' });
      }

      if (!oauthSignature) {
        return res
          .status(400)
          .send({ message: 'Body must contain oauthSignature field!' });
      }

      if (oauthSignature !== this.makeSignature(payload)) {
        return res
          .status(400)
          .send({ message: 'OauthSignature not valid' });
      }
      
      req.body = { oauthSignature, payload: this.base64ToObject(payload) };
    
      return next();
    };
  }

  getFinishOAuthRedirectUrl(oauthSignature: string): string {
    return `${this.FINISH_REDIRECT_URL}?oauth-signature=${oauthSignature}`;
  }

  async finishOauth(data: MoneymadeConnect.FinishOauthPayload): Promise<void>;
  async finishOauth(data: MoneymadeConnect.FinishOauthPayloadV2): Promise<MoneymadeConnect.FinishOauthResult>;

  async finishOauth(
    data: MoneymadeConnect.FinishOauthPayload | MoneymadeConnect.FinishOauthPayload
  ): Promise<void | MoneymadeConnect.FinishOauthResult> {
    const { oauthSignature, ...payload } = data;
    const { publicKey } = this.config;
    
    const base64Body = this.objectToBase64(payload);
    const signature = this.makeSignature(base64Body);
    
    let accounts = null;

    if (this.config.version === 'v1' && payload.accounts) {
      accounts = payload.accounts;
      delete payload.accounts; 
    }

    await fetch(
      this.FINISH_OAUTH_URL,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'api-key': publicKey,
          'request-signature': signature,
          'oauth-signature': oauthSignature,
        },
      },
    );

    if (this.config.version === 'v1' && accounts) {
      await this.pushAccounts(accounts);
    }

    if (this.config.version === 'v2') {
      return {
        redirectUrl: this.getFinishOAuthRedirectUrl(oauthSignature),
      }
    }
  }

  async pushAccounts(payload: any): Promise<void> {
    await fetch(
      this.PUSH_ACCOUNTS_API_URL,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.publicKey,
          'request-signature': this.makeSignature(
            this.objectToBase64(payload),
          ),
        }
      },
    );
  }

  async pushTransactions(payload: any): Promise<void> {
    await fetch(
      this.PUSH_TRANSACTIONS_API_URL,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.publicKey,
          'request-signature': this.makeSignature(
            this.objectToBase64(payload),
          ),
        }
      },
    );
  }
}

export namespace MoneymadeConnect {
  export interface Config {
    publicKey: string;
    privateKey: string;
    env?: 'development' | 'production';
    version?: 'v1' | 'v2';
  }

  export interface OauthPayload {
    userId: string;
  }

  export interface FinishOauthBody {
    payload: string;
    signature: string;
  }

  export interface FinishOauthPayload {
    userId: string;
    oauthSignature: string;
    accessToken?: string;
    accounts?: unknown;
  }

  export type FinishOauthPayloadV2 = Omit<FinishOauthPayload, 'userId'>;

  export interface FinishOauthResult {
    redirectUrl: string;
  }
}
