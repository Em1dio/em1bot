const tmi = require("tmi.js");
require("dotenv").config();

const opts = {
  identity: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
  },
  channels: ["em1dio"],
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);

// Connect to Twitch:
client.connect();
let sorteio = [];
let sorteioEstaAtivo = false;
const listaSubs = [
  "moya",
  "micheldelarocha",
  "rescom",
  "kelviny",
  "mqrossi",
  "slvfps",
  "eogusapenas",
  "xtecna",
  "m4urici0gm",
  "theusanchez",
  "em1dio",
  "dwtoledo",
];

// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  } // Ignore messages from the bot
  const isBroadcaster = context.badges?.broadcaster == "1";
  // Remove whitespace from chat message
  const commandName = msg.trim();

  if (isBroadcaster) {
    switch (commandName) {
      case "!verificarsorteio": {
        const size = sorteio.length;
        const value = shuffleArray(sorteio);
        console.log(size);
        console.log(value);
        client.say(target, `O Ganhador do sorteio é: ${value[0]}`);
        sorteioEstaAtivo = false;
        break;
      }
      case "!iniciar-sorteio": {
        sorteio = [];
        sorteioEstaAtivo = true;
        client.say(
          target,
          `O sorteio vai comecar! Digite !sorteio para participar. Sub tem 5x de chance de ganhar!`
        );
        console.log(sorteio);
        break;
      }
    }
  }

  switch (commandName) {
    case "!dice": {
      const num = random(1, 6);
      client.say(target, `You rolled a ${num}`);
      break;
    }
    case "!sorteio": {
        if(sorteioEstaAtivo) {
            const nome = context["display-name"];
            if (!sorteio.includes(nome)) {
              if (listaSubs.includes(context.username)) {
                sorteio.push(nome);
                sorteio.push(nome);
                sorteio.push(nome);
                sorteio.push(nome);
                sorteio.push(nome);
              } else {
                sorteio.push(nome);
              }
              client.say(target, `${nome} esta cadastrado no sorteio`);
            } else {
              client.say(target, `${nome}, Voce ja se cadastrou malandrinho ;)`);
            }
            console.log(sorteio);
        } else 
        {
            client.say(target, `Nao temos nenhum sorteio ativo no momento`);
        }
      
      break;
    }
    default:
      break;
  }
}

// Function called when the "dice" command is issued
function random(min, max) {
  return Math.floor(Math.random() * max) + min;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
