/*
Solution file for HW5: JS Mesh & WebGL Renderer - 5-scene.js
Comp 630 W'16 - Computer Graphics
Phillips Academy
2016-2-20

By Thomas Marshall
*/


// This function returns the Python generated scene data as an anonymous
// object with attributes, transforms and shapes. Shapes contains vertex,
// adjacency, and color information for each shape, transforms contains the,
// instance transformations.
function sceneData() {

  var transforms = [

  mat4( 7.5,  0. ,  0. ,  0. ,
          0. ,  7.5,  0. ,  0. ,
          0. ,  0. ,  0.5, -0.5,
          0. ,  0. ,  0. ,  1. ),//Cube

  mat4( 1. ,  0. ,  0. ,  2. ,
          0. ,  2.4,  0. ,  0. ,
          0. ,  0. ,  1. ,  1. ,
          0. ,  0. ,  0. ,  1. ),//Wheel

  mat4( 1. ,  0. ,  0. , -2. ,
          0. ,  2.4,  0. ,  0. ,
          0. ,  0. ,  1. ,  1. ,
          0. ,  0. ,  0. ,  1. ),//Wheel

  mat4( 4.1,  0. ,  0. ,  0. ,
          0. ,  2. ,  0. ,  0. ,
          0. ,  0. ,  1. ,  2. ,
          0. ,  0. ,  0. ,  1. ),//Cube

  mat4( 2.,  0.,  0.,  0.,
          0.,  2.,  0.,  0.,
          0.,  0.,  1.,  4.,
          0.,  0.,  0.,  1.),// Cube

// Headlight
  mat4( 3.06161700e-17,  2.00000000e-01,  0.00000000e+00, 4.10000000e+00,
         -5.00000000e-01,  1.22464680e-17,  0.00000000e+00, 1.00000000e+00,
          0.00000000e+00,  0.00000000e+00,  4.00000000e-01, 2.00000000e+00,
          0.00000000e+00,  0.00000000e+00,  0.00000000e+00, 1.00000000e+00),

// Headlight
  mat4(  3.06161700e-17, 2.00000000e-01, 0.00000000e+00,  4.10000000e+00,
          -5.00000000e-01, 1.22464680e-17, 0.00000000e+00, -1.00000000e+00,
           0.00000000e+00, 0.00000000e+00, 4.00000000e-01,  2.00000000e+00,
           0.00000000e+00, 0.00000000e+00, 0.00000000e+00,  1.00000000e+00),

// Cube
  mat4(-0.02958858,  0.47757387, -0.10703417,  4.92269163,
          0.27429943,  0.125     ,  0.23789863,  0.75      ,
          0.25398689, -0.07936116, -0.26939363,  7.3553925 ,
          0.        ,  0.        ,  0.        ,  1.        ),


// Cube
  mat4( 0.01362392,  1.19393469, -0.11020973,  3.25118307,
          0.16237976,  0.3125    ,  0.32475953,  0.3125    ,
          0.33774576, -0.19840291, -0.15169069,  7.63315657,
          0.        ,  0.        ,  0.        ,  1.        ),


// Cube
  mat4( 1.85767514e-17,   1.02862419e+00,   3.03381373e-01, 1.02862419e+00,
          3.75000000e-01,   8.66915064e-17,  -3.64589274e-17, 8.66915064e-17,
         -3.64589274e-17,   1.41577974e+00,  -2.20419470e-01, 6.41577974e+00,
          0.00000000e+00,   0.00000000e+00,   0.00000000e+00, 1.00000000e+00)

       ];

  var shapes = [
    (cube(vec4(0.0,1.0,0.0,1.0))),
    (sandClock(vec4(1.0,1.0,0.0,1.0))),
    (sandClock(vec4(1.0,0.0,0.0,1.0))),
    (cube(vec4(0.0,1.0,1.0,1.0))),
    (cube(vec4(1.0,0.0,1.0,1.0))),
    (topToy(vec4(0.0,0.0,0.0,1.0))),
    (topToy(vec4(0.0,1.0,0.5,1.0))),
    (cube(vec4(0.5,1.0,0.0,1.0))),
    (cube(vec4(1.0,0.0,0.5,1.0))),
    (cube(vec4(0.0,1.0,1.0,1.0)))
  ];

  return {
    transforms: transforms,
    shapes: shapes
  };

}

function octahedron(color) {

  // Define position data
  var vertexArray = [

    vec4( 0.0, 0.5, 0.0, 1.0),
    vec4( 0.5, 0.0, 0.0, 1.0),
    vec4( 0.0, 0.0,-0.5, 1.0),
    vec4(-0.5, 0.0, 0.0, 1.0),
    vec4( 0.0, 0.0, 0.5, 1.0),
    vec4( 0.0,-0.5, 0.0, 1.0)
    ];

  // Define adjacency data
  var triArray = [0,1,2,
                  0,2,3,
                  0,3,4,
                  0,4,1,

                  5,2,1,
                  5,3,2,
                  5,4,3,
                  5,1,4];

  // Define color information
  colorArray = [];
  for (var i = 0; i < triArray.length/3; i++) {
    colorArray.push(color);
  }

  var normals = [];
  for (var i = 0; i < triArray.length; i += 3) {

    normals.push(vec4(normalize(cross(
                subtract(vertexArray[triArray[i+1]], vertexArray[triArray[i]]),
                subtract(vertexArray[triArray[i+2]], vertexArray[triArray[i]])),
                false),
                0));
  }

  return {verts:  vertexArray,
          tris:   triArray,
          norms:  normals,
          colors: colorArray};

}

// Returns data for a cube
function cube(color) {

  // Define position data
  var vertexArray = [
    vec4( 1,  1,  1,  1),
    vec4(-1,  1,  1,  1),
    vec4(-1, -1,  1,  1),
    vec4( 1, -1,  1,  1),
    vec4( 1,  1, -1,  1),
    vec4(-1,  1, -1,  1),
    vec4(-1, -1, -1,  1),
    vec4( 1, -1, -1,  1)
    ];

  // Define adjacency data
  var triArray = [0, 1, 2,
                  0, 2, 3,
                  1, 0, 4,
                  2, 1, 5,
                  3, 2, 6,
                  0, 3, 7,
                  4, 5, 1,
                  5, 6, 2,
                  6, 7, 3,
                  7, 4, 0,
                  4, 6, 5,
                  4, 7, 6];

  // Define color information
  colorArray = [];
  for (var i = 0; i < triArray.length/3; i++) {
    colorArray.push(color);
  }

  var normals = [];
  for (var i = 0; i < triArray.length; i += 3) {

    normals.push(vec4(normalize(cross(
                subtract(vertexArray[triArray[i+1]], vertexArray[triArray[i]]),
                subtract(vertexArray[triArray[i+2]], vertexArray[triArray[i]])),
                false),
                0));
  }

  return {verts:  vertexArray,
          tris:   triArray,
          norms:  normals,
          colors: colorArray};

}

// Returns shape data for the headlights
function topToy(color) {

  // Define position data
  var vertexArray = [
       vec4(  5.00000000e-01,   1.00000000e+00,   0.00000000e+00, 1.0),
       vec4(  4.50484434e-01,   1.00000000e+00,   2.16941870e-01, 1.0),
       vec4(  3.11744901e-01,   1.00000000e+00,   3.90915741e-01, 1.0),
       vec4(  1.11260467e-01,   1.00000000e+00,   4.87463956e-01, 1.0),
       vec4( -1.11260467e-01,   1.00000000e+00,   4.87463956e-01, 1.0),
       vec4( -3.11744901e-01,   1.00000000e+00,   3.90915741e-01, 1.0),
       vec4( -4.50484434e-01,   1.00000000e+00,   2.16941870e-01, 1.0),
       vec4( -5.00000000e-01,   1.00000000e+00,   6.12323400e-17, 1.0),
       vec4( -4.50484434e-01,   1.00000000e+00,  -2.16941870e-01, 1.0),
       vec4( -3.11744901e-01,   1.00000000e+00,  -3.90915741e-01, 1.0),
       vec4( -1.11260467e-01,   1.00000000e+00,  -4.87463956e-01, 1.0),
       vec4(  1.11260467e-01,   1.00000000e+00,  -4.87463956e-01, 1.0),
       vec4(  3.11744901e-01,   1.00000000e+00,  -3.90915741e-01, 1.0),
       vec4(  4.50484434e-01,   1.00000000e+00,  -2.16941870e-01, 1.0),
       vec4(  5.00000000e-01,   5.00000000e-01,   0.00000000e+00, 1.0),
       vec4(  4.50484434e-01,   5.00000000e-01,   2.16941870e-01, 1.0),
       vec4(  3.11744901e-01,   5.00000000e-01,   3.90915741e-01, 1.0),
       vec4(  1.11260467e-01,   5.00000000e-01,   4.87463956e-01, 1.0),
       vec4( -1.11260467e-01,   5.00000000e-01,   4.87463956e-01, 1.0),
       vec4( -3.11744901e-01,   5.00000000e-01,   3.90915741e-01, 1.0),
       vec4( -4.50484434e-01,   5.00000000e-01,   2.16941870e-01, 1.0),
       vec4( -5.00000000e-01,   5.00000000e-01,   6.12323400e-17, 1.0),
       vec4( -4.50484434e-01,   5.00000000e-01,  -2.16941870e-01, 1.0),
       vec4( -3.11744901e-01,   5.00000000e-01,  -3.90915741e-01, 1.0),
       vec4( -1.11260467e-01,   5.00000000e-01,  -4.87463956e-01, 1.0),
       vec4(  1.11260467e-01,   5.00000000e-01,  -4.87463956e-01, 1.0),
       vec4(  3.11744901e-01,   5.00000000e-01,  -3.90915741e-01, 1.0),
       vec4(  4.50484434e-01,   5.00000000e-01,  -2.16941870e-01, 1.0),
       vec4(  1.00000000e+00,   5.00000000e-01,   0.00000000e+00, 1.0),
       vec4(  9.00968868e-01,   5.00000000e-01,   4.33883739e-01, 1.0),
       vec4(  6.23489802e-01,   5.00000000e-01,   7.81831482e-01, 1.0),
       vec4(  2.22520934e-01,   5.00000000e-01,   9.74927912e-01, 1.0),
       vec4( -2.22520934e-01,   5.00000000e-01,   9.74927912e-01, 1.0),
       vec4( -6.23489802e-01,   5.00000000e-01,   7.81831482e-01, 1.0),
       vec4( -9.00968868e-01,   5.00000000e-01,   4.33883739e-01, 1.0),
       vec4( -1.00000000e+00,   5.00000000e-01,   1.22464680e-16, 1.0),
       vec4( -9.00968868e-01,   5.00000000e-01,  -4.33883739e-01, 1.0),
       vec4( -6.23489802e-01,   5.00000000e-01,  -7.81831482e-01, 1.0),
       vec4( -2.22520934e-01,   5.00000000e-01,  -9.74927912e-01, 1.0),
       vec4(  2.22520934e-01,   5.00000000e-01,  -9.74927912e-01, 1.0),
       vec4(  6.23489802e-01,   5.00000000e-01,  -7.81831482e-01, 1.0),
       vec4(  9.00968868e-01,   5.00000000e-01,  -4.33883739e-01, 1.0),
       vec4(  1.00000000e+00,   0.00000000e+00,   0.00000000e+00, 1.0),
       vec4(  9.00968868e-01,   0.00000000e+00,   4.33883739e-01, 1.0),
       vec4(  6.23489802e-01,   0.00000000e+00,   7.81831482e-01, 1.0),
       vec4(  2.22520934e-01,   0.00000000e+00,   9.74927912e-01, 1.0),
       vec4( -2.22520934e-01,   0.00000000e+00,   9.74927912e-01, 1.0),
       vec4( -6.23489802e-01,   0.00000000e+00,   7.81831482e-01, 1.0),
       vec4( -9.00968868e-01,   0.00000000e+00,   4.33883739e-01, 1.0),
       vec4( -1.00000000e+00,   0.00000000e+00,   1.22464680e-16, 1.0),
       vec4( -9.00968868e-01,   0.00000000e+00,  -4.33883739e-01, 1.0),
       vec4( -6.23489802e-01,   0.00000000e+00,  -7.81831482e-01, 1.0),
       vec4( -2.22520934e-01,   0.00000000e+00,  -9.74927912e-01, 1.0),
       vec4(  2.22520934e-01,   0.00000000e+00,  -9.74927912e-01, 1.0),
       vec4(  6.23489802e-01,   0.00000000e+00,  -7.81831482e-01, 1.0),
       vec4(  9.00968868e-01,   0.00000000e+00,  -4.33883739e-01, 1.0),
       vec4(  0.00000000e+00,  -1.00000000e+00,   0.00000000e+00, 1.0)
    ];

  // Define adjacency data
  var triArray =  [0,  2,  1,
                  0,  3,  2,
        0,  4,  3,
        0,  5,  4,
        0,  6,  5,
        0,  7,  6,
        0,  8,  7,
        0,  9,  8,
        0, 10,  9,
        0, 11, 10,
        0, 12, 11,
        0, 13, 12,
        0, 15, 14,
        1, 16, 15,
        2, 17, 16,
        3, 18, 17,
        4, 19, 18,
        5, 20, 19,
        6, 21, 20,
        7, 22, 21,
        8, 23, 22,
        9, 24, 23,
       10, 25, 24,
       11, 26, 25,
       12, 27, 26,
       13, 14, 27,
        0,  1, 15,
        1,  2, 16,
        2,  3, 17,
        3,  4, 18,
        4,  5, 19,
        5,  6, 20,
        6,  7, 21,
        7,  8, 22,
        8,  9, 23,
        9, 10, 24,
       10, 11, 25,
       11, 12, 26,
       12, 13, 27,
       13,  0, 14,
       14, 29, 28,
       15, 30, 29,
       16, 31, 30,
       17, 32, 31,
       18, 33, 32,
       19, 34, 33,
       20, 35, 34,
       21, 36, 35,
       22, 37, 36,
       23, 38, 37,
       24, 39, 38,
       25, 40, 39,
       26, 41, 40,
       27, 28, 41,
       14, 15, 29,
       15, 16, 30,
       16, 17, 31,
       17, 18, 32,
       18, 19, 33,
       19, 20, 34,
       20, 21, 35,
       21, 22, 36,
       22, 23, 37,
       23, 24, 38,
       24, 25, 39,
       25, 26, 40,
       26, 27, 41,
       27, 14, 28,
       28, 43, 42,
       29, 44, 43,
       30, 45, 44,
       31, 46, 45,
       32, 47, 46,
       33, 48, 47,
       34, 49, 48,
       35, 50, 49,
       36, 51, 50,
       37, 52, 51,
       38, 53, 52,
       39, 54, 53,
       40, 55, 54,
       41, 42, 55,
       28, 29, 43,
       29, 30, 44,
       30, 31, 45,
       31, 32, 46,
       32, 33, 47,
       33, 34, 48,
       34, 35, 49,
       35, 36, 50,
       36, 37, 51,
       37, 38, 52,
       38, 39, 53,
       39, 40, 54,
       40, 41, 55,
       41, 28, 42,
       43, 56, 42,
       44, 56, 43,
       45, 56, 44,
       46, 56, 45,
       47, 56, 46,
       48, 56, 47,
       49, 56, 48,
       50, 56, 49,
       51, 56, 50,
       52, 56, 51,
       53, 56, 52,
       54, 56, 53,
       55, 56, 54,
       42, 56, 55];

  // Define color information
  colorArray = [];
  for (var i = 0; i < triArray.length/3; i++) {
    colorArray.push(color);
  }

  var normals = [];
  for (var i = 0; i < triArray.length; i += 3) {

    normals.push(vec4(normalize(cross(
                subtract(vertexArray[triArray[i+1]], vertexArray[triArray[i]]),
                subtract(vertexArray[triArray[i+2]], vertexArray[triArray[i]])),
                false),
                0));
  }

  return {verts:  vertexArray,
          tris:   triArray,
          norms:  normals,
          colors: colorArray};

}

// Returns data for the wheel shapes
function sandClock(color) {

  // Define position data
  var vertexArray = [
       [ 0.        ,  0.        ,  0.        , 1.0],
       [ 1.        ,  1.        ,  0.        , 1.0],
       [ 0.91354546,  1.        ,  0.40673664, 1.0],
       [ 0.66913061,  1.        ,  0.74314483, 1.0],
       [ 0.30901699,  1.        ,  0.95105652, 1.0],
       [-0.10452846,  1.        ,  0.9945219 , 1.0],
       [-0.5       ,  1.        ,  0.8660254 , 1.0],
       [-0.80901699,  1.        ,  0.58778525, 1.0],
       [-0.9781476 ,  1.        ,  0.20791169, 1.0],
       [-0.9781476 ,  1.        , -0.20791169, 1.0],
       [-0.80901699,  1.        , -0.58778525, 1.0],
       [-0.5       ,  1.        , -0.8660254 , 1.0],
       [-0.10452846,  1.        , -0.9945219 , 1.0],
       [ 0.30901699,  1.        , -0.95105652, 1.0],
       [ 0.66913061,  1.        , -0.74314483, 1.0],
       [ 0.91354546,  1.        , -0.40673664, 1.0],
       [ 1.        , -1.        ,  0.        , 1.0],
       [ 0.91354546, -1.        ,  0.40673664, 1.0],
       [ 0.66913061, -1.        ,  0.74314483, 1.0],
       [ 0.30901699, -1.        ,  0.95105652, 1.0],
       [-0.10452846, -1.        ,  0.9945219 , 1.0],
       [-0.5       , -1.        ,  0.8660254 , 1.0],
       [-0.80901699, -1.        ,  0.58778525, 1.0],
       [-0.9781476 , -1.        ,  0.20791169, 1.0],
       [-0.9781476 , -1.        , -0.20791169, 1.0],
       [-0.80901699, -1.        , -0.58778525, 1.0],
       [-0.5       , -1.        , -0.8660254 , 1.0],
       [-0.10452846, -1.        , -0.9945219 , 1.0],
       [ 0.30901699, -1.        , -0.95105652, 1.0],
       [ 0.66913061, -1.        , -0.74314483, 1.0],
       [ 0.91354546, -1.        , -0.40673664, 1.0]
    ];

  // Define adjacency data
  var triArray = [
        1,  3,  2,
        1,  4,  3,
        1,  5,  4,
        1,  6,  5,
        1,  7,  6,
        1,  8,  7,
        1,  9,  8,
        1, 10,  9,
        1, 11, 10,
        1, 12, 11,
        1, 13, 12,
        1, 14, 13,
        1, 15, 14,
        0,  1,  2,
        0,  2,  3,
        0,  3,  4,
        0,  4,  5,
        0,  5,  6,
        0,  6,  7,
        0,  7,  8,
        0,  8,  9,
        0,  9, 10,
        0, 10, 11,
        0, 11, 12,
        0, 12, 13,
        0, 13, 14,
        0, 14, 15,
        0, 15,  1,
        16, 17, 18,
        16, 18, 19,
        16, 19, 20,
        16, 20, 21,
        16, 21, 22,
        16, 22, 23,
        16, 23, 24,
        16, 24, 25,
        16, 25, 26,
        16, 26, 27,
        16, 27, 28,
        16, 28, 29,
        16, 29, 30,
        0, 17, 16,
        0, 18, 17,
        0, 19, 18,
        0, 20, 19,
        0, 21, 20,
        0, 22, 21,
        0, 23, 22,
        0, 24, 23,
        0, 25, 24,
        0, 26, 25,
        0, 27, 26,
        0, 28, 27,
        0, 29, 28,
        0, 30, 29,
        0, 16, 30];

  // Define color information
  colorArray = [];
  for (var i = 0; i < triArray.length/3; i++) {
    colorArray.push(color);
  }

  var normals = [];
  for (var i = 0; i < triArray.length; i += 3) {

    normals.push(vec4(normalize(cross(
                subtract(vertexArray[triArray[i+1]], vertexArray[triArray[i]]),
                subtract(vertexArray[triArray[i+2]], vertexArray[triArray[i]])),
                false),
                0));
  }

  return {verts:  vertexArray,
          tris:   triArray,
          norms:  normals,
          colors: colorArray};

}

// This new function just applies faceToVertProperties to a shape and
// returns the result.
function faceToVertPropertiesShape(shape) {
  return faceToVertProperties(shape.verts,
                              shape.tris,
                              shape.norms,
                              shape.colors);
}

function faceToVertProperties(vertices, triangleIndicies, normals, colors) {

  var vertexArray = [];
  var triArray = [];
  var normalsArray = [];
  var colorArray = [];

  for (var i = 0; i < triangleIndicies.length; i++) {
    vertexArray.push(vertices[triangleIndicies[i]]);
    triArray.push(i);
    if (i % 3 === 0) {
      normalsArray.push(normals[i/3]);
      normalsArray.push(normals[i/3]);
      normalsArray.push(normals[i/3]);
      colorArray.push(colors[i/3]);
      colorArray.push(colors[i/3]);
      colorArray.push(colors[i/3]);
    }
  }

  return {verts:  vertexArray,
          tris:   triArray,
          norms: normalsArray,
          colors: colorArray};

}

function applyXform(transform, verticies, normals) {
  var normalMatrix = transpose(inverse(transform));

  var verts = [];
  for (var vertexIndex = 0; vertexIndex < verticies.length; vertexIndex++) {
    var t = []
    for (var row = 0; row < 4; row++) {
      t.push(dot(verticies[vertexIndex], transform[row]));
    }
    verts.push(t);
  }

  var norms = [];
  for (var normalIndex = 0; normalIndex < normals.length; normalIndex++) {
    var t = [];
    for (var row = 0; row < 4; row++) {
      t.push(dot(normals[normalIndex], transform[row]));
    }
    norms.push(t);
  }

  return {
    verts: verts,
    norms: norms
  };
}

window.onload = function init() {

  // Load transformation

  worldToCanonicalView = mat4( -2.2190124 ,   0.95100531,   0.,   2.2190124 ,
        -0.64356008,  -1.50164018,   1.77745164,   0.64356008,
         0.29007896,   0.6768509 ,   0.6768509 , -20.96237587,
        -0.29002095,  -0.67671554,  -0.67671554,  20.97818181);

  look_at = vec3(1,0,0);
  eye = vec3(7,14,14);


  canvas = document.getElementById("gl-canvas");



  // Set up the WebGL context
  gl = WebGLUtils.setupWebGL(canvas);

  // Check to see if the WebGL context was correctly initilized
  if (!gl) {
    alert("WebGL failed to load.");
  }

  // Set up the WebGL canvas
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.GEQUAL);
  gl.clearDepth(-1.0);

  // Initilize the shaders
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program)


  var cBuffer = gl.createBuffer();
  var vBuffer = gl.createBuffer();
  var nBuffer = gl.createBuffer();
  var eBuffer = gl.createBuffer();


  var vPosition = gl.getAttribLocation(program, "vPosition");
  var vColor = gl.getAttribLocation(program, "vColor");
  var normalLoc = gl.getAttribLocation(program, "vNormal");


  lookVectorLoc = gl.getUniformLocation(program, "lookVector");
  worldToCanonicalViewLoc =
                        gl.getUniformLocation(program, "worldToCanonicalView");
  transformLoc = gl.getUniformLocation(program, "transform");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");




  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Get the id of the vPosition attribute


  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);




  // Get the id of the vColor attribute


  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLoc);


  // eye = (0,3,1.5)
  // look_at = (0,0,0)
  // up = (0,1,0)
  // near = 0.01
  // far = 100
  // fovy = 45
  // aspect = 1


  gl.uniform4fv(lookVectorLoc, vec4(normalize(subtract(eye,look_at)),0.0));

  gl.uniformMatrix4fv(worldToCanonicalViewLoc,
                                          false, flatten(worldToCanonicalView));

  scene = sceneData();

  scene.shapes[4].colors = [
    vec4(0.0, 1.0, 0.7, 1.0),
    vec4(0.0, 1.0, 0.7, 1.0),
    vec4(0.7, 0.0, 1.0, 1.0),
    vec4(0.7, 0.0, 1.0, 1.0),

    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(0.7, 0.0, 1.0, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),

    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),

    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),
    vec4(1.0, 0.2, 0.3, 1.0),
    ];

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (var i = 0; i < scene.transforms.length; i++) {

    var normalMatrix = transpose(inverse(scene.transforms[i]));

    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
    gl.uniformMatrix4fv(transformLoc, false, flatten(scene.transforms[i]));

    scene.shapes[i] = faceToVertPropertiesShape(scene.shapes[i]);

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
              new Float32Array(flatten(scene.shapes[i].norms)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
                                flatten(scene.shapes[i].verts), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
                               flatten(scene.shapes[i].colors), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                          new Uint8Array(scene.shapes[i].tris), gl.STATIC_DRAW);


    gl.drawElements(gl.TRIANGLES,
                              scene.shapes[i].tris.length, gl.UNSIGNED_BYTE, 0);

  }

}
