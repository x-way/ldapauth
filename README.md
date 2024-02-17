# ldapauth

LDAP server with a MongoDB backend, used for authenticating WiFi users.

## Usage

```
npm install
node ldap_server.js
```

## Configuration

Configuration is taken from environment variables.

```
MONGODB_URL        # URL used to connect to MongoDB (incl. auth)
MONGODB_DB         # name of the database
MONGODB_COLLECTION # name of the collection with the users
LDAP_BINDDN        # bindDN for connecting to the ldap server
LDAP_SECRET        # secret for connecting to the ldap server
LDAP_SERVERDN      # DN of the ldap server
LDAP_SEARCHTREE    # searchtree for the users
LDAP_LISTENIP      # IP to listen on for the ldap server
```
