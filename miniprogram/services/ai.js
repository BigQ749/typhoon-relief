function analyzeRisk() {
  return Promise.resolve({
    level: 'reserved',
    summary: 'AI 风险分析能力已预留，待接入模型服务。'
  });
}

function summarizeSOS(description) {
  return Promise.resolve(description || '');
}

module.exports = {
  analyzeRisk,
  summarizeSOS
};
