# vercel-chat

Chat SDK + AI SDK で動く Slack ボット。Bun + Hono で動作。

## Prerequisites

- [Bun](https://bun.sh/)
- Slack App（後述のマニフェストで作成）
- Anthropic API Key

## Quick start

```bash
bun install
cp .env.example .env  # 環境変数を設定
bun run dev           # http://localhost:3000
```

ローカルで Slack と接続するには ngrok 等でトンネルを張る:

```bash
ngrok http 3000
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | `xoxb-` で始まる Bot User OAuth Token |
| `SLACK_SIGNING_SECRET` | Slack App の Signing Secret |
| `ANTHROPIC_API_KEY` | Anthropic API Key |

## Slack App Setup

[api.slack.com/apps](https://api.slack.com/apps) で「Create New App」→「From a manifest」を選択し、以下の YAML を貼り付ける。

```yaml
display_information:
  name: Assistant Bot
  description: A bot built with Chat SDK
features:
  bot_user:
    display_name: Assistant Bot
    always_online: true
oauth_config:
  scopes:
    bot:
      - app_mentions:read
      - channels:history
      - channels:read
      - chat:write
      - groups:history
      - groups:read
      - im:history
      - im:read
      - mpim:history
      - mpim:read
      - reactions:read
      - reactions:write
      - users:read
settings:
  event_subscriptions:
    request_url: https://<YOUR_DOMAIN>/api/webhooks/slack
    bot_events:
      - app_mention
      - message.channels
      - message.groups
      - message.im
      - message.mpim
  interactivity:
    is_enabled: true
    request_url: https://<YOUR_DOMAIN>/api/webhooks/slack
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

`<YOUR_DOMAIN>` を ngrok の URL やデプロイ先のドメインに置き換える。

アプリ作成後:
1. **OAuth & Permissions** → ワークスペースにインストール → Bot User OAuth Token をコピー
2. **Basic Information** → Signing Secret をコピー
3. `.env` に設定

## Architecture

```
POST /api/webhooks/slack → Hono → Chat SDK → Event Handlers → AI SDK → Streaming Response
```
