import * as crypto from 'crypto';
import { default as fetch } from 'node-fetch';

export class MoneymadeConnect {
  constructor(private readonly config: MoneymadeConnect.Config) {
    if (!config.privateKey) {
      throw new Error(`Missed 'privateKey' config field or it quals undefined or null`);
    }

    if (!config.publicKey) {
      throw new Error(`Missed 'publicKey' config field or it quals undefined or null`);
    }
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
      const { payload, signature } = req.body;

      if (!payload) {
        return res
          .status(400)
          .send({ message: 'Body must contain payload field!' });
      }

      if (!signature) {
        return res
          .status(400)
          .send({ message: 'Body must contain signature field!' });
      }

      if (signature !== this.makeSignature(payload)) {
        return res
          .status(400)
          .send({ message: 'Signature not valid' });
      }
      
      req.body = { signature, payload: this.base64ToObject(payload) };
    
      return next();
    };
  }

  async finishOauth(data: MoneymadeConnect.FinishOauthPayload) {
    const { requestSignature, connectPayload, ...payload } = data;
    const { publicKey } = this.config;
    const { moneymadeAuthUrl } = connectPayload;
    const body = {
      payload: this.objectToBase64(payload),
    } as MoneymadeConnect.FinishOauthBody;

    body.signature = this.makeSignature(body.payload)

    return fetch(
      moneymadeAuthUrl,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'platform-api-key': publicKey,
          'request-signature': requestSignature,
        },
      },
    )
    .then(res => res.json())
    .then(res => {
      if (res.status === 200) {

      }
    })
  }
}

export namespace MoneymadeConnect {
  export interface Config {
    publicKey: string;
    privateKey: string;
  }

  export interface ConnectPayload {
    userId: string;
    timestamp: string;
    moneymadeAuthUrl: string;
    onSuccessRedirectUrl: string;
    onFailureRedirectUrl: string;
  }

  export interface FinishOauthBody {
    payload: string;
    signature: string;
  }

  export interface FinishOauthPayload {
    userId: string;
    requestSignature: string;
    accountsData: any[];
    connectPayload: ConnectPayload;
    accessToken: string;
  }
}
