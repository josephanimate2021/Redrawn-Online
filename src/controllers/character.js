const express = require("express"),
      router = express.Router(),
      loadPost = require("../models/body"),
      character = require("../models/character"),
      http = require("http")

router.get("/characters/:charId", (req, res) => {
    const cId = req.params.charId.slice(0, -4);
    res.setHeader("Content-Type", "text/xml");
    character.load(cId).then((v) => {
        (res.statusCode = 200), res.end(v);
    }).catch((e) => {
        (res.statusCode = 404), console.log(e), res.end(e);
    });
})
router.post("/getCcCharCompositionXml/", (req, res) => {
    loadPost(req, res).then(async data => {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        character.load(data.assetId || data.original_asset_id).then((v) => {
            (res.statusCode = 200), res.end(0 + v);
        }).catch(e => { res.statusCode = 404, res.end(1 + e), console.log(e) });
    });
})
router.post("/getCCPreMadeCharacters", (_req, res) => res.end())
router.post("/saveCCCharacter/", (req, res) => {
    loadPost(req, res).then(data => {
        character.save(Buffer.from(data.body)).then((id) => {
            var thumb = Buffer.from(data.thumbdata, "base64");
            character.saveThumb(thumb, id);
            res.end(`0${id}`);
        }).catch(e => { console.log(e), res.end(`10`) });
    });
})
router.post("/saveCCThumbs/", (req, res) => {
    loadPost(req, res).then(data => {
        var id = data.assetId;
        var thumb = Buffer.from(data.thumbdata, "base64");
        character.saveThumb(thumb, id);
        res.end(`0${id}`);
    });
})

module.exports = router;
