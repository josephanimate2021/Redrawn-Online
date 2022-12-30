exports.xmlFail = function(message = "You're grounded.") {
  return `<error><code>ERR_ASSET_404</code><message>${message}</message><text></text></error>`;
};
exports.assetFail = function(message) {
  return `<error><code>${message}</code></error>`;
};
