### Moneymade connect flow

Moneymade server redirects user to your platform website with two query string parameters:

- payload - base64 encoded string, which contains main info (userId, redirect urls) 
- signature - request hmac

Exmaple: 

https://domain/oauth?payload={PAYLOAD}&signature={SIGNATURE}

Signature validation should be handled at the server side.
To validatie signature, follow this algorithm:

1. Read payload and signature values.
2. Concat the SDK public key with payload by formula:

    `publicKey + payload + publicKey`

3. Create hmac using sha256 alrogithm and privateKey as encription key.
Note: hmac digest should be hex.

4. Compare created hmac and signature. 

We reccomend to read payload and signature from oauth url and send it to your backend part with POST query.
Don't do it at the frontend side, because private key shouldn't be shared. 

You may use expressMiddleware method of nodejs moneymade connect sdk to validate signature in POST query body.
(See examples folder for a complete example).

If signature was validated as correct, then you need to generate user accessToken and send it to moneymade server via http request.

To achieve this follow these points:

1. Decode request data from payload parameter. (Payload is a base64 encoded JSON string);
2. Read from decoded data these variables:
    - moneymadeAuthUrl
    - userId
3. Handle user authorization according to your logic
4. Send request to moneymade.io API to finish oauth (See request requriements below);


### Finish OAuth request
##### Body paremeters
Request body should be JSON contains following fields:
| Field  | Description |
| ------------- | ------------- |
| payload  | base64 encoded JSON string. (JSON fields see below)  |
| signature  | Request hmac (Generated via algorithm explained from above) |

Sample:

    {
        "signature": "request hmac",
        "payload": "base64 encoded JSON string"
    }

#### Request payload JSON fields
| Field  | Description |
| ------------- | ------------- |
| userId  | userId read from payload received from moneymade side (query string) |
| accessToken  |accessToken with access rights to read user balances and transactions |

Sample:
   
    {
        "userId": "05db7e8c-d4d1-4b54-a09e-5039de2e6269"
        "accessToken": "329f7bd421e3a516c5d88ea8e2654735329f7bd421e3a516c5d88ea8e2654735"
    }
#### Request headers
| Header  | Description |
| ------------- | ------------- |
| platform-api-key | Public key received from moneymade devs |
| request-signature  | Request signature received from moneymade side (signature from query string parameter) |



