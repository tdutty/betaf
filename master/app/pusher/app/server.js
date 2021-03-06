const express = require('express');
const bodyParser = require('body-parser');
const Pusher = require('pusher');
const cloudinary = require('cloudinary');
const multipart = require('connect-multiparty')
const mongoose = require('mongoose')
const config = require('./config');
const htmlGenerator = require('./html-generator');
const nodeCache = require('node-cache');
const crypto = require('crypto-js');
const Datauri = require('datauri');
const path = require('path');
const mysql = require('mysql');
const sgMail = require('@sendgrid/mail');
//The TTL && Check period should correspond with time interval in which pusher emits all recursive events
const myCache = new nodeCache( { stdTTL: 100, checkperiod: 120 } )
const https = require('https');
const fs = require('fs')
const app = express();
const multipartMw = multipart();
const port = config.PORT || 3030;


const pusher = new Pusher({
  appId: config.PUSHER_APP_ID,
  key: config.PUSHER_APP_KEY,
  secret: config.PUSHER_APP_SECRET,
  cluster: config.PUSHER_CLUSTER,
});


cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
})


sgMail.setApiKey(config.SENDGRID_API_KEY);

let con = mysql.createPool({
  connectionLimit: 10,
  host:"152.44.33.140",
  port:"3306",
  user:"terrellgilb5",
  password:"Tremaine",
  database:"loginsystem"
})

con.getConnection(function(err) {
  if(err) { 
    console.log(err)
  } else {
    console.log("mysql is connected")
  }
})

mongoose.connect('mongodb://terrellgilb5:Tremaine@localhost/msg_Storage', {useNewUrlParser: true});
let db = mongoose.connection;

db.once('open', (dbOpen) => {
  console.log("mongodb connected")
});


const msg_Schema = new mongoose.Schema({
  time : String, 
  requestID : String,
  userID : String, 
  Specialty : String,
  Question : String,
  Reply: [],
  imgUrl: String,
  userCred: String
})

const drug_Schema = new mongoose.Schema({
  DrugName : String,
  Question : String,
  reply: [],
  time : String, 
  Specialty : String,
  requestID : String,
  userID: String,
  userCred : String

})


//sendgrid API // QUERIES MYSQL // 
mailCLI = (e) => {
  console.log(e,1) 
  first = e[0].userCred.split(" ")[0]
  last = e[0].userCred.split(" ")[1]


  ///last = e.userCred.split(" ")[1].toString()
  //first = e.userCred.split(" ")[0].toString()
  sql = "SELECT * FROM users "+ "WHERE user_first =" + " " + mysql.escape(first) + " " + "AND user_last =" + " " + mysql.escape(last) + " " +  "AND user_specialty=" + " " + mysql.escape(e[0].Specialty) + " " + "lIMIT 1"

 //sql = "SELECT * FROM users WHERE user_first = 'Terrell' AND user_last = 'Gilbert'"
  con.query(sql, function(err,result) {
	console.log(result, 2)
    const msg = {
      to: result[0].user_email,
      from: 'Aumnio@donotreply.com',
      subject: 'Someone replied to your comment.',
      text:  'Hey, Dr.' + result[0].user_last + ' replied to your comment.',
      html: '<strong style="font-size:22px">Hello Dr.' + result[0].user_last + ', <br> You got a reply to your question.</strong><br><br><br><strong style="color:; font-size:20px;">For more details check out: https://www.aumnio.com</strong><br><br><span>Thanks,</span><br>The Aumnio Team</span>',
    };
    sgMail.send(msg);
    })
  
}
 



 
async function eventsDbInit(value) {
    let body = value.body

    if (body.eventID == undefined) {
      
      if(body.commentID == 1) {
        db.collection("msg_med_Comments").insertOne({          
          Question : body.comment,
          time : body.timeStamps,
          Specialty : body.userSpec.replace("+", " "),
          requestID : crypto.MD5(body.comment.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ") + body.userSpec.replace("+", " ")).toString(),
          userID: crypto.MD5(body.userCred.split(' ')[0] + body.userCred.split(' ')[1] + body.userSpec.replace("+", " ")).toString(),
          userCred : body.userCred,
          DrugName : body.drugName,
          replies : [],
          subreply: []
        })
      } else if (body.commentID == 2) {
        db.collection("msg_med_Comments").findOneAndUpdate({requestID: body.requestID}, {$push: {replies:[userID,body.reply,body.timeStamps, body.userSpec]}}).catch(e => { console.log(e)})
        db.collection("msg_med_Comments").find({requestID: body.requestID}).toArray(function(err, result) {
            mailCLI(result)
        })
      
      } else if (body.commentID == 4) {
        db.collection("msg_").findOneAndUpdate({requestID: body.requestID}, {$push:{subreply:[body.reply]}}).catch(e => {console.log(e)})
        db.collection("msg_").find({requestID: body.requestID}).toArray(function(err, result) {
          mailCLI(result)
      })
        
        
      } else if(body.commentID == 5) {
        db.collection("msg_med_Comments").findOneAndUpdate({requestID: body.requestID}, {$push:{subreply:[body.reply]}}).catch(e => {console.log(e)})
        db.collection("msg_med_Comments").find({requestID: body.requestID}).toArray(function(err, result) {
          mailCLI(result)
      })
      } else { 
        console.log('error')
      }
    } else if (body.eventID === 1) {
      if(body.img_Capt == undefined || body.img_Capt == null){
        body.img_Capt = 'none';
      } 

      db.collection("msg_").insertOne({          
        Question : body.Question.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," "),
        time : body.timeStamps,
        Specialty : body.userSpec.replace("+", " "),
        requestID : crypto.MD5(body.Question.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ") + body.userSpec.replace("+", " ")).toString(),
        userID: crypto.MD5(body.userCred.split(' ')[0] + body.userCred.split(' ')[1] + body.userSpec.replace("+", " ")).toString(),
        userCred : body.userCred,
        image : body.img_Capt,
        replies : [""],
        subreply : [""]
      
      },function(error, result){
        console.log(error)
       })
    } else if(body.eventID === 2) {
      db.collection("msg_").updateOne({ requestID: body.requestID }, { $push: { replies: body.reply} },{ upsert: true },function(error, result) {
      });

      db.collection("msg_").find({requestID: body.requestID}).toArray(function(err, result) {
        mailCLI(result)
      })


    } else {
      console.log('none')
  }
}


const debug = (...args) => {
  if (config.DEBUG) {

    console.log('debug::: ', ...args);
  }
};

// Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, Accept,Content-Type, Authorization,');
  next();
});

app.use(bodyParser.json({limit:'10mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '10mb'}));

console.log(config);


// Handles auth for users and creates && generates password for users
app.post(config.ENDPOINT, (req, res) => {
  debug('received auth request');
  debug('req.body:', req.body);

  const socketId = req.body.socket_id;
  const channelName = req.body.channel_name;

  if (/^presence-/.test(channelName)) {
    // If the request is for a presence channel include some data about the user
    // in the call to authenticate
    let timestamp = new Date().toISOString();
    let presenceData = {
      user_id: `user-${timestamp}`,
      user_info: {
        name: 'Pusherino',
        twitter_id: '@pusher',
      },
    };
    let auth = pusher.authenticate(socketId, channelName, presenceData);
    res.send(auth);
  } else {
    let auth = pusher.authenticate(socketId, channelName);
    res.send(auth);
  }
});

dbNPIinit = (e) => { 
  sql = "UPDATE users SET NPI =" +" "+ mysql.escape(e.id) +" "+ "WHERE user_first =" + " " + mysql.escape(e.first) + " " + "AND user_last =" + " " + mysql.escape(e.last) + " " +  "AND user_specialty=" + " " + mysql.escape(e.userSpec)
  con.query(sql, function(err,result) {
  
    })
}

app.post("/authv", (req,res) => {
   let idno = parseInt(req.body.id)

  isEmpty = (obj) => { 
    for (var key in obj) {
      if(obj.hasOwnProperty(key))
        return false
    }
    return true 
  }
db.collection('National_id').find({"NPI":req.body.id}).limit(3).toArray(function(err, result) {

    if(isEmpty(result) || result == null) {
      res.json({authx :"false"})
      res.end()
    } else {
      dbNPIinit(req.body)
      res.json({authx :"true"})
      res.end()  
    }
  });

/*
 let c = db.collection('National_id').find({NPI:'1679576722'}, (function(err, items) {
    if (!isEmpty(items) || items == null) {
      res.json({authx :"false"})
      db.close();
      res.end()
    } else {
      res.json({authx :"true"})
      db.close()
      res.end() 
    }
  }))
  console.log(c) */
}) 



app.post("/updateV", (req,res) => {
sql = "UPDATE users SET authV = '1' WHERE user_first =" + " " + mysql.escape(req.body.first) + " " + "AND user_last =" + " " + mysql.escape(req.body.last) + " " +  "AND user_specialty=" + " " + mysql.escape(req.body.params.replace("+", " "))
con.query(sql, function(err,result) {

  })
  res.end()
})

//convert to scheduler ||  "kue"
app.post("/ftype", (req,res) => {
  if(req.body.JobType == 1) { 
    db.collection("opts").insertOne({
      company : req.body.comp.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," "),
      time :req.body.timeStamps,
      Specialty : req.body.userSpec.replace("+", " "),
      request: req.body.request,
      userCred : req.body.userCred,
    })
  } else {
    db.collection("opts2").insertOne({
      company : req.body.comp.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," "),
      time :req.body.timeStamps,
      Specialty : req.body.userSpec.replace("+", " "),
      request: req.body.request,
      userCred : req.body.userCred,
      no: req.body.num
    })

  }
  
  res.end()
})


app.post("/order", (req,res) => { 
  db.collection("order").insertOne({
    order : req.body.order,
    time :req.body.timeStamps,
    Specialty : req.body.userSpec.replace("+", " "),
    first : req.body.first,
    last: req.body.last,
    userID: crypto.MD5(req.body.first + req.body.last + req.body.userSpec.replace("+", " ")).toString()
  }).catch((e) => {
 
  })
  res.end()
})



app.post("/comment", (req,res ) => {
/*
if(req.body.userCred == "terrell admin"){
	req.body.userCred = "Aumnio Admin"
	req.body.userSpec = "Company"

}*/

  let userCred = req.body.userCred;
  let eventType = req.body.eventID;
  let userSpec = req.body.userSpec.replace("+", " ");
  let timeStampPost= req.body.timeStamps;
  let userID =  crypto.MD5(userCred.split(' ')[0] + userCred.split(' ')[1] + userSpec).toString();
if(eventType === 1) {
  let question = req.body.Question.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ");
  let requestID = crypto.MD5(question + userSpec).toString();
  pusher.trigger("presence-aumnio","client-click", 
    {"message": { "eventID": eventType,
      "userSpec": userSpec,
      "userID": userID,
      "timeStamps": timeStampPost,
      "Question": question,
      "requestID": requestID,
      "userCred": userCred,                     
      }});
      eventsDbInit(req)
      res.end()
    } else {
      let userReply =  req.body.reply.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ");
      let userCred = req.body.userCred;
      let userLast = userCred.split(' ')[1]
      let userSpec = req.body.userSpec.replace("+", " ");
      let requestID = req.body.requestID.toString(); 
      let reply = req.body.reply.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ")
      let timeStampPost = req.body.timeStamps;     
      let userID =  crypto.MD5(userCred.split(' ')[0] + userCred.split(' ')[1] + userSpec).toString();
      eventsDbInit(req)
         pusher.trigger("presence-aumnio","client-reply",
          {"message": {"eventID": eventType,
            "userSpec": userSpec,
            "userCred":userCred,
            "requestID": requestID,
            "userLast" : userLast,
            "timeStamps": timeStampPost,
            "userID": userID, 
            "reply" : reply}})   
          }
    
    res.end("complete")
});


app.post("/drugComments", (req, res) => {
  console.log(req.body.userCred)
/*

	if(req.body.userCred == "terrell admin") {
	 req.body.userSpec = "Company"
	 req.body.userCred = "Aumnio Admin"
	}

*/
      let userCred = req.body.userCred;
      let commentType = req.body.commentID;
      let userSpec = req.body.userSpec.replace("+", " ");
      let timeStampPost= req.body.timeStamps;
      let question = req.body.comment.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ")
      let userID =  crypto.MD5(userCred.split(' ')[0] + userCred.split(' ')[1] + userSpec).toString();
      let DrugName = req.body.drugName;
      let requestID = crypto.MD5(question + userSpec).toString();
     if(commentType == 1) {      
      pusher.trigger("presence-aumnio","drugComments",
      {"message": { "DrugName" : DrugName,
        "Question" : question.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," "),
        "time" : timeStampPost,
        "Specialty" : userSpec,
        "requestID" : requestID,
        "userID": userID,
        "userCred" : userCred,
      }})
      
      res.end('complete')
    } else if (commentType == 2) {
      let userReply =  req.body.reply;
      let userCred = req.body.userCred;
      let userSpec = req.body.userSpec.replace("+", " ");
      let requestID = crypto.MD5(question + userSpec).toString(); 
      let reply = userCred + "--" +userReply;
      let userID = req.body.userID

       pusher.trigger("presence-aumnio","drugComments", {"message": {
        "DrugName" : DrugName,
        "reply" : reply,
        "time" : timeStampPost,
        "Specialty" : userSpec,
        "requestID" : requestID,
        "userID": userID,
        "userCred" : userCred,
       }
      })
    }
    eventsDbInit(req)
    res.end()
})

app.post("/subreply", (req, res) => { 

  console.log(req.body)
  let userCred = req.body.userCred;
  let commentType = req.body.commentID;
  let userSpec = req.body.userSpec.replace("+", " ");
  let timeStampPost= req.body.timeStamps;
  let reply = req.body.reply.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ")
  let userID =  crypto.MD5(userCred.split(' ')[0] + userCred.split(' ')[1] + userSpec).toString();
  let DrugName = req.body.drugName;
  let requestID = req.body.requestID;
  let partit = req.body.partit
  if(commentType == 4) {
    pusher.trigger("presence-aumnio","subreply", {"message": {
      "reply" : reply,
      "time" : timeStampPost,
      "Specialty" : userSpec,
      "requestID" : requestID,
      "userID": userID,
      "userCred" : userCred,
      "partit" : partit,
      "commentID": commentType
      }
    }) 
  } else { 
    pusher.trigger("presence-aumnio","subreply", {"message": {
      "DrugName" : DrugName,
      "reply" : reply,
      "time" : timeStampPost,
      "Specialty" : userSpec,
      "requestID" : requestID,
      "userID": userID,
      "userCred" : userCred,
      "partit" : partit,
      "commentID": commentType
     }
    })
  } 
 eventsDbInit(req)
 res.end()
})

app.post("/likes", (req,res) => {
  let requestID = req.body.requestID
  let userCred = req.body.userCred
  let userSpec = req.body.Specialty.replace("+", " ")
  let userid = crypto.MD5(userCred.split(' ')[0] + userCred.split(' ')[1] + userSpec).toString();
  db.collection("likes").updateOne(
    {userId : userid},
    { $addToSet: { requestID: requestID} },
  )

  res.end("ok")
})


app.post("/bkm", (req,res) => {
	let requestID = req.body.requestID
	let userCred = req.body.userCred
	let userSpec = req.body.userSpec.replace("+", " ")
	let userid = crypto.MD5(userCred.split(' ')[0] + userCred.split(' ')[1] + userSpec).toString();
	db.collection("bookmark").updateOne(
	{userId :userid},
	{$addToSet: {requestID:requestID}},
	)
	res.end("ok")
})


app.post("/imghandler", multipartMw, (req, res) => {
  //image channel
      let parse = JSON.parse(req.body.userdata)
      let userCred = parse.userCred;
      let eventType = parse.eventID;
      let userSpec =  parse.userSpec.replace("+", " ");
      let timeStampPost= parse.timeStamps;
      let question = parse.Question.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ")
      let requestID = crypto.MD5(question + userSpec).toString(); 
      let img_ID = crypto.MD5(requestID + timeStampPost).toString();
      let IMG_Path = req.files.file.path
      let img_Capt ='https://res.cloudinary.com/dlmew3p6k/image/upload/v1565027636/' + img_ID;
      let userID=  crypto.MD5(userCred.split(' ')[0] + userCred.split(' ')[1] + userSpec).toString();
      //since pusherchannels has a 10kb limiy were going to pass the image to cloudinary and our own fs and send a link to that request to the client.
    
      const datauri = new Datauri(IMG_Path)
      cloudinary.v2.uploader.upload(datauri.content, {public_id : img_ID}, (error, result) => {
    })

      pusher.trigger('presence-aumnio', 'upload', 
        {"message":{"image": img_Capt,
        "Question" : question,
        "time" : timeStampPost,
        "Specialty" : userSpec,
        "requestID" : requestID,
        "eventID" : 1,
        "userCred" : userCred,
        "userID" : userID
      }});
      eventsDbInit(req)
      res.status(200).json('completed');
      res.end()
  });

	avi = (e, y) => {
	db.collection("avi").insertOne({
			aviURI:y,
			userID:e
	})
	
	}

  app.post("/avatar", multipartMw, (req, res) =>{
    let parse = JSON.parse(req.body.userdata)
    let IMG_Path = req.files.file.path
    let ufirst = parse.userFirst
    let ulast = parse.userLast
    let userSpec =  parse.userSpec.replace("+", " ");
    let requestID = crypto.MD5(ufirst + ulast + userSpec).toString(); 
    let imageUri = 'https://res.cloudinary.com/dlmew3p6k/image/upload/v1565027636/' + requestID
    const datauri = new Datauri(IMG_Path);
	
    cloudinary.v2.uploader.upload(datauri.content, {public_id : requestID}, (error, result) => {
    })

	avi(requestID,imageUri)

	db.collection("msg_").updateMany({userID:{ $gt: requestID} },
	{ $set: {"imageUri": imageUri}}
	)

	db.collection("msg_med_Comments").updateMany({userID:{$gt: requestID} },
	{$set:{"imageUri": imageUri}}
	)
	
	

    res.end()
  })



app.post("/visit", function(req,res) {
  sql = "UPDATE users SET visit = '1' WHERE user_first =" + " " + mysql.escape(req.body.first) + " " + "AND user_last =" + " " + mysql.escape(req.body.last) + " " +  "AND user_specialty=" + " " + mysql.escape(req.body.id.replace("+", " "))
  con.query(sql, function(err,result) {
    }) 

	let avi_ID = crypto.MD5(req.body.first + req.body.last + req.body.id.replace("+", " ")).toString();
	
    db.collection("avi").find({userID:avi_ID}).limit(1).toArray(function(error, result){
	res.end(JSON.stringify(result))
    })
	
	db.collection("note").remove({})  
	 
})


app.post("/support", function(req, res){


res.end()
})


app.post("/newCards",function(req,res) {
	db.collection("appMain").find({}).limit(3).toArray(function(_error, result) {
	res.end(JSON.stringify(result))
	})
})

app.post("/newMsgs",function(req,res) {
	db.collection("msg_").find({}).sort({_id:-1}).limit(9).toArray(function(err, result) {
	res.end(JSON.stringify(result))
	})

})
//Listens to Pusher Server for events between the clients machine, catch responses and stores events.
app.post("/pusher-webhooks", multipartMw, function(req, res) {
  
     let eventType = req.body.events[0].data.eventType;
    
    //null or undefined events types are subscriber-events && other native pusher events
    if (eventType !== null || undefined) {
        if(eventType == 1) {
          //Question Event
           //I need to concatenate the strings on the requestID && userid
          let eventName = req.body.events[0].event_name;
          let uploaded_IMG = req.files
          let userCred = JSON.parse(req.body.events[0].data).userCred;
          let userSpec = JSON.parse(req.body.events[0].data).userSpec;
          let timeStampPost= JSON.parse(req.body.events[0].data).timeStamps;
          let question = JSON.parse(req.body.events[0].data).question.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ")
          let comment = JSON.parse(req.body.events[0].data).comment
          let requestID = crypto.MD5(question + userSpec).toString();
          let img_ID = crypto.MD5(requestID + timeStampPost).toString(); 
          let img_Capt = 'https://res.cloudinary.com/dlmew3p6k/image/upload/v1565027636/' + img_ID;
          let userID = usercred.split(" ").join("") + userSpec;
            myCache.get(requestID, (error, value) => {
              if (value == undefined || error) {
                //Since pusher emits  events in periodic batches of the same event, I generated a unique string from the user cred and timestamp.
                //This will stop us from storing the same event into the database. We use cache storage simply to get unique events emitted from the pusher channel.
                //its emitting and storing data faster than it could be stored in cache"
                  if (uploaded_IMG !== undefined || null) {
                    const datauri = new Datauri(req.files.file.path)
                      cloudinary.v2.uploader.upload(datauri.content, {public_id : img_ID}, (error, result) => {
                      })
                    }

                      if(eventName == "comments") {
                      db.collection("msg_").insertOne({          
                        Question : question,
                        time : timeStampPost,
                        Specialty : userSpec,
                        requestID : requestID,
                        userID: userID,
                        userCred : userCred,
                        image : img_Capt
                      })
                      } else {
                        //When Medication questions are created
                      db.collection("msg_med_Comments").insertOne({
                        DrugName : DrugName, 
                        Question : comment,
                        time : timeStampPost,
                        Specialty : userSpec,
                        requestID : requestID,
                        userID: userID,
                        userCred : userCred })
                      }

                myCache.set('requestID', requestID);
          } else {
            //The event is already recorded an cache is should be stored in the databases
            res.end()
          }
        })
      } else if (eventType == 2) {
        //Reply Event
        myCache.get(requestID, (error, value) => {  
          if(value == undefined || error) {
            let userReply =  JSON.parse(req.body.events[0].data).reply.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g," ")
            let userCred = JSON.parse(req.body.events[0].data).question;
            let requestID = JSON.parse(req.body.events[0].data).requestID;
            let reply = 'Dr.' + userLast + "--" + userReply;


            if(eventName == 'client-click') { 
              db.collection("msg_").updateMany({requestID : requestID, $push : {reply : reply} })
               } else {
              db.collection("msg_med_Comments").updateMany({DrugName: DrugName, $push : {reply: reply}})
            }
            myCache.set('requestID', requestID);
          } else {
             res.end() 
            }
        })
      }
    } else {
      res.end()
    } 
})



const html = htmlGenerator.generate(config.ENDPOINT);
app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});





const options = {
	key : fs.readFileSync('/root/.getssl/api.aumnio.com/api.aumnio.com.key'),
	cert: fs.readFileSync('/root/.getssl/api.aumnio.com/api.aumnio.com.crt')
} 

const httpsServer = https.createServer(options,app)



httpsServer.listen(port, () => { console.log('Port open')})
