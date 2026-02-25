import { ChatOpenAI } from "langchain/chat_models/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "langchain/prompts";

export const dynamic = "force-dynamic";
export const revalidate = true;
export const runtime = "edge";

async function runLLMChain(text: string, api: string) {
  const encoder = new TextEncoder();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const chatStreaming = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    streaming: true,
    maxTokens: -1,
    temperature: 0,
    openAIApiKey: api,
    callbacks: [
      {
        async handleLLMNewToken(token) {
          await writer.ready;
          await writer.write(encoder.encode(`${token}`));
        },
        async handleLLMEnd() {
          await writer.ready;
          await writer.close();
        },
        async handleLLMError(e) {
          await writer.ready;
          console.log("handleLLMError Error: ", e);
          await writer.abort(e);
        },
      },
    ],
  });

  const prompt_template =
    "次の文章の簡潔に議員のフルネームや時刻などは省略せず要約を書いてください: {text} 簡潔な日本語の要約: ";

  const RPROMPT = new PromptTemplate({
    template: prompt_template,
    inputVariables: ["text"],
  });

  const refinePromptTemplate = `あなたの仕事は最終的な要約を作ることです
  途中までの要約があります: "{existing_answer}"
  必要に応じて下記の文章を使い、さらに良い要約を作成してください
  与えられた文章が有用でない場合、途中までの文章を返してください
------------
"{text}"
------------

与えられた文章を踏まえて、日本語で要約を改善してください
REFINED SUMMARY:`;

  const REFINE_PROMPT = new PromptTemplate({
    template: refinePromptTemplate,
    inputVariables: ["existing_answer", "text"],
  });

  const chain = loadSummarizationChain(chatStreaming, {
    type: "refine",
    refinePrompt: REFINE_PROMPT,
    questionPrompt: RPROMPT,
  });

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 3000,
  });

  const docs = await textSplitter.createDocuments([text]);

  chain.call({
    input_documents: docs,
  });
  return stream.readable;
}

export async function POST(request: Request) {
  const body = await request.json();

  const stream = runLLMChain(body.text, body.api);
  return new Response(await stream, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
}
