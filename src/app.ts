// Sistema de Inflacao pra dinheiro que ficar na conta qndo o mercado fechar. -15% + 15%.
// TODO: THINK ABOUT IT. Sistema de Roubo de Moedas Paradas. (Evento Pago por Em1Coins da Live)
// TODO: GUARDAR Mercado dentro do MongoDb
// TODO: Eventos estarem no mongoDB e serao chamados pelo bot.66
// Taxa por venda :) (ideia do AlissonSLeal)
require("dotenv").config();
import { IncomingHttpStatusHeader } from "http2";
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

const job = new cronJob("0 */5 * * * *", async () => {
  if (mercado.status) {
    const evento = await event();
    const { coin, value, quantity } = evento;
    mercado.evento.coin = coin;
    mercado.evento.value = value;
    mercado.evento.quantity = quantity;
    mercado.evento.status = true;
    const filePath = path.join(__dirname, "cash.mp3");
    await sound.play(filePath);
    client.say(
      "#em1dio",
      `/me 🤝 O evento comecou! Digite !pegar para conseguir... [${coin}]:${value.toFixed(5)}!`
    );
    setTimeout(async () => {
      mercado.evento.status = false;
      mercado.evento.pegou = [];
      client.say("#em1dio", `/me :( O evento acabou!!`);
    }, 30 * 1000); // 30 segundos
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
    pegou: [] as string[],
  }
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

enum Coins {
  BTC = "BTC",
  EM1 = "EM1",
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
    "!pegar"
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
  }
}

async function event(randomNumber?: number) {
  // get random coin in cryptocoins
  const cryptoCoins = await getCryptoCoins();
  const randomCoin = cryptoCoins[random(0, cryptoCoins.length)];

  randomNumber = randomNumber || random(5, 10);
  const coinValue = await getCoinValue(randomCoin);

  const value = randomNumber / coinValue;

  return { coin: randomCoin, value: value, quantity: randomNumber };
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
    const transaction: ICoin = {
      symbol: mercado.evento.coin,
      quantity: mercado.evento.quantity,
      status: Status.Doacao,
    };
    await giveCoin(username, transaction);
    client.say(
      "#em1dio",
      `/me @${username} 🤝 Voce ganhou [${mercado.evento.coin}]: ${mercado.evento.value.toFixed(5)}`
    );
  }
}
