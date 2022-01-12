// Sistema de Inflacao pra dinheiro que ficar na conta qndo o mercado fechar. -15% + 15%.
// TODO: GUARDAR Mercado dentro do MongoDb
// TODO: Eventos estarem no mongoDB e serao chamados pelo bot.
// Taxa por venda :) (ideia do AlissonSLeal)
require("dotenv").config();
import { ObjectId } from "mongodb";
import path = require("path");

const { MongoClient } = require("mongodb");
const dataMongo = {
  url: process.env.MONGO_URL,
  dbName: process.env.MONGO_DB_NAME,
  password: process.env.MONGO_PASSWORD,
  user: process.env.MONGO_USER,
};
const uri = `mongodb+srv://${dataMongo.user}:${dataMongo.password}@${dataMongo.url}/${dataMongo.dbName}?retryWrites=true&w=majority`;
const mongoClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const sound = require("sound-play");
const tmi = require("tmi.js");
const axios = require("axios");
require("dotenv").config();
const cronJob = require("cron").job;

enum TipoEvento {
  Pegar = "pegar",
  Assalto = "assalto",
}

const job = new cronJob("0 */5 * * * *", async () => {
  if (mercado.status) {
    const functionArray = [
      TipoEvento.Pegar,
      TipoEvento.Assalto
    ];
    const sorteio = random(0, functionArray.length);
    runEvents(functionArray[sorteio]);
  }
});
job.start();

const mercado = {
  status: false,
  salarios: [],
  evento: {
    coin: "",
    value: 0,
    quantity: 0,
    status: false,
    risco: 0,
    pegou: [] as string[],
    participar: [] as string[],
  },
};

const countInArray = (arr: unknown[], item: string | number) =>
  arr.filter((x) => x == item).length;

enum Status {
  Compra = "Compra",
  Venda = "Venda",
  Doacao = "Doacao",
}

interface ICoin {
  symbol: string;
  quantity: number;
  status: Status;
}

interface IWallet {
  _id: ObjectId;
  username: string;
  em1coins: number;
  coins?: ICoin[];
}

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

async function EventoPegar() {
  const quantity = random(5, 10);
  mercado.evento.status = true;
  mercado.evento.quantity = quantity;
  const filePath = path.join(__dirname, "cash.mp3");
  await sound.play(filePath);
  client.say(
    "#em1dio",
    `/me 🤝 O evento comecou! Digite !pegar para conseguir... [EM1]: ${quantity}!`
  );
  setTimeout(async () => {
    mercado.evento.status = false;
    mercado.evento.pegou = [];
    client.say("#em1dio", `/me :( O evento acabou!!`);
  }, 30 * 1000);
}

// Called every time a message comes in
async function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  } // Ignore messages from the bot
  const isBroadcaster = context.badges?.broadcaster == "1";
  // Remove whitespace from chat message
  const commandName = msg.trim();
  const commands = commandName.split(" ");
  const command = commands[0];
  if (isBroadcaster) {
    switch (command) {
      case "!teste": {
        console.log("teste");
        break;
      }
      case "!mercado": {
        if (!mercado.status) {
          await mongoClient.connect();
          mercado.status = true;
          return client.say(
            "#em1dio",
            `/me 🤝 O mercado esta aberto! Use !salario para receber seu salario.`
          );
        } else {
          mercado.status = false;
          mercado.salarios = [];

          await mongoClient.close();
          return client.say("#em1dio", `/me 😐 O mercado esta fechado!`);
        }
        break;
      }
      case "!doacao": {
        // !doacao [usuario] [quantidade]
        let usuario: string = commands[1];
        if (usuario[0] === "@") {
          usuario = usuario.slice(1);
        }

        const quantidade = commands[2];
        await giveEM1(usuario.toLowerCase(), parseInt(quantidade));
        break;
      }
    }
  }

  const listCommands = [
    "!mercado",
    "!vender",
    "!ranking",
    "!investir",
    "!carteira",
    "!salario",
    "!moedas",
    "!pegar",
  ];
  if (listCommands.includes(command) && !mercado) {
    return client.say(
      "#em1dio",
      `/me 😪 O mercado esta fechado! Que tal pedir para o Streamer abrir?`
    );
  }
  const { badges, "badge-info": badgeInfo } = context;
  const isSubscriber =
    badges?.subscriber || badges?.founder || context.subscriber;
  switch (command) {
    case "!salario": {
      await em1coin(context.username, isSubscriber);
      break;
    }
    case "!carteira": {
      await wallet(context.username);
      break;
    }
    case "!investir": {
      // !investir [valor] [cryptoCoin]
      const cryptoCoin = commands[1];
      const valor = commands[2];
      await investir(context.username, valor, cryptoCoin);
      break;
    }
    case "!vender": {
      const cryptoCoin = commands[1];
      const valor = commands[2];
      await vender(valor, context.username, cryptoCoin);
      break;
    }

    case "!ranking": {
      await ranking(context.username);
      break;
    }

    case "!mercado": {
      if (!isBroadcaster) {
        commandsMercado(listCommands);
      }
      break;
    }

    case "!moedas": {
      client.say(
        "#em1dio",
        `/me 🤝 As moedas voce encontra la na Brapi ;) https://brapi.ga/api/v2/crypto/available `
      );
      break;
    }

    case "!pegar": {
      await pegar(context.username);
      break;
    }

    case "!participar": {
      await participar(context.username);
      break;
    }
  }
}

function commandsMercado(listCommands: string[]) {
  return client.say(
    "#em1dio",
    `/me 💰 Para usar o mercado EM1: ${listCommands.join("|")}.`
  );
}

async function vender(valor: number, username: string, cryptoCoin: string) {
  const db = mongoClient.db("em1bot");
  const accountsCollection = db.collection("em1coinsimulator");
  const wallet = await getWallet(username);

  const cryptoCoins = await getCryptoCoins();

  if (!cryptoCoin) {
    return client.say(
      "#em1dio",
      `/me 🤔 Você precisa informar a moeda que deseja vender. !moedas para conhecer as moedas validas.`
    );
  }

  const validCryptoCoin = cryptoCoins.find((x) => x == cryptoCoin);
  if (!validCryptoCoin) {
    return client.say(
      "#em1dio",
      `/me 🤔 A moeda ${cryptoCoin} não existe. Use !moedas para conhecer as moedas validas.`
    );
  }

  const coins = wallet.coins.find((x) => x.symbol === validCryptoCoin);
  valor = !valor ? coins.quantity : valor;

  if (valor < 0 || !Number(valor)) {
    return client.say(
      "#em1dio",
      `/me Use !vender [CryptoCoin] [QUANTIDADE (Valores Positivos), sem valor vender tudo ;)] `
    );
  }

  if (!wallet.coins || !coins || coins?.quantity < valor) {
    return client.say("#em1dio", `/me 🤝 Voce nao tem moedas para vender!`);
  }

  const cryptocoins = await getCryptoCoin(cryptoCoin);
  const crypto = cryptocoins[0].regularMarketPrice;
  const total = valor * crypto;

  coins.quantity -= valor;
  wallet.coins[wallet.coins.indexOf(coins)] = coins;

  await accountsCollection.updateOne(
    { _id: wallet._id },
    { $inc: { em1coins: +total }, $set: { coins: wallet.coins } }
  );

  const totalToShow = coins?.quantity;
  client.say(
    "#em1dio",
    `/me 🤝 O valor vendido foi ${valor} em um total de: ${total.toFixed(2)}.` +
      ` Agora voce tem: ${totalToShow.toFixed(8)} de ${cryptoCoin} imaginarios`
  );
}

async function investir(username: string, valor: number, cryptoCoin: string) {
  const db = mongoClient.db("em1bot");
  const accountsCollection = db.collection("em1coinsimulator");
  const coins = await getCryptoCoins();

  if (!cryptoCoin) {
    return client.say(
      "#em1dio",
      `/me 🤔 Você precisa informar a moeda que deseja investir. !moedas para conhecer as moedas validas.`
    );
  }
  cryptoCoin = cryptoCoin.toUpperCase();
  const validCoin = coins.find((coin) => coin === cryptoCoin);
  if (!validCoin) {
    return client.say(
      "#em1dio",
      `/me 🤔 A moeda ${validCoin} não existe. Use !moedas para conhecer as moedas validas.`
    );
  }
  if (!valor || !Number(valor) || valor <= 0) {
    return client.say(
      "#em1dio",
      `/me 🤝 Use !investir [Cryptocoin] [QUANTIDADE (Valores Positivos)]`
    );
  }

  const wallet = await getWallet(username);

  if (!wallet) {
    return giveEM1(username);
  }

  if (wallet.em1coins < valor) {
    return client.say(
      "#em1dio",
      `/me Voce nao tem essa quantidade para investir`
    );
  }

  // update accounts.coins
  const transaction: ICoin = {
    symbol: validCoin,
    quantity: valor,
    status: Status.Compra,
  };

  const totalToShow = await giveCoin(username, transaction);
  client.say(
    "#em1dio",
    `/me 🤝 O valor investido foi ${valor}.` +
      ` Agora voce tem: ${totalToShow.toFixed(8)} ${validCoin} imaginarios`
  );
}

async function giveCoin(username: string, transaction: ICoin) {
  const db = mongoClient.db("em1bot");
  const accountsCollection = db.collection("em1coinsimulator");

  const wallet = await getWallet(username);

  if (!wallet) {
    return giveEM1(username);
  }

  const cryptocoins = await getCryptoCoin(transaction.symbol);
  const crypto = cryptocoins[0].regularMarketPrice;
  const total = transaction.quantity / crypto;

  const existCoins = wallet.coins?.find((x) => x.symbol === transaction.symbol);
  if (existCoins) {
    existCoins.quantity += total;
    wallet.coins[wallet.coins.indexOf(existCoins)] = existCoins;

    const update = {
      $set: { coins: wallet.coins },
    };

    if (transaction.status === Status.Compra) {
      update["$inc"] = { em1coins: -transaction.quantity };
    }

    await accountsCollection.updateOne({ username }, update);
  } else {
    const update = {
      $push: { coins: { symbol: transaction.symbol, quantity: total } },
    };

    if (transaction.status === Status.Compra) {
      update["$inc"] = { em1coins: -transaction.quantity };
    }
    await accountsCollection.updateOne({ username }, update);
  }

  return existCoins?.quantity || total;
}

async function em1coin(username: string, isSubscriber: boolean) {
  const jaExiste = countInArray(mercado.salarios, username);

  if (jaExiste === 0) {
    mercado.salarios.push(username);
    return await giveEM1(username, 30);
  }

  if (isSubscriber && jaExiste < 2) {
    mercado.salarios.push(username);
    return await giveEM1(username, 30);
  }

  client.say("#em1dio", `/me 🤝 Voce ja ganhou seu salario hoje!`);
}

async function wallet(username: string) {
  const wallet = await getWallet(username);
  if (!wallet) {
    return giveEM1(username);
  }

  const coins = wallet.coins;
  if (coins.length === 0) {
    return client.say(
      "#em1dio",
      `/me @${username} 🤝 Voce tem ${wallet.em1coins} EM1! 😎`
    );
  }

  let text = coins.reduce((acc, coin) => {
    if (coin.quantity > 0) {
      acc += `[${coin.symbol}]:${coin.quantity.toFixed(8)} `;
    }
    return acc;
  }, "");

  text = text === "" ? text : "e " + text;

  return client.say(
    "#em1dio",
    `/me 🤝 @${username} Voce tem ${wallet.em1coins} EM1! 😎 ${text}`
  );
}

function novaCarteira(username: string) {
  return client.say(
    "#em1dio",
    `/me 🤝 @${username} Criei sua carteira da Em1 E ja te dei 100 EM1 ;) !`
  );
}

async function takeOutEm1(username: string, valor: number) {
  const db = mongoClient.db("em1bot");
  const accountsCollection = db.collection("em1coinsimulator");

  const wallet = await getWallet(username);
  
  if (wallet.em1coins < valor) {
    return accountsCollection.updateOne(
      { username },
      { $set: { em1coins: 0 } }
    );  
  }

  return accountsCollection.updateOne(
    { username },
    { $inc: { em1coins: -valor } }
  );   
} 

async function giveEM1(username: string, valor?: number) {
  const wallet = await getWallet(username);
  const db = mongoClient.db("em1bot");
  const accountsCollection = db.collection("em1coinsimulator");
  if (!wallet) {
    await accountsCollection.insertOne({ username, em1coins: 100, coins: [] });
    return novaCarteira(username);
  } else {
    // update accounts with new value
    await accountsCollection.updateOne(
      { _id: wallet._id },
      { $inc: { em1coins: valor } }
    );
  }
  const account = await accountsCollection.findOne({ username });
  return client.say(
    "#em1dio",
    `/me @${username} 🤝 Voce ganhou ${valor} EM1!, Seu saldo eh: ${account.em1coins.toFixed(
      2
    )}`
  );
}

async function getWallet(username: string): Promise<IWallet> {
  const db = mongoClient.db("em1bot");
  const accountsCollection = db.collection("em1coinsimulator");
  return accountsCollection.findOne({ username });
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

async function getCryptoCoin(
  crypto: string | string[],
  currency: string = "BRL"
) {
  try {
    if (Array.isArray(crypto)) {
      crypto = crypto.join(",");
    }
    const response = await axios.get(
      `https://brapi.ga/api/v2/crypto?coin=${crypto}&currency=${currency}`
    );
    return response.data.coins;
  } catch (error) {
    console.error(error);
  }
}

async function getCryptoCoins(): Promise<string[]> {
  try {
    const response = await axios.get(
      `https://brapi.ga/api/v2/crypto/available`
    );
    return response.data.coins;
  } catch (error) {
    console.error(error);
  }
}

async function ranking(username: string) {
  const db = mongoClient.db("em1bot");
  const accountsCollection = db.collection("em1coinsimulator");
  const accounts = await accountsCollection.find().toArray();
  let list = [];
  let i = 1;
  for await (const account of accounts) {
    const totalEm1 = await getTotal(account.username);
    list.push({
      name: account.username,
      em1coins: totalEm1,
    });
  }

  const usernameTotal = list.find((x) => x.name === username);
  // sort list by em1coins
  list.sort((a, b) => {
    return b.em1coins - a.em1coins;
  });

  const top3 = [];
  list.slice(0, 3).forEach((x, i) => {
    top3.push(`[${i + 1} - ${x.name} - ${x.em1coins.toFixed(3)}]`);
  });

  return client.say(
    "#em1dio",
    `Segue o nosso podio! ${top3.join("\n")}.` +
      `@${username} possui um total de ${usernameTotal.em1coins.toFixed(
        3
      )} EM1. Parabens! 💪💪💪`
  );
}

async function getTotal(username: string) {
  const wallet = await getWallet(username);
  const coins = wallet.coins.map((coin) => coin.symbol);
  if (coins.length === 0) {
    return wallet.em1coins;
  }
  // sum to every coin in wallet
  const cryptocoins = await getCryptoCoin(coins);

  const total = wallet.coins.reduce((acc, coin) => {
    return (
      acc +
      cryptocoins.find(
        (cryptocoin: { coin: string }) => cryptocoin.coin === coin.symbol
      )?.regularMarketPrice *
        coin.quantity
    );
  }, 0);

  return wallet.em1coins + total;
}
async function getCoinValue(coin: string) {
  const cryptocoins = await getCryptoCoin(coin);
  return cryptocoins.find((cryptocoin) => cryptocoin.coin === coin)
    ?.regularMarketPrice;
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

async function pegar(username: string) {
  // check if username is not inside momento.pegou
  const isInsidePegou = mercado.evento.pegou.includes(username);

  if (mercado.evento.status && !isInsidePegou) {
    mercado.evento.pegou.push(username);
    await giveEM1(username, mercado.evento.quantity);
  }
}

async function participar(username: string) {
  // check if username is not inside momento.pegou
  const isInsideParticipar = mercado.evento.participar.includes(username);

  if (mercado.evento.status && !isInsideParticipar) {
    mercado.evento.participar.push(username);
    try {
      takeOutEm1(username, mercado.evento.quantity);
      client.say("#em1dio", `/me 🔫 Voce esta fazendo parte do Assalto!`);

    } catch (error) {
      console.log(error);   
    }
  }
}

async function runEvents(evento: string) {
  switch (evento) {
    case TipoEvento.Pegar:
      await EventoPegar();
      break;

    case TipoEvento.Assalto:
      await EventoAssalto();
      break;
  }
}

async function EventoAssalto() {
  mercado.evento.status = true;
  const filePath = path.join(__dirname, "cash.mp3");
  await sound.play(filePath);
  client.say("#em1dio", `/me 🔫 Assalto no mercado! O Rei do Crime que fazer um assalto! O premio sera divido entre os participantes`);
  mercado.evento.quantity = random(10, 25);
  mercado.evento.risco = random(1, 1000)/1000;
  client.say("#em1dio", `/me 🔫 O Custo para participar desse evento eh de ${mercado.evento.quantity} 💰`);
  client.say("#em1dio", `/me 🔫 Os mestres do roubo estao falando que o risco eh: ${definirRisco()} 💰`);
  client.say("#em1dio", `/me Para participar basta dizer !participar 💰`);
  setTimeout(async () => {
    const participantes = mercado.evento.participar;
    const potencial = random(1, 3);
    const chance = random(1, 1000)/1000;
    client.say("#em1dio", `/me 🔫 O Assalto Acabou!!! 💰`);
    if (chance >= mercado.evento.risco) {
      const premio = definirPremio();
      const valorRecebido = mercado.evento.quantity * potencial * premio;
      client.say("#em1dio", `/me 🔫 O assalto foi um sucesso!`);
      client.say("#em1dio", `/me 🔫 Os participantes ganharam ${valorRecebido} 💰`);
      for await (const participante of participantes) {
        await giveEM1(participante, valorRecebido);
      }
    } else {
      client.say("#em1dio", `/me 🔫 O assalto foi um fracasso!`);
      const pena = mercado.evento.quantity * definirPremio();
      client.say("#em1dio", `/me 🔫 Os participantes perderam mais ${pena} 💰`);
      for await (const participante of participantes) {
        await takeOutEm1(participante, pena);
      }
    }
    mercado.evento.status = false;
    mercado.evento.participar = [];
  }, 40 * 1000);

}

function definirPremio() {
  const risco = mercado.evento.risco;
  if (risco <= 0.1) {
    return random(1, 2);
  } 
  if (risco <= 0.3) {
    return random(2, 3);
  }
  if (risco <= 0.5) {
    return random(3, 4);
  }
  if (risco <= 0.7) {
    return random(4, 6);
  }
  if (risco <= 1) {
    return 10;
  }
}

function definirRisco() {
  const risco = mercado.evento.risco;
  if (risco <= 0.1) {
    return "Facil";
  } 
  if (risco <= 0.3) {
    return "Baixo";
  }
  if (risco <= 0.5) {
    return "Medio";
  }
  if (risco <= 0.8) {
    return "Alto";
  }
  if (risco <= 1) {
    return "Impossivel";
  }
}

