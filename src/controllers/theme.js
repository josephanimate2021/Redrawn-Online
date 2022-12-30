const express = require("express"),
      router = express.Router(),
      http = require("http"),
      fUtil = require("../models/file"),
      folder = process.env.THEME_FOLDER,
      formidable = require("formidable")

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
router.post("/getThemeList/", (_req, res) => {
  res.setHeader("Content-Type", "application/zip");
  fUtil.makeZip(`${folder}/_themelist.xml`, "themelist.xml").then((b) => res.send(b)).catch(e => console.log(e))
})
router.post("/getThemeList/?", (_req, res) => {
  res.setHeader("Content-Type", "application/zip");
  fUtil.makeZip(`${folder}/_themelist.xml`, "themelist.xml").then((b) => res.send(b)).catch(e => console.log(e))
})
router.post("/getTheme/", (req, res) => {
	new formidable.IncomingForm().parse(req, (e, f) => {
		res.setHeader("Content-Type", "application/zip");
		fUtil.makeZip(`${folder}/${f.themeId}.xml`, "theme.xml").then((b) => res.send(b)).catch(e => console.log(e));
	});
})
module.exports = router;
