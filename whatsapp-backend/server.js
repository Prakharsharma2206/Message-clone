//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher"; //just npm i pusher for backend
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1205312",
  key: "caada80569cc57f988bb",
  secret: "7a26829c683a0f2c494b",
  cluster: "ap2",
  useTLS: true,
});

//middleware
app.use(express.json());

app.use(cors());
// app.use(cors()); can be replaced by the following code can try it out
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   next();
// });

//Db config  admin "5feVH5gtORoMZZIU"
const connection_url =
  "mongodb+srv://admin:5feVH5gtORoMZZIU@cluster0.l9nle.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("Db Connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A change here", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;

      pusher.trigger("message", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received : messageDetails.received
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

//????

//api routes
app.get("/", (req, res) => res.status(200).send("Hello World"));

// gives back all the data in the database
app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//posts the data into the database
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
