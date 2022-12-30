const fUtil = require("./file"),
      caché = require("./caché")
      nodezip = require("node-zip"),
      parse = require("./parse"),
      fs = require("fs")

exports.save = function(movieZip, thumb, id) {
	return new Promise(async (res, rej) => {
		if (!id) id = `m-${fUtil.getNextFileId("movie-", ".xml")}`;
		// Saves the thumbnail of the respective video.
		if (thumb && id.startsWith("m-")) {
			const n = Number.parseInt(id.substr(2));
			const thumbFile = fUtil.getFileIndex("thumb-", ".png", n);
			fs.writeFileSync(thumbFile, thumb);
		}
		var i = id.indexOf("-");
		var prefix = id.substr(0, i);
		var suffix = id.substr(i + 1);
		var zip = nodezip.unzip(movieZip);
		if (prefix == "m") {
			var path = fUtil.getFileIndex("movie-", ".xml", suffix);
			var writeStream = fs.createWriteStream(path);
			parse.unpackMovie(zip, thumb).then((data) => {
				writeStream.write(data, () => {
					writeStream.close();
					res(id);
				});
			}).catch(e => rej(e));		
		}
		// get the current date and write the file into the saved folder for the meta file to look at.
		const [p, s] = id.split("-");
		fs.writeFileSync(process.env.SAVED_FOLDER + `/date-${s}.txt`, fUtil.time("24hour"));
	});
};
exports.loadZip = function(mId) {
	return new Promise((res, rej) => {
		const i = mId.indexOf("-");
		const prefix = mId.substr(0, i);
		const suffix = mId.substr(i + 1);
		switch (prefix) {
			case "m": {
				let numId = Number.parseInt(suffix);
				if (isNaN(numId)) rej("Error: Movie ID Parsing Has Failed.");
				let filePath = fUtil.getFileIndex("movie-", ".xml", numId);
				if (!fs.existsSync(filePath)) rej("Error: Movie Not Found");

				const buffer = fs.readFileSync(filePath);
				if (!buffer || buffer.length == 0) rej("Error: Your Movie Has Failed To Load");

				parse.packMovie(buffer, mId).then((pack) => res(pack)).catch(e => rej(e))
				break;
			}
			case "s": {
				let numId = Number.parseInt(suffix);
				if (isNaN(numId)) rej("Error: Starter ID Parsing Has Failed.");
				let filePath = fUtil.getFileIndex("starter-", ".xml", numId);
				if (!fs.existsSync(filePath)) rej("Error: Starter Not Found");

				const buffer = fs.readFileSync(filePath);
				if (!buffer || buffer.length == 0) rej("Error: Your Starter Has Failed To Load");

				parse.packMovie(buffer, mId).then((pack) => res(pack)).catch(e => rej(e));
				break;
			}
			default: rej("Error: The function you are using cannot load a file outside of starters and movies. please change around some configurations and try again later.");
		}
	});
};
exports.loadXml = function(movieId) {
	return new Promise(async (res, rej) => {
		const i = movieId.indexOf("-");
		const prefix = movieId.substr(0, i);
		const suffix = movieId.substr(i + 1);
		if (prefix == "m") {
			const fn = fUtil.getFileIndex("movie-", ".xml", suffix);
			if (fs.existsSync(fn)) res(fs.readFileSync(fn));
			else rej("Error: Movie Not Found");
		}
	});
};
exports.loadThumb = function(movieId) {
	return new Promise(async (res, rej) => {
		const [ preifx, id ] = movieId.split("-");
		var fn;
		switch (preifx) {
			case "m": {
				fn = fUtil.getFileIndex("thumb-", ".png", id);
				break;
			} case "s": {
				fn = fUtil.getFileIndex("starter-", ".png", id);
				break;
			} case "c": {
				fn = fUtil.getFileIndex("char-", ".png", id);
				break;
			}
		}
		isNaN(id) ? rej("Error: Thumb Not Found") : res(fs.readFileSync(fn));
	});
};
exports.list = function() {
	const array = [];
	const last = fUtil.getLastFileIndex("movie-", ".xml");
	for (let c = last; c >= 0; c--) {
		const movie = fs.existsSync(fUtil.getFileIndex("movie-", ".xml", c));
		const thumb = fs.existsSync(fUtil.getFileIndex("thumb-", ".png", c));
		if (movie && thumb) array.push(`m-${c}`);
	}
	return array;
};
exports.loadRows = function() {
	const folder = process.env.SAVED_FOLDER;
	const array = [];
	fs.readdirSync(folder).forEach(fn => {
		if (!fn.includes("movie")) return;
		const [ beg, numbers, end ] = fn.split("-");
		const id = Number.parseInt(numbers);
		array.unshift({html: `<a class="video-holder" href="#" data-video="/app/player?movieId=m-${id}"><div class="vthumb"><div class="vthumb-clip"><div class="vthumb-clip-inner"><span class="valign"></span><img src="/movie_thumbs/m-${id}" alt=""/></div></div></div><div class="play"></div></a>`});
	});
	return array;
};
exports.meta = function(movieId) {
	return new Promise(async (res, rej) => {
		if (!movieId.startsWith("m-")) return;
		const n = Number.parseInt(movieId.substr(2));
		const fn = fUtil.getFileIndex("movie-", ".xml", n);
		const date = fs.readFileSync(process.env.SAVED_FOLDER + `/date-${n}.txt`, 'utf8');

		const fd = fs.openSync(fn, "r");
		const buffer = Buffer.alloc(256);
		fs.readSync(fd, buffer, 0, 256, 0);
		const begTitle = buffer.indexOf("<title>") + 16;
		const endTitle = buffer.indexOf("]]></title>");
		const title = buffer.slice(begTitle, endTitle).toString().trim();

		const begDuration = buffer.indexOf('duration="') + 10;
		const endDuration = buffer.indexOf('"', begDuration);
		const duration = Number.parseFloat(buffer.slice(begDuration, endDuration));
		const min = ("" + ~~(duration / 60)).padStart(2, "0");
		const sec = ("" + ~~(duration % 60)).padStart(2, "0");
		const durationStr = `${min}:${sec}`;

		fs.closeSync(fd);
		res({
			date: date,
			durationString: durationStr,
			duration: duration,
			title: title || "Untitled Video",
			id: movieId,
		});
	});
};
