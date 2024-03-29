const { Client, CommandInteraction, Collection } = require("discord.js");
const fs = require("fs");
const { } = require("./manager.js");

// fun the getdataforextension function out of the manager
const { getDataForExtension } = require("./manager.js");

// fun the getdataforextension function out of the manager
let data = getDataForExtension("tempvoice");

module.exports = {
  setup(client) {
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      if (interaction.commandName === "tempvoice") {
        const VoiceChannel = interaction.options.getChannel("voicechannel");
        const Category = interaction.options.getChannel("category");
        const NamePattern = interaction.options.getString("pattern");

        updateDataForExtension("tempvoice", {
          VoiceChannel: VoiceChannel.id,
          Category: Category.id,
          NamePattern: NamePattern,
        });

        interaction.reply("Temp voice channel created successfully.");;
      }
    });

    client.on("ready", async () => {


      const commands =[{
        name: "tempvoice",
        description: "Set the temp voice channel",
        options: [
          {
            name: "voicechannel",
            description: "The temp voice creator channel",
            type: 7,
            required: true,
          },
          {
            name: "category",
            description:
              "The Category where the temp voice channel will be created",
            type: 7,
            required: true,
          },
          {
            name: "pattern",
            description: "The name pattern of the temp voice channel",
            type: 3,
            required: true,
          },
        ],
      },];

      const guild = client.guilds.cache.get("935536919520100372");

      for (const command of commands) {

          await guild.commands.create(command);


      }
    });
  },
};
