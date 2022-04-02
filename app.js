//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-ryan:test123@cluster0.auylj.mongodb.net/todoList", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", function () {
    console.log("Connection Successful!");
});

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "No name specified"]
    }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your to-do list."
});
const item2 = new Item({
    name: "Hit '+' to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find({}, (err, foundItems) => {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err) => {

                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to database.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    });
});

app.get("/:customListName", function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });
});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {

            if (!err) {
                console.log("Successfully removed item with id: " + checkedItemId);
            }
            res.redirect("/");
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.get("/work", function (req, res) {
    res.render("list", {
        listTitle: "Work List",
        newListItems: workItems
    });
});

app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT;
//if (port == null || port == "") {
//    port = 3000;
//}

app.listen(port || 3000, function() {
  console.log("Server has started Successfully on dynamic port ");
});
