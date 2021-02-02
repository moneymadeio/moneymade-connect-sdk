### Moneymade connect flow

Monemade server redirects user to your platform website with two query string parameters:

- payload - base64 encoded string, which contains main info (userId, redirect urls) 
- signature - request hmac

Exmaple: 

https://domain/oauth?payload={PAYLOAD}&signature={SIGNATURE}

Signature validation should be handled at the server side.
To validatie signature, follow this algorithm:

1. Read payload and signature values.
2. Concat the SDK public key with payload according to the formula:

    `publicKey + payload + publicKey`

3. Create hmac using sha256 alrogithm and privateKey as encription key.
Note: hmac digest should equal hex.

4. Compare created hmac and signature. 

We reccomend to read payload and signature from oauth url and send it to your backend part with POST query.
Don't do it at the frontend side, because private key shouldn't be shared. 

You may use expressMiddleware method of nodejs moneymade connect sdk to validate signature in POST query body.
(See examples folder for a complete example).

If signature was validated as correct, then you need to generate user accessToken and send it to moneymade server.
