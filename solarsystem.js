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
  sceneProgram      = initShaders(gl, "scene-vertex-shader"  , "scene-fragment-shader");
  textureProgram    = initShaders(gl, "texture-vertex-shader", "texture-fragment-shader");
  mixerProgram      = initShaders(gl, "texture-vertex-shader", "mixer-fragment-shader");
  lensProgram       = initShaders(gl, "texture-vertex-shader", "lens-fragment-shader");

  // Create buffers
  vBufferSphere         = gl.createBuffer();
  nBuffer               = gl.createBuffer();
  eBuffer               = gl.createBuffer();
  texCoordBufferSphere  = gl.createBuffer();

  vBufferSquare         = gl.createBuffer();
  texCoordBufferSquare  = gl.createBuffer();

  // Unpack the locations of nessicary attributes and uniforms into dictionaries
  // (objects) for the sake of neatness and code clarity
  sceneProgramLocs = {
    vPositionLoc  : gl.getAttribLocation(sceneProgram,  "vPosition"  ),
    vNormalLoc    : gl.getAttribLocation(sceneProgram,  "vNormal"    ),
    texCoordInLoc : gl.getAttribLocation(sceneProgram,  "texCoordIn" ),

    pMatrixLoc    : gl.getUniformLocation(sceneProgram, "pMatrix"       ),
    mvMatrixLoc   : gl.getUniformLocation(sceneProgram, "mvMatrix"      ),
    transformLoc  : gl.getUniformLocation(sceneProgram, "transform"     ),
    vColorLoc     : gl.getUniformLocation(sceneProgram, "vColor"        ),
    uSamplerLoc   : gl.getUniformLocation(sceneProgram, "uSampler"      ),
    ignoreLightLoc: gl.getUniformLocation(sceneProgram, "ignoreLightIn" )
  };

  textureProgramLocs = {
    vPositionLoc  : gl.getAttribLocation(textureProgram,  "vPosition"  ),
    texCoordInLoc : gl.getAttribLocation(textureProgram,  "texCoordIn" ),

    uSamplerLoc   : gl.getUniformLocation(textureProgram, "uSampler"   )
  };

  mixerProgramLocs = {
    uSampler1Loc : gl.getUniformLocation(mixerProgram, "uSampler1" ),
    uSampler2Loc : gl.getUniformLocation(mixerProgram, "uSampler2" )
  };

  lensProgramLocs  = {
    noiseSamplerLoc : gl.getUniformLocation(lensProgram, "noiseSampler"   ),

    pMatrixLoc      : gl.getUniformLocation(lensProgram, "pMatrix"        ),
    mvMatrixLoc     : gl.getUniformLocation(lensProgram, "mvMatrix"       ),
    aspectLoc       : gl.getUniformLocation(lensProgram, "aspect"         ),
    brightnessLoc   : gl.getUniformLocation(lensProgram, "brightness"     ),

    forcePointLoc     : gl.getUniformLocation(lensProgram, "forcePoint"   ),
    forcePointVecLoc  : gl.getUniformLocation(lensProgram, "forcePointVec")
  };

  // Load the constant sphere and square data into the buffers
  sphereData = sphere(35);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferSphere);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.verts), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.norms), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferSphere);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.texCoords), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(sphereData.tris)), gl.STATIC_DRAW);

  squareData = square();

  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferSquare);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(squareData.verts), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferSquare);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(squareData.texCoords), gl.STATIC_DRAW);

  
  // Set up the camera and its controls

  keyDownList = {};
  view = {};

  setUpCamera(view);
  setUpCameraControls(view, keyDownList);

  // Load the scene to be displayed
  objects = [
    {
      transform   : mat4(500.0,0,0,0,0,500,0,0,0,0,500,0,0,0,0,1),
      color       : vec4(0.,0,0,1),
      textureURL  : "skybox2.png", // http://likeonions.deviantart.com/art/Wormhole-Space-Equirectangular-Skybox-587119511
      ignoreLight : true
    },
    {
      transform   : mat4(1.0,0,0,10,0,1,0,0,0,0,1,10,0,0,0,1),
      color       : vec4(1.0,1.0,1.0,1.0),
      textureURL  : "Earth.png", // http://www.celestiamotherlode.net/
      ignoreLight : false,
      radius      : 1.0,
      pos         : vec3(10.0,0.0,10.0)
    }
  ];

  loadObjectTextures();

  noise = {};
  loadTexture(noise, "noise.png"); // http://www.noisetexturegenerator.com/

  // Next, we need to create a set of textures, framebuffers and render buffers
  // to contain our images for post processing
  framebuffers = [];
  frameTextures = [];
  renderbuffers = [];

  // This look generates the nessicary resources and binds them together
  // We used the following sources in developing this code:
  //
  // http://webglfundamentals.org/webgl/lessons/webgl-image-processing.html
  // http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html
  // http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-14-render-to-texture/
  // 
  for (var i = 0; i < 2; i ++) {
    // Create a texture
    var tex = makeTexture();
    frameTextures.push(tex);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
 
    // Create a framebuffer and attach the texture to it
    var framebuffer = gl.createFramebuffer();
    framebuffers.push(framebuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    // Create a depth buffer and bind it to the framebuffer
    var renderbuffer = gl.createRenderbuffer();
    renderbuffers.push(renderbuffers);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
  }

  render();
}

function render() {

    // Link the scene program attributes to the correct buffers
    switchToSceneProgram();

    // Bind to the 0th frame buffer which will contain our starless image
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update our view and generate the camera matricies
    updateCamera(view);

    mvMatrix    = lookAt(view.eye, view.at, view.up);
    pMatrix     = perspective(view.fovy, view.aspect, view.near, view.far);

    // Pass in camera transformation data into the shaders
    gl.uniformMatrix4fv(sceneProgramLocs.pMatrixLoc , false, flatten(pMatrix));
    gl.uniformMatrix4fv(sceneProgramLocs.mvMatrixLoc, false, flatten(mvMatrix));

    // Make the skybox follow the viewer to eliminate paralax effects
    objects[0].transform[0][3]  = view.eye[0];
    objects[0].transform[1][3]  = view.eye[1];
    objects[0].transform[2][3]  = view.eye[2];

    for (var i = 0; i < objects.length; i++) {

      // Bind a texture and load it
      // For learning to texture, we used the following resource:
      //
      // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, objects[i].texture);
      gl.uniform1i(sceneProgramLocs.uSamplerLoc, 0);

      gl.uniform1i(sceneProgramLocs.ignoreLightLoc, objects[i].ignoreLight);
      gl.uniformMatrix4fv(sceneProgramLocs.transformLoc, false, flatten(objects[i].transform));
      gl.uniform4fv(sceneProgramLocs.vColorLoc, objects[i].color);

      gl.drawElements(gl.TRIANGLES, sphereData.tris.length*3, gl.UNSIGNED_SHORT, 0);

    }

 
    // Here is where we do the cpu side occlusion for the star. First, we
    // cast a ray from our eye to the origin and check for interesctions. If
    // there are none, then we simply render the star at the origin. If there is
    // an interection detected, we force the star to be rendered at the object's
    // edge and decrease its brightness as it becomes more and more occluded
    var brightness = 1.0;
    var origin = vec3(0.0, 0.0, 0.0);
    var forcePoint = false;
    var forcePointVec = vec3(0.0,0.0,0.0);

    for (var i = 0; i < objects.length; i++) {
      if (!objects[i].ignoreLight) {
        var dist = pointLineDistance(objects[i].pos, view.eye, origin);
        if (dist - objects[i].radius < 0.0 &&
            length(subtract(view.eye, objects[i].pos))  < length(view.eye) &&
            dot(subtract(view.eye, objects[i].pos), subtract(origin, view.eye)) < 0.0) 
        {
          
          var t = dot(subtract(view.eye,objects[i].pos),subtract(origin, view.eye))/ Math.pow(length(subtract(origin, view.eye)),2.0);
          var point = add(view.eye, scale(-t, subtract(origin,view.eye)));

          forcePointVec = add(objects[i].pos, scale(objects[i].radius, normalize(subtract(point, objects[i].pos))));
          forcePoint = true;

          brightness = (dist - objects[i].radius) / (dist * objects[i].radius / (dist + 3.0)) + 1.0;
        }
      }
    }

    // Now use the texture vertex shader for rendering single textured quads
    switchToTextureProgram();

    // Switch to the lens flare generating fragment shader and bind to the
    // framebuffer that will contain our star image
    gl.useProgram(lensProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Bind the noise texture, which is basically being used as random data
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, noise.texture);

    // Set the properties required to draw the sun and go!
    gl.uniform1f(lensProgramLocs.aspectLoc, canvas.height / canvas.width);
    gl.uniform1i(lensProgramLocs.noiseSamplerLoc, 0);
    gl.uniformMatrix4fv(lensProgramLocs.pMatrixLoc, false, flatten(pMatrix));
    gl.uniformMatrix4fv(lensProgramLocs.mvMatrixLoc, false, flatten(mvMatrix));
    gl.uniform1f(lensProgramLocs.brightnessLoc, brightness);
    gl.uniform1f(lensProgramLocs.forcePointLoc, forcePoint);
    gl.uniform3fv(lensProgramLocs.forcePointVecLoc, forcePointVec);

    gl.drawArrays(gl.TRIANGLES, 0, 6);


    // Now load the mixer fragment shader which will add the results together
    gl.useProgram(mixerProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTextures[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frameTextures[1]);
    gl.uniform1i(mixerProgramLocs.uSampler1Loc, 0);
    gl.uniform1i(mixerProgramLocs.uSampler2Loc, 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);


    requestAnimFrame(render);

}

function setUpCamera () {
  view = {
    eye     : vec3(4.0, 0.0, 0.0),
    at      : vec3(0.0, 0.0, 0.0),
    up      : vec3(0.0, 1.0, 0.0),
    near    : 0.01,
    far     : 1000,
    fovy    : 45,
    aspect  : canvas.width / canvas.height,

    lookVector : vec3(-4.0, 1.0, 0.0),

    theta : Math.PI / 2,
    phi : 0.0
  };
}

// Set us the nessicary functions for key handling 
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
      view.theta += event.movementY / 1000;
      view.phi   += event.movementX / 1000;

      if (view.theta < 0.1) {view.theta = 0.1;}
      if (view.theta > Math.PI - 0.1) {view.theta = Math.PI - 0.1;}

      view.lookVector = vec3(
        Math.cos(view.phi) * Math.sin(view.theta),
        Math.cos(view.theta),
        Math.sin(view.phi) * Math.sin(view.theta)
      );

      view.at = add(view.eye, view.lookVector); 

    }
  }, false);

  // Capture the mouse when the user clicks on the canvas
  canvas.onclick =
    document.body.requestPointerLock    ||
    document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;
}

// Update the camera posiions based upon user input
function updateCamera(view) {

  var movementSpeed = 0.05;

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

// Load a texture into an object from a URL
function loadTexture(object, url) {
  object.texture = makeTexture();
  object.texture.image = new Image();

  object.texture.image.crossOrigin = "anonymous";
  object.texture.image.src = url;
  
  object.texture.image.onload = function() {
   linkTexture(object.texture, object.texture.image)
  };
}

// Create and set up a texture object
function makeTexture() {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

// Bind a texture to an image resource
function linkTexture(texture, image) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

// Load the textures in the object list
function loadObjectTextures () {
  for (var i = 0; i < objects.length; i++) {
    loadTexture(objects[i], objects[i].textureURL);
  }
}

// WebGL helper function for binding attributes to their buffers
function linkBufferAttrib(attribLoc, buffer, vecsize) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(attribLoc, vecsize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attribLoc);
}

// Link the texture program attrivutes to the correct buffers
function switchToTextureProgram() {
  linkBufferAttrib(textureProgramLocs.vPositionLoc, vBufferSquare, 4);
  linkBufferAttrib(textureProgramLocs.texCoordInLoc, texCoordBufferSquare, 2);
  gl.useProgram(textureProgram);
}

// Link the scene program attributes to the correct buffers
function switchToSceneProgram() {
  linkBufferAttrib(sceneProgramLocs.vPositionLoc, vBufferSphere, 4);
  linkBufferAttrib(sceneProgramLocs.texCoordInLoc, texCoordBufferSphere, 2);
  linkBufferAttrib(sceneProgramLocs.vNormalLoc, nBuffer, 4);
  gl.useProgram(sceneProgram);
}

// Calcule the distance from a point x0 to a line x1 to x2
function pointLineDistance(x0, x1, x2) {
  return(length(cross(subtract(x0,x1),subtract(x0,x2)))/length(subtract(x2,x1)));
}

// Maximize two inputs
function max(a, b) {
  if (a > b) return a;
  return b;
}