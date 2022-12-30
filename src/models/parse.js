const themeFolder = process.env.THEME_FOLDER,
      char = require("./character"),
      asset = require("./asset"),
      source = process.env.CLIENT_URL,
      header = process.env.XML_HEADER,
      get = require("./get"),
      fUtil = require("./file"),
      nodezip = require("node-zip"),
      store = process.env.STORE_URL,
      xmldoc = require("xmldoc"),
      fs = require("fs")

function name2Font(font) {
	switch (font) {
		case "Blambot Casual":
			return "FontFileCasual";
		case "BadaBoom BB":
			return "FontFileBoom";
		case "Entrails BB":
			return "FontFileEntrails";
		case "Tokyo Robot Intl BB":
			return "FontFileTokyo";
		case "Accidental Presidency":
			return "FontFileAccidental";
		case "BodoniXT":
			return "FontFileBodoniXT";
		case "Budmo Jiggler":
			return "FontFileBJiggler";
		case "Budmo Jigglish":
			return "FontFileBJigglish";
		case "Existence Light":
			return "FontFileExistence";
		case "HeartlandRegular":
			return "FontFileHeartland";
		case "Honey Script":
			return "FontFileHoney";
		case "I hate Comic Sans":
			return "FontFileIHate";
		case "Impact Label":
			return "FontFileImpactLabel";
		case "loco tv":
			return "FontFileLocotv";
		case "Mail Ray Stuff":
			return "FontFileMailRay";
		case "Mia's Scribblings ~":
			return "FontFileMia";
		case "Shanghai":
			return "FontFileShanghai";
		case "Comic Book":
			return "FontFileComicBook";
		case "Wood Stamp":
			return "FontFileWoodStamp";
		case "Brawler":
			return "FontFileBrawler";
		case "Coming Soon":
			return "FontFileCSoon";
		case "Glegoo":
			return "FontFileGlegoo";
		case "Lilita One":
			return "FontFileLOne";
		case "Telex Regular":
			return "FontFileTelex";
		case "Claire Hand":
			return "FontFileClaireHand";
		case "Oswald":
			return "FontFileOswald";
		case "Poiret One":
			return "FontFilePoiretOne";
		case "Raleway":
			return "FontFileRaleway";
		case "Bangers":
			return "FontFileBangers";
		case "Creepster":
			return "FontFileCreepster";
		case "BlackoutMidnight":
			return "FontFileBlackoutMidnight";
		case "BlackoutSunrise":
			return "FontFileBlackoutSunrise";
		case "Junction":
			return "FontFileJunction";
		case "LeagueGothic":
			return "FontFileLeagueGothic";
		case "LeagueSpartan":
			return "FontFileLeagueSpartan";
		case "OstrichSansMedium":
			return "FontFileOstrichSansMedium";
		case "Prociono":
			return "FontFileProciono";
		case "Lato":
			return "FontFileLato";
		case "Alegreya Sans SC":
			return "FontFileAlegreyaSansSC";
		case "Barrio":
			return "FontFileBarrio";
		case "Bungee Inline":
			return "FontFileBungeeInline";
		case "Bungee Shade":
			return "FontFileBungeeShade";
		case "Gochi Hand":
			return "FontFileGochiHand";
		case "IM Fell English SC":
			return "FontFileIMFellEnglishSC";
		case "Josefin":
			return "FontFileJosefin";
		case "Kaushan":
			return "FontFileKaushan";
		case "Lobster":
			return "FontFileLobster";
		case "Montserrat":
			return "FontFileMontserrat";
		case "Mouse Memoirs":
			return "FontFileMouseMemoirs";
		case "Patrick Hand":
			return "FontFilePatrickHand";
		case "Permanent Marker":
			return "FontFilePermanentMarker";
		case "Satisfy":
			return "FontFileSatisfy";
		case "Sriracha":
			return "FontFileSriracha";
		case "Teko":
			return "FontFileTeko";
		case "Vidaloka":
			return "FontFileVidaloka";
		case "":
		case null:
			return "";
		default:
			return `FontFile${font}`;
	}
}

function useBase64(aId) {
	if (aId.endsWith("-starter.xml")) return true;
	switch (aId.substr(aId.lastIndexOf(".") + 1)) {
		case "xml":
			return false;
		default:
			return true;
	}
}

exports.packMovie = async function(xmlBuffer) {
	if (xmlBuffer.length == 0) throw null;

	const zip = nodezip.create();
	const themes = { common: true };
	var ugc = `${header}<theme id="ugc" name="ugc">`;
	fUtil.addToZip(zip, "movie.xml", xmlBuffer);

	// this is common in this file
	async function basicParse(file, type, subtype) {
		const pieces = file.split(".");
		const themeId = pieces[0];

		// add the extension to the last key
		var ext = pieces.pop();
		pieces[pieces.length - 1] += "." + ext;
		// add the type to the filename
		pieces.splice(1, 0, type);

		const filename = pieces.join(".");
		if (themeId == "ugc") {
			const [ preifx, file ] = pieces[2].split("-");
			var id, dot, ext, path, b;
			var t = "";
			if (type == "prop" && subtype == "video") t = "video";
			if (file) {
				id = file.slice(0, -4);
				dot = file.lastIndexOf(".");
				ext = file.substr(dot + 1);
				path = fUtil.getFileIndexForAssets("asset-", `.${ext}`, id);
				b = fs.readFileSync(fUtil.getFileIndexForAssets(`${t || type}-`, `.${ext}`, id));
			} else {
				id = pieces[2].slice(0, -4);
				path = process.env.ASSETS_FOLDER + `/${pieces[2]}`;
				b = fs.readFileSync(path);
			}
			if (!fs.existsSync(path)) fs.writeFileSync(path, b);
			try {
				const buffer = await asset.load(id, ext);

				// add asset meta
				ugc += asset.parseXmls(asset.meta(pieces[2], type, subtype));
				// and add the file
				fUtil.addToZip(zip, filename, buffer);

				// add video thumbnails
				if (type == "prop" && subtype == "video") {
					path = fUtil.getFileIndexForAssets("asset-", ".png", id);
					b = fs.readFileSync(fUtil.getFileIndexForAssets("video-", ".png", id));
					if (!fs.existsSync(path)) fs.writeFileSync(path, b);
					const filename = pieces.join(".").slice(0, -3) + "png";
					const buffer = await asset.load(id, "png");
					fUtil.addToZip(zip, filename, buffer);
				}
			} catch (e) {
				console.error(`WARNING: ${id}:`, e);
				return;
			}
		} else {
			const filepath = `${store}/${pieces.join("/")}`;

			// add the file to the zip
			fUtil.addToZip(zip, filename, await get(filepath));
		}

		themes[themeId] = true;
	}

	// begin parsing the movie xml
	const film = new xmldoc.XmlDocument(xmlBuffer);
	for (const eI in film.children) {
		const elem = film.children[eI];

		switch (elem.name) {
			case "sound": {
				const file = elem.childNamed("sfile")?.val;
				if (!file) continue;
				
				await basicParse(file, elem.name)
				break;
			}

			case "scene": {
				for (const e2I in elem.children) {
					const elem2 = elem.children[e2I];

					let tag = elem2.name;
					// change the tag to the one in the store folder
					if (tag == "effectAsset") tag = "effect";

					switch (tag) {
						case "durationSetting":
						case "trans":
							break;
						case "bg":
						case "effect":
						case "prop": {
							const file = elem2.childNamed("file")?.val;
							if (!file) continue;
							
							await basicParse(file, tag, elem2.attr.subtype);
							break;
						}
						
						case "char": {
							let file = elem2.childNamed("action")?.val;
							if (!file) continue;
							const pieces = file.split(".");
							const themeId = pieces[0];

							const ext = pieces.pop();
							pieces[pieces.length - 1] += "." + ext;
							pieces.splice(1, 0, elem2.name);
	
							if (themeId == "ugc") {
								// remove the action from the array
								pieces.splice(3, 1);

								const id = pieces[2];
								try {
									const buffer = await char.load(id);
									const filename = pieces.join(".");

									ugc += asset.parseXmls({
										// i can't just select the character data because of stock chars
										id: id,
										type: "char",
										themeId: char.getTheme(buffer)
									});
									fUtil.addToZip(zip, filename + ".xml", buffer);
								} catch (e) {
									console.error(`WARNING: ${id}:`, e);
									continue;
								}
							} else {
								const filepath = `${store}/${pieces.join("/")}`;
								const filename = pieces.join(".");

								fUtil.addToZip(zip, filename, await get(filepath));
							}

							for (const e3I in elem2.children) {
								const elem3 = elem2.children[e3I];
								if (!elem3.children) continue;

								// add props and head stuff
								file = elem3.childNamed("file")?.val;
								if (!file) continue;
								const pieces2 = file.split(".");

								// headgears and handhelds
								if (elem3.name != "head") await basicParse(file, "prop");
								else { // heads
									if (pieces2[0] == "ugc") continue;
									pieces2.pop(), pieces2.splice(1, 0, "char");
									const filepath = `${store}/${pieces2.join("/")}.swf`;

									pieces2.splice(1, 1, "prop");
									const filename = `${pieces2.join(".")}.swf`;
									fUtil.addToZip(zip, filename, await get(filepath));
								}

								themes[pieces2[0]] = true;
							}

							themes[themeId] = true;
							break;
						}

						case 'bubbleAsset': {
							const bubble = elem2.childNamed("bubble");
							const text = bubble.childNamed("text");

							// arial doesn't need to be added
							if (text.attr.font == "Arial") continue;

							const filename = `${name2Font(text.attr.font)}.swf`;
							const filepath = `${source}/go/font/${filename}`;
							fUtil.addToZip(zip, filename, await get(filepath));
							break;
						}
					}
				}
				break;
			}
		}
	}

	if (themes.family) {
		delete themes.family;
		themes.custom = true;
	}

	if (themes.cc2) {
		delete themes.cc2;
		themes.action = true;
	}

	const themeKs = Object.keys(themes);
	themeKs.forEach(async t => {
		if (t == 'ugc') return;
		const file = await get(`${store}/${t}/theme.xml`);
		fUtil.addToZip(zip, `${t}.xml`, file);
	});

	fUtil.addToZip(zip, 'themelist.xml', Buffer.from(`${header}<themes>${
		themeKs.map(t => `<theme>${t}</theme>`).join('')}</themes>`));
	fUtil.addToZip(zip, 'ugc.xml', Buffer.from(ugc + `</theme>`));
	return await zip.zip();
};
exports.repair = function(xmlBuffer) {
	if (xmlBuffer.length == 0) throw null;

	function basicParse(file, tag) {
		const pieces = file.split(".");
		const themeId = pieces[0];

		let ext;
		if (tag != "char") {
			ext = pieces.pop();
			pieces[pieces.length - 1] += "." + ext;
		} else pieces.splice(2, 2);

		switch (themeId) {
			case "ugc": {
				const id = pieces[1];
				if (!asset.exists(id)) {
					console.error(`${id} doesn't exist, removing from XML...`);
					return false;
				}
				break;
			} default: break;
		}
		return true;
	}

	// begin parsing the movie xml
	const film = new xmldoc.XmlDocument(xmlBuffer);
	for (const eI in film.children) {
		const elem = film.children[eI];

		switch (elem.name) {
			case "sound": {
				const file = elem.childNamed("sfile")?.val;
				if (!file) continue;
					
				if (!basicParse(file)) film.children.splice(eI, 1);;
				break;
			} case "scene": {
				for (const e2I in elem.children) {
					const elem2 = elem.children[e2I];
					const tag = elem2.name;

					switch (tag) {
						case "bg":
						case "char":
						case "effectAsset":
						case "prop": {
							const file = elem2.childNamed(tag != "char" ? "file" : "action")?.val;
							if (!file) continue;
								
							if (!basicParse(file, tag)) elem.children.splice(e2I, 1);
							break;
						} default: break;
					}
				}
				break;
			}
		}
	}

	return film.toString({ compressed: true });
};
exports.unpackMovie = async function(zipFile, thumb = null) {
	return new Promise(res => {
		var pieces = [];
		var stream = zipFile["movie.xml"].toReadStream();
		stream.on("data", (b) => pieces.push(b));
		stream.on("end", async () => {
			var mainSlice = Buffer.concat(pieces).slice(0, -7);
			var xmlBuffers = [];
			var charBuffers = {};
			var assetRemap = {};

			// Remaps UGC asset IDs to match the current Wrapper environment.
			for (let c = 0, end; ; c = mainSlice.indexOf("ugc.", c) + 4) {
				if (c == 0) continue;
				else if (c == 3) {
					xmlBuffers.push(mainSlice.subarray(end));
					break;
				}

				xmlBuffers.push(mainSlice.subarray(end, c));
				end = mainSlice.indexOf("<", c + 1);
				var assetId = mainSlice.subarray(c, end).toString();
				var index = assetId.indexOf("-");
				var prefix = assetId.substr(0, index);
				switch (prefix) {
					case "c": {
						var t = new Date().getTime();
						var dot = assetId.indexOf(".");
						var charId = assetId.substr(0, dot);
						var saveId = assetRemap[charId];
						if (!assetRemap[charId]) {
							saveId = assetRemap[charId] = `C-${~~(1e4 * Math.random())}-${t}`;
						}

						var remainder = assetId.substr(dot);
						xmlBuffers.push(Buffer.from(saveId + remainder));
						try {
							charBuffers[saveId] = await char.load(charId);
						} catch (e) {}
						break;
					}
					case "C": {
						var dot = assetId.indexOf(".");
						var charId = assetId.substr(0, dot);
						charBuffers[charId] = await char.load(charId);
						xmlBuffers.push(Buffer.from(assetId));
						break;
					}
					default: {
						xmlBuffers.push(Buffer.from(assetId));
						break;
					}
				}
			}

			var hLen = header.length;
			for (let id in charBuffers) {
				var buff = charBuffers[id];
				var hasHeader = buff.subarray(0, hLen / 2).toString() == header.substr(0, hLen / 2);
				var start = buff.includes("file_name") ? buff.indexOf(".xml") + 6 : hasHeader ? hLen + 9 : 9;
				xmlBuffers.push(Buffer.from(`<cc_char file_name='ugc.char.${id}.xml' ${buff.subarray(start)}`));
			}

			if (thumb) {
				var thumbString = thumb.toString("base64");
				xmlBuffers.push(Buffer.from(`<thumb>${thumbString}</thumb>`));
			}

			xmlBuffers.push(Buffer.from(`</film>`));
			res(Buffer.concat(xmlBuffers));
		});
	});
};
exports.unpackXml = async function(xml, mId) {
	var i = mId.indexOf("-");
	var prefix = mId.substr(0, i);
	var suffix = mId.substr(i + 1);
	if (prefix == "m") {
		var beg = xml.lastIndexOf("<thumb>");
		var end = xml.lastIndexOf("</thumb>");
		if (beg > -1 && end > -1) {
			var sub = Buffer.from(xml.subarray(beg + 7, end).toString(), "base64");
			fs.writeFileSync(fUtil.getFileIndex("thumb-", ".png", suffix), sub);
		}
		fs.writeFileSync(fUtil.getFileIndex("movie-", ".xml", suffix), xml);
	}
};
