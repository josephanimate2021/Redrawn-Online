const http = require("http");
const asset = require("../models/asset");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "GET") return; 
	const match = req.url.match(/\/assets\/([^/]+)\/([^/]+)$/);
	if (!match) return;
	const type = match[1];
	const aId = match[2];
	const dot = aId.lastIndexOf(".");
	const ext = aId.substr(dot + 1);
	asset.loadOnGetRequest(type, aId, ext).then(b => res.end(b)).catch(e => { console.log(e), res.end(`<center><h1>${e || "404 Not Found"}</h1></center>`) });
	return true;
};
