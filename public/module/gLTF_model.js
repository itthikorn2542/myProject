class gLTF_model {
  constructor() {}
  showModel(id) {
    var promise = Cesium.IonResource.fromAssetId(id)
      .then(function (resource) {
        var entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(0, 0, 100),
          model: {
            uri: resource,
          },
        });
        viewer.trackedEntity = entity;
      })
      .otherwise(function (error) {
        console.log(error);
      });
  }
}
