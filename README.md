# @moneymade/connect

This package contains helpers, tools and middlewares, which should be useful for integration with moneymade.io oauth feature.

## Install
    npm install @moneymade/connect
###
    yarn add @moneymade/connect

## Usage

See examples folder for a complete example

##### SDK initialization

    import { MoneymadeConnect } from '@moneymade/connect';

    const moneymade = new MoneymadeConnect({
      privateKey: 'MONEYMADE_PRIVATE_KEY',
      publicKey: 'MONEYMADE_PRIVATE_KEY',
    });

##### Using as express middleware

    app.post(
      '/oauth',
      moneymade.expressMiddleware(),
      (req, res) => {
        ...hadle user's auth here and collect the request payload be 
        sent to moneymade server endpoint
      },
    );

#### Finishing oauth via sdk method

To finish oauth, you must send request to moneymade.io API. 

     await moneymade.finishOauth({
        accessToken, // access token for user
        userId, // moneymade userId, received in oauth payload
        oauthSignature, // oauth signature, received from moneymade in query string
        oauthPayload, // payload, received from moneymade in query string
      });

