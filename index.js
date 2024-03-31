require("dotenv").config();

const {
  Client,
  GatewayIntentBits,

} = require("discord.js");

const fs = require("fs");
const path = require("path");
const fetch = require('node-fetch-commonjs');
const settings = require("./settings.json");

const TOKEN = process.env.TOKEN;
const guildID = process.env.GUILDID;

const debug = true;

const extensionsPath = "./src";

const client = new Client({
  intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds],
});

client.on("ready", async () => {
  const activities = ["Hello World!", "@Bro6 for help!"];

  const commands = [
    {
      name: "uninstall",
      description: "Uninstall a extension",
      options: [
        {
          name: "extension",
          description: "The extension to uninstall",
          type: 3,
          required: true,
        },
      ],
    },
    {
      name: "install",
      type: 1,
      description: "Install an extension",
      options: [
        {
          name: "extension",
          description: "The extension to install",
          type: 3,
          required: true,
        },
        {
          name: "repo",
          description: "The repo to install from",
          type: 3,
          required: true,
          choices: settings["repos"],
        },
      ],
    },
  ];

  for (const command of commands) {
    await client.guilds.cache.get(guildID).commands.create(command);
  }

  setInterval(() => {
    const status = activities[Math.floor(Math.random() * activities.length)];
    client.user.setPresence({
      activities: [{ name: status, type: 0 }],
    });
  }, 5000);
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (debug)
    console.log(
      `${interaction.user.tag} used Command: ${interaction.commandName}`
    );

  if (!interaction.member.permissions.has("ADMINISTRATOR")) return;
  if (debug) console.log("User has ADMINISTRATOR permission.");

  if (interaction.commandName === "uninstall") {
    const extensionName = interaction.options.getString("extension");
    uninstallextension(extensionName, interaction);
    return;
  }

  if (interaction.commandName === "install") {
    const extensionName = interaction.options.getString("extension");
    const repo = interaction.options.getString("repo");
    installextension(extensionName, repo, interaction);
    return;
  }
});

async function uninstallextension(extensionName, interaction) {
  try {
    const folder = `${extensionsPath}/${extensionName}`;
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true, force: true });
    };
    interaction.reply(`Extension ${extensionName} uninstalled.`);
  } catch (error) {
    interaction.reply(`Error uninstalling extension: ${error}`);
  };
};

async function installextension(extensionName, repo, interaction) {
  try {
    const extensionsIndex = await (await fetch(`${repo}/index.json`)).json();

    const extension = extensionsIndex[extensionName];
    if (!extension) return;

    const files = extension.files;
    if (!files) return;

    const createDirectories = new Set();
    const writeFiles = [];
    for (const fileType in files) {
      const filePath = `${extensionsPath}/${extensionName}/${fileType}`;
      if (fs.existsSync(filePath)) return;
      createDirectories.add(filePath);
      for (const file of files[fileType]) {
        writeFiles.push({
          fileUrl: `${repo}/extensions/${extensionName}/${fileType}/${file}`,
          filePath: `${filePath}/${file}`,
        });
      };
    };

    await Promise.all(
      [...createDirectories].map((dir) =>
        fs.promises.mkdir(dir, { recursive: true })
      )
    );
    await Promise.all(
      writeFiles.map(async ({ fileUrl, filePath }) => {
        const fileContent = await (await fetch(fileUrl)).text();
        await fs.promises.writeFile(filePath, fileContent);
      })
    );

    interaction.reply(`Extension ${extensionName} installed.`);
  } catch (error) {
    interaction.reply(`Error installing ${extensionName}: ${error}`);
    return;
  }
}

function loadExtensions(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? loadExtensions(path.join(dir, entry.name))
        : entry.name.endsWith(".js")
        ? path.join(dir, entry.name)
        : []
    );
}

for (const file of loadExtensions(extensionsPath)) {
  if (debug) console.log(`Loading extension: ${file}`);
  const extension = require(`./${file}`);
  extension.setup(client);
}

if (TOKEN != undefined) {
  client.login(TOKEN);
} else {
  console.log("Please set your TOKEN in .env");
}