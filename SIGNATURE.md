### Moneymade signature generation algorithm

To generate signature, follow this algorithm:

1. Collect request body as JSON string
2. Encode JSON string to base64.
3. Concat the SDK public key with base64 body by formula:

    `publicKey + base64Body + publicKey`

4. Create hmac using sha256 alrogithm and privateKey as encription key.
    Note: hmac digest should be hex.
