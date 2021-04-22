

var loadedModels = [];

var tempPoints = [];
var tempEntities = [];
var tempPinEntities = [];
var tempPinLon, tempPinLat;

var handler = null;
var hendler3D = null;
var clickHendle = null;
var earthRadiusMeters = 6371000.0;
var radiansPerDegree = Math.PI / 180.0;
var degreesPerRadian = 180.0 / Math.PI;

class Measurement {
  constructor() {}

  clearEffects() {
    if (handler != null) {
      handler.destroy();
      tempPoints = [];
      //console.log(tempPoints)
    }
    if (hendler3D != null || clickHendle != null) {
      hendler3D.destroy();
      clickHendle.destroy()
      tempPoints = [];
      //console.log(tempPoints)
    }
  }

  //Set various operating modes
  drawPoint = (point) => {
    var entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
      label: {
        text: "",
        font: "22px Helvetica",
        clampToGround: true,
      },
      point: {
        pixelSize: 10,
        color: Cesium.Color.CHARTREUSE,
        clampToGround: true,
      },
    });
    tempEntities.push(entity);
  };

  draw3DPoint = (point) => {
    //console.log(point.lon,point.lat,point.height)
    // tempEntities = [];
    var entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        point.lon,
        point.lat,
        point.height
      ),
      label: {
        text: " ",
        font: "22px Helvetica",
        //clampToGround: true,
      },
      point: {
        pixelSize: 10,
        color: Cesium.Color.CHARTREUSE,
        clampToGround: true,
      },
    });
    tempEntities.push(entity);
  };
  SetMode(mode) {
    let draw = this;
    if (mode == "drawPloy") {
      tempPoints = [];
      handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

      handler.setInputAction(function (click) {
        //console.log("Draw poly Left Click!!!!!!!!!!")
        var cartesian = viewer.camera.pickEllipsoid(
          click.position,
          scene.globe.ellipsoid
        );
        if (cartesian) {
          var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
          var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
          var heightString = cartographic.height;
          tempPoints.push({ lon: longitudeString, lat: latitudeString,height:heightString });
          var tempLength = tempPoints.length;
          draw.drawPoint(tempPoints[tempPoints.length - 1]);
          if (tempLength > 1) {
            draw.drawLine(
              tempPoints[tempPoints.length - 2],
              tempPoints[tempPoints.length - 1],
              true
            );
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      handler.setInputAction(function (click) {
        //console.log("Draw poly Right Click!!!!!!!!!!")
        var cartesian = viewer.camera.pickEllipsoid(
          click.position,
          scene.globe.ellipsoid
        );
        if (cartesian) {
          var tempLength = tempPoints.length;
          if (tempLength < 3) {
            alert(
              "Please select more than 3 points and then execute the closing operation command"
            );
          } else {
            draw.drawLine(
              tempPoints[0],
              tempPoints[tempPoints.length - 1],
              true
            );
            draw.drawPoly(tempPoints);
            // <!-- highLightAssetsInArea(tempPoints); -->
              var area = draw.SphericalPolygonAreaMeters(tempPoints);
              var areaUnit = "㎡"
              if(area>=1000){
                area/=1000;
                areaUnit = "k㎡";
              }
            var ent = viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(
                (tempPoints[0].lon +
                  (tempPoints[tempPoints.length - 1].lon +
                    tempPoints[tempPoints.length - 2].lon) /
                    2) /
                  2,
                (tempPoints[0].lat +
                  (tempPoints[tempPoints.length - 1].lat +
                    tempPoints[tempPoints.length - 2].lat) /
                    2) /
                  2
              ),
              label: {
                text:
                  area.toFixed(1) + areaUnit,
                font: "22px Helvetica",
                fillColor: Cesium.Color.BLACK,
              },
            });
            tempEntities.push(ent);
            tempPoints = [];
            draw.clearEffects();
            handler.destroy()
          }
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
     else if ("draw3DLine" == mode) {
      let draw = this;
      tempPoints = [];
      var longitudePoint;
      var latitudePoint ;
      var heightPoint;
      var tempLength;
      hendler3D = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      clickHendle = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      hendler3D.setInputAction(function (movement) {
        var cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (cartesian) {
          var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          longitudePoint = Cesium.Math.toDegrees(cartographic.longitude);
          latitudePoint = Cesium.Math.toDegrees(cartographic.latitude);
          heightPoint = cartographic.height;
          //console.log(longitudePoint, latitudePoint, heightPoint);
          console.log("longitude: "+longitudePoint+" \n"+"lattitude: "+latitudePoint+"\n"+"height: "+heightPoint)
          clickHendle.setInputAction(function (click) {
            // console.log("Draw Line3D Left Click!!!!!!!!!!")
            tempPoints.push({
              lon: longitudePoint,
              lat: latitudePoint,
              height: heightPoint,
            });
            tempLength = tempPoints.length;
            // console.log(tempLength)
            draw.draw3DPoint(tempPoints[tempPoints.length - 1]);
            if (tempLength > 1) {
              draw.draw3DLine(
                tempPoints[tempPoints.length - 2],
                tempPoints[tempPoints.length - 1],
                true
              );
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          clickHendle.setInputAction(function (click) {
            tempPoints = [];
            draw.clearEffects();
            // console.log(tempPoints);
            // console.log("Draw Line3D Right Click!!!!!!!!!!")
            // console.log(tempPoints.length);
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      
    }
  }

  drawLine(point1, point2, showDistance) {
    var entity = viewer.entities.add({
      polyline: {
        positions: [
          Cesium.Cartesian3.fromDegrees(point1.lon, point1.lat),
          Cesium.Cartesian3.fromDegrees(point2.lon, point2.lat),
        ],
        width: 10.0,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: Cesium.Color.CHARTREUSE.withAlpha(0.5),
        }),
        clampToGround: true,
      },
    });
    tempEntities.push(entity);
    if (showDistance) {
      let draw = this;
      var w = Math.abs(point1.lon - point2.lon);
      var h = Math.abs(point1.lat - point2.lat);
      var offsetV = w >= h ? 0.0005 : 0;
      var offsetH = w < h ? 0.001 : 0;
      var distance = draw.getFlatternDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );
      var distanceUnit = " m";
      if (distance >= 1000) {
        distance /= 1000;
        distanceUnit = " km";
      }
      entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          (point1.lon + point2.lon) / 2 + offsetH,
          (point1.lat + point2.lat) / 2 + offsetV
        ),
        label: {
          text: distance.toFixed(1) + distanceUnit,
          font: "22px Helvetica",
          fillColor: Cesium.Color.WHITE,
          pixelOffset: new Cesium.Cartesian2(0.0, 20),
          showBackground: true,
        },
      });
      tempEntities.push(entity);
    }
  }
  draw3DLine(point1, point2, showDistance) {
    var entity = viewer.entities.add({
      polyline: {
        positions: [
          Cesium.Cartesian3.fromDegrees(point1.lon, point1.lat,point1.height),
          Cesium.Cartesian3.fromDegrees(point2.lon, point2.lat,point2.height),
        ],
        width: 5.0,
        material: {
          color: Cesium.Color.RED.withAlpha(0.5),
          
        },
        clampToGround: true,
        color:Cesium.Color.RED,
      },
    });
    tempEntities.push(entity);
    if (showDistance) {
      let draw = this;
      var distance = draw.getFlatternDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon
      );
      var distanceUnit = " m";
      if (distance >= 1000) {
        distance /= 1000;
        distanceUnit = " km";
      }
      // console.log("height1: "+point1.height,"height2: "+point2.height,"heightTotal: "+(point1.height+point2.height)/2)
      entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees((point1.lon + point2.lon) / 2 ,
        (point1.lat + point2.lat) / 2 ,
        point1.height>=point2.height?point1.height:point2.height
        ),
        label: {
          text: distance.toFixed(1) + distanceUnit,
          font: "22px Helvetica",
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          clampToGround:true,
          pixelOffset: new Cesium.Cartesian2(0.0, 20),
        },
      });
      tempEntities.push(entity);
    }
  }

  drawPoly(points) {
    var pArray = [];
    for (var i = 0; i < points.length; i++) {
      pArray.push(points[i].lon);
      pArray.push(points[i].lat);
    }
    var entity = viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(pArray)
        ),
        material: Cesium.Color.CHARTREUSE.withAlpha(0.5),
      },
    });
    tempEntities.push(entity);
  }

  /// Calculate the distance between two points
  getFlatternDistance(lat1, lng1, lat2, lng2) {
    var EARTH_RADIUS = 6378137.0; //unit M
    var PI = Math.PI;

    function getRad(d) {
      return (d * PI) / 180.0;
    }
    var f = getRad((lat1 + lat2) / 2);
    var g = getRad((lat1 - lat2) / 2);
    var l = getRad((lng1 - lng2) / 2);

    var sg = Math.sin(g);
    var sl = Math.sin(l);
    var sf = Math.sin(f);

    var s, c, w, r, d, h1, h2;
    var a = EARTH_RADIUS;
    var fl = 1 / 298.257;

    sg = sg * sg;
    sl = sl * sl;
    sf = sf * sf;

    s = sg * (1 - sl) + (1 - sf) * sl;
    c = (1 - sg) * (1 - sl) + sf * sl;

    w = Math.atan(Math.sqrt(s / c));
    r = Math.sqrt(s * c) / w;
    d = 2 * w * a;
    h1 = (3 * r - 1) / 2 / c;
    h2 = (3 * r + 1) / 2 / s;

    return d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg));
  }

  /// Calculate the polygon area

  SphericalPolygonAreaMeters(points) {
    let draw = this;
    var totalAngle = 0;
    for (var i = 0; i < points.length; i++) {
      var j = (i + 1) % points.length;
      var k = (i + 2) % points.length;
      totalAngle += draw.Angle(points[i], points[j], points[k]);
    }
    var planarTotalAngle = (points.length - 2) * 180.0;
    var sphericalExcess = totalAngle - planarTotalAngle;
    if (sphericalExcess > 420.0) {
      totalAngle = points.length * 360.0 - totalAngle;
      sphericalExcess = totalAngle - planarTotalAngle;
    } else if (sphericalExcess > 300.0 && sphericalExcess < 420.0) {
      sphericalExcess = Math.abs(360.0 - sphericalExcess);
    }
    return (
      sphericalExcess * radiansPerDegree * earthRadiusMeters * earthRadiusMeters
    );
  }
  /* angle*/
  Angle(p1, p2, p3) {
    var bearing21 = this.Bearing(p2, p1);
    var bearing23 = this.Bearing(p2, p3);
    var angle = bearing21 - bearing23;
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  }

  /*direction*/
  Bearing(from, to) {
    var lat1 = from.lat * radiansPerDegree;
    var lon1 = from.lon * radiansPerDegree;
    var lat2 = to.lat * radiansPerDegree;
    var lon2 = to.lon * radiansPerDegree;
    var angle = -Math.atan2(
      Math.sin(lon1 - lon2) * Math.cos(lat2),
      Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
    );
    if (angle < 0) {
      angle += Math.PI * 2.0;
    }
    angle = angle * degreesPerRadian;
    return angle;
  }

  clearDrawingBoard() {
    let clear = this;
    var primitives = viewer.entities;
    for (i = 0; i < tempEntities.length; i++) {
      primitives.remove(tempEntities[i]);
    }
    tempEntities = [];
    tempPoints = []
    clear.clearEffects();
    // console.log(tempEntities,tempPoints.length)
  }
}
