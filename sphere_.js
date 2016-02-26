
  // Generate vertices
  var points = [vec4(0, 1, 0, 1)];
  for (var i = 0 ; i < k ; i += 1) {
    for (var j = 0 ; j < k ; j += 1) {
      var theta = 2 * Math.PI / k * i;
      var phi = Math.PI / (k+2) * (j+1);
      points.push(vec4(
        Math.sin(phi)*Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi)*Math.sin(theta)
      ));
    }
  }
  points.push(vec4(0, -1, 0, 1));
  var tris = [];
  var last = k*k+1
  for (var i = 1 ; i < k+1 ; i += 1) {
    tris.push([0, i, i%k+1]);
    tris.push([last, last-i, last-(i%k+1)]);
  }
  console.log(points);
  console.log(tris);
  for (var i = 0 ; i < k-1 ; i += 1) {
    for (var j = 0 ; j < k ; j += 1) {
      tris.push([(j+1)+i*k, (j+1)%k+1+i*k, (j+1)+(i+1)*k]);
      tris.push([(j+1)+(i+1)*k, (j+1)%k+1+(i+1)*k, (j+1)%k+1+i*k]);
    }
  }
  var verts = [];
  var norms = [];
  tris.forEach(function(tri) {
    verts.push(points[tri[0]]);
    verts.push(points[tri[1]]);
    verts.push(points[tri[2]]);
    norms.push(vec4(
      normalize(cross(
        subtract(points[tri[1]], points[tri[0]]),
        subtract(points[tri[2]], points[tri[0]]),
        false
      )), 0
    ));
  });
  return {
    verts : verts,
    tris : tris,
    norms : norms
  };
