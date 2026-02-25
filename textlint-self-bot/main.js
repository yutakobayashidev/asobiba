const { Client } = require('discord.js-selfbot-v13');
const { TextFixEngine } = require('textlint')

const formatResults = require('./formatResults');

require('dotenv').config();

const options = {
    configFile: '.textlintrc'
};

reply = false
autolint = true

const client = new Client({ checkUpdate: false });
const engine = new TextFixEngine(options);

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);
})

client.on('messageCreate', async (message) => {

    if (message.author.id == client.user.id && message.guildId == parseInt(process.env.DISCORD_GUILD_ID,10) && message.type == "DEFAULT") {

        const fixResults = await engine.executeOnText(message.content.replace(`<@${process.env.DISOCRD_USER_ID}>`, ''))

        if (message.mentions.members.has(client.user.id) && engine.isErrorResults(fixResults)) {

            message.reply("文章チェックが完了しました🎉\n\n" + "**文章のチェック結果:**\n" + formatResults(fixResults) + "**自動修正文章の提案:**\n" + fixResults[0].output)
        } else if (message.mentions.members.has(client.user.id)) {
            message.reply("文章チェックが完了しました🎉\n\n" + "**文章のチェック結果:**\n" + "✔ エラーは見つかりませんでした")
        } else if (message.content == "!reply on") {
            reply = true
            message.reply("lintの結果を送信します。")
        } else if (message.content == "!reply off") {
            message.reply("lintの結果の送信をストップしました。")
            reply = false
        } else if (message.content == "!reply") {
            message.reply(`現在replyは${reply}です。`)
        }
        else if (message.content == "!autolint") {
            message.reply(`現在autolintは${autolint}です。`)
        } else if (message.content == "!autolint off") {
            autolint = false
            message.reply("autolintをストップしました。")
        } else if (message.content == "!autolint on") {
            autolint = true
            message.reply("自動的にメッセージをlintします。")
        } else if (engine.isErrorResults(fixResults)) {
            if (reply == true)
                message.reply("文章チェックが完了しました🎉\n\n" + "**文章のチェック結果:**\n" + formatResults(fixResults) + "**自動修正文章の提案:**\n" + fixResults[0].output)
            else (autolint == true)
                message.edit(fixResults[0].output)
        } else if (reply == true) {
            message.reply("文章チェックが完了しました🎉\n\n" + "**文章のチェック結果:**\n" + "✔ エラーは見つかりませんでした")
        }
    }

});

client.login(process.env.DISCORD_TOKEN);