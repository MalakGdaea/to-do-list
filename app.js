// requiring our packeges
const express = require("express");
const bosyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

mongoose.set("strictQuery", false);
mongoose.connect(process.env.CONNECTION_LINK_DB, { useNewUrlParser: true }).then(() => console.log("Database connected")).catch((err) => console.log(err));
const Schema = mongoose.Schema;

const app = express();
app.use(bosyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

const ItemSchema = new Schema({
  name: String,
});

const ListSchema = new Schema({
  name: String,
  items: [ItemSchema],
});

const Item = mongoose.model("item", ItemSchema);
const List = mongoose.model("list", ListSchema);

let item1 = new Item({
  name: "Welcome to your to-do list.",
});
let item2 = new Item({
  name: "Hit + to add an item.",
});

let item3 = new Item({
  name: "<-- Hit this to remove an item.",
});

const defaultItems = [item1, item2, item3];

// what the server will show when the user requist our website
app.get("/", async function (req, res) {
  try {
    let items = await Item.find({});
    if (items.length == 0) {
      Item.insertMany(defaultItems).then(() => {
        console.log({ msg: `successfully saved the default items in DB` });
        res.redirect("/");
      });
    } else {
      res.render("list", { listTitle: "Today", newItems: items });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/:customListname", (req, res) => {
  let listName = _.capitalize(req.params.customListname);
  try {
    List.findOne({ name: listName }).then((list) => {
      if (list) {
        res.render("list", { listTitle: list.name, newItems: list.items });
      } else {
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect(`/${listName}`);
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.post("/", (req, res) => {
  let itemName = req.body.newItem;
  const listName = req.body.list;
  let item = new Item({
    name: itemName,
  });
  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", function (req, res) {
  const idOfItemToRemove = req.body.checkbox;
  const listName = req.body.listName;
  try {
    if (listName == "Today") {
      Item.findByIdAndRemove(idOfItemToRemove).then(() => {
        res.redirect("/");
      });
    } else {
      List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: idOfItemToRemove } } }
      ).then(() => {
        res.redirect(`/${listName}`);
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(3000, () => {
  console.log("The server is listening to the port 3000");
});
