declare interface SessionType {
	username:	string
	created: 	number
}

declare interface ServerResponse {
	result?: any
	error?: number
}

declare interface WebFileType {
	mime:string
	data:Buffer 
}