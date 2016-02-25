function sphere(k) {
  // Generate vertices
  var points = [vec4(0, 1, 0, 1)];
  for (var i = 0 ; i < k ; i += 1) {
    for (var j = 0 ; j < k ; j += 1) {
      var theta = 2 * Math.PI / k * i;
      var phi = Math.PI / k * j;
      points.push(vec4(
        0.5*Math.cos(phi)*Math.cos(theta),
        0.5*Math.sin(phi),
        0.5*Math.cos(phi)*Math.sin(theta)
      ));
    }
  }
  var tris = [];
  for (var i = 1 ; i < k+1 ; i += 1) {
    tris.push([0, i, i%k+1]);
    tris.push([k*k+1, k*k+1-i, k*k+1-(i%k + 1)]);
  }
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
}
