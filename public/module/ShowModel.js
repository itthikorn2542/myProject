var object;
var targetY = 0.0;
var targetX = 0.0;
var planeEntities = [];
var selectedPlane;
var clippingPlanes;
var object_overley;
var Clipping_enable = false;
var widthPlane = 2.5;
var longPlane = 2.5;
var moveHandler;
var longitudeString;
var latitudeString;
var heightString;

var colorHex = ["#484f93","#00a655","#f2ef0c","#ee7b11","#ea3033"]

class ShowModel {
  constructor() {}
  TileColorGradient(){
    var boundingCenter = object.boundingSphere.center;
    var radius = object.boundingSphere.radius;
    // boundingCenter.z += 1000.0;
    console.log(object)
    var cartographic = Cesium.Cartographic.fromCartesian(boundingCenter);
      var lon = Cesium.Math.toDegrees(cartographic.longitude);
      var lat= Cesium.Math.toDegrees(cartographic.latitude);
      heightString = cartographic.height;
      console.log("longitude: "+lon+" \n"+"lattitude: "+lat+"\n"+"height: "+heightString)
    // // boundingCenter.z += radius
   var label = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(lon, lat,heightString),
    label: {
      text: "this",
      font: "22px Helvetica",
      clampToGround: true,
    },
   })
    
    // console.log("longitude: "+longitudeString+" \n"+"lattitude: "+latitudeString+"\n"+"height: "+heightString)
    let colorLevel;
    let count = 0;
    let height1 = heightString-(heightString*0.85);
    let height2 = parseInt(height1*2)
    let step = parseInt(height2/5);
    let conditionsColor = [];
    console.log("height1: "+height1+"\nstep: "+step);
    for(let i = step;i<=height2;i+=step){
      console.log(i)
      colorLevel = ["${POSITION}.z < "+i.toString(), "color('"+colorHex[count++]+"')"];
      // console.log(colorLevel)
      conditionsColor.push(colorLevel);
      
    }
    conditionsColor.push(["true", "color('#FFFFFF', 1.0)"]);
    console.log(conditionsColor);
    object.style = new Cesium.Cesium3DTileStyle({
      color: {
        conditions: conditionsColor,
      },
    
      pointSize: 5,
    });
    viewer.zoomTo(
      object,
      new Cesium.HeadingPitchRange(0.0, -1.0, radius * 3.0)
    );
  }
  TileUndefineColor(){
    object.style = undefined;
    object.style = new Cesium.Cesium3DTileStyle({
                      pointSize: 5,
                    });;
    console.log(object.style)
  }
  clipping_plane() {
    var downHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    downHandler.setInputAction(function (movement) {
      var pickedObject = scene.pick(movement.position);
      if (
        Cesium.defined(pickedObject) &&
        Cesium.defined(pickedObject.id) &&
        Cesium.defined(pickedObject.id.plane)
      ) {
        
        selectedPlane = pickedObject.id.plane;
        console.log(selectedPlane)
        selectedPlane.material = Cesium.Color.WHITE.withAlpha(0.1);
        selectedPlane.outlineColor = Cesium.Color.WHITE;
        scene.screenSpaceCameraController.enableInputs = false;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Release plane on mouse up
    var upHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    upHandler.setInputAction(function () {
      if (Cesium.defined(selectedPlane)) {
        selectedPlane.material = Cesium.Color.WHITE.withAlpha(0.1);
        selectedPlane.outlineColor = Cesium.Color.WHITE;
        selectedPlane = undefined;
      }

      scene.screenSpaceCameraController.enableInputs = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // Update plane on mouse move
    var moveHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    moveHandler.setInputAction(function (movement) {
      // console.log(movement.endPosition)
      if (Cesium.defined(selectedPlane)) {
        selectedPlane.material = Cesium.Color.YELLOW.withAlpha(0.1)
        var deltaY = movement.startPosition.y - movement.endPosition.y;
        targetY += deltaY;
      
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    function createPlaneUpdateFunction(plane) {
      return function () {
        plane.distance = targetY;
        return plane;
      };
    }
    function updatedimensions(dimension) {
      return function () {
        var boundingSphere = object.boundingSphere;
        var radius = boundingSphere.radius;

        dimension = new Cesium.Cartesian2(
          radius * widthPlane,
          radius * longPlane
        );
        return dimension;
      };
    }
    
    console.log(object)
    return object.readyPromise
      .then(function () {
        var boundingSphere = object.boundingSphere;
        var radius = boundingSphere.radius;
        console.log(boundingSphere.center)
        viewer.zoomTo(
          object,
          new Cesium.HeadingPitchRange(0.5, -0.2, radius * 4.0)
        );

        if (
          !Cesium.Matrix4.equals(object.root.transform, Cesium.Matrix4.IDENTITY)
        ) {
          // The clipping plane is initially positioned at the tileset's root transform.
          // Apply an additional matrix to center the clipping plane on the bounding sphere center.
          var transformCenter = Cesium.Matrix4.getTranslation(
            object.root.transform,
            new Cesium.Cartesian3()
          );
          var transformCartographic = Cesium.Cartographic.fromCartesian(
            transformCenter
          );
          var boundingSphereCartographic = Cesium.Cartographic.fromCartesian(
            object.boundingSphere.center
          );
          var height =
            boundingSphereCartographic.height - transformCartographic.height;
            
          clippingPlanes.modelMatrix = Cesium.Matrix4.fromTranslation(
            new Cesium.Cartesian3(0.0, 0.0, height)
          );
        }

        for (var i = 0; i < clippingPlanes.length; ++i) {
          var plane = clippingPlanes.get(i);
          var dimension = clippingPlanes._clippingPlanesTexture.dimensions;
         
          // console.log(cartographicPlane.height);
          var planeEntity = viewer.entities.add({
            position: boundingSphere.center,

            plane: {
              dimensions: new Cesium.CallbackProperty(
                updatedimensions(dimension),
                false
              ),
              material: Cesium.Color.WHITE.withAlpha(0.1),
              plane: new Cesium.CallbackProperty(
                createPlaneUpdateFunction(plane),
                false
              ),
              outline: true,
              outlineColor: Cesium.Color.WHITE,
            },
          });
          console.log(planeEntity)
          planeEntities.push(planeEntity);
        }
        return object;
      })
      .otherwise(function (error) {
        console.log(error);
      });
  }

  show_model3d(id) {
    // Select plane when mouse down
    clippingPlanes = new Cesium.ClippingPlaneCollection({
      planes: [new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 0.0, -1.0))],
      unionClippingRegions: true,
      edgeWidth: 1.0,
    });
    // console.log(clippingPlanes._planes[0]._normal._cartesian3.x);
    var tileset = viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(id),
        clippingPlanes: clippingPlanes,
      })
    );
    var Overleytileset = viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(id),
      })
    );
    Overleytileset.style = new Cesium.Cesium3DTileStyle({
      color: "color('red')",
      pointSize:5
    });
    // tileset.style = new Cesium.Cesium3DTileStyle(style);
    tileset.style = new Cesium.Cesium3DTileStyle({
      pointSize: 5,
    });

    Overleytileset.pointCloudShading.maximumScreenSpaceError = 16.0; //16
    Overleytileset.pointCloudShading.maximumAttenuation = 4; // Don't allow points larger than 4 pixels.
    Overleytileset.pointCloudShading.baseResolution = 0.5; // Assume an original capture resolution of 5 centimeters between neighboring points.
    Overleytileset.pointCloudShading.geometricErrorScale = 0.05; // Applies to both geometric error and the base resolution.
    Overleytileset.pointCloudShading.attenuation = true;
    Overleytileset.pointCloudShading.eyeDomeLighting = true;

    tileset.pointCloudShading.maximumScreenSpaceError = 16.0; //16
    tileset.pointCloudShading.maximumAttenuation = 4; // Don't allow points larger than 4 pixels.
    tileset.pointCloudShading.baseResolution = 0.5; // Assume an original capture resolution of 5 centimeters between neighboring points.
    tileset.pointCloudShading.geometricErrorScale = 0.05; // Applies to both geometric error and the base resolution.
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.eyeDomeLighting = true;
    
    object = tileset;
    viewer.flyTo(
      object
    );
    object_overley = Overleytileset;
    object_overley.show = false;
  }
}
