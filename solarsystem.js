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

  // Get the ids of shader attributes
  vPositionLoc     = gl.getAttribLocation(program,  "vPosition"   );
  vNormalLoc       = gl.getAttribLocation(program,  "vNormal"     );

  // Get the ids of shader uniforms
  lookVectorLoc    = gl.getUniformLocation(program, "lookVector"  );
  pMatrixLoc       = gl.getUniformLocation(program, "pMatrix"     );
  mvMatrixLoc      = gl.getUniformLocation(program, "mvMatrix"    );
  transformLoc     = gl.getUniformLocation(program, "transform"   );
  normalMatrixLoc  = gl.getUniformLocation(program, "normalMatrix");
  vColorLoc        = gl.getUniformLocation(program, "vColor");

  // Link the buffers to their corresponding js representations
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPositionLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.vertexAttribPointer(vNormalLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormalLoc);

  scene = {
    transforms: [        mat4(1.0,0,0,5,
                                0,1,0,2,
                                0,0,1,0,
                                0,0,0,1),
                         mat4(2.0,0,0,5,
                                0,2,0,0,
                                0,0,2,10,
                                0,0,0,1)],
    colors: [vec4(0,0,1,1), vec4(1,1,1,1)]
  };

  sphereData = sphere(200);

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.verts), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereData.norms), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array(flatten(sphereData.tris)), gl.STATIC_DRAW);

  eye     = vec3(4.0, 0.0, 0.0)
  at      = vec3(0.0, 0.0, 0.0)
  up      = vec3(0.0, 1.0, 0.0)
  near    = 0.01
  far     = 100
  fovy    = 45
  aspect  = canvas.width / canvas.height;

  lookAtVector = vec4(subtract(at, eye));

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
      fpvRight = normalize(cross(vec3(lookAtVector), up));
      fpvTop = normalize(cross(fpvRight, lookAtVector));
      at = add(at, scale(-event.movementX, fpvRight));
      if (Math.abs(dot(vec3(lookAtVector), up)) < 0.75 || true) {
        at = add(at, scale(-event.movementY, fpvTop));
      }
    }
  }, false); //TODO: ALter this model to use spherical coordinates

  // Capture the mouse when the user clicks on the canvas
  canvas.onclick =
    document.body.requestPointerLock    ||
    document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;

  render();
}

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    movementSpeed = 0.2;

    if (keyDownList.back == true) {
      eye = add(eye, scale(movementSpeed, vec3(lookAtVector)));
      at  = add(at,  scale(movementSpeed, vec3(lookAtVector)));
    }
    if (keyDownList.forward == true) {
      eye = subtract(eye, scale(movementSpeed, vec3(lookAtVector)));
      at  = subtract(at,  scale(movementSpeed, vec3(lookAtVector)));
    }
    if (keyDownList.left == true) {
      eye = add(eye, scale(movementSpeed, normalize(cross(vec3(lookAtVector), up))));
      at  = add(at,  scale(movementSpeed, normalize(cross(vec3(lookAtVector), up))));
    }
    if (keyDownList.right == true) {
      eye = subtract(eye, scale(movementSpeed, normalize(cross(vec3(lookAtVector), up))));
      at  = subtract(at,  scale(movementSpeed, normalize(cross(vec3(lookAtVector), up))));
    }

    mvMatrix      = lookAt(eye, at, up);
    pMatrix       = perspective(fovy, aspect, near, far);
    lookAtVector  = vec4(normalize(subtract(eye,at)),0.0);

    gl.uniform4fv(lookVectorLoc, lookAtVector);
    gl.uniformMatrix4fv(pMatrixLoc, false, flatten(pMatrix));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));

    for (var i = 0; i < scene.transforms.length; i++) {

      var normalMatrix = transpose(inverse(scene.transforms[i]));

      gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
      gl.uniformMatrix4fv(transformLoc, false, flatten(scene.transforms[i]));

      gl.uniform4fv(vColorLoc, scene.colors[i]);

      gl.drawElements(gl.TRIANGLES,
                                sphereData.tris.length*3, gl.UNSIGNED_SHORT, 0);

    }

    requestAnimFrame(render);
}
