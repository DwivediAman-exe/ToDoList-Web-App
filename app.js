//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true,  useUnifiedTopology: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your Todolist."
});
const item2 = new Item ({
  name: "Write the item then press + button to add it in your list."
});
const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const ListSchema ={
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", ListSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err,foundItems){

    if(foundItems.length==0) {
      Item.insertMany(defaultItems, function(err) {
        if(err)
          console.log(err);
        else
          console.log("Default Item inserted successfully");
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });

});

app.get("/:customList", function(req,res){

  const customListName = _.capitalize(req.params.customList);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err) {
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName );
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req,res){

  const checkeditemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkeditemId, function(err){
      if(!err) {
        console.log("successfully deleted checked item")
        res.redirect("/");
      }
    });
  } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkeditemId}}}, function(err, foundList){
        if(!err) {
          res.redirect("/" + listName);
        }
      });
  }

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
