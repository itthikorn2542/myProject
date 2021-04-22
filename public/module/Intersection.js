
  class Intersection{
      constructor(){}
      getPolygon(p1,p2){
         
        var poly1 = turf.polygon([p1]);
        // console.log(poly1)
        var poly2 = turf.polygon([p2]);
        //console.log(poly2)
        var intersection = turf.intersect(poly1, poly2);
        // console.log(intersection);
        return intersection
      }
  }