//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session")
const passport =  require("passport")
const passportLocalMongoose =  require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook');
const findOrCreate = require('mongoose-findorcreate')
const LocalStorage = require('node-localstorage').LocalStorage;

localStorage = new LocalStorage('./scratch');

const expressLayouts = require("express-ejs-layouts")
const flash = require("connect-flash");
const { intersection, entries } = require('lodash');
const { string } = require('joi');


const path = require('path');


const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(flash());

// image uploads 
const fs = require("fs");
const  multer = require("multer");
const { listeners } = require('process');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, "uploads")
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname)
      // cb(null, new Date().toISOString() + file.originalname)
  }
});
var upload = multer({ storage: storage });


// Get currentYear 
const currentYear = new Date().getFullYear(); 
// current Month 
const months = ["January","February","March","April","May","June",
"July","August","September","October","November","December"];
let month = months[new Date().getMonth()];
// Current Day
day = new Date().getDate();

fullDate = month + " " + day + ", " + currentYear


app.use(session({
  secret: "Our little secret.",
  resave:false,
  uninitialized: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://excel:excel2000@cluster0.nmntn.mongodb.net/blogDB");
// mongoose.connect("mongodb://localhost:27017/blogDB");

let url = "/";
let delUrl = "/";
let auth = false;
let noPost = true;
let createdProfile = false;

// Filter Functionality
let filter = "";
let all = true;

let filterAll = "section-li-active";
let filterNews = "";
let filterSports = "";
let filterEntertainment = "";
let filterTech = "";
let filterFashion = "";
let filterBranding = "";  

// Check if current user has this post 
let myPost = false;

// Delete Post 
let postId = "";

// Edit Post
let editPost = false;
let  editPostPost = "";
let  editPostName = "";
let  editPostImage = "";
let  editPostType = "";

// for create/edit profile // 
let stat = "Create";
let statButton = "Submit";

// --------- AUTHENTICATION ---------- //

const userSchema = new mongoose.Schema ({
  accountName: String,
  firstName: String,
  lastName: String,
  aboutUser: String,
  bloggerStatus: String,
  phoneNumber: Number,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// -----  Targeting LogOut Route  ------ //

app.get("/logout", function(req, res){
  url = "/"
  auth = false;
  editPost = false;
  req.logout();
  noPost = true;
  createdProfile = false;
  res.redirect("/");
});

// -----  Targeting Register Route  ------ //

app.get("/register", function(req, res){
  editPost = false;
  res.render("register", {currentYear:currentYear, auth:auth, createdProfile:createdProfile,
    message : req.flash("message"), message2 : req.flash("message2")})
})

app.post("/register", function(req, res){

  // Check if email exists 
  User.findOne({username: req.body.username}, function(err, user){
    if (user){
      req.flash("message", user.username + " already exists, Please login");
      res.redirect("/register")
    }
    // Check if username exists 
    User.findOne({accountName: req.body.accountName}, (err, user)=> {
      if (user){
        req.flash("message2", "Username '" + user.accountName + "' already exists, Please choose another");
        res.redirect("/register")
      } else {
        // Creating User Profile
        Users = new User({
          accountName: req.body.accountName,
          username : req.body.username
        });
        // Register User
        User.register(Users, req.body.password, function(err, user) {
          if (err) {
            console.log(err)
            console.log("RegErr")
            res.redirect("/register");
          } else {
            passport.authenticate("local")(req, res, function(){
              auth = true;       
              // for create/edit profile //      
              if (req.user.firstName === undefined){              
                stat = "Create";
                statButton = "Submit";
                createdProfile = false;
              } else {
                stat = "Edit";
                statButton = "Save";
                createdProfile = true;
              }
              res.redirect(url);  
            });
          }
        });       
      }
    })    
  })  
});

// -----  Targeting Login Route  ------ //

app.get("/login", function(req, res){
  editPost = false;
  res.render("login", {currentYear:currentYear, auth:auth, createdProfile:createdProfile,  message : req.flash("message")})
})

app.post("/login", function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
      console.log("loginErr")
    }
    // Generate a JSON response reflecting authentication status
    if (!user) {
      req.flash("message", "Invalid Username or Password");
      return res.redirect("/login")
    }
    req.login(user, loginErr => {
      if (loginErr) {
        return next(loginErr);
      }
      auth = true;
      // for create/edit profile //      
      if (req.user.firstName === undefined){              
        stat = "Create";
        statButton = "Submit";
        createdProfile = false;
      } else {
        stat = "Edit";
        statButton = "Save";
        createdProfile = true;
      }
      return res.redirect(url)
      
    });      
  })(req, res, next);
});

// Creating Post Schema
postSchema = new mongoose.Schema ({
  name:String,
  post: String,
  userId: String,
  image: String,
  postType: String,
  postDate: String
})
// Creating Post Model
const Post = mongoose.model("post", postSchema)


// make admin page (Authorization)
// Add option to put user profile pic and user dashboard image from myProfile page only
// edit navbar css 
// edit about us and contact us css
// Know what to do with services page in footer


// -------------   Main Page    --------------- //

app.get("/", function(req, res){
  editPost = false;
  function clearFilter(){    
    filterAll = "";
    filterNews = "";
    filterSports = "";
    filterEntertainment = "";
    filterTech = "";
    filterFashion = "";
    filterBranding = "";
  }  
  Post.find(function(err, posts){
    if (!err){
      // Features Section 
      let featuresPage = [];
      function pushFeatures(){
        for(let i = 0; i < 6; i++){
          // Note, i + 1 is to remove undefined in featuresPost which comes at the end
          featuresPage.push((posts[posts.length - (i + 1)])) 
        }        
      }
      pushFeatures(); 
      // Filter Functionality
      if ( all === true){
        Post.find( (err, post) => {
          if (!err){
            // Render page  
            res.render("home", {posts: post, auth:auth, filterAll:filterAll, filterTech:filterTech,
              filterNews:filterNews, filterSports:filterSports, filterEntertainment:filterEntertainment,
              filterFashion:filterFashion, filterBranding:filterBranding, featuresPage:featuresPage,
              currentYear:currentYear, createdProfile:createdProfile}) 
              clearFilter();  
          }
        })
      } else {
        Post.find({postType:filter}, (err, post) => {
          if (!err){
            // Render page  
            res.render("home", {posts: post, auth:auth, filterAll:filterAll, filterTech:filterTech,
              filterNews:filterNews, filterSports:filterSports, filterEntertainment:filterEntertainment,
              filterFashion:filterFashion, filterBranding:filterBranding, featuresPage:featuresPage,
              currentYear:currentYear, createdProfile:createdProfile})  
              clearFilter();
          }
        })
      }      
    }
  })
});

// Filter Functionality
app.get("/filter/:topic", function(req, res){
  filtr = req.params.topic.toUpperCase() 
  if (req.params.topic === "all"){
    all = true;
    res.redirect("/#section")
  } else {      
    filter = filtr
    all = false;
    res.redirect("/#section")    
  } 
  // Filter Switch Active    
  switch (filtr) { 
    case "ALL":
      filterAll = "section-li-active";
      break;
    case "NEWS":
      filterNews = "section-li-active";
      break;
    case "SPORTS":
      filterSports = "section-li-active";
      break;
    case "ENTERTAINMENT":
      filterEntertainment = "section-li-active";
      break;
    case "TECH":
      filterTech = "section-li-active";
      break;
    case "FASHION":
      filterFashion = "section-li-active";
      break;
    case "BRANDING":
      filterBranding = "section-li-active";
      break;
    default:
      console.log("Invalid option");   
  }
});

app.post("/", upload.single("image"), function(req, res){  
  const newText = req.body.newText
  const bigText = req.body.bigText 
  let userId = req.user.id
  const image = req.file.path
  const postType = req.body.postType

  function postUpdate(){
    Post.updateMany({_id: postId},{'$set':{name: newText, post: bigText, image: image, postType: postType}}, (err, post) =>{
      if (err){
        console.log(err)
      }
      // else {
      //   console.log("Updated Successfully")
      // }
    })
    res.redirect("/")
  }

  // If user is editing post
  if (editPost === true){
    // Check if post name already exists 
    Post.find({name:newText}, (err, post) =>{
      if (err){
        console.log(err)
      } else {
        // Check if edit is the same name
        if (post.length > 0){
          if (post[0].name === newText){
            postUpdate()
          } 
        } else {
          console.log(post)
          // check if new edit name already exists
          if (post.length > 0){
            req.flash("message", "Post name already exists");
            return res.redirect("/compose")
          } else {
            postUpdate()
          }
        }        
      }
    }) 
  } else {
    // if user is creating new post
    // Check if post name already exists 
    Post.find({name:newText}, (err, post) =>{
      if (err){
        console.log(err)
      } else {
        // If post title already exists
        if (post.length > 0){
          req.flash("message", "Post name already exists");
          return res.redirect("/compose")
        } else {
          // Create post
          const post = new Post ({
            name: newText,
            post: bigText,
            userId: userId,  
            image: image,
            postType: postType,
            postDate: fullDate
          })
          post.save()
          res.redirect("/");
        }
      }
    }) 
  }  
});

app.get("/about", function(req, res){
  editPost = false;
  res.render("about", {mainText: aboutContent, auth:auth, currentYear:currentYear, createdProfile:createdProfile})
});

app.get("/contact", function(req, res){
  editPost = false;
  res.render("contact", {mainText: contactContent, auth:auth, currentYear:currentYear, createdProfile:createdProfile})
});

app.get("/compose", function(req, res){
  if (req.isAuthenticated()){

    function editFunction (){
      url = "/"
      res.render("compose", {currentYear:currentYear, editPostPost:editPostPost, editPostName:editPostName,
        editPostImage:editPostImage, editPostType:editPostType, auth:auth, createdProfile:createdProfile,
        message : req.flash("message")})
    }
    if (editPost === false){
      editPostPost = "";
      editPostName = "";
      editPostImage = "";
      editPostType = "";
      editFunction();      
    } else {
      editFunction();       
    }    
  } else {
    url = "/compose"
    res.redirect("/login")
  }  
});

app.get("/profile", function(req, res){
  editPost = false;
  if (req.isAuthenticated()){
    url = "/"
    User.find({_id:req.user.id}, (err, user) => {
      if (err){
        console.log(err)
      } else {
        let firstNameEdit = req.user.firstName;
        let lastNameEdit = req.user.lastName;
        let aboutEdit = req.user.aboutUser;
        let phoneNoEdit = req.user.phoneNumber;
        let bloggerStatusEdit = req.user.bloggerStatus;
        res.render("profile", {currentYear:currentYear, auth:auth, stat:stat, createdProfile:createdProfile,
          statButton:statButton, accountName:user[0].accountName, username:user[0].username, firstNameEdit:firstNameEdit,
          lastNameEdit:lastNameEdit, aboutEdit:aboutEdit, phoneNoEdit:phoneNoEdit, bloggerStatusEdit:bloggerStatusEdit,
          message : req.flash("message")})        
      }
    })    
  } else {
    url = "/profile"
    res.redirect("/login")
  }  
});
app.post("/profile", (req, res) => {
  User.updateMany({_id: req.user.id}, {'$set':{firstName: req.body.firstName, lastName:req.body.lastName,
    aboutUser:req.body.aboutP, bloggerStatus:req.body.bloggerStatus, phoneNumber:req.body.phoneNumber}}, function (err, user){
    if (err){
      console.log(err)
    }
    createdProfile = true
    res.redirect("/myProfile");
  })     
})

app.get("/myProfile", function(req, res){
  editPost = false;
  if (req.isAuthenticated()){
    Post.find({userId: req.user.id}, function (err, user){
      if(err){
        console.log(err)
      } 
      if (user) {
        userPosts = (user)
        url = "/";
        if (userPosts.length != 0){
          noPost = false;
        }
        // Checking if user has created profile 
        if (createdProfile === false){
          res.redirect("/profile")
        } else {
          User.find({_id:req.user.id}, (err, user) => {
            if (err){
              console.log(err)
            } else {
              let firstNameEdit = req.user.firstName;
              let lastNameEdit = req.user.lastName;
              let aboutEdit = req.user.aboutUser;
              let phoneNoEdit = req.user.phoneNumber;
              let bloggerStatusEdit = req.user.bloggerStatus;
              // res.render("myProfile", {currentYear:currentYear, auth:auth, })
              res.render("myProfile", {currentYear:currentYear, auth:auth, userPosts:userPosts, noPost:noPost,
                createdProfile:createdProfile, accountName:user[0].accountName, username:user[0].username,
                firstNameEdit:firstNameEdit, lastNameEdit:lastNameEdit, aboutEdit:aboutEdit, phoneNoEdit:phoneNoEdit,
                bloggerStatusEdit:bloggerStatusEdit})        
            }
          }) 
        }        
      }
    })   
  } else {
    url = "/myProfile"
    res.redirect("/login")
  }  
});

app.get("/myPosts", function(req, res){
  editPost = false;
  if (req.isAuthenticated()){
   
    Post.find({userId: req.user.id}, function (err, user){
      if(err){
        console.log(err)
      } 
      if (user) {
        userPosts = (user)
        url = "/";
        if (userPosts.length != 0){
          noPost = false;
        }   
        // Checking if user has created profile 
        if (createdProfile === false){
          res.redirect("/profile")
        } else {
          User.find({_id:req.user.id}, (err, user) => {
            if (err){
              console.log(err)
            } else {
              let firstNameEdit = req.user.firstName;
              let lastNameEdit = req.user.lastName;
              let aboutEdit = req.user.aboutUser;
              let phoneNoEdit = req.user.phoneNumber;
              let bloggerStatusEdit = req.user.bloggerStatus;
              // res.render("myProfile", {currentYear:currentYear, auth:auth, })
              res.render("myPosts", {currentYear:currentYear, auth:auth, userPosts:userPosts, noPost:noPost,
                createdProfile:createdProfile, accountName:user[0].accountName, username:user[0].username,
                firstNameEdit:firstNameEdit, lastNameEdit:lastNameEdit, aboutEdit:aboutEdit, phoneNoEdit:phoneNoEdit,
                bloggerStatusEdit:bloggerStatusEdit})        
            }
          }) 
        }         
      }
    })    
  } else {
    url = "/myPosts"
    res.redirect("/login")
  }  
});

app.get("/edit", (req, res) => {
  editPost = true;
  res.redirect("/compose")
})

app.get("/posts/:topic", function(req, res){
let parameter = _.kebabCase(req.params.topic)
  delUrl = parameter
  Post.find(function(err, postName){
    postName = postName
    if (!err){
      console.log(postId)
      for (let post of postName){ 
        const postTitle = _.kebabCase(post.name)       
        if (parameter === postTitle){
          
          // Checking if current user is Authenticated 
          if (req.isAuthenticated()){
            // Checking if current viewer posted this post 
            if (post.userId === req.user.id){
              myPost = true;
            } else {
              myPost = false;
            }
          }
          editPost = false;
          postId = post.id
          editPostPost = post.post
          editPostName = post.name
          editPostImage = post.image
          editPostType = post.postType
          let delUrl = parameter
          res.render("posts", {title :post.name, myPost:myPost, postType:post.postType, postDate:post.postDate, image:post.image, Posts:postName, bigText:post.post, auth:auth, currentYear:currentYear, createdProfile:createdProfile} )                             
        }
      }
    } else {
      console.log(err)
    }
  })
});

app.get("/delete", (req, res)=>{
  if (req.isAuthenticated()){
    Post.find({_id: postId}, (err, post) =>{
      if (err){
        console.log(err)
      } else {
        // Check if current user posted this post 
        if (post[0].userId === req.user.id){
          Post.deleteOne({_id: postId}, (err, post)=>{
            if (err){
              console.log(err)
            } else {
              console.log("Deleted")              
              postId = "";
              res.redirect(url)
            }
          })
        } else {
          res.redirect("/")
        }
      }
    })    
  } else {
    url = "/posts/" + delUrl
    res.redirect("/login")
  }    
})


app.listen(process.env.PORT || 3000, function() {
  console.log("Server running on port 3000");
});
