import express from "express";
import cors from "cors";//跨域访问
import axios from "axios";
import dotenv from "dotenv";//加载环境变量

dotenv.config();//加载.env文件中的配置，加载完后可以通过process.env.变量名来访问实际的环境变量
const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = process.env.AI_BASE_URL;
const API_KEY = process.env.AI_API_KEY;

// 普通非流式接口（调试用）
app.post("/api/chat", async (req, res) => {
  const { message } = req.query;
  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );
    res.json({ reply: response.data.choices[0].message.content });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// 流式接口（带心跳和错误处理增强）
app.post("/api/chat-stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message } = req.query;
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  // 心跳机制，防止连接超时，定时发送消息给前端保持连接活跃
  const heartbeatInterval = setInterval(() => {
    res.write("data: [HEARTBEAT]\n\n");
  }, 30000);

  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: message }],
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );
    let buffer = "";
    response.data.on("data", (chunk) => {
      // console.log("Received chunk:", chunk.toString());
      const lines = chunk
        .toString()
        .split("\n")
        .filter((line) => line.trim() !== "");
      // console.log("Parsed lines:", lines);
      for (const line of lines) {
        if (line === "data: [DONE]") {
          clearInterval(heartbeatInterval);
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }
        // console.log(line);
        if (line.startsWith("data: ")) {
          const json = line.replace("data: ", "").trim();
          try {
            const parsed = JSON.parse(json);
            //判断是正常内容、结束符
            if(parsed.choices?.[0]?.finish_reason === "stop"){
              res.write(`data: [DONE]\n\n`);
              res.end();
              return;
            }else{
              //判断是否有内容
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                //替换掉输出内容中的\r和\n，防止前端换行显示问题
                const safeContent = content.replace(/\r/g, "").replace(/\n/g, "\\n");
                res.write(`data: ${safeContent}\n\n`);
                buffer += content;
              }
            }
          } catch (e) {
            console.error("⚠️ JSON parse error:", json);
          }
        }
      }
    });
    response.data.on("end", () => {
      clearInterval(heartbeatInterval);
      res.write("data: [DONE]\n\n");
      res.end();
    });
  } catch (err) {
    clearInterval(heartbeatInterval);
    console.error("❌ AI 请求失败:", err.response?.data || err.message);
    res.write(`data: [ERROR] ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.listen(3000, () =>
  console.log("✅ Backend running at http://localhost:3000")
);