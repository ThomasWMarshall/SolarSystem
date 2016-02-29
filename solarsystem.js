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
  sceneProgram = initShaders(gl, "scene-vertex-shader", "scene-fragment-shader");
  textureProgram = initShaders(gl, "texture-vertex-shader", "texture-fragment-shader");
  brightnessProgram = initShaders(gl, "texture-vertex-shader", "brightness-fragment-shader");
  blurProgram = initShaders(gl, "texture-vertex-shader", "blur-fragment-shader");
  mixerProgram = initShaders(gl, "texture-vertex-shader", "mixer-fragment-shader");
  lensProgram = initShaders(gl, "texture-vertex-shader", "lens-fragment-shader");

  // Create buffers
  vBufferSphere         = gl.createBuffer();
  nBuffer               = gl.createBuffer();
  eBuffer               = gl.createBuffer();
  texCoordBufferSphere  = gl.createBuffer();

  vBufferSquare         = gl.createBuffer();
  texCoordBufferSquare  = gl.createBuffer();

  // Get the ids of shader attributes
  vPositionLoc     = gl.getAttribLocation(sceneProgram,  "vPosition"   );
  vNormalLoc       = gl.getAttribLocation(sceneProgram,  "vNormal"     );
  texCoordInLoc    = gl.getAttribLocation(sceneProgram,  "texCoordIn"  );

  // Get the ids of shader uniforms
  pMatrixLoc       = gl.getUniformLocation(sceneProgram, "pMatrix"      );
  mvMatrixLoc      = gl.getUniformLocation(sceneProgram, "mvMatrix"     );
  transformLoc     = gl.getUniformLocation(sceneProgram, "transform"    );
  vColorLoc        = gl.getUniformLocation(sceneProgram, "vColor"       );
  uSamplerLoc      = gl.getUniformLocation(sceneProgram, "uSampler"     );
  ignoreLightLoc   = gl.getUniformLocation(sceneProgram, "ignoreLightIn");


  texVPositionLoc  = gl.getAttribLocation(textureProgram,  "vPosition"  );
  texTexCoordInLoc = gl.getAttribLocation(textureProgram,  "texCoordIn" );

  texUSamplerLoc   = gl.getUniformLocation(textureProgram, "texUSampler"   );

  brightTexUSamplerLoc = gl.getUniformLocation(brightnessProgram, "brightTexUSampler"   );

  texUSampler1Loc = gl.getUniformLocation(mixerProgram, "texUSampler1"   );
  texUSampler2Loc = gl.getUniformLocation(mixerProgram, "texUSampler2"   );

  imageSizeLoc = gl.getUniformLocation(blurProgram, "imageSize"   );
  horizontalLoc = gl.getUniformLocation(blurProgram, "horizontal"   );

  lens = {
    noiseSamplerLoc : gl.getUniformLocation(lensProgram, "noiseSampler"   ),

    pMatrixLoc      : gl.getUniformLocation(lensProgram, "pMatrix"        ),
    mvMatrixLoc     : gl.getUniformLocation(lensProgram, "mvMatrix"       ),
    aspectLoc       : gl.getUniformLocation(lensProgram, "aspect"         ),
    brightnessLoc   : gl.getUniformLocation(lensProgram, "brightness"     )
  };

  // Load the constant sphere and square data into the shaders
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
      textureURL  : "textures/skybox/skybox2.png",
      ignoreLight : true
    },
    {
      transform   : mat4(1.0,0,0,10,0,1,0,0,0,0,1,10,0,0,0,1),
      color       : vec4(1.0,1.0,1.0,1.0),
      textureURL  : "textures/earth/Earth.png",
      ignoreLight : false,
      radius      : 1.0,
      pos         : vec3(10.0,0.0,10.0)
    }
  ];

  loadObjectTextures();

  noise = {};
  loadTexture(noise, "textures/noise/noise.png");

  framebuffers = [];
  frameTextures = [];
  renderbuffers = [];

  for (var i = 0; i < 3; i ++) {
    var tex = makeTexture();
    frameTextures.push(tex);

    // make the texture the same size as the image
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
 
    var framebuffer = gl.createFramebuffer();
    framebuffers.push(framebuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
 
    // Attach a texture to it.
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    // Create a depth buffer
    var renderbuffer = gl.createRenderbuffer();
    renderbuffers.push(renderbuffers);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  render();
}

function render() {

    switchToSceneProgram();

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateCamera(view);

    mvMatrix    = lookAt(view.eye, view.at, view.up);
    pMatrix     = perspective(view.fovy, view.aspect, view.near, view.far);

    gl.uniformMatrix4fv(pMatrixLoc , false, flatten(pMatrix));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));

    // Make the skybox follow the viewer to eliminate paralax effects
    objects[0].transform[0][3]  = view.eye[0];
    objects[0].transform[1][3]  = view.eye[1];
    objects[0].transform[2][3]  = view.eye[2];

    for (var i = 0; i < objects.length; i++) {

      // Bind a texture and load it
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, objects[i].texture);
      gl.uniform1i(uSamplerLoc, 0);

      gl.uniform1i(ignoreLightLoc, objects[i].ignoreLight);

      gl.uniformMatrix4fv(transformLoc, false, flatten(objects[i].transform));

      gl.uniform4fv(vColorLoc, objects[i].color);

      gl.drawElements(gl.TRIANGLES, sphereData.tris.length*3, gl.UNSIGNED_SHORT, 0);

    }

    // Render just the brightest portions of the image

    switchToTextureProgram();
    // gl.useProgram(brightnessProgram);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
    // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, frameTextures[0]);
    // gl.uniform1i(brightTexUSamplerLoc, 0);

    // gl.drawArrays(gl.TRIANGLES, 0, 6);


    // // Run the blur program twice

    // gl.useProgram(blurProgram);
    // gl.uniform2f(imageSizeLoc, canvas.width, canvas.height);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[2]);
    // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, frameTextures[0]);
    // gl.uniform1i(brightTexUSamplerLoc, 0);
    // gl.uniform1i(horizontalLoc, true);

    // gl.drawArrays(gl.TRIANGLES, 0, 6);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
    // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, frameTextures[2]);
    // gl.uniform1i(brightTexUSamplerLoc, 0);
    // gl.uniform1i(horizontalLoc, false);

    // gl.drawArrays(gl.TRIANGLES, 0, 6);


    // Run the mixer to sum the results

    var brightness = 1.0;
    for (var i = 0; i < objects.length; i++) {
      if (!objects[i].ignoreLight) {
        var dist = pointLineDistance(objects[i].pos, view.eye, vec3(0.0,0.0,0.0));
        if (dist <= objects[i].radius &&
            length(subtract(view.eye, objects[i].pos))  < length(view.eye) &&
            dot(subtract(view.eye, objects[i].pos), subtract(vec3(0.0,0.0,0.0), view.eye)) < 0.0) {
          brightness = 0.0;
        }
      }
    }


    gl.useProgram(lensProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, noise.texture);

    gl.uniform1f(lens.aspectLoc, canvas.height / canvas.width);
    gl.uniform1i(lens.noiseSamplerLoc, 0);

    gl.uniformMatrix4fv(lens.pMatrixLoc, false, flatten(pMatrix));
    gl.uniformMatrix4fv(lens.mvMatrixLoc, false, flatten(mvMatrix));
    gl.uniform1f(lens.brightnessLoc, brightness);

    gl.drawArrays(gl.TRIANGLES, 0, 6);



    gl.useProgram(mixerProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTextures[1]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frameTextures[0]);
    gl.uniform1i(texUSampler1Loc, 0);
    gl.uniform1i(texUSampler2Loc, 1);

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

function loadTexture(object, url) {
  object.texture = makeTexture();
  object.texture.image = new Image();

  object.texture.image.crossOrigin = "anonymous";
  object.texture.image.src = url;
  
  object.texture.image.onload = function() {
   linkTexture(object.texture, object.texture.image)
  };
}

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

function linkTexture(texture, image) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function loadObjectTextures () {
  for (var i = 0; i < objects.length; i++) {
    loadTexture(objects[i], objects[i].textureURL);
  }
}

function linkBufferAttrib(attribLoc, buffer, vecsize) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(attribLoc, vecsize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attribLoc);
}

function switchToTextureProgram() {
  linkBufferAttrib(texVPositionLoc, vBufferSquare, 4);
  linkBufferAttrib(texTexCoordInLoc, texCoordBufferSquare, 2);
  gl.useProgram(textureProgram);
}

function switchToSceneProgram() {
  linkBufferAttrib(vPositionLoc, vBufferSphere, 4);
  linkBufferAttrib(texCoordInLoc, texCoordBufferSphere, 2);
  linkBufferAttrib(vNormalLoc, nBuffer, 4);
  gl.useProgram(sceneProgram);
}

function pointLineDistance(x0, x1, x2) {
  return(length(cross(subtract(x0,x1),subtract(x0,x2)))/length(subtract(x2,x1)));
}