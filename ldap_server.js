var ldap = require('ldapjs');
const MongoClient = require('mongodb').MongoClient;
const url = process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB;
const mongodb_collection = process.env.MONGODB_COLLECTION;

const ldap_binddn = process.env.LDAP_BINDDN;
const ldap_secret = process.env.LDAP_SECRET;
const ldap_serverdn = process.env.LDAP_SERVERDN;
const ldap_searchtree = process.env.LDAP_SEARCHTREE;
const ldap_listenip = process.env.LDAP_LISTENIP;

const client = new MongoClient(url);
const collection = client.db(dbName).collection(mongodb_collection);

const server = ldap.createServer();

function authorize(req, res, next) {
	if (!req.connection.ldap.bindDN.equals(ldap_binddn)) {
		return next(new ldap.InsufficientAccessRightsError());
	}
	return next();
}

// handle bind
server.bind(ldap_serverdn, function(req, res, next) {
	//console.log('Bind');
	//console.log('Credentials: >>' + req.credentials + '<<');
	//console.log('DN: ' + req.dn.toString());
	if (req.dn.toString() !== ldap_binddn || req.credentials !== ldap_secret)
		return next(new ldap.InvalidCredentialsError());

	//console.log('Bind success');
	res.end();
	return next();
});

// handle search
server.search(ldap_searchtree, authorize, async function(req, res, next) {
	//console.log('Querying');
	//console.log('Filter: >>' + req.filter.toString() + '<<');
	//console.log('DN: ' + req.dn.toString());
	var filter = req.filter.toString();

	if ( filter.match(/^\(uid=[a-zA-Z0-9-]*\)$/) ) {
		var uid = filter.substring(5, filter.length-1);
		var items = await collection.find({'name': uid}).toArray();
		//console.log('items: ' + JSON.stringify(items));
		if (items.length < 1 ) {
			console.log('Could not find wlanuser with uid ' + uid);
		} else {
			var item = items[0];
			//console.log('uid: ' + uid);
			//console.log('item: ' + JSON.stringify(item));
			if ( item['disabled'] == null || (!item['disabled']) ) {
				var reply = {
					dn: 'uid=' + uid + ',' + ldap_searchtree,
					attributes: {
						uid: uid,
						userPassword: item['password'],
						objectClass: ['account','simpleSecurityObject','top']
					}
				};
				//console.log('reply: ' + JSON.stringify(reply));
				//console.log('res: ' + JSON.stringify(res));
				res.attributes = ['*']; // aj, 15.1.2024: allow any attributes in response, workaround bug where userPassword gets dropped, https://github.com/ldapjs/node-ldapjs/issues/900
				//console.log('res2: ' + JSON.stringify(res));
				res.send(reply, true);
			}
		}
		res.end();
		return next();
	} else if ( filter.match(/^\(objectClass=account\)$/i) ) {
		var items = await collection.find().toArray();
		//console.log('items: ' + JSON.stringify(items));
		for (var key in items) {
			var item = items[key];
			//console.log('item: ' + JSON.stringify(item));
			if ( item['disabled'] == null || (!item['disabled']) ) {
				res.send({
					dn: 'uid=' + item['name'] + ',' + ldap_searchtree,
					attributes: {
						uid: item['name'],
						userPassword: item['password'],
						objectClass: ['account','simpleSecurityObject','top']
					}
				});
			}
		}
		res.end();
		return next();
	} else {
		res.end();
		return next();
	}
});

server.listen(389, ldap_listenip, function () {
	console.log('LDAP server up and running.');
});
