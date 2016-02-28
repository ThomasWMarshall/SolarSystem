function sphere(k) {

  // Define the positions of points on the sphere and their texture coordinates
  var points = [vec4(0, 1, 0)];
  var texCoords = [vec2(0.0, 1.0)]
  for (var i = 1 ; i < k+2 ; i++) {
    for (var j = 0 ; j < k+3 ; j++) {
      var theta = Math.PI / (k+2) * i;
      var phi = 2 * Math.PI / (k+3) * j;

      texCoords.push(vec2(1 - (i / (k+2)), j / (k+3)));

      points.push(vec4(
        Math.cos(phi) * Math.sin(theta),
        Math.cos(theta),
        Math.sin(phi) * Math.sin(theta)
      ));
    }
  }
  points.push(vec4(0, -1, 0));
  texCoords.push(vec2(0.0, 0.0));

  // Define primitive data
  var last = 2+(k+1)*(k+3)-1;
  var tris = [];
  for (var i = 0 ; i < k+3 ; i++) {
    tris.push([0,i+1,(i+1)%(k+3)+1]);
    tris.push([last,last-(i+1),last-((i+1)%(k+3)+1)]);
  }
  for (var j = 0 ; j < k ; j++) {
    for (var i = 0 ; i < k+3 ; i++) {
      tris.push([1+i+j*(k+3),1+i+(k+3)+j*(k+3),1+(i+1)%(k+3)+(k+3)+j*(k+3)]);
      tris.push([1+i+j*(k+3),1+(i+1)%(k+3)+(k+3)+j*(k+3),1+(i+1)%(k+3)+j*(k+3)]);
    }
  }

  // Generate the normals
  norms = [];
  for (var i = 0; i < points.length; i++) {
    norms.push(vec4(normalize(points[i].slice(0)), 0.0));
  }


  return {
    verts : points,
    tris : tris,
    norms : norms,
    texCoords: texCoords
  }
}

function processSphere(s) {
  var points = s.verts;
  var tris = s.tris;
  var verts = [];
  var norms = [];
  tris.forEach(function(tri) {
    verts.push(points[tri[0]]);
    verts.push(points[tri[1]]);
    verts.push(points[tri[2]]);
    normal = vec4(
        normalize(cross(
        subtract(points[tri[2]], points[tri[0]]),
        subtract(points[tri[1]], points[tri[0]]),
        true
      )), 0);
    norms.push(normal);
    norms.push(normal);
    norms.push(normal);
  });
  return {
    verts : verts,
    norms : norms
    //txc : txc
  };
}
