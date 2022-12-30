const cachéFolder = process.env.CACHÉ_FOLDER,
      fs = require("fs")

/**
 * @summary Dictionary of hashmaps of saved assets, respective to each movie ID loaded.
 * @typedef {string[]} cTableType
 * @typedef {{[mId:string]:cTableType}} lcType
 * @type lcType
 */
const localCaché = {};
var size = 0;

// IMPORTANT: serialises the cachéd files into the dictionaries.
fs.readdirSync(cachéFolder).forEach((v) => {
	const index = v.indexOf(".");
	const prefix = v.substr(0, index);
	const suffix = v.substr(index + 1);

	if (!localCaché[prefix]) localCaché[prefix] = [];
	localCaché[prefix].push(suffix);
});

exports.generateId = function(pre = "", suf = "", table = []) {
	var id;
	do id = `${pre}${("" + Math.random()).replace(".", "")}${suf}`;
	while (table.includes(id));
	return id;
};
exports.validAssetId = function(aId) {
	switch (aId) {
		case "id":
		case "time":
			return false;
		default: return true;
	}
};
exports.saveTable = function(mId, buffers = {}) {
	for (const aId in buffers) this.save(mId, aId, buffers[aId]);
	return buffers;
};
exports.loadTable = function(mId) {
	const buffers = {};
	this.list(mId).forEach((aId) => buffers[aId] = fs.readFileSync(`${cachéFolder}/${mId}.${aId}`));
	return buffers;
};
exports.list = function(mId) {
	return localCaché[mId] || [];
};
exports.transfer = function(old, nëw) {
	if (nëw == old || !localCaché[old]) return;
	(localCaché[nëw] = localCaché[old]).forEach((aId) => {
		const oldP = `${cachéFolder}/${old}.${aId}`;
		const nëwP = `${cachéFolder}/${nëw}.${aId}`;
		fs.renameSync(oldP, nëwP);
	});
	delete localCaché[old];
};
exports.clearTable = function(mId, setToEmpty = true) {
	const stored = localCaché[mId];
	if (!stored) return;
	stored.forEach((aId) => {
		if (aId != "time") {
			var path = `${cachéFolder}/${mId}.${aId}`;
			size -= fs.statSync(path).size;
			fs.unlinkSync(path);
		}
	});
	if (setToEmpty) localCaché[mId] = [];
	else delete localCaché[mId];
};
