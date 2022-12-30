const express = require("express"),
      router = express.Router(),
      header = process.env.XML_HEADER,
      formidable = require("formidable"),
      fUtil = require("../models/file"),
      nodezip = require("node-zip"),
      base = Buffer.alloc(1, 0),
      asset = require("../models/asset"),
      http = require("http"),
      fs = require("fs"),
      starter = require("../models/starter"),
      util = require("../models/util"),
      mp3Duration = require("mp3-duration"),
      tempfile = require("tempfile"),
      ffmpeg = require("fluent-ffmpeg"),
      get = require("../models/get")
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
ffmpeg.setFfprobePath(require("@ffprobe-installer/ffprobe").path);
function movieXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const tag = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-tag.txt`, 'utf8');
	return `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${
		title
	}" thumbnail_url="/movie_thumbs/${v.id}.png"><tags>${tag}</tags></movie>`;
}
function propXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const ext = fs.existsSync(process.env.META_FOLDER + `/${v.id}-ext.txt`) ? fs.readFileSync(process.env.META_FOLDER + `/${
		v.id
	}-ext.txt`, 'utf8') : getExt(title);
	const meta = require('.' + process.env.META_FOLDER + `/${v.id}-meta.json`);
	return `<prop subtype="0" id="${v.id}.${ext}" name="${
		title
	}" enable="Y" holdable="${meta.holdable}" headable="${meta.headable}" wearable="${meta.wearable}" placeable="${
		meta.placeable
	}" facing="left" width="0" height="0" asset_url="/assets/${v.type}/${v.id}.${ext}"/>`;
}
function videoXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const ext = fs.existsSync(process.env.META_FOLDER + `/${v.id}-ext.txt`, 'utf8') ? fs.readFileSync(process.env.META_FOLDER + `/${
		v.id
	}-ext.txt`, 'utf8') : getExt(title);
	const meta = require('.' + process.env.META_FOLDER + `/${v.id}-meta.json`);
	return `<prop subtype="video" id="${v.id}.${ext}" enc_asset_id="${v.id}.${ext}" name="${
		title
	}" enable="Y" placeable="1" facing="left" width="${meta.width}" height="${meta.height}" asset_url="/assets/${v.type}/${v.id}.${ext}" thumbnail_url="/assets/${v.type}/${v.id}.png"/>`;
}
function getExt(buffer) {
	const dot = buffer.lastIndexOf(".");
	return buffer.substr(dot + 1);
}
function backgroundXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const ext = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-ext.txt`, 'utf8') || getExt(title);
	return `<background subtype="0" id="${v.id}.${ext}" asset_url="/assets/${v.type}/${v.id}.${ext}" name="${title}" enable="Y"/>`;
}
function soundXml(v, type) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const ext = fs.existsSync(process.env.META_FOLDER + `/${v.id}-ext.txt`) ? fs.readFileSync(process.env.META_FOLDER + `/${
		v.id
	}-ext.txt`, 'utf8') : getExt(title);
	const durMetaFile = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-dur.txt`, 'utf8');
	const dot = durMetaFile.lastIndexOf(".");
	const dur = durMetaFile.substr(dot + 1);
	return `<sound subtype="${type}" id="${v.id}.${ext}" name="${title}" enable="Y" duration="${dur}" downloadtype="progressive"/>`;
}
function listAssets(data) {
	return new Promise(async res => {
		var xmlString, files;
		switch (data.type) {
			case "char": {
				const chars = await asset.chars(data.themeId);
				xmlString = `${header}<ugc more="0">${chars.map(v => `<char id="${v.id}" name="Untitled" cc_theme_id="${
										v.theme
									}" thumbnail_url="/movie_thumbs/${v.id}.png" copyable="Y"><tags/></char>`).join("")}</ugc>`;
				break;
			} case "prop": {
				const assets = asset.list("prop", "png");
				files = asset.list("prop", "jpg");
				xmlString = `${header}<ugc more="0">${files.map(v => propXml(v)).join("")}${assets.map(v => propXml(v)).join("")}</ugc>`;
				break;
			} case "sound": {
				files = asset.list("bgmusic", "mp3");
				const assets = asset.list("soundeffect", "mp3");
				const sounds = asset.list("voiceover", "mp3");
				xmlString = `${header}<ugc more="0">${files.map(v => soundXml(v, "bgmusic")).join("")}${assets.map(v => soundXml(v, "soundeffect")).join("")}${sounds.map(v => soundXml(v, "voiceover")).join("")}</ugc>`;
				break;
			}	
		}
		res(Buffer.from(xmlString));	
	});
}
function convertVideoToFlv(ut, type, _ext, _buffer, subtype, filepath) {
	const files = {};
	const temppath = tempfile(".flv");
	ffmpeg(filepath).ffprobe((e, data) => {
		if (e) console.log(e);
		const meta = {
			width: data.streams[0].width,
			height: data.streams[0].height
		};

		// convert the video to an flv
		ffmpeg(filepath).output(temppath).on("end", async () => {
			const buff = fs.readFileSync(temppath);
			meta.file = `vi-${asset.saveStream(ut, type, "flv", buff, subtype)}`;
			const vId = meta.file.slice(0, -4);
			const id = Number.parseInt(vId.substr(2));
			// save the first frame
			ffmpeg(filepath).seek("0:00").output(fUtil.getFileIndexForAssets("video-", ".png", id)).outputOptions("-frames", "1").on("end", () => files[meta.file]).run();
			fs.writeFileSync(process.env.META_FOLDER + `/${vId}-meta.json`, JSON.stringify(meta));
			fs.writeFileSync(process.env.META_FOLDER + `/${vId}-title.txt`, meta.file);
		}).on("error", (e) => console.log("Error converting video:", e)).run();
	});
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
router.post(["/getAsset/","/getAssetEx/"], (req, res) => {
	new formidable.IncomingForm().parse(req, (e, f) => {
		if (!f.assetId.startsWith("a-")) {
			asset.loadRandom(f.assetId).then(b => {
				res.setHeader("Content-Length", b.length);
				res.setHeader("Content-Type", "audio/mp3");
				res.end(b);
			}).catch(e => { res.end(1 + util.xmlFail(e)), console.log(e) });
		} else {
			const [ prefix, id ] = f.assetId.split(".");
			console.log(id.slice(0, -4));
			asset.load(id.slice(0, -4)).then(b => {
				res.setHeader("Content-Length", b.length);
				res.setHeader("Content-Type", "audio/mp3");
				res.end(b);
			}).catch(e => { res.end(1 + util.xmlFail(e)), console.log(e) });
		}
	});
})
router.post("/updateAsset/", (req, res) => {
	new formidable.IncomingForm().parse(req, (e, f) => {
		const id = f.assetId.slice(0, -4);
		const origTitle = fs.readFileSync(process.env.META_FOLDER + `/${id}-title.txt`);
		const dot = origTitle.lastIndexOf(".") || "";
		const ext = origTitle.subarray(dot + 1) || "";
		if (!fs.existsSync(process.env.META_FOLDER + `/${id}-ext.txt`)) fs.writeFileSync(process.env.META_FOLDER + `/${id}-ext.txt`, ext);
		fs.writeFileSync(process.env.META_FOLDER + `/${id}-title.txt`, data.title);
	});
})
router.post("/getUserAssets/", (req, res) => {
	new formidable.IncomingForm().parse(req, (e, f) => {
		switch (f.type) {
			case "movie": {
				starter.list().then(async files => {
					const xml = `${header}<ugc more="0">${files.map((v) => movieXml(v)).join('')}</ugc>`;
					const zip = nodezip.create();
					fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
					res.setHeader("Content-Type", "application/zip");
					res.write(base);
					res.end(await zip.zip());
				}).catch(e => { res.end(1 + util.assetFail(e)), console.log(e) });
				break;
			} case "bg": {
				function listBackgrounds() {
					return new Promise(async res => {
						const assets = asset.list("bg", "png");
						files = asset.list("bg", "jpg");
						const xml = `${header}<ugc more="0">${files.map((v) => backgroundXml(v)).join("")}${assets.map((v) => backgroundXml(v)).join("")}</ugc>`;
						const zip = nodezip.create();
						fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
						res(await zip.zip());
					});
				}
				listBackgrounds().then((buff) => {
					res.setHeader("Content-Type", "application/zip");
					res.write(base);
					res.end(buff);
				}).catch(e => { res.end(1 + util.assetFail(e)), console.log(e) });
				break;
			} case "prop": {
				function listProps() {
					return new Promise(async res => {
						files = asset.list("video", "flv");
						const xml = `${header}<ugc more="0">${files.map((v) => videoXml(v)).join("")}</ugc>`;
						const zip = nodezip.create();
						fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
						res(await zip.zip());
					});
				}
				listProps().then((buff) => {
					res.setHeader("Content-Type", "application/zip");
					res.write(base);
					res.end(buff);
				}).catch(e => { res.end(1 + util.assetFail(e)), console.log(e) });
				break;
			}
		}
	});
})
router.post("/getUserAssetsXml/", (req, res) => {
	new formidable.IncomingForm().parse(req, (e, f) => {
		listAssets(f).then((buff) => {
			res.setHeader("Content-Type", "text/xml");
			res.end(buff);
		}).catch(e => { res.end(1 + util.assetFail(e)), console.log(e) });
	});
})
router.post("/upload_asset", (req, res) => {
	formidable().parse(req, (_, fields, files) => {
		var [ ut, type, ext ] = fields.params.split(".");
		var subtype = "", prefix = "";
		const path = files.import.path;
		const name = files.import.name;
		var buffer = fs.readFileSync(path);
		switch (type) {
			case "vo":
				type = "sound";
				subtype = "voiceover";
				prefix = "v";
				break;
			case "se":
				type = "sound";
				subtype = "soundeffect";
				prefix = "s";
				break;
			case "mu":
				type = "sound";
				subtype = "bgmusic";
				prefix = "bg";
				break;
			case "vi": {
				type = "prop";
				subtype = "video";
				break;
			}
		}
		if (subtype != "video") {
			asset.save(ut, type, ext, buffer, subtype).then(id => {
				asset.createMeta(id, name, type, subtype);
				switch (type) {
					case "prop": {
						const meta = {
							holdable: "0",
							wearable: "0",
							headable: "0",
							placeable: "1"
						};
						fs.writeFileSync(process.env.META_FOLDER + `/p-${id}-meta.json`, JSON.stringify(meta));
						break;
					} case "sound": {
						mp3Duration(buffer, (e, d) => {
							if (e) {
								console.log(e);
								return;
							}
							fs.writeFileSync(process.env.META_FOLDER + `/${prefix}-${id}-dur.txt`, `dur.${d * 1e3}`);
						});
						break;
					}
				}
			}).catch(e => console.log(e));
			fs.unlinkSync(path);
		} else convertVideoToFlv(ut, type, ext, buffer, subtype, path);
		res.end();
	});
})
router.post("/deleteAsset/", (req, res) => {
	new formidable.IncomingForm().parse(req, (e, f) => {
		var type;
		const id = f.assetId;
		if (id.startsWith("p-")) type = "prop";
		else if (id.startsWith("b-")) type = "bg";
		else if (id.startsWith("bg-")) type = "bgmusic";
		else if (id.startsWith("s-")) type = "soundeffect";
		else if (id.startsWith("v-")) type = "voiceover";
		else return;
		asset.delete(id, type);
	});
})

module.exports = router;
