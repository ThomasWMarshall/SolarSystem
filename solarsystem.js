window.onload = function init() {

  // Return the WebGL context.
  canvas = document.getElementById("gl-canvas");

  // Set up the WebGL context
  gl = WebGLUtils.setupWebGL(canvas);

  // Check to see if the WebGL context was correctly initilized
  if (!gl) {
    alert("WebGL failed to load.");
  }

  // Set up the WebGL canvas
  canvas.width  = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.95;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Initilize the shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program)

  // Create buffers
  vBuffer = gl.createBuffer();
  nBuffer = gl.createBuffer();
  eBuffer = gl.createBuffer();
  texCoordBuffer = gl.createBuffer();

  // Get the ids of shader attributes
  vPositionLoc     = gl.getAttribLocation(program,  "vPosition"   );
  vNormalLoc       = gl.getAttribLocation(program,  "vNormal"     );
  texCoordInLoc    = gl.getAttribLocation(program,  "texCoordIn"  );

  // Get the ids of shader uniforms
  pMatrixLoc       = gl.getUniformLocation(program, "pMatrix"      );
  mvMatrixLoc      = gl.getUniformLocation(program, "mvMatrix"     );
  transformLoc     = gl.getUniformLocation(program, "transform"    );
  normalMatrixLoc  = gl.getUniformLocation(program, "normalMatrix" );
  vColorLoc        = gl.getUniformLocation(program, "vColor"       );
  uSamplerLoc      = gl.getUniformLocation(program, "uSampler"     );
  ignoreLightLoc = gl.getUniformLocation(program, "ignoreLightIn");

  // Link the buffers to their corresponding js representations
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPositionLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.vertexAttribPointer(vNormalLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormalLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texCoordInLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(texCoordInLoc);

  // Load the constant sphere data into the shaders
  sphereData = sphere(200);

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.verts), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.norms), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.texCoords), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array(flatten(sphereData.tris)), gl.STATIC_DRAW);


  // Set up the camera and its controls

  keyDownList = {};
  view = {};

  setUpCamera(view);
  setUpCameraControls(view, keyDownList);

  // Load the scene to be displayed
  scene = {
    transforms: [        mat4(1.0,0,0,5,
                                0,1,0,2,
                                0,0,1,0,
                                0,0,0,1),
                         mat4(2.0,0,0,5,
                                0,2,0,0,
                                0,0,2,10,
                                0,0,0,1),
                         mat4(50.0,0,0,0,
                                0,50,0,0,
                                0,0,50,0,
                                0,0,0,1)],
    colors: [vec4(0,0,1,1), vec4(1,1,1,1), vec4(0,0,0,1)],
    textureIDs: [0,0,0],
    ignoreLight : [0,0,1]
  };

  textures = loadTextures(["textures/earth/Earth.png"]);

  render();
}

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateCamera(view);

    mvMatrix    = lookAt(view.eye, view.at, view.up);
    pMatrix     = perspective(view.fovy, view.aspect, view.near, view.far);

    gl.uniformMatrix4fv(pMatrixLoc , false, flatten(pMatrix));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));

    for (var i = 0; i < scene.transforms.length; i++) {

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[scene.textureIDs[i]]);
      gl.uniform1i(uSamplerLoc, 0);

      gl.uniform1i(ignoreLightLoc, scene.ignoreLight[i]);

      var normalMatrix = transpose(inverse(scene.transforms[i]));

      gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
      gl.uniformMatrix4fv(transformLoc, false, flatten(scene.transforms[i]));

      gl.uniform4fv(vColorLoc, scene.colors[i]);

      gl.drawElements(gl.TRIANGLES,
                                sphereData.tris.length*3, gl.UNSIGNED_SHORT, 0);

    }

    requestAnimFrame(render);
}

function setUpCamera () {
  view = {
    eye     : vec3(4.0, 0.0, 0.0),
    at      : vec3(0.0, 0.0, 0.0),
    up      : vec3(0.0, 1.0, 0.0),
    near    : 0.01,
    far     : 100,
    fovy    : 45,
    aspect  : canvas.width / canvas.height,

    lookVector : vec3(-4.0, 1.0, 0.0),

    theta : Math.PI / 2,
    phi : 0.0
  };
}

function setUpCameraControls() {

  keyDownList = {
    forward: false,
    left:    false,
    right:   false,
    back:    false
  };

  window.addEventListener("keydown", function(event) {
    switch (event.keyCode) {
      case 87:
        keyDownList.forward = true;
        break;
      case 83:
        keyDownList.back = true;
        break;
      case 68:
        keyDownList.right = true;
        break;
      case 65:
        keyDownList.left = true;
        break;
    }
  }, false);

  window.addEventListener("keyup", function(event) {
    switch (event.keyCode) {
      case 87:
        keyDownList.forward = false;
        break;
      case 83:
        keyDownList.back = false;
        break;
      case 68:
        keyDownList.right = false;
        break;
      case 65:
        keyDownList.left = false;
        break;
    }
  }, false);

  window.addEventListener("mousemove", function(event) {
    if(document.pointerLockElement === canvas    ||
       document.mozPointerLockElement === canvas ||
       document.webkitPointerLockElement === canvas) {
      view.theta += event.movementY / 100;
      view.phi   += event.movementX / 100;

      if (view.theta < 0.1) {view.theta = 0.1;}
      if (view.theta > Math.PI - 0.1) {view.theta = Math.PI - 0.1;}

      view.lookVector = vec3(
        Math.cos(view.phi) * Math.sin(view.theta),
        Math.cos(view.theta),
        Math.sin(view.phi) * Math.sin(view.theta)
      );

      view.at = add(view.eye, view.lookVector); 

    }
  }, false); //TODO: ALter this model to use spherical coordinates

  // Capture the mouse when the user clicks on the canvas
  canvas.onclick =
    document.body.requestPointerLock    ||
    document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;
}

function updateCamera(view) {

  var movementSpeed = 0.2;

  if (keyDownList.forward == true) {
    view.eye = add(view.eye, scale(movementSpeed, view.lookVector));
    view.at = add(view.eye, view.lookVector); 
  }
  if (keyDownList.back == true) {
    view.eye = subtract(view.eye, scale(movementSpeed, view.lookVector));
    view.at = add(view.eye, view.lookVector); 
  }
  if (keyDownList.right == true) {
    view.eye = add(view.eye, scale(movementSpeed, normalize(cross(view.lookVector, view.up))));
    view.at = add(view.eye, view.lookVector); 
  }
  if (keyDownList.left == true) {
    view.eye = subtract(view.eye, scale(movementSpeed, normalize(cross(view.lookVector, view.up))));
    view.at = add(view.eye, view.lookVector); 
  }
}

function loadTextures(imageFileNames) {
  var textures = [];
  for (var i = 0; i < imageFileNames.length; i++) {
    var texture;
    texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    texture.image.crossOrigin = "anonymous";
    texture.image.src = imageFileNames[i];
    textures.push(texture);
  }
  return textures;
}
