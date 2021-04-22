const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/Model-PointCloud", {
  useNewUrlParser: true,
});
// สร้าง database schema
const PointCloud = mongoose.model("PointCloud", {
  name: String,
  AssetId: Number,
  TypeOfAsset: String,
  Date: Date,
  Size: Number,
});
module.exports = PointCloud;