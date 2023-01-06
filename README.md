# Open Source Node JS Endpoint Detection & Response (EDR) Tool #

Philosophy:
 1) EDR client should be as match simple as possible it should be one file! (ONE_FILE)
 2) EDR client should not have 0 third party requirements! (ZERO_DEPS)
 3) EDR communication should be secure by default (SECURE)
 4) EDR client should be cross-platform and work on Linux, MacOS, Windows (CROSS_PLATFORM)
 5) EDR server should control all clients and install extensions as JS code (REVERS_SHELL)

# SetUp Server #

```bash
wget https://raw.githubusercontent.com/pahaz/open-node-js-edr/main/server.js
EDR_SECRET=eAc8trg_GVzQ6eEucvjz node server.js
```

# SetUp Client #

```bash
wget https://raw.githubusercontent.com/pahaz/open-node-js-edr/main/client.js
EDR_SERVER=224.143.12.9 EDR_SECRET=eAc8trg_GVzQ6eEucvjz node client.js
```
