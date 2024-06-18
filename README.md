# icicb-portal-backend

## Request object
---------------	
A rpc call is represented by sending a Request object to a Server. The Request object has the following members:
| field | meaning |
| --- | --- |
| jsonrpc | A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0". |
| method | A String containing the name of the method to be invoked. Method names that begin with the word rpc followed by a period character (U+002E or ASCII 46) are reserved for rpc-internal methods and extensions and MUST NOT be used for anything else. |
| params | A Structured value that holds the parameter values to be used during the invocation of the method. This member MAY be omitted. |
| id | An identifier established by the Client that MUST contain a String, Number, or NULL value if included. If it is not included it is assumed to be a notification. The value SHOULD normally not be Null [1] and Numbers SHOULD NOT contain fractional parts [2] |

## Response object
---------------	
When a request call is made, the Server MUST reply with a Response, except for in the case of Notifications. The Response is expressed as a single JSON Object, with the following members:
| field | meaning |
| --- | --- |
| result | This member is REQUIRED on success. This member MUST NOT exist if there was an error invoking the method. The value of this member is determined by the method invoked on the Server. |
| error | This member is REQUIRED on error. This member MUST NOT exist if there was no error triggered during invocation. The value for this member MUST be an Object as defined in error code talbe. |

### Error Code
| code | message | meaning |
| --- | --- | --- |
| 1001 | invalid username | Usernames can only have lowercase Letters (a-z) and numbers (0-9), 3 ~ 20 characters
| 1002 | invalid email | invalid email address format
| 1003 | invalid password | invalid password length
| 1004 | unregistered user | unregistered user in server
| 1005 | no permission | the user haven't login permision
| 1006 | wrong password | password is wrong
| 1007 | duplicated | target already exist
| 1008 | already logged | already logged
| 2000 | login | require login.
| 2001 | invalid code | code must be 6 digits number.
| 2002 | unknown coin | 
| 2003 | no enough  | no enough balance for purchasing ICICB
| -32700 | Parse error | Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text. |
| -32600 | Invalid Request | The JSON sent is not a valid Request object. |
| -32601 | Method not found | The method does not exist / is not available. |
| -32602 | Invalid params | Invalid method parameter(s). |
| -32603 | Internal error | Internal JSON-RPC error. |
| -32000 | Server error | Reserved for implementation-defined server-errors. |

## API
> /api/v1/login
```
in: 
	{ username, password }
out: 
	{
		user: {
			token: 'string',
			username: 'string',
			email: 'string',
			pinCode: false,
			created: 0,
			wallets: {
				icicb: '0x0000',
				btc: '3xxxxxx',
				eth: '0x0000',
				usdt: '0x0000',
				bnb: '0x0000',
				ltc: 'Lxxxxx',
			},
			balances: {
				icicb: 0,
				btc: 0,
				eth: 0,
				usdt: 0,
				bnb: 0,
				ltc: 0,
			},
		},
		prices: {
			icicb: 0,
			btc: 0,
			eth: 0,
			usdt: 0,
			bnb: 0,
			ltc: 0,
		},
		charts: {
			prev?: 	Array<[number,number]>
			day?: Array<[number,number]>
			week?: Array<[number,number]>
			month?: Array<[number,number]>
		},
		txs: [
			{
				txid: 	'0x00000',
				chain: 	'eth',
				address:'0x00000',
				input: 	false,
				amount: 0.0001,
				created:16000000
			}
		]
	}
```

> api/v1/register
```
in: 
	{username, email, password}
out: 
	{
		success: true
	}
```

> /api/v1/reset-password
```
in: 
	{ email }
out: 
	{
		success: true
	}
```

> /api/v1/set-pincode
```
in: 
	{ code }
out: 
	{
		success: true
	}
```

> /api/v1/presale
```
in: 
	{ code }
out: 
	{
		success: true
	}
```

> /api/v1/new-txs
```
in: 
	{ code }
out: 
	{
		success: true
	}
```