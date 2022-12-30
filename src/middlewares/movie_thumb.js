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
	const match = req.url.match(/\/movie_thumbs\/([^/]+)$/);
	if (!match) return;

	var id = match[1];
	movie.loadThumb(id).then((v) => {
		res.setHeader("Content-Type", "image/png");
		res.statusCode = 200;
		res.end(v);
	}).catch(e => {
		res.statusCode = 400;
        console.log(e);
		res.end(e);
	});
};
