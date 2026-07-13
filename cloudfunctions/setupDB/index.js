const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function ensureCollection(name, result) {
  try {
    await db.createCollection(name);
    result.success.push(`创建集合: ${name}`);
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      result.success.push(`集合已存在: ${name}`);
    } else {
      result.failed.push(`创建集合 ${name} 失败: ${err.message}`);
    }
  }
}

exports.main = async () => {
  const result = { success: [], failed: [] };

  await ensureCollection('typhoons', result);
  await ensureCollection('sos_signals', result);

  return {
    code: result.failed.length ? 1 : 0,
    data: result,
    msg: `成功 ${result.success.length} 项，失败 ${result.failed.length} 项`
  };
};
