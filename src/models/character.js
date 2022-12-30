const cachéFolder = process.env.CACHÉ_FOLDER,
      xNumWidth = process.env.XML_NUM_WIDTH,
      baseUrl = process.env.CHAR_BASE_URL,
      fUtil = require("./file"),
      util = require("./util"),
      get = require("./get"),
      fw = process.env.FILE_WIDTH,
      fs = require("fs"),
      themes = {}

function addTheme(id, buffer) {
	const beg = buffer.indexOf(`theme_id="`) + 10;
	const end = buffer.indexOf(`"`, beg);
	const theme = buffer.subarray(beg, end).toString();
	return (themes[id] = theme);
}

function save(id, data) {
	const i = id.indexOf("-");
	const prefix = id.substr(0, i);
	const suffix = id.substr(i + 1);
	switch (prefix) {
		case "c":
			fs.writeFileSync(fUtil.getFileIndex("char-", ".xml", suffix), data);
			break;
		case "C":
	}
	addTheme(id, data);
	return id;
}

fUtil.getValidFileIndicies("char-", ".xml").map((n) => {
	return addTheme(`c-${n}`, fs.readFileSync(fUtil.getFileIndex("char-", ".xml", n)));
});

/**
 * @param {string} id
 * @returns {string}
 */
function getCharPath(id) {
	var i = id.indexOf("-");
	var prefix = id.substr(0, i);
	var suffix = id.substr(i + 1);
	switch (prefix) {
		case "c":
			return fUtil.getFileIndex("char-", ".xml", suffix);
		case "C":
		default:
			return `${cachéFolder}/char.${id}.xml`;
	}
}
/**
 * @param {string} id
 * @returns {string}
 */
function getThumbPath(id) {
	var i = id.indexOf("-");
	var prefix = id.substr(0, i);
	var suffix = id.substr(i + 1);
	switch (prefix) {
		case "c":
			return fUtil.getFileIndex("char-", ".png", suffix);
		case "C":
		default:
			return `${cachéFolder}/char.${id}.png`;
	}
}

exports.getTheme = function(id) {
	return new Promise((res, rej) => {
		if (themes[id]) res(themes[id]);
		else this.load(id).then((b) => res(addTheme(id, b))).catch(e => rej(e));
	});
};
exports.load = function(id) {
	return new Promise((res, rej) => {
		var i = id.indexOf("-");
		var prefix = id.substr(0, i);
		var suffix = id.substr(i + 1);

		switch (prefix) {
			case "c":
			case "C":
				fs.readFile(getCharPath(id), (e, b) => {
					if (e) {
						var fXml = util.xmlFail();
						rej(Buffer.from(fXml));
					} else res(b);
				});
				break;

			case "":
			default: {
				// Blank prefix is left here for backwards-compatibility purposes.
				var nId = Number.parseInt(suffix);
				var xmlSubId = nId % fw;
				var fileId = nId - xmlSubId;
				var lnNum = fUtil.padZero(xmlSubId, xNumWidth);
				var url = `${baseUrl}/${fUtil.padZero(fileId)}.txt`;

				get(url).then((b) => {
					var line = b.toString("utf8").split("\n").find((v) => v.substr(0, xNumWidth) == lnNum);
					if (line) res(Buffer.from(line.substr(xNumWidth)));
					else rej("Error: Character Not Found");
				}).catch((e) => rej(e));
				break;
			}
		}
	});
};
exports.loadStock = async function(cId) {
	const nId = (cId.slice(0, -3) + "000").padStart(9, 0);
	const chars = await get(`${baseUrl}/${nId}.txt`);
	var line = chars.toString("utf8").split("\n").find(v => v.substring(0, 3) == cId.slice(-3));
	if (line) return Buffer.from(line.substring(3));
	else return Buffer.from("Character not found.");
};
exports.parseTheme = function(buffer) {
	const beg = buffer.indexOf(`theme_id="`) + 10;
	const end = buffer.indexOf(`"`, beg);
	return buffer.slice(beg, end).toString();
};
exports.save = function(data, id) {
	return new Promise((res, rej) => {
		if (id) {
			const i = id.indexOf("-");
			const prefix = id.substr(0, i);
			switch (prefix) {
				case "c":
				case "C": {
					fs.writeFile(getCharPath(id), data, (e) => (e ? rej() : res(id)));
					break;
				} default: {
					res(save(id, data));
					break;
				}
			}
		} else {
			saveId = `c-${fUtil.getNextFileId("char-", ".xml")}`;
			res(save(saveId, data));
		}
	});
};
exports.saveThumb = function(data, id) {
	return new Promise((res, rej) => {
		var thumb = Buffer.from(data, "base64");
		fs.writeFileSync(getThumbPath(id), thumb);
		res(id);
	});
};
exports.loadThumb = function(id) {
	return new Promise((res, rej) => {
		fs.readFile(getThumbPath(id), (e, b) => {
			if (e) {
				var fXml = util.xmlFail();
				rej(Buffer.from(fXml));
			} else res(b);
		});
	});
};
