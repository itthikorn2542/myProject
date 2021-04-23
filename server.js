const express = require("express");
var formidable = require("formidable");
var dateFormat = require("dateformat");
const request = require("request-promise");
var session = require("express-session");
var bodyParser = require("body-parser");
const PointCloud = require('./database/Mongodb')
const axios = require('axios');
var classifyPoint = require("robust-point-in-polygon")
const app = express();
const port = 8000;
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMmFkYjQ4Yi02ODFmLTQ5NjQtOWMyMy1kMGUzYmVhYmQ0MWUiLCJpZCI6MzkyNTksImlhdCI6MTYwOTIzNjc1M30.mXjs9YbCklx_8BA_CKOf8CkQGmh2bt1lXgmEWGZEz3U"; // Replace this with your token from above.
app.use(express.static("public"));
app.use(express.static("Images"));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
//////////////////////////////////////////
var fileName, name, type;
///////////////////
//////////////////////////////////////////

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get("/", async (req, res) => {
  let DataDB = await PointCloud.find();
  // console.log(DataDB.length)
  res.render("index", { pcObj: DataDB });
  // res.render("login");

  //res.sendFile(path.join(__dirname,'/index.html'))
});
app.get("/home",async (req,res)=>{
  console.log(req.body.username,req.body.password)
    let DataDB = await PointCloud.find();
    res.render("index", { pcObj: DataDB });
})
app.post("/savefile", async (req, res, next) => {
  var form = new formidable.IncomingForm();

  form.parse(req);
  try {
    form.on("fileBegin", function (name, file) {
      let d = new Date();
      let date = dateFormat(d, "dd-mm-yyyy h-MM-ss").toString();
      fileName = date + "_" + file.name;
      console.log(date);
      file.path = __dirname + "/resources/" + date + "_" + file.name;
    });
    form.on("field", function (fieldName, fieldValue) {
      //console.log('Got a field name, field value:', fieldName, fieldValue);
      if (fieldName == "sourcetype") {
        // console.log('Got a field name, field value:', fieldValue);
        type = fieldValue;
        console.log("sourceType: "+type);
      }
      else if(fieldName == "convertto"){

        console.log("convertto: "+fieldValue);
      } 
      else if(fieldName == "Aname") {
        //console.log('Got a field name, field value:', fieldValue);
        name = fieldValue;
        console.log("name: "+name);
      }
    });
    form.on("file", function (name, file) {
      //console.log('Uploaded '+file.path);
      console.log(fileName);
    });
    //  res.redirect("/");
    res.redirect("/point");
  } catch (error) {
    console.log("error at Post method");
  }
});
app.post("/delete", async function (req, res) {
  const response = await request({
    url: `https://api.cesium.com/v1/assets/${req.body.id}`,
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
  })
    .then(function () {
      console.log("delete from asset success!!");
    })
    .catch(function (error) {
      console.log("delete asset error");
    });

  let id = req.body.id;
  await PointCloud.remove({ AssetId: id })
    .then(() => {
      console.log("Delete id " + id + " success!!");
    })
    .catch((error) => {
      console.log(error);
    });
});
app.get("/point", async (req, res) => {
  ///Step 1: Provide ion information about your data
  const postBody = {
    name: `${name}`,
    description: "test model upload",
    type: "3DTILES",
    options: {
      sourceType: `${type}`,
      clampToTerrain: true,
      baseTerrainId: 1,
    },
  };
  const response = await request({
    url: "https://api.cesium.com/v1/assets",
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    body: postBody,
  });

  //Step 2: Upload your data to the provided Amazon S3 bucket
  const AWS = await require("aws-sdk");
  const uploadLocation = response.uploadLocation;
  const s3 = new AWS.S3({
    apiVersion: "2012-10-17",
    region: "ap-southeast-1",
    signatureVersion: "v4",
    endpoint: uploadLocation.endpoint,
    credentials: new AWS.Credentials(
      uploadLocation.accessKey,
      uploadLocation.secretAccessKey,
      uploadLocation.sessionToken
    ),
  });

  const input = `/Users/gorigoe/Documents/internship/point_cloud/myProject/resources/${fileName}`;
  const fs = require("fs");
  await s3
    .upload({
      Body: fs.createReadStream(input),
      Bucket: uploadLocation.bucket,
      Key: `${uploadLocation.prefix}${fileName}`,
    })
    .promise();

  //Step 3: Notify ion that you are finished uploading
  const onComplete = response.onComplete;
  await request({
    url: onComplete.url,
    method: onComplete.method,
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    body: onComplete.fields,
  });

  //Step 4: Monitor the tiling status
  function sendDataSuccess(data) {
    console.log(data);
    //สร้าง instance จาก model
    let mb = (data.bytes * 0.000001).toFixed(2);
    console.log(mb);
    const Data = new PointCloud({
      name: data.name,
      AssetId: data.id,
      TypeOfAsset: data.type,
      Date: data.dateAdded,
      Size: mb,
    })
      .save()
      .then(() => {
        console.log("----------------------------");
        console.log("|Add to Mongo DB Success...|");
        console.log("----------------------------");
      })
      .catch((error) => {
        console.log(error);
      });
    res.redirect("/?success=true");
  }
  function sendDataUnSuccess() {
    res.redirect("/?fail=true");

    // res.send("Please check your data type!!!")
  }
  let myPromise = new Promise(async function (fulfill, reject) {
    const assetId = response.assetMetadata.id;
    while (true) {
      const assetMetadata = await request({
        url: `https://api.cesium.com/v1/assets/${assetId}`,
        headers: { Authorization: `Bearer ${accessToken}` },
        json: true,
      });

      const status = assetMetadata.status;
      if (status === "COMPLETE") {
        console.log("Asset tiled successfully");
        console.log(
          `View in ion: https://cesium.com/ion/assets/${assetMetadata.id}`
        );
        fulfill(assetMetadata);
        break;
      } else if (status === "DATA_ERROR") {
        console.log("ion detected a problem with the uploaded data.");
        reject(null);
        break;
      } else if (status === "ERROR") {
        console.log(
          "An unknown tiling error occurred, please contact support@cesium.com."
        );
        reject(null);
        break;
      } else {
        if (status === "NOT_STARTED") {
          console.log("Tiling pipeline initializing.");
        } else {
          // IN_PROGRESS
          console.log(`Asset is ${assetMetadata.percentComplete}% complete.`);
        }

        // Not done yet, check again in 10 seconds
        setTimeout(() => {
          console.log("Try to request again...");
        }, 5000000);
      }
    }
  });
  await myPromise.then(
    function (data) {
      sendDataSuccess(data);
    },
    function (error) {
      sendDataUnSuccess();
    }
  );
});
app.post('/Check-point-in-polygon',async (req,res)=>{
  let polygon = req.body.polygon;
  let point = req.body.point;
  let arr = []
  console.log(point)
  for(let i=0;i<4;i++){
    let status = classifyPoint(polygon,point[i])
    console.log(status)
    if(status==-1){
      arr.push(point[i])
    }
        
  }
  if(arr.length!=0){
    res.json({ point: arr,status: true});
  }
  else{
    res.json({ point: point,status:false });
  }
  
   //replace with your data here
});
app.use((req,res)=>{
  res.status(404).send('404 PAGE NOT FOUND! <a href="/">back to home</a>')
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
