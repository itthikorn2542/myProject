var pointArr = [];
var tempEntities = [];
var targetHeight = 0;
var  selectedPlane;
var place;
var lineEntity = []
var polygon = [];
var posRunway = []
var posPolygon = []
var positionRunway = [];
var posWithheight = [];
class KmlModel{
    constructor(){}
    showKML(id){
      let f = this;
        var promise = Cesium.IonResource.fromAssetId(id)
        .then(function (resource) {
            return Cesium.KmlDataSource.load(resource, {
            camera: viewer.scene.camera,
            canvas: viewer.scene.canvas,
            });
        })
        .then(function (dataSource) {
            return viewer.dataSources.add(dataSource);
        })
        .then(function (dataSource) {
            positionRunway.push(dataSource.entities._entities._array[5].polygon.hierarchy._value.positions[0])
            positionRunway.push(dataSource.entities._entities._array[5].polygon.hierarchy._value.positions[1])
            positionRunway.push(dataSource.entities._entities._array[7].polygon.hierarchy._value.positions[0])
            positionRunway.push(dataSource.entities._entities._array[7].polygon.hierarchy._value.positions[1])
            for(let i=0;i<4;i++){
              var cartesianRunWay = [];
              var posPoRun = []
              // var position = dataSource.entities._entities._array[5].polygon.hierarchy._value.positions[i]
              // console.table(positionRunway[i])
              var cartographic = Cesium.Cartographic.fromCartesian(positionRunway[i]);
              var lon = Cesium.Math.toDegrees(cartographic.longitude)
              cartesianRunWay.push(lon);
              posPoRun.push(lon)
              var lat = Cesium.Math.toDegrees(cartographic.latitude)
              cartesianRunWay.push(lat);
              posPoRun.push(lat)
              var h = cartographic.height
              posRunway.push(cartesianRunWay);
              posPoRun.push(h);
              posWithheight.push(posPoRun);
              
              var point = viewer.entities.add({
                position:Cesium.Cartesian3.fromDegrees(lon,lat,h),
                label:{
                  text: "number: "+i,
                  font: "22px Helvetica",
                  clampToGround: true,
                }
              });
            }
            posRunway.push(posRunway[0]);
            return viewer.flyTo(dataSource);
        })
        .otherwise(function (error) {
            console.log(error);
        });

        hendler3D = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        var clickHendle = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        hendler3D.setInputAction(function (movement) {
          var cartesian = viewer.scene.pickPosition(movement.endPosition);
          if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
            var height = cartographic.height;
            //console.log(longitudePoint, latitudePoint, heightPoint);
            // console.log("longitude: "+longitudeString+" \n"+"lattitude: "+latitudeString+"\n"+"height: "+height)
            clickHendle.setInputAction(function (click) {
              // console.log("Draw Line3D Left Click!!!!!!!!!!")
              var tempPos = [];
              tempPos.push(longitudeString);
              tempPos.push(latitudeString);
              tempPos.push(height);
              posPolygon.push(tempPos);
              pointArr.push({lon:longitudeString,lat:latitudeString,height:height})
              f.CreatePoint(pointArr[pointArr.length-1])
              if(pointArr.length==4){
                f.CreatePolygon()
                pointArr = []
                //console.log(posPolygon)
                posPolygon.push(posPolygon[0]);
                var intersection = new Intersection().getPolygon(posRunway,posPolygon);
                if(intersection!==null){
                  f.CheckHeight();
                }
                else{
                  posPolygon = [];
                }
                
                //console.log(intersection)
              }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    CreatePoint(point){
      var entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          point.lon,
          point.lat,
          point.height
        ),
        point: {
          pixelSize: 10,
          color: Cesium.Color.CHARTREUSE,
          clampToGround: true,
        },
      });
      tempEntities.push(entity);
    }
    updateExtrudeHeight(exHeight){
      return function () {
        exHeight += 10;
        return exHeight;
      };
    }
    CreatePolygon(){
      var pArr = [];
      var f = this;
      for(let i = 0;i<pointArr.length;i++){
        pArr.push(pointArr[i].lon)
        pArr.push(pointArr[i].lat)
        pArr.push(pointArr[i].height)
      }
      var purplePolygonUsingRhumbLines = viewer.entities.add({
        name: "Purple polygon using rhumb lines with outline",
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(pArr),
          extrudedHeight: 500,
          material: Cesium.Color.PURPLE,
          outline: true,
          outlineColor: Cesium.Color.MAGENTA,
          clampToGround:true
        },
      });
      
      polygon.push(purplePolygonUsingRhumbLines);
    }
    CheckHeight(){
      var x = 0.0;
      var totalH = 0.0;
      console.table(posWithheight);
      console.table(posPolygon);
      $.post('/Check-point-in-polygon', { polygon: posRunway,point: posPolygon},function(data){
          
          console.table(data.point)
          var lonCenter1 = (posWithheight[0][0]+posWithheight[1][0])/2;
            var latCenter1 = (posWithheight[0][1]+posWithheight[1][1])/2;
            var lonCenter2 = (posWithheight[2][0]+posWithheight[3][0])/2;
            var latCenter2 = (posWithheight[2][1]+posWithheight[3][1])/2;

            var maxHeight = (posWithheight[2][2]+posWithheight[3][2])/2;
            var minHeight = (posWithheight[0][2]+posWithheight[1][2])/2;
            var y = maxHeight-minHeight;
            /// find total distance
            var left = Cesium.Cartesian3.fromDegrees(lonCenter1,latCenter1);
            var right = Cesium.Cartesian3.fromDegrees(lonCenter2,latCenter2);
            var distanceRunway = Cesium.Cartesian3.distance(left, right)
            console.log("distanceRunway: ")

            console.log(distanceRunway)
          if(data.status){
            if(data.point.length==1){
              let lonPoly = parseFloat(data.point[0][0]);
              let latPoly = parseFloat(data.point[0][1]);
              let hPoly = parseFloat(data.point[0][2]);
              let polyCartes = Cesium.Cartesian3.fromDegrees(lonPoly,latPoly,hPoly);
              let surface = Cesium.Cartesian3.fromDegrees(lonCenter2,latCenter2);
              polyCartes.x = surface.x;
              
              let distanceA = Cesium.Cartesian3.distance(left, polyCartes);
              console.log("distanceA")
              console.log(distanceA)
              x = parseFloat((y*distanceA)/distanceRunway)
              console.log("x: ")
              console.log(x)
              console.log("totalH: ")
              totalH = minHeight+x;
              console.log(totalH)
              if(500.0>parseFloat(totalH)){
                polygon[polygon.length-1].polygon.material = Cesium.Color.RED
                polygon[polygon.length-1].polygon.outline = false;
              }
            }
            else{
                var minY = Number.MAX_VALUE;
                var polyCartes1;
                for(let i=0;i<data.point.length;i++){
                      let lonPoly = parseFloat(data.point[i][0]);
                      let latPoly = parseFloat(data.point[i][1]);
                      let hPoly = parseFloat(data.point[i][2]);
                      let polyCartes = Cesium.Cartesian3.fromDegrees(lonPoly,latPoly,hPoly);
                      let surface = Cesium.Cartesian3.fromDegrees(lonCenter2,latCenter2);
                      polyCartes.x = surface.x;
                      if(polyCartes.y<minY){
                         
                          polyCartes1 = polyCartes;
                      }
                      
                }
                let distanceA = Cesium.Cartesian3.distance(left, polyCartes1);
                console.log("distanceA")
                console.log(distanceA)
                x = parseFloat((y*distanceA)/distanceRunway)
                console.log("x: ")
                console.log(x)
                console.log("totalH: ")
                totalH = minHeight+x;
                console.log(totalH)
                if(500.0>parseFloat(totalH)){
                  polygon[polygon.length-1].polygon.material = Cesium.Color.RED
                  polygon[polygon.length-1].polygon.outline = false;

                }
            }
            
          }
          else{
            var minY = Number.MAX_VALUE;
            for(let i=0;i<4;i++){
                var polyCartes1;
                let lonPoly = parseFloat(data.point[i][0]);
                let latPoly =  parseFloat(data.point[i][1]);
                let hPoly = parseFloat(data.point[i][2]);
                console.table({lonPoly,latPoly,hPoly})
                let polyCartes = Cesium.Cartesian3.fromDegrees(lonPoly,latPoly,hPoly);
                let surface = Cesium.Cartesian3.fromDegrees(lonCenter2,latCenter2);
                polyCartes.x = surface.x;
                if(polyCartes.y<minY){
                    polyCartes1 = polyCartes;
                }
                      
            }
            let distanceA = Cesium.Cartesian3.distance(left, polyCartes1);
            console.log("distanceA")
            console.log(distanceA)
            x = parseFloat((y*distanceA)/distanceRunway)
            console.log("x: ")
            console.log(x)
            console.log("totalH: ")
            totalH = minHeight+x;
            console.log(totalH)
            if(500.0>parseFloat(totalH)){
              polygon[polygon.length-1].polygon.material = Cesium.Color.RED
              polygon[polygon.length-1].polygon.outline = false;
            }

          }
          
          
      });
      posPolygon = [];
    }
    
}