const fs = require("fs");

module.exports = function (req, res, url) {
	if (req.method != "GET" || !url.pathname.startsWith("/files") && !url.pathname.startsWith("/misc")) return;
	const html = fs.existsSync(`.${url.pathname}`) ? fs.readFileSync(`.${url.pathname}`) : `404 Not Found`;
	res.end(html);
	return fs.existsSync(pathName) ? true : "";
};