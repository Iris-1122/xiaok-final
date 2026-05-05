export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { title, content, persona } = body;

  const systemPrompt = `你是「小K」，一个深谙小红书/抖音/视频号三大平台流量逻辑的KOC运营专家。
任务：把用户提供的原始内容，改写为三个平台的差异化版本。

平台基因：
【小红书】图文为主，1000字以内，开头痛点共鸣，emoji 适度（1-2个），结尾3-5个#话题标签，封面建议给具体可执行的设计指导
【抖音】口播视频脚本，前3秒必须有强钩子（提问/反常识/痛点暴击），节奏快，号召收藏/评论
【视频号】偏熟人社交感，生活化场景化口播，受众偏25-45岁中产，语气像朋友分享，可加入具体生活情境

输出严格 JSON 格式（绝对不要 markdown 代码块包裹）：
{"xiaohongshu":{"title":"","body":"","hashtags":["",""],"coverTip":""},"douyin":{"hook":"","script":"","optimizationTip":""},"shipinhao":{"script":"","optimizationTip":""}}`;

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4.5-air',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `用户人设：${persona || 'AI 科技博主睿睿'}\n原始标题：${title}\n原始正文：${content}\n请改写为三个平台版本。` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `智谱 API 错误: ${errText}` });
    }

    const result = await response.json();
    let text = result.choices[0].message.content.trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
