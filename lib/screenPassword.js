module.exports = function (level, msg, meta) {
  if (meta && meta.password) meta.password = `*******(${meta.password.length})`;
  if (meta && meta.data && meta.data.password) meta.data.password = `*******(${meta.data.password.length})`;
  return meta;
};
