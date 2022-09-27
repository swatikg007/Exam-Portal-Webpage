const express = require('express');
const routes = express.Router();
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs');
const user = require('./models.js');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
require('dotenv').config();
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
//app.use(express.static("public"));


// using Bodyparser for getting form data
routes.use(bodyparser.urlencoded({
  extended: true
}));
// using cookie-parser and session
routes.use(cookieParser('secret'));
routes.use(session({
  secret: 'secret',
  maxAge: 3600000,
  resave: true,
  saveUninitialized: true,
}));
// using passport for authentications
routes.use(passport.initialize());
routes.use(passport.session());
// using flash for flash messages
routes.use(flash());


var options = {
    auth: {
        api_key: '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'
    }
}

var mailer = nodemailer.createTransport(sgTransport(options));

// MIDDLEWARES
// Global variable
routes.use(function(req, res, next) {
  res.locals.success_message = req.flash('success_message');
  res.locals.error_message = req.flash('error_message');
  res.locals.error = req.flash('error');
  next();
});

const checkAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
    return next();
  } else {
    res.redirect('/login');
  }
}

// Connecting To Database
// using Mongo Atlas as database
const db_link="mongodb+srv://dkcs:"+process.env.DB_PASSWORD+"@cluster0-uzjw5.mongodb.net/students";
mongoose.connect(db_link, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Database Connected"));




// ALL THE ROUTES
routes.get('/', (req, res) => {
  res.render('index');
})

routes.post('/register', (req, res) => {
  var testTaken = 0;
  var highestScore = 0;
  var lowestScore = 0;
  var email=req.body.email;
  var username=req.body.username;
  var password=req.body.password;
  var confirmpassword=req.body.confirmpassword;
  var collegeName=req.body.collegeName;
  var phoneNumber=req.body.phnNumber;
  var name=req.body.name;
  var admin=0;
  var dateOfBirth;
  //console.log(req.body);

  var err;
  if (!email || !username || !password || !confirmpassword) {
    err = "Please Fill All The Fields...";
    res.render('index', {
      'err': err
    });
  }
  if (password != confirmpassword) {
    err = "Passwords Don't Match";
    res.render('index', {
      'err': err,
      'email': email,
      'username': username,
    });
  }
  if (typeof err == 'undefined') {
    user.findOne({
      email: email
    }, function(err, data) {
      if (err) throw err;
      if (data) {
        console.log("User Exists");
        err = "User Already Exists With This Email...";
        res.render('index', {
          'err': err,
          'email': email,
          'username': username
        });
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;
            password = hash;
            user({
              email,
              username,
              password,
              name,
              phoneNumber,
              collegeName,
              admin,
              dateOfBirth,
              testTaken,
              highestScore,
              lowestScore
            }).save((err, data) => {
              if (err) throw err;
              req.flash('success_message', "Registered Successfully.. Login To Continue..");
              res.redirect('/login');
            });
          });
        });
      }
    });
  }
});


// Authentication Strategy
// ---------------
var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({
  usernameField: 'email'
}, (email, password, done) => {
  user.findOne({
    email: email
  }, (err, data) => {
    if (err) throw err;
    if (!data) {
      return done(null, false, {
        message: "User Doesn't Exists.."
      });
    }
    bcrypt.compare(password, data.password, (err, match) => {
      if (err) {
        return done(null, false);
      }
      if (!match) {
        return done(null, false, {
          message: "Password Doesn't Match"
        });
      }
      if (match) {
        return done(null, data);
      }
    });
  });
}));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  user.findById(id, function(err, user) {
    cb(err, user);
  });
});
// ---------------
// end of autentication statregy

routes.get('/login', (req, res) => {
  res.render('login2');
});

routes.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/success',
    failureFlash: true,
  })(req, res, next);
});

routes.get('/success', checkAuthenticated, (req, res) => {
  ques.distinct('subject', function(err, arr) {
    if (err) {
      console.log(err);
    } else {
    //  console.log(arr);
      res.render('success', {
        'user': req.user,
        'arr': arr
      });
    }
  });

});

routes.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

routes.get('/examcenter', checkAuthenticated, (req, res) => {
  res.render('examcenter', {
    'user': req.user
  });
});


routes.get('/upload', checkAuthenticated, (req, res) => {

  console.log(req.user.admin);
  if (req.user.admin == 1) {
    ques.distinct('subject', function(err, arr) {
      if (err) {
        console.log(err);
      } else {
        res.render('upload', {
          'user': req.user,
          'arr': arr
        });
      }
    });
  } else
    res.render('forbidden', {
      'user': req.user
    });
});




var questionSchema = new mongoose.Schema({
  subject: String,
  question: String,
  correctAnswer: String,
  optionA: String,
  optionB: String,
  optionC: String,
  optionD: String
});
var ques = mongoose.model("ques", questionSchema);

routes.post('/add_question', (req, res) => {
  console.log(req.body);
  var subject = req.body.subject;
  var subject = (req.body.subject == "new_subject") ? req.body.subject2 : req.body.subject;
  var question = req.body.question;
  var A = req.body.optionA;
  var B = req.body.optionB;
  var C = req.body.optionC;
  var D = req.body.optionD;
  var correctAnswer = req.body.answer;

  const q = new ques({
    subject: subject,
    question: question,
    optionA: A,
    optionB: B,
    optionC: C,
    optionD: D,
    correctAnswer: correctAnswer
  });
  q.save(function(err) {
    if (!err) {
      res.redirect("/success");
    }
  });
});

routes.get('/exam_form', checkAuthenticated, (req, res) => {
  ques.distinct('subject', function(err, arr) {
    if (err) {
      console.log(err);
    } else {

      res.render('exam_form', {
        'user': req.user,
        'arr': arr
      });
    }
  });

});
let globalVal = 0,
  total = 0;
  let emailTo="";
let array = [];
routes.post('/exam_form', (req, res) => {

  let subject = req.body.subject;
  emailTo=req.body.emailTo;
  let count = req.body.count;
  total = count;
  // console.log(subject);
  // console.log(count);

  ques.find().where('subject').in(subject).exec((err, arr) => {
    //console.log(arr);

    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    array=[];
    for (var i = 0; i < Math.min(count, arr.length); i++)
      array[i] = arr[i];
    total = array.length;
    res.render("try", {
      'arr': array
    });
  });

  // ques.find(function(err,arr){
  //   if(err){
  //     console.log(err);
  //   }
  //   else {
  //     //console.log(arr);
  //     res.render("try", {'arr':arr});
  //   }
  // });


});


routes.post('/exam_page', (req, res) => {
  let count = 0;
  var p = req.body;
  var userArray = [];
  globalVal=0;
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      userArray.push({
        k: key,
        r: p[key]
      });
    }
  }

  for (var i = 0; i < userArray.length; i++) {
    let key = userArray[i].k;
    let result = userArray[i].r;
    let key2 = key;
    let result2 = result;
    ques.findOne({
      _id: key
    }, function(err, q) {
      if (err) {
        console.log(err);
      } else {
        key2 = q._id;
        result2 = q.correctAnswer;
        if (result2 == result) {
          count = count + 1;
          globalVal = count;

          //                  console.log("equal",globalVal);
        }
      }
    });
  }
  res.redirect("/result");
});

routes.get('/result', checkAuthenticated, (req, res) => {

  var test = req.user.testTaken;
  var hi=req.user.highestScore;
  if(((globalVal*100)/total)>hi)
  hi=((globalVal*100)/total);
  test = test + 1;
  user.updateOne({
    email: req.user.email
  }, {
    testTaken: test,
    highestScore:hi
  }, function(err) {
    if (err) {
      console.log(err);
    } else {


      console.log("successfully done");

      let mailBody = "Your test is succesfully submitted.\n\nYou answered "+globalVal+" questions correctly out of "+total;
      mailBody=mailBody+" questions.\n\nYour final score is: "+globalVal+"\nAccuracy : "+((globalVal*100)/total)+"%"+"\n\nThank you for choosing eXam Portal\n\n";
      // for (var i = 0; i < array.length; i++) {
      //   let str = "Question:-  " +array[i].question + "\n\nCorrect answer-> ";
      //   if (array[i].correctAnswer == 'a')
      //     str = str + array[i].optionA;
      //   else if (array[i].correctAnswer == 'b')
      //     str = str + array[i].optionB;
      //   else if (array[i].correctAnswer == 'c')
      //     str = str + array[i].optionC;
      //   else
      //     str = str + array[i].optionD;
      //   str = str + "\n" + "\n\n";
      //   mailBody = mailBody + str;
      // }


      var email = {
          to: emailTo,
          from: 'portalexam2020@gmail.com',
          subject: 'eXam Portal: Your answer Script',
          text: mailBody,
          html: ''
      };

      mailer.sendMail(email, function(err, res) {
          if (err) {
              console.log(err)
          }
//          console.log(res);
      });


    }
  });

  res.render('result', {
    'count': globalVal,
    'total': total
  });

});


routes.get('/answerKey', checkAuthenticated, (req, res) => {
  res.render('answerKey', {
    'arr': array
  });
});


routes.get('/dashboard', checkAuthenticated, (req, res) => {
console.log(req.user);
  res.render('dashboard', {
    'user': req.user
  });
});

routes.get('/ourteam', checkAuthenticated, (req, res) => {
console.log(req.user);
  res.render('ourteam', {
    'user': req.user
  });
});


routes.post('/dashboard', (req, res) => {
  var name = req.body.name;
  var phoneNumber=req.body.phoneNumber;
  var dob=req.body.dateOfBirth;
  var dateOfBirth=dob.toString();
  var collegeName=req.body.collegeName;
  //console.log(req.body);
  user.updateOne({
    email: req.user.email
  },
   {
    phoneNumber:phoneNumber,
    dateOfBirth:dateOfBirth,
    collegeName:collegeName,
    name:name
  },
   function(err)
   {
    if (err)
    {
      console.log(err);
    }
     else
     {}

  });
  res.redirect("/success");
});




module.exports = routes;
