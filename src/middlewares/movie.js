const movie = require("../models/movie");
const http = require("http");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "GET") return; 
	switch (url.pathname) { 
		case "/movieList": {
			Promise.all(movie.list().map(movie.meta)).then((a) => res.end(JSON.stringify(a)));
			return true;
		}
	} 
	const match = req.url.match(/\/movies\/([^.]+)(?:\.(zip|xml))?$/);
	if (!match) return;

	var id = match[1];
	var ext = match[2];
	switch (ext) {
		case "zip": {
			res.setHeader("Content-Type", "application/zip");
			movie.loadZip(id).then((v) => {
				if (v) {
					res.statusCode = 200;
					res.end(v);
				} else {
					res.statusCode = 404;
					res.end();
				}
			});
			break;
		} default: {
			res.setHeader("Content-Type", "text/xml");
			movie.loadXml(id).then((v) => {
				if (v) {
					res.statusCode = 200;
					res.end(v);
				} else {
					res.statusCode = 404;
					res.end();
				}
			});
			break;
		}
	}
	return true;
};
