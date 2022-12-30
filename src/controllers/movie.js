const express = require("express"),
      router = express.Router(),
      base = Buffer.alloc(1, 0),
      movie = require("../models/movie"),
      http = require("http"),
      get = require("../models/get"),
      formidable = require("formidable"),
      loadPost = require("../models/body"),
      starter = require("../models/starter"),
      url = require("url")

router.post("/upload_movie", (req, res) => {
	new formidable.IncomingForm().parse(req, (e, f, files) => {
		if (!files.import) return;
		var path = files.import.path;
		var buffer = fs.readFileSync(path);
		var numId = fUtil.getNextFileId("movie-", ".xml");
		parse.unpackXml(buffer, `m-${numId}`);
		fs.unlinkSync(path);

		res.statusCode = 302;
		var url = `/go_full?movieId=m-${numId}`;
		res.setHeader("Location", url);
		res.end();
	});
})
router.post("/getMovie/", (req, res) => { 
	const p = url.parse(req.url, true);
	res.setHeader("Content-Type", "application/zip");
	movie.loadZip(p.query.movieId).then((b) => res.end(Buffer.concat([base, b]))).catch(e => { console.log(e), res.end("1" + e) });
})
router.post("/saveMovie/", (req, res) => {
	loadPost(req, res).then(data => {
		get(process.env.THUMB_BASE_URL + '/274502704.jpg').then(t => {
			const body = Buffer.from(data.body_zip, "base64"),
			thumb = !data.thumbnail ? t : Buffer.from(data.thumbnail, "base64")
			movie.save(body, thumb, data.movieId).then(id => res.end(0 + id)).catch(e => console.log(e));
		}).catch(e => console.log(e));
	});
})
router.post("/saveTemplate/", (req, res) => {
	loadPost(req, res).then(data => {
		const body = Buffer.from(data.body_zip, "base64"),
		      thumb = Buffer.from(data.thumbnail, "base64")
		starter.save(body, thumb, data.movieId).then(id => res.end(0 + id)).catch(e => console.log(e));
	});
})

module.exports = router;
