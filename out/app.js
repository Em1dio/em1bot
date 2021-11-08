"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Sistema de Inflacao pra dinheiro que ficar na conta qndo o mercado fechar. -15% + 15%.
// TODO: THINK ABOUT IT. Sistema de Roubo de Moedas Paradas. (Evento Pago por Em1Coins da Live)
// TODO: GUARDAR Mercado dentro do MongoDb
// TODO: Eventos estarem no mongoDB e serao chamados pelo bot.66
// Taxa por venda :) (ideia do AlissonSLeal)
require("dotenv").config();
const path = require("path");
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
const job = new cronJob("0 */5 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    if (mercado.status) {
        const evento = yield event();
        const { coin, value, quantity } = evento;
        mercado.evento.coin = coin;
        mercado.evento.value = value;
        mercado.evento.quantity = quantity;
        mercado.evento.status = true;
        const filePath = path.join(__dirname, "cash.mp3");
        yield sound.play(filePath);
        client.say("#em1dio", `/me 🤝 O evento comecou! Digite !pegar para conseguir... [${coin}]:${value.toFixed(5)}!`);
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            mercado.evento.status = false;
            mercado.evento.pegou = [];
            client.say("#em1dio", `/me :( O evento acabou!!`);
        }), 30 * 1000); // 30 segundos
    }
}));
job.start();
const mercado = {
    status: false,
    salarios: [],
    evento: {
        coin: "",
        value: 0,
        quantity: 0,
        status: false,
        pegou: [],
    }
};
const countInArray = (arr, item) => arr.filter((x) => x == item).length;
var Status;
(function (Status) {
    Status["Compra"] = "Compra";
    Status["Venda"] = "Venda";
    Status["Doacao"] = "Doacao";
})(Status || (Status = {}));
var Coins;
(function (Coins) {
    Coins["BTC"] = "BTC";
    Coins["EM1"] = "EM1";
})(Coins || (Coins = {}));
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
function onMessageHandler(target, context, msg, self) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (self) {
            return;
        } // Ignore messages from the bot
        const isBroadcaster = ((_a = context.badges) === null || _a === void 0 ? void 0 : _a.broadcaster) == "1";
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
                        yield mongoClient.connect();
                        mercado.status = true;
                        return client.say("#em1dio", `/me 🤝 O mercado esta aberto! Use !salario para receber seu salario.`);
                    }
                    else {
                        mercado.status = false;
                        mercado.salarios = [];
                        yield mongoClient.close();
                        return client.say("#em1dio", `/me 😐 O mercado esta fechado!`);
                    }
                    break;
                }
                case "!doacao": {
                    // !doacao [usuario] [quantidade]
                    let usuario = commands[1];
                    if (usuario[0] === "@") {
                        usuario = usuario.slice(1);
                    }
                    const quantidade = commands[2];
                    yield giveEM1(usuario.toLowerCase(), parseInt(quantidade));
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
            return client.say("#em1dio", `/me 😪 O mercado esta fechado! Que tal pedir para o Streamer abrir?`);
        }
        const { badges, "badge-info": badgeInfo } = context;
        const isSubscriber = (badges === null || badges === void 0 ? void 0 : badges.subscriber) || (badges === null || badges === void 0 ? void 0 : badges.founder) || context.subscriber;
        switch (command) {
            case "!salario": {
                yield em1coin(context.username, isSubscriber);
                break;
            }
            case "!carteira": {
                yield wallet(context.username);
                break;
            }
            case "!investir": {
                // !investir [valor] [cryptoCoin]
                const cryptoCoin = commands[1];
                const valor = commands[2];
                yield investir(context.username, valor, cryptoCoin);
                break;
            }
            case "!vender": {
                const cryptoCoin = commands[1];
                const valor = commands[2];
                yield vender(valor, context.username, cryptoCoin);
                break;
            }
            case "!ranking": {
                yield ranking(context.username);
                break;
            }
            case "!mercado": {
                if (!isBroadcaster) {
                    commandsMercado(listCommands);
                }
                break;
            }
            case "!moedas": {
                client.say("#em1dio", `/me 🤝 As moedas voce encontra la na Brapi ;) https://brapi.ga/api/v2/crypto/available `);
                break;
            }
            case "!pegar": {
                yield pegar(context.username);
                break;
            }
        }
    });
}
function event(randomNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        // get random coin in cryptocoins
        const cryptoCoins = yield getCryptoCoins();
        const randomCoin = cryptoCoins[random(0, cryptoCoins.length)];
        randomNumber = randomNumber || random(5, 10);
        const coinValue = yield getCoinValue(randomCoin);
        const value = randomNumber / coinValue;
        return { coin: randomCoin, value: value, quantity: randomNumber };
    });
}
function commandsMercado(listCommands) {
    return client.say("#em1dio", `/me 💰 Para usar o mercado EM1: ${listCommands.join("|")}.`);
}
function vender(valor, username, cryptoCoin) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = mongoClient.db("em1bot");
        const accountsCollection = db.collection("em1coinsimulator");
        const wallet = yield getWallet(username);
        const cryptoCoins = yield getCryptoCoins();
        if (!cryptoCoin) {
            return client.say("#em1dio", `/me 🤔 Você precisa informar a moeda que deseja vender. !moedas para conhecer as moedas validas.`);
        }
        const validCryptoCoin = cryptoCoins.find((x) => x == cryptoCoin);
        if (!validCryptoCoin) {
            return client.say("#em1dio", `/me 🤔 A moeda ${cryptoCoin} não existe. Use !moedas para conhecer as moedas validas.`);
        }
        const coins = wallet.coins.find((x) => x.symbol === validCryptoCoin);
        valor = !valor ? coins.quantity : valor;
        if (valor < 0 || !Number(valor)) {
            return client.say("#em1dio", `/me Use !vender [CryptoCoin] [QUANTIDADE (Valores Positivos), sem valor vender tudo ;)] `);
        }
        if (!wallet.coins || !coins || (coins === null || coins === void 0 ? void 0 : coins.quantity) < valor) {
            return client.say("#em1dio", `/me 🤝 Voce nao tem moedas para vender!`);
        }
        const cryptocoins = yield getCryptoCoin(cryptoCoin);
        const crypto = cryptocoins[0].regularMarketPrice;
        const total = valor * crypto;
        coins.quantity -= valor;
        wallet.coins[wallet.coins.indexOf(coins)] = coins;
        yield accountsCollection.updateOne({ _id: wallet._id }, { $inc: { em1coins: +total }, $set: { coins: wallet.coins } });
        const totalToShow = coins === null || coins === void 0 ? void 0 : coins.quantity;
        client.say("#em1dio", `/me 🤝 O valor vendido foi ${valor} em um total de: ${total.toFixed(2)}.` +
            ` Agora voce tem: ${totalToShow.toFixed(8)} de ${cryptoCoin} imaginarios`);
    });
}
function investir(username, valor, cryptoCoin) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = mongoClient.db("em1bot");
        const accountsCollection = db.collection("em1coinsimulator");
        const coins = yield getCryptoCoins();
        if (!cryptoCoin) {
            return client.say("#em1dio", `/me 🤔 Você precisa informar a moeda que deseja investir. !moedas para conhecer as moedas validas.`);
        }
        cryptoCoin = cryptoCoin.toUpperCase();
        const validCoin = coins.find((coin) => coin === cryptoCoin);
        if (!validCoin) {
            return client.say("#em1dio", `/me 🤔 A moeda ${validCoin} não existe. Use !moedas para conhecer as moedas validas.`);
        }
        if (!valor || !Number(valor) || valor <= 0) {
            return client.say("#em1dio", `/me 🤝 Use !investir [Cryptocoin] [QUANTIDADE (Valores Positivos)]`);
        }
        const wallet = yield getWallet(username);
        if (!wallet) {
            return giveEM1(username);
        }
        if (wallet.em1coins < valor) {
            return client.say("#em1dio", `/me Voce nao tem essa quantidade para investir`);
        }
        // update accounts.coins
        const transaction = {
            symbol: validCoin,
            quantity: valor,
            status: Status.Compra,
        };
        const totalToShow = yield giveCoin(username, transaction);
        client.say("#em1dio", `/me 🤝 O valor investido foi ${valor}.` +
            ` Agora voce tem: ${totalToShow.toFixed(8)} ${validCoin} imaginarios`);
    });
}
function giveCoin(username, transaction) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const db = mongoClient.db("em1bot");
        const accountsCollection = db.collection("em1coinsimulator");
        const wallet = yield getWallet(username);
        if (!wallet) {
            return giveEM1(username);
        }
        const cryptocoins = yield getCryptoCoin(transaction.symbol);
        const crypto = cryptocoins[0].regularMarketPrice;
        const total = transaction.quantity / crypto;
        const existCoins = (_a = wallet.coins) === null || _a === void 0 ? void 0 : _a.find((x) => x.symbol === transaction.symbol);
        if (existCoins) {
            existCoins.quantity += total;
            wallet.coins[wallet.coins.indexOf(existCoins)] = existCoins;
            const update = {
                $set: { coins: wallet.coins },
            };
            if (transaction.status === Status.Compra) {
                update["$inc"] = { em1coins: -transaction.quantity };
            }
            yield accountsCollection.updateOne({ username }, update);
        }
        else {
            const update = {
                $push: { coins: { symbol: transaction.symbol, quantity: total } },
            };
            if (transaction.status === Status.Compra) {
                update["$inc"] = { em1coins: -transaction.quantity };
            }
            yield accountsCollection.updateOne({ username }, update);
        }
        return (existCoins === null || existCoins === void 0 ? void 0 : existCoins.quantity) || total;
    });
}
function em1coin(username, isSubscriber) {
    return __awaiter(this, void 0, void 0, function* () {
        const jaExiste = countInArray(mercado.salarios, username);
        if (jaExiste === 0) {
            mercado.salarios.push(username);
            return yield giveEM1(username, 30);
        }
        if (isSubscriber && jaExiste < 2) {
            mercado.salarios.push(username);
            return yield giveEM1(username, 30);
        }
        client.say("#em1dio", `/me 🤝 Voce ja ganhou seu salario hoje!`);
    });
}
function wallet(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = yield getWallet(username);
        if (!wallet) {
            return giveEM1(username);
        }
        const coins = wallet.coins;
        if (coins.length === 0) {
            return client.say("#em1dio", `/me @${username} 🤝 Voce tem ${wallet.em1coins} EM1! 😎`);
        }
        let text = coins.reduce((acc, coin) => {
            if (coin.quantity > 0) {
                acc += `[${coin.symbol}]:${coin.quantity.toFixed(8)} `;
            }
            return acc;
        }, "");
        text = text === "" ? text : "e " + text;
        return client.say("#em1dio", `/me 🤝 @${username} Voce tem ${wallet.em1coins} EM1! 😎 ${text}`);
    });
}
function novaCarteira(username) {
    return client.say("#em1dio", `/me 🤝 @${username} Criei sua carteira da Em1 E ja te dei 100 EM1 ;) !`);
}
function giveEM1(username, valor) {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = yield getWallet(username);
        const db = mongoClient.db("em1bot");
        const accountsCollection = db.collection("em1coinsimulator");
        if (!wallet) {
            yield accountsCollection.insertOne({ username, em1coins: 100, coins: [] });
            return novaCarteira(username);
        }
        else {
            // update accounts with new value
            yield accountsCollection.updateOne({ _id: wallet._id }, { $inc: { em1coins: valor } });
        }
        const account = yield accountsCollection.findOne({ username });
        return client.say("#em1dio", `/me @${username} 🤝 Voce ganhou ${valor} EM1!, Seu saldo eh: ${account.em1coins.toFixed(2)}`);
    });
}
function getWallet(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = mongoClient.db("em1bot");
        const accountsCollection = db.collection("em1coinsimulator");
        return accountsCollection.findOne({ username });
    });
}
// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}
function getCryptoCoin(crypto, currency = "BRL") {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (Array.isArray(crypto)) {
                crypto = crypto.join(",");
            }
            const response = yield axios.get(`https://brapi.ga/api/v2/crypto?coin=${crypto}&currency=${currency}`);
            return response.data.coins;
        }
        catch (error) {
            console.error(error);
        }
    });
}
function getCryptoCoins() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios.get(`https://brapi.ga/api/v2/crypto/available`);
            return response.data.coins;
        }
        catch (error) {
            console.error(error);
        }
    });
}
function ranking(username) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const db = mongoClient.db("em1bot");
        const accountsCollection = db.collection("em1coinsimulator");
        const accounts = yield accountsCollection.find().toArray();
        let list = [];
        let i = 1;
        try {
            for (var accounts_1 = __asyncValues(accounts), accounts_1_1; accounts_1_1 = yield accounts_1.next(), !accounts_1_1.done;) {
                const account = accounts_1_1.value;
                const totalEm1 = yield getTotal(account.username);
                list.push({
                    name: account.username,
                    em1coins: totalEm1,
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (accounts_1_1 && !accounts_1_1.done && (_a = accounts_1.return)) yield _a.call(accounts_1);
            }
            finally { if (e_1) throw e_1.error; }
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
        return client.say("#em1dio", `Segue o nosso podio! ${top3.join("\n")}.` +
            `@${username} possui um total de ${usernameTotal.em1coins.toFixed(3)} EM1. Parabens! 💪💪💪`);
    });
}
function getTotal(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = yield getWallet(username);
        const coins = wallet.coins.map((coin) => coin.symbol);
        if (coins.length === 0) {
            return wallet.em1coins;
        }
        // sum to every coin in wallet
        const cryptocoins = yield getCryptoCoin(coins);
        const total = wallet.coins.reduce((acc, coin) => {
            var _a;
            return (acc +
                ((_a = cryptocoins.find((cryptocoin) => cryptocoin.coin === coin.symbol)) === null || _a === void 0 ? void 0 : _a.regularMarketPrice) *
                    coin.quantity);
        }, 0);
        return wallet.em1coins + total;
    });
}
function getCoinValue(coin) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const cryptocoins = yield getCryptoCoin(coin);
        return (_a = cryptocoins.find((cryptocoin) => cryptocoin.coin === coin)) === null || _a === void 0 ? void 0 : _a.regularMarketPrice;
    });
}
function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function pegar(username) {
    return __awaiter(this, void 0, void 0, function* () {
        // check if username is not inside momento.pegou
        const isInsidePegou = mercado.evento.pegou.includes(username);
        if (mercado.evento.status && !isInsidePegou) {
            mercado.evento.pegou.push(username);
            const transaction = {
                symbol: mercado.evento.coin,
                quantity: mercado.evento.quantity,
                status: Status.Doacao,
            };
            yield giveCoin(username, transaction);
            client.say("#em1dio", `/me @${username} 🤝 Voce ganhou [${mercado.evento.coin}]: ${mercado.evento.value.toFixed(5)}`);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5RkFBeUY7QUFDekYsK0ZBQStGO0FBQy9GLDBDQUEwQztBQUMxQyxnRUFBZ0U7QUFDaEUsNENBQTRDO0FBQzVDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUczQiw2QkFBOEI7QUFFOUIsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMzQyxNQUFNLFNBQVMsR0FBRztJQUNoQixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTO0lBQzFCLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWE7SUFDakMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYztJQUNwQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVO0NBQzdCLENBQUM7QUFDRixNQUFNLEdBQUcsR0FBRyxpQkFBaUIsU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsUUFBUSxJQUFJLFNBQVMsQ0FBQyxHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDckksTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLENBQUMsR0FBRyxFQUFFO0lBQ3ZDLGVBQWUsRUFBRSxJQUFJO0lBQ3JCLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM5QixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzNCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFFcEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQUMsZUFBZSxFQUFFLEdBQVMsRUFBRTtJQUNsRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDbEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLEVBQUUsQ0FBQztRQUM3QixNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUM7UUFDekMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQzNCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUM3QixPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDbkMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQzdCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQixNQUFNLENBQUMsR0FBRyxDQUNSLFNBQVMsRUFDVCw2REFBNkQsSUFBSSxLQUFLLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FDMUYsQ0FBQztRQUNGLFVBQVUsQ0FBQyxHQUFTLEVBQUU7WUFDcEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUMxQixNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWM7S0FDOUI7QUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBQ0gsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBRVosTUFBTSxPQUFPLEdBQUc7SUFDZCxNQUFNLEVBQUUsS0FBSztJQUNiLFFBQVEsRUFBRSxFQUFFO0lBQ1osTUFBTSxFQUFFO1FBQ04sSUFBSSxFQUFFLEVBQUU7UUFDUixLQUFLLEVBQUUsQ0FBQztRQUNSLFFBQVEsRUFBRSxDQUFDO1FBQ1gsTUFBTSxFQUFFLEtBQUs7UUFDYixLQUFLLEVBQUUsRUFBYztLQUN0QjtDQUNGLENBQUM7QUFFRixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQWMsRUFBRSxJQUFxQixFQUFFLEVBQUUsQ0FDN0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUV0QyxJQUFLLE1BSUo7QUFKRCxXQUFLLE1BQU07SUFDVCwyQkFBaUIsQ0FBQTtJQUNqQix5QkFBZSxDQUFBO0lBQ2YsMkJBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQUpJLE1BQU0sS0FBTixNQUFNLFFBSVY7QUFlRCxJQUFLLEtBR0o7QUFIRCxXQUFLLEtBQUs7SUFDUixvQkFBVyxDQUFBO0lBQ1gsb0JBQVcsQ0FBQTtBQUNiLENBQUMsRUFISSxLQUFLLEtBQUwsS0FBSyxRQUdUO0FBQ0QsTUFBTSxJQUFJLEdBQUc7SUFDWCxRQUFRLEVBQUU7UUFDUixRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRO1FBQzlCLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVE7S0FDL0I7SUFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7Q0FDckIsQ0FBQztBQUVGLG1DQUFtQztBQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFcEMsOENBQThDO0FBQzlDLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDdkMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUUzQyxxQkFBcUI7QUFDckIsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBRWpCLHVDQUF1QztBQUN2QyxTQUFlLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUk7OztRQUN4RCxJQUFJLElBQUksRUFBRTtZQUNSLE9BQU87U0FDUixDQUFDLCtCQUErQjtRQUNqQyxNQUFNLGFBQWEsR0FBRyxDQUFBLE1BQUEsT0FBTyxDQUFDLE1BQU0sMENBQUUsV0FBVyxLQUFJLEdBQUcsQ0FBQztRQUN6RCxzQ0FBc0M7UUFDdEMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQy9CLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLElBQUksYUFBYSxFQUFFO1lBQ2pCLFFBQVEsT0FBTyxFQUFFO2dCQUNmLEtBQUssUUFBUSxDQUFDLENBQUM7b0JBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDckIsTUFBTTtpQkFDUDtnQkFDRCxLQUFLLFVBQVUsQ0FBQyxDQUFDO29CQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO3dCQUNuQixNQUFNLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBQ3RCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FDZixTQUFTLEVBQ1Qsc0VBQXNFLENBQ3ZFLENBQUM7cUJBQ0g7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7d0JBQ3ZCLE9BQU8sQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO3dCQUV0QixNQUFNLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDMUIsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO3FCQUNoRTtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssU0FBUyxDQUFDLENBQUM7b0JBQ2QsaUNBQWlDO29CQUNqQyxJQUFJLE9BQU8sR0FBVyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTt3QkFDdEIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQzVCO29CQUVELE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDL0IsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUMzRCxNQUFNO2lCQUNQO2FBQ0Y7U0FDRjtRQUVELE1BQU0sWUFBWSxHQUFHO1lBQ25CLFVBQVU7WUFDVixTQUFTO1lBQ1QsVUFBVTtZQUNWLFdBQVc7WUFDWCxXQUFXO1lBQ1gsVUFBVTtZQUNWLFNBQVM7WUFDVCxRQUFRO1NBQ1QsQ0FBQztRQUNGLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUM5QyxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQ2YsU0FBUyxFQUNULHFFQUFxRSxDQUN0RSxDQUFDO1NBQ0g7UUFDRCxNQUFNLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFDcEQsTUFBTSxZQUFZLEdBQ2hCLENBQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLFVBQVUsTUFBSSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsT0FBTyxDQUFBLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUM5RCxRQUFRLE9BQU8sRUFBRTtZQUNmLEtBQUssVUFBVSxDQUFDLENBQUM7Z0JBQ2YsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDOUMsTUFBTTthQUNQO1lBQ0QsS0FBSyxXQUFXLENBQUMsQ0FBQztnQkFDaEIsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvQixNQUFNO2FBQ1A7WUFDRCxLQUFLLFdBQVcsQ0FBQyxDQUFDO2dCQUNoQixpQ0FBaUM7Z0JBQ2pDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDcEQsTUFBTTthQUNQO1lBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQztnQkFDZCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2xELE1BQU07YUFDUDtZQUVELEtBQUssVUFBVSxDQUFDLENBQUM7Z0JBQ2YsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNO2FBQ1A7WUFFRCxLQUFLLFVBQVUsQ0FBQyxDQUFDO2dCQUNmLElBQUksQ0FBQyxhQUFhLEVBQUU7b0JBQ2xCLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDL0I7Z0JBQ0QsTUFBTTthQUNQO1lBRUQsS0FBSyxTQUFTLENBQUMsQ0FBQztnQkFDZCxNQUFNLENBQUMsR0FBRyxDQUNSLFNBQVMsRUFDVCx5RkFBeUYsQ0FDMUYsQ0FBQztnQkFDRixNQUFNO2FBQ1A7WUFFRCxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUNiLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUIsTUFBTTthQUNQO1NBQ0Y7O0NBQ0Y7QUFFRCxTQUFlLEtBQUssQ0FBQyxZQUFxQjs7UUFDeEMsaUNBQWlDO1FBQ2pDLE1BQU0sV0FBVyxHQUFHLE1BQU0sY0FBYyxFQUFFLENBQUM7UUFDM0MsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFOUQsWUFBWSxHQUFHLFlBQVksSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sU0FBUyxHQUFHLE1BQU0sWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWpELE1BQU0sS0FBSyxHQUFHLFlBQVksR0FBRyxTQUFTLENBQUM7UUFFdkMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLENBQUM7SUFDcEUsQ0FBQztDQUFBO0FBRUQsU0FBUyxlQUFlLENBQUMsWUFBc0I7SUFDN0MsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUNmLFNBQVMsRUFDVCxtQ0FBbUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUM3RCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWUsTUFBTSxDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFLFVBQWtCOztRQUN2RSxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzdELE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXpDLE1BQU0sV0FBVyxHQUFHLE1BQU0sY0FBYyxFQUFFLENBQUM7UUFFM0MsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FDZixTQUFTLEVBQ1Qsa0dBQWtHLENBQ25HLENBQUM7U0FDSDtRQUVELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3BCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FDZixTQUFTLEVBQ1Qsa0JBQWtCLFVBQVUsMkRBQTJELENBQ3hGLENBQUM7U0FDSDtRQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLGVBQWUsQ0FBQyxDQUFDO1FBQ3JFLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ3hDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMvQixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQ2YsU0FBUyxFQUNULDBGQUEwRixDQUMzRixDQUFDO1NBQ0g7UUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxRQUFRLElBQUcsS0FBSyxFQUFFO1lBQ3RELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUseUNBQXlDLENBQUMsQ0FBQztTQUN6RTtRQUVELE1BQU0sV0FBVyxHQUFHLE1BQU0sYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQztRQUNqRCxNQUFNLEtBQUssR0FBRyxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBRTdCLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7UUFFbEQsTUFBTSxrQkFBa0IsQ0FBQyxTQUFTLENBQ2hDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFDbkIsRUFBRSxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQzlELENBQUM7UUFFRixNQUFNLFdBQVcsR0FBRyxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsUUFBUSxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxHQUFHLENBQ1IsU0FBUyxFQUNULDhCQUE4QixLQUFLLG9CQUFvQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHO1lBQ3hFLG9CQUFvQixXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLFVBQVUsY0FBYyxDQUM1RSxDQUFDO0lBQ0osQ0FBQztDQUFBO0FBRUQsU0FBZSxRQUFRLENBQUMsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsVUFBa0I7O1FBQ3pFLE1BQU0sRUFBRSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDN0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxjQUFjLEVBQUUsQ0FBQztRQUVyQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2YsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUNmLFNBQVMsRUFDVCxvR0FBb0csQ0FDckcsQ0FBQztTQUNIO1FBQ0QsVUFBVSxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN0QyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUM7UUFDNUQsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FDZixTQUFTLEVBQ1Qsa0JBQWtCLFNBQVMsMkRBQTJELENBQ3ZGLENBQUM7U0FDSDtRQUNELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtZQUMxQyxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQ2YsU0FBUyxFQUNULG9FQUFvRSxDQUNyRSxDQUFDO1NBQ0g7UUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV6QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDMUI7UUFFRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxFQUFFO1lBQzNCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FDZixTQUFTLEVBQ1QsZ0RBQWdELENBQ2pELENBQUM7U0FDSDtRQUVELHdCQUF3QjtRQUN4QixNQUFNLFdBQVcsR0FBVTtZQUN6QixNQUFNLEVBQUUsU0FBUztZQUNqQixRQUFRLEVBQUUsS0FBSztZQUNmLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtTQUN0QixDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsTUFBTSxRQUFRLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFELE1BQU0sQ0FBQyxHQUFHLENBQ1IsU0FBUyxFQUNULGdDQUFnQyxLQUFLLEdBQUc7WUFDdEMsb0JBQW9CLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxjQUFjLENBQ3hFLENBQUM7SUFDSixDQUFDO0NBQUE7QUFFRCxTQUFlLFFBQVEsQ0FBQyxRQUFnQixFQUFFLFdBQWtCOzs7UUFDMUQsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwQyxNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUU3RCxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV6QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDMUI7UUFFRCxNQUFNLFdBQVcsR0FBRyxNQUFNLGFBQWEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDO1FBQ2pELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO1FBRTVDLE1BQU0sVUFBVSxHQUFHLE1BQUEsTUFBTSxDQUFDLEtBQUssMENBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5RSxJQUFJLFVBQVUsRUFBRTtZQUNkLFVBQVUsQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUM7WUFFNUQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUU7YUFDOUIsQ0FBQztZQUVGLElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUN4QyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDdEQ7WUFFRCxNQUFNLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzFEO2FBQU07WUFDTCxNQUFNLE1BQU0sR0FBRztnQkFDYixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7YUFDbEUsQ0FBQztZQUVGLElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUN4QyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDdEQ7WUFDRCxNQUFNLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzFEO1FBRUQsT0FBTyxDQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxRQUFRLEtBQUksS0FBSyxDQUFDOztDQUN0QztBQUVELFNBQWUsT0FBTyxDQUFDLFFBQWdCLEVBQUUsWUFBcUI7O1FBQzVELE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRTFELElBQUksUUFBUSxLQUFLLENBQUMsRUFBRTtZQUNsQixPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxPQUFPLE1BQU0sT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNwQztRQUVELElBQUksWUFBWSxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUU7WUFDaEMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsT0FBTyxNQUFNLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDcEM7UUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7Q0FBQTtBQUVELFNBQWUsTUFBTSxDQUFDLFFBQWdCOztRQUNwQyxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDMUI7UUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzNCLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDdEIsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUNmLFNBQVMsRUFDVCxRQUFRLFFBQVEsZ0JBQWdCLE1BQU0sQ0FBQyxRQUFRLFVBQVUsQ0FDMUQsQ0FBQztTQUNIO1FBRUQsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNwQyxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFO2dCQUNyQixHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7YUFDeEQ7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVQLElBQUksR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFeEMsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUNmLFNBQVMsRUFDVCxXQUFXLFFBQVEsYUFBYSxNQUFNLENBQUMsUUFBUSxZQUFZLElBQUksRUFBRSxDQUNsRSxDQUFDO0lBQ0osQ0FBQztDQUFBO0FBRUQsU0FBUyxZQUFZLENBQUMsUUFBZ0I7SUFDcEMsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUNmLFNBQVMsRUFDVCxXQUFXLFFBQVEscURBQXFELENBQ3pFLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZSxPQUFPLENBQUMsUUFBZ0IsRUFBRSxLQUFjOztRQUNyRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QyxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxNQUFNLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQy9CO2FBQU07WUFDTCxpQ0FBaUM7WUFDakMsTUFBTSxrQkFBa0IsQ0FBQyxTQUFTLENBQ2hDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFDbkIsRUFBRSxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FDOUIsQ0FBQztTQUNIO1FBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FDZixTQUFTLEVBQ1QsUUFBUSxRQUFRLG1CQUFtQixLQUFLLHdCQUF3QixPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FDdEYsQ0FBQyxDQUNGLEVBQUUsQ0FDSixDQUFDO0lBQ0osQ0FBQztDQUFBO0FBRUQsU0FBZSxTQUFTLENBQUMsUUFBZ0I7O1FBQ3ZDLE1BQU0sRUFBRSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDN0QsT0FBTyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FBQTtBQUVELG9EQUFvRDtBQUNwRCxTQUFTLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJO0lBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFFRCxTQUFlLGFBQWEsQ0FDMUIsTUFBeUIsRUFDekIsV0FBbUIsS0FBSzs7UUFFeEIsSUFBSTtZQUNGLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDekIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDM0I7WUFDRCxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQzlCLHVDQUF1QyxNQUFNLGFBQWEsUUFBUSxFQUFFLENBQ3JFLENBQUM7WUFDRixPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQzVCO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBZSxjQUFjOztRQUMzQixJQUFJO1lBQ0YsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUM5QiwwQ0FBMEMsQ0FDM0MsQ0FBQztZQUNGLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDNUI7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDdEI7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFlLE9BQU8sQ0FBQyxRQUFnQjs7O1FBQ3JDLE1BQU0sRUFBRSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDN0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzRCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7O1lBQ1YsS0FBNEIsSUFBQSxhQUFBLGNBQUEsUUFBUSxDQUFBLGNBQUE7Z0JBQXpCLE1BQU0sT0FBTyxxQkFBQSxDQUFBO2dCQUN0QixNQUFNLFFBQVEsR0FBRyxNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ1IsSUFBSSxFQUFFLE9BQU8sQ0FBQyxRQUFRO29CQUN0QixRQUFRLEVBQUUsUUFBUTtpQkFDbkIsQ0FBQyxDQUFDO2FBQ0o7Ozs7Ozs7OztRQUVELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDNUQsd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDakIsT0FBTyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUNmLFNBQVMsRUFDVCx3QkFBd0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRztZQUN4QyxJQUFJLFFBQVEsdUJBQXVCLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUMvRCxDQUFDLENBQ0Ysd0JBQXdCLENBQzVCLENBQUM7O0NBQ0g7QUFFRCxTQUFlLFFBQVEsQ0FBQyxRQUFnQjs7UUFDdEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0RCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3RCLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUN4QjtRQUNELDhCQUE4QjtRQUM5QixNQUFNLFdBQVcsR0FBRyxNQUFNLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUvQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTs7WUFDOUMsT0FBTyxDQUNMLEdBQUc7Z0JBQ0gsQ0FBQSxNQUFBLFdBQVcsQ0FBQyxJQUFJLENBQ2QsQ0FBQyxVQUE0QixFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQ2xFLDBDQUFFLGtCQUFrQjtvQkFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FDaEIsQ0FBQztRQUNKLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVOLE9BQU8sTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDakMsQ0FBQztDQUFBO0FBQ0QsU0FBZSxZQUFZLENBQUMsSUFBWTs7O1FBQ3RDLE1BQU0sV0FBVyxHQUFHLE1BQU0sYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLE9BQU8sTUFBQSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQywwQ0FDN0Qsa0JBQWtCLENBQUM7O0NBQ3hCO0FBRUQsU0FBUyxNQUFNLENBQUMsR0FBVyxFQUFFLEdBQVc7SUFDdEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUN2RCxDQUFDO0FBRUQsU0FBZSxLQUFLLENBQUMsUUFBZ0I7O1FBQ25DLGdEQUFnRDtRQUNoRCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFOUQsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUMzQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxXQUFXLEdBQVU7Z0JBQ3pCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUk7Z0JBQzNCLFFBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVE7Z0JBQ2pDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTthQUN0QixDQUFDO1lBQ0YsTUFBTSxRQUFRLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxHQUFHLENBQ1IsU0FBUyxFQUNULFFBQVEsUUFBUSxvQkFBb0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQy9GLENBQUM7U0FDSDtJQUNILENBQUM7Q0FBQSJ9