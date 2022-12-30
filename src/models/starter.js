const parse = require('./parse'),
      fUtil = require('./file'),
      nodezip = require('node-zip'),
      fs = require('fs');

exports.meta = function(sId) {
	return new Promise(async res => {
		if (!sId.startsWith("s-")) return;
		const n = Number.parseInt(sId.substr(2));
		const fn = fUtil.getFileIndex("starter-", ".xml", n);

		const fd = fs.openSync(fn, "r");
		const buffer = Buffer.alloc(256);
		fs.readSync(fd, buffer, 0, 256, 0);
		const begTitle = buffer.indexOf("<title>") + 16;
		const endTitle = buffer.indexOf("]]></title>");
		const title = buffer.slice(begTitle, endTitle).toString().trim();
		const begTag = buffer.indexOf("<tag>") + 14;
		const endTag = buffer.indexOf("]]></tag>");
		const tag = buffer.slice(begTag, endTag).toString().trim();

		fs.closeSync(fd);
		res({
			title: title,
			tags: tag,
			id: sId,
		});
	});
};
exports.save = function(starterZip, thumb, id) {
	return new Promise(async (res, rej) => {
		if (!id) id = `s-${fUtil.getNextFileId("starter-", ".xml")}`;
		// Saves the thumbnail of the respective video.
		if (thumb && id.startsWith("s-")) {
			const n = Number.parseInt(id.substr(2));
			const thumbFile = fUtil.getFileIndex("starter-", ".png", n);
			fs.writeFileSync(thumbFile, thumb);
		}
		var i = id.indexOf("-");
		var prefix = id.substr(0, i);
		var suffix = id.substr(i + 1);
		var zip = nodezip.unzip(starterZip);
		if (prefix == "s") {
			var path = fUtil.getFileIndex("starter-", ".xml", suffix);
			var writeStream = fs.createWriteStream(path);
			parse.unpackMovie(zip, thumb).then((data) => {
				writeStream.write(data, () => {
					writeStream.close();
					this.meta(id).then(m => {
						fs.writeFileSync(process.env.META_FOLDER + `/${m.id}-tag.txt`, m.tags);
						fs.writeFileSync(process.env.META_FOLDER + `/${m.id}-title.txt`, m.title);
					}).catch(e => rej(e));
					res(id);
				});
			}).catch(e => rej(e));		
		}
	});
};
exports.delete = function(sId) {
	if (!sId.startsWith("s-")) return;
	const n = Number.parseInt(sId.substr(2));
	const xml = fUtil.getFileIndex("starter-", ".xml", n);
	const png = fUtil.getFileIndex("starter-", ".png", n);
	const title = process.env.META_FOLDER + `/${sId}-title.txt`;
	const tag = process.env.META_FOLDER + `/${sId}-tag.txt`;
	fs.unlinkSync(xml);
	fs.unlinkSync(png);
	fs.unlinkSync(title);
	fs.unlinkSync(tag);
};
exports.thumb = function(movieId) {
	return new Promise((res, rej) => {
		if (!movieId.startsWith('s-')) return;
		const n = Number.parseInt(movieId.substr(2));
		const fn = fUtil.getFileIndex('starter-', '.png', n);
		isNaN(n) ? rej() : res(fs.readFileSync(fn));
	});
};
exports.list = function() {
	return new Promise((res, rej) => {
		const table = [];
		var ids = fUtil.getValidFileIndicies('starter-', '.xml');
		for (const i in ids) {
			var id = `s-${ids[i]}`;
			table.unshift({ id: id });
		}
		res(table);
	});
};
