function square() {

  // Define the positions of points on the sphere and their texture coordinates
  var points = [vec4(-1, -1, 0),
                vec4( 1, -1, 0),
                vec4(-1,  1, 0),
                vec4(-1,  1, 0),
                vec4( 1, -1, 0),
                vec4( 1,  1, 0)];

  var texCoords = [vec2(0.0, 0.0),
                   vec2(1.0, 0.0),
                   vec2(0.0, 1.0),
                   vec2(0.0, 1.0),
                   vec2(1.0, 0.0),
                   vec2(1.0, 1.0)];


  return {
    verts : points,
    texCoords: texCoords
  }
}